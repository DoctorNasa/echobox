import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useBlockNumber } from 'wagmi';
import { Address } from 'viem';
import type { WalletAssets, FetchAssetsOptions } from '../types/wallet';
import { fetchWalletAssets, clearAssetCache } from '../lib/walletAssets';

interface UseWalletAssetsOptions extends FetchAssetsOptions {
  enabled?: boolean;
  refetchInterval?: number; // in milliseconds
  refetchOnBlockChange?: boolean;
}

interface UseWalletAssetsResult {
  assets: WalletAssets | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Hook to fetch and manage wallet assets
 */
export function useWalletAssets(
  options: UseWalletAssetsOptions = {}
): UseWalletAssetsResult {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: blockNumber } = useBlockNumber();
  
  const [assets, setAssets] = useState<WalletAssets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    enabled = true,
    refetchInterval,
    refetchOnBlockChange = false,
    ...fetchOptions
  } = options;

  // Fetch assets function
  const fetchAssets = useCallback(async () => {
    if (!address || !isConnected || !enabled) {
      setAssets(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletAssets = await fetchWalletAssets(address, {
        ...fetchOptions,
        chainId,
      });
      setAssets(walletAssets);
    } catch (err) {
      console.error('Error fetching wallet assets:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assets'));
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, enabled, chainId, fetchOptions]);

  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchAssets();
  }, [address, chainId, enabled]);

  // Refetch on block change
  useEffect(() => {
    if (refetchOnBlockChange && blockNumber) {
      fetchAssets();
    }
  }, [blockNumber, refetchOnBlockChange]);

  // Set up interval refetching
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchAssets();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchAssets]);

  // Clear cache function
  const clearCache = useCallback(() => {
    if (address) {
      clearAssetCache(address, chainId);
    }
  }, [address, chainId]);

  return {
    assets,
    isLoading,
    error,
    refetch: fetchAssets,
    clearCache,
  };
}

/**
 * Hook to get a specific asset balance
 */
export function useAssetBalance(
  tokenAddress: Address | null,
  type: 'native' | 'erc20' = 'erc20'
) {
  const { assets } = useWalletAssets({
    includeNative: type === 'native',
    includeERC20: type === 'erc20',
    includeNFTs: false,
    tokenList: tokenAddress ? [tokenAddress] : undefined,
  });

  if (type === 'native') {
    return assets?.native?.balance || 0n;
  }

  if (type === 'erc20' && tokenAddress) {
    const token = assets?.erc20.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token?.balance || 0n;
  }

  return 0n;
}

/**
 * Hook to check if user has sufficient balance
 */
export function useHasSufficientBalance(
  amount: bigint,
  tokenAddress: Address | null = null
): boolean {
  const balance = useAssetBalance(tokenAddress, tokenAddress ? 'erc20' : 'native');
  return balance >= amount;
}
