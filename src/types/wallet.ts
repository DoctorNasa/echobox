import { Address } from 'viem';

// Base wallet asset interface
export interface WalletAsset {
  type: 'native' | 'erc20' | 'erc721' | 'erc1155';
  address: Address | null; // null for native token
  balance: bigint;
  formattedBalance?: string;
  metadata?: AssetMetadata;
}

// Asset metadata
export interface AssetMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  logoURI?: string;
  chainId?: number;
}

// Native token (ETH)
export interface NativeAsset extends WalletAsset {
  type: 'native';
  address: null;
  symbol: 'ETH';
  decimals: 18;
}

// ERC20 token
export interface ERC20Asset extends WalletAsset {
  type: 'erc20';
  address: Address;
  decimals: number;
}

// NFT base
export interface NFTAsset extends WalletAsset {
  tokenId: bigint;
  tokenURI?: string;
  metadata?: NFTMetadata;
}

// NFT metadata
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// ERC721 NFT
export interface ERC721Asset extends NFTAsset {
  type: 'erc721';
  balance: bigint; // Always 1n for ERC721
}

// ERC1155 NFT
export interface ERC1155Asset extends NFTAsset {
  type: 'erc1155';
  balance: bigint; // Can be > 1 for ERC1155
}

// Combined wallet assets
export interface WalletAssets {
  native: NativeAsset | null;
  erc20: ERC20Asset[];
  erc721: ERC721Asset[];
  erc1155: ERC1155Asset[];
  totalValueUSD?: number;
  lastUpdated?: Date;
}

// Asset fetch options
export interface FetchAssetsOptions {
  includeNative?: boolean;
  includeERC20?: boolean;
  includeNFTs?: boolean;
  tokenList?: Address[]; // Specific tokens to check
  chainId?: number;
  cache?: boolean;
}

// Popular token list for default checking
export const DEFAULT_TOKEN_LIST: { address: Address; symbol: string; decimals: number }[] = [
  // Mainnet tokens
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 },
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  { address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8', symbol: 'PYUSD', decimals: 6 }, // Correct mainnet PYUSD

  // Add more popular tokens as needed
];
