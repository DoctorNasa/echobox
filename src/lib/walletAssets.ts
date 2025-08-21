import { Address, formatUnits, erc20Abi, erc721Abi } from 'viem';
import { readContract, getBalance } from '@wagmi/core';
import { config } from './wagmi';
import type {
  WalletAssets,
  NativeAsset,
  ERC20Asset,
  ERC721Asset,
  ERC1155Asset,
  FetchAssetsOptions,
} from '../types/wallet';
import { DEFAULT_TOKEN_LIST } from '../types/wallet';
import { getTokenListForChain } from './constants';

// ERC1155 ABI for balance checking
const erc1155Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOfBatch',
    type: 'function',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    name: 'uri',
    type: 'function',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

// Cache for asset data
const assetCache = new Map<string, { data: WalletAssets; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetch native ETH balance
 */
export async function fetchNativeBalance(
  address: Address,
  chainId?: number
): Promise<NativeAsset> {
  try {
    const balance = await getBalance(config, {
      address,
      chainId,
    });

    return {
      type: 'native',
      address: null,
      symbol: 'ETH',
      decimals: 18,
      balance: balance.value,
      formattedBalance: formatUnits(balance.value, 18),
      metadata: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId,
      },
    };
  } catch (error) {
    console.error('Error fetching native balance:', error);
    return {
      type: 'native',
      address: null,
      symbol: 'ETH',
      decimals: 18,
      balance: 0n,
      formattedBalance: '0',
    };
  }
}

/**
 * Fetch ERC20 token balance for a specific token
 */
export async function fetchERC20Balance(
  walletAddress: Address,
  tokenAddress: Address,
  decimals = 18
): Promise<ERC20Asset | null> {
  try {
    // Get balance
    const balance = await readContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    // Skip if balance is 0
    if (balance === 0n) return null;

    // Try to get metadata
    let name = '';
    let symbol = '';

    try {
      [name, symbol] = await Promise.all([
        readContract(config, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'name',
        }),
        readContract(config, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
      ]);
    } catch (metadataError) {
      console.warn('Could not fetch token metadata:', metadataError);
    }

    return {
      type: 'erc20',
      address: tokenAddress,
      balance,
      decimals,
      formattedBalance: formatUnits(balance, decimals),
      metadata: {
        name,
        symbol,
        decimals,
      },
    };
  } catch (error) {
    // Check if it's a contract execution error (contract doesn't exist or wrong network)
    if (error instanceof Error && error.message.includes('returned no data')) {
      console.warn(`Token contract ${tokenAddress} may not exist on the current network or is not a valid ERC20 contract`);
    } else {
      console.error(`Error fetching ERC20 balance for ${tokenAddress}:`, error);
    }
    return null;
  }
}

/**
 * Fetch multiple ERC20 token balances
 */
export async function fetchERC20Balances(
  walletAddress: Address,
  chainId?: number,
  tokenList?: Address[]
): Promise<ERC20Asset[]> {
  // Use network-specific token list if chainId is provided, otherwise fall back to provided list or default
  let tokensToCheck: Address[];
  let tokenMetadata: { address: Address; decimals: number }[];

  if (chainId && !tokenList) {
    const networkTokens = getTokenListForChain(chainId);
    tokensToCheck = networkTokens.map(t => t.address).filter(addr => addr !== null) as Address[];
    tokenMetadata = networkTokens.map(t => ({ address: t.address as Address, decimals: t.decimals }));
  } else {
    tokensToCheck = tokenList || DEFAULT_TOKEN_LIST.map(t => t.address);
    tokenMetadata = DEFAULT_TOKEN_LIST;
  }

  const balancePromises = tokensToCheck.map(async (tokenAddress, index) => {
    const decimals = tokenMetadata.find(t => t.address === tokenAddress)?.decimals || 18;
    return fetchERC20Balance(walletAddress, tokenAddress, decimals);
  });

  const results = await Promise.all(balancePromises);
  return results.filter((asset): asset is ERC20Asset => asset !== null);
}

/**
 * Fetch NFT balance for a specific ERC721 token
 */
export async function fetchERC721Balance(
  walletAddress: Address,
  contractAddress: Address,
  tokenId: bigint
): Promise<ERC721Asset | null> {
  try {
    // Check ownership
    const owner = await readContract(config, {
      address: contractAddress,
      abi: erc721Abi,
      functionName: 'ownerOf',
      args: [tokenId],
    });

    if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
      return null;
    }

    // Try to get metadata
    let tokenURI = '';
    let name = '';
    let symbol = '';

    try {
      [tokenURI, name, symbol] = await Promise.all([
        readContract(config, {
          address: contractAddress,
          abi: erc721Abi,
          functionName: 'tokenURI',
          args: [tokenId],
        }),
        readContract(config, {
          address: contractAddress,
          abi: erc721Abi,
          functionName: 'name',
        }),
        readContract(config, {
          address: contractAddress,
          abi: erc721Abi,
          functionName: 'symbol',
        }),
      ]);
    } catch (metadataError) {
      console.warn('Could not fetch NFT metadata:', metadataError);
    }

    return {
      type: 'erc721',
      address: contractAddress,
      tokenId,
      balance: 1n,
      tokenURI,
      metadata: {
        name,
        symbol,
      },
    };
  } catch (error) {
    console.error(`Error fetching ERC721 balance:`, error);
    return null;
  }
}

/**
 * Fetch NFT balance for a specific ERC1155 token
 */
export async function fetchERC1155Balance(
  walletAddress: Address,
  contractAddress: Address,
  tokenId: bigint
): Promise<ERC1155Asset | null> {
  try {
    // Get balance
    const balance = await readContract(config, {
      address: contractAddress,
      abi: erc1155Abi,
      functionName: 'balanceOf',
      args: [walletAddress, tokenId],
    });

    if (balance === 0n) return null;

    // Try to get metadata URI
    let tokenURI = '';
    try {
      tokenURI = await readContract(config, {
        address: contractAddress,
        abi: erc1155Abi,
        functionName: 'uri',
        args: [tokenId],
      });
    } catch (metadataError) {
      console.warn('Could not fetch ERC1155 metadata:', metadataError);
    }

    return {
      type: 'erc1155',
      address: contractAddress,
      tokenId,
      balance,
      tokenURI,
    };
  } catch (error) {
    console.error(`Error fetching ERC1155 balance:`, error);
    return null;
  }
}

/**
 * Main function to fetch all wallet assets
 */
export async function fetchWalletAssets(
  walletAddress: Address,
  options: FetchAssetsOptions = {}
): Promise<WalletAssets> {
  const {
    includeNative = true,
    includeERC20 = true,
    includeNFTs = false,
    tokenList,
    chainId,
    cache = true,
  } = options;

  // Check cache
  if (cache) {
    const cacheKey = `${walletAddress}-${chainId}`;
    const cached = assetCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  const assets: WalletAssets = {
    native: null,
    erc20: [],
    erc721: [],
    erc1155: [],
    lastUpdated: new Date(),
  };

  // Fetch assets in parallel
  const promises: Promise<any>[] = [];

  if (includeNative) {
    promises.push(
      fetchNativeBalance(walletAddress, chainId).then(
        (native) => (assets.native = native)
      )
    );
  }

  if (includeERC20) {
    promises.push(
      fetchERC20Balances(walletAddress, chainId, tokenList).then(
        (erc20) => (assets.erc20 = erc20)
      )
    );
  }

  // Note: NFT fetching would require additional integration with services like Alchemy or Moralis
  // for discovering owned NFTs. Here we provide the structure but would need external APIs.
  if (includeNFTs) {
    // This is a placeholder - in production, you'd use an NFT indexing service
    console.log('NFT fetching requires integration with indexing services');
  }

  await Promise.all(promises);

  // Cache the results
  if (cache) {
    const cacheKey = `${walletAddress}-${chainId}`;
    assetCache.set(cacheKey, {
      data: assets,
      timestamp: Date.now(),
    });
  }

  return assets;
}

/**
 * Clear the asset cache
 */
export function clearAssetCache(walletAddress?: Address, chainId?: number) {
  if (walletAddress) {
    const cacheKey = `${walletAddress}-${chainId}`;
    assetCache.delete(cacheKey);
  } else {
    assetCache.clear();
  }
}

/**
 * Format asset display value
 */
export function formatAssetValue(
  balance: bigint,
  decimals: number,
  maxDecimals = 6
): string {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.000001) return '< 0.000001';
  
  return num.toFixed(maxDecimals).replace(/\.?0+$/, '');
}
