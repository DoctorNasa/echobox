import { useEnsAddress } from 'wagmi';
import { normalize } from 'viem/ens';
import { mainnet, arbitrum, base, optimism, polygon } from 'wagmi/chains';
import { useState, useEffect } from 'react';

// Helper function to convert EVM chain ID to coin type (ENSIP-11)
export const evmChainIdToCoinType = (chainId: number): number => {
  return (0x80000000 | chainId) >>> 0;
};

// Standard coin types from SLIP-0044 (ENSIP-9)
export const COIN_TYPES = {
  BITCOIN: 0,
  LITECOIN: 2,
  DOGECOIN: 3,
  ETHEREUM: 60,
  ETHEREUM_CLASSIC: 61,
  COSMOS: 118,
  ROOTSTOCK: 137,
  RIPPLE: 144,
  BITCOIN_CASH: 145,
  STELLAR: 148,
  MONERO: 128,
  NANO: 165,
  TRON: 195,
  COSMOS_HUB: 330,
  THETA: 500,
  SOLANA: 501,
  POLKADOT: 354,
  FILECOIN: 461,
  BINANCE: 714,
  POLYGON: evmChainIdToCoinType(polygon.id),
  OPTIMISM: evmChainIdToCoinType(optimism.id),
  ARBITRUM: evmChainIdToCoinType(arbitrum.id),
  BASE: evmChainIdToCoinType(base.id),
  AVALANCHE: evmChainIdToCoinType(43114),
  BSC: evmChainIdToCoinType(56),
} as const;

export type ChainName = keyof typeof COIN_TYPES;

export interface ChainAddress {
  chain: ChainName;
  address: string | undefined;
  coinType: number;
  isLoading: boolean;
  error: Error | null;
}

export interface UseENSMultichainOptions {
  chains?: ChainName[];
  enabled?: boolean;
}

export interface UseENSMultichainResult {
  addresses: Map<ChainName, ChainAddress>;
  isLoading: boolean;
  hasAnyAddress: boolean;
  primaryAddress: string | undefined;
  normalizedName: string | null;
}

/**
 * Hook to resolve ENS names to addresses across multiple chains
 */
export function useENSMultichain(
  ensName: string,
  options: UseENSMultichainOptions = {}
): UseENSMultichainResult {
  const {
    chains = ['ETHEREUM', 'BITCOIN', 'SOLANA', 'POLYGON', 'ARBITRUM', 'BASE', 'OPTIMISM'],
    enabled = true,
  } = options;

  const [normalizedName, setNormalizedName] = useState<string | null>(null);

  // Normalize ENS name
  useEffect(() => {
    if (ensName && ensName.endsWith('.eth')) {
      try {
        const normalized = normalize(ensName);
        setNormalizedName(normalized);
      } catch (error) {
        console.error('Error normalizing ENS name:', error);
        setNormalizedName(null);
      }
    } else {
      setNormalizedName(null);
    }
  }, [ensName]);

  // Fetch addresses for each chain
  const results = new Map<ChainName, ChainAddress>();

  // Always fetch Ethereum address (primary)
  const ethResult = useEnsAddress({
    name: normalizedName || undefined,
    chainId: mainnet.id,
    enabled: enabled && !!normalizedName,
  });

  results.set('ETHEREUM', {
    chain: 'ETHEREUM',
    address: ethResult.data,
    coinType: COIN_TYPES.ETHEREUM,
    isLoading: ethResult.isLoading,
    error: ethResult.error,
  });

  // Fetch addresses for requested chains
  for (const chain of chains) {
    if (chain === 'ETHEREUM') continue; // Already fetched

    const coinType = COIN_TYPES[chain];
    const result = useEnsAddress({
      name: normalizedName || undefined,
      coinType,
      chainId: mainnet.id,
      enabled: enabled && !!normalizedName,
    });

    results.set(chain, {
      chain,
      address: result.data,
      coinType,
      isLoading: result.isLoading,
      error: result.error,
    });
  }

  // Calculate aggregate states
  const isLoading = Array.from(results.values()).some(r => r.isLoading);
  const hasAnyAddress = Array.from(results.values()).some(r => !!r.address);
  const primaryAddress = results.get('ETHEREUM')?.address;

  return {
    addresses: results,
    isLoading,
    hasAnyAddress,
    primaryAddress,
    normalizedName,
  };
}

/**
 * Hook to get a specific chain's address from an ENS name
 */
export function useENSChainAddress(
  ensName: string,
  chain: ChainName = 'ETHEREUM'
): {
  address: string | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { addresses } = useENSMultichain(ensName, { chains: [chain] });
  const result = addresses.get(chain);

  return {
    address: result?.address,
    isLoading: result?.isLoading || false,
    error: result?.error || null,
  };
}

/**
 * Get chain metadata
 */
export function getChainMetadata(chain: ChainName) {
  const metadata: Record<ChainName, {
    name: string;
    icon: string;
    explorer: string;
    color: string;
  }> = {
    BITCOIN: {
      name: 'Bitcoin',
      icon: '₿',
      explorer: 'https://www.blockchain.com/btc/address/',
      color: 'orange',
    },
    LITECOIN: {
      name: 'Litecoin',
      icon: 'Ł',
      explorer: 'https://blockchair.com/litecoin/address/',
      color: 'gray',
    },
    DOGECOIN: {
      name: 'Dogecoin',
      icon: '🐕',
      explorer: 'https://blockchair.com/dogecoin/address/',
      color: 'yellow',
    },
    ETHEREUM: {
      name: 'Ethereum',
      icon: '⟠',
      explorer: 'https://etherscan.io/address/',
      color: 'purple',
    },
    ETHEREUM_CLASSIC: {
      name: 'Ethereum Classic',
      icon: '⟠',
      explorer: 'https://blockscout.com/etc/mainnet/address/',
      color: 'green',
    },
    COSMOS: {
      name: 'Cosmos',
      icon: '⚛️',
      explorer: 'https://www.mintscan.io/cosmos/account/',
      color: 'indigo',
    },
    ROOTSTOCK: {
      name: 'Rootstock',
      icon: '🟠',
      explorer: 'https://explorer.rsk.co/address/',
      color: 'orange',
    },
    RIPPLE: {
      name: 'Ripple',
      icon: 'X',
      explorer: 'https://xrpscan.com/account/',
      color: 'black',
    },
    BITCOIN_CASH: {
      name: 'Bitcoin Cash',
      icon: '₿',
      explorer: 'https://blockchair.com/bitcoin-cash/address/',
      color: 'green',
    },
    STELLAR: {
      name: 'Stellar',
      icon: '🚀',
      explorer: 'https://stellar.expert/explorer/public/account/',
      color: 'black',
    },
    MONERO: {
      name: 'Monero',
      icon: 'ⓜ',
      explorer: '',
      color: 'orange',
    },
    NANO: {
      name: 'Nano',
      icon: 'Ӿ',
      explorer: 'https://nanolooker.com/account/',
      color: 'blue',
    },
    TRON: {
      name: 'TRON',
      icon: '🔺',
      explorer: 'https://tronscan.org/#/address/',
      color: 'red',
    },
    COSMOS_HUB: {
      name: 'Cosmos Hub',
      icon: '⚛️',
      explorer: 'https://www.mintscan.io/cosmos/account/',
      color: 'indigo',
    },
    THETA: {
      name: 'Theta',
      icon: 'Θ',
      explorer: 'https://explorer.thetatoken.org/account/',
      color: 'teal',
    },
    SOLANA: {
      name: 'Solana',
      icon: '◎',
      explorer: 'https://solscan.io/account/',
      color: 'purple',
    },
    POLKADOT: {
      name: 'Polkadot',
      icon: '●',
      explorer: 'https://polkadot.subscan.io/account/',
      color: 'pink',
    },
    FILECOIN: {
      name: 'Filecoin',
      icon: '⬡',
      explorer: 'https://filfox.info/en/address/',
      color: 'cyan',
    },
    BINANCE: {
      name: 'Binance',
      icon: '🔶',
      explorer: 'https://bscscan.com/address/',
      color: 'yellow',
    },
    POLYGON: {
      name: 'Polygon',
      icon: '🟣',
      explorer: 'https://polygonscan.com/address/',
      color: 'purple',
    },
    OPTIMISM: {
      name: 'Optimism',
      icon: '🔴',
      explorer: 'https://optimistic.etherscan.io/address/',
      color: 'red',
    },
    ARBITRUM: {
      name: 'Arbitrum',
      icon: '🔵',
      explorer: 'https://arbiscan.io/address/',
      color: 'blue',
    },
    BASE: {
      name: 'Base',
      icon: '🔷',
      explorer: 'https://basescan.org/address/',
      color: 'blue',
    },
    AVALANCHE: {
      name: 'Avalanche',
      icon: '🔺',
      explorer: 'https://snowtrace.io/address/',
      color: 'red',
    },
    BSC: {
      name: 'BNB Chain',
      icon: '🔶',
      explorer: 'https://bscscan.com/address/',
      color: 'yellow',
    },
  };

  return metadata[chain];
}
