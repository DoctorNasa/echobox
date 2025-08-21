import type { TokenMeta } from '@/types/asset';

// Contract Addresses
export const ECHOBOX_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECHOBOX_CONTRACT_ADDRESS || "0xb5aa12ccb861827a0d2daf47082780247a6d254e";
export const GIFTBOX_V2_ADDRESS = process.env.NEXT_PUBLIC_GIFTBOX_V2_ADDRESS || "0x6802ec0997148cd10257c449702E900405c64cbC";
export const PYUSD_ADDRESS_SEPOLIA = process.env.NEXT_PUBLIC_PYUSD_ADDRESS_SEPOLIA || "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
export const PYUSD_ADDRESS_MAINNET = process.env.NEXT_PUBLIC_PYUSD_ADDRESS_MAINNET || "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";

// Chain Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const MAINNET_CHAIN_ID = 1;
export const SUPPORTED_CHAINS = [MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID];

// Get network-specific PYUSD address
export function getPYUSDAddress(chainId: number): string {
  switch (chainId) {
    case MAINNET_CHAIN_ID:
      return PYUSD_ADDRESS_MAINNET;
    case SEPOLIA_CHAIN_ID:
      return PYUSD_ADDRESS_SEPOLIA;
    default:
      return PYUSD_ADDRESS_SEPOLIA; // Default to Sepolia for testing
  }
}

// Contract ABI
export { default as ECHOBOX_ABI } from './EchoBoxABI.json';

// Enhanced Token Registry for Multi-Asset Support
// Mainnet Token List
export const MAINNET_TOKEN_LIST: TokenMeta[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: null,
    decimals: 18,
    icon: "/tokens/eth.svg"
  },
  {
    symbol: "PYUSD",
    name: "PayPal USD",
    address: PYUSD_ADDRESS_MAINNET as `0x${string}`,
    decimals: 6,
    icon: "/tokens/pyusd.svg"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`, // Mainnet USDC
    decimals: 6,
    icon: "/tokens/usdc.svg"
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`, // Mainnet WETH
    decimals: 18,
    icon: "/tokens/weth.svg"
  },
  {
    symbol: "DAI",
    name: "DAI Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" as `0x${string}`, // Mainnet DAI
    decimals: 18,
    icon: "/tokens/dai.svg"
  },
];

// Sepolia Token List
export const SEPOLIA_TOKEN_LIST: TokenMeta[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: null,
    decimals: 18,
    icon: "/tokens/eth.svg"
  },
  {
    symbol: "PYUSD",
    name: "PayPal USD",
    address: PYUSD_ADDRESS_SEPOLIA as `0x${string}`,
    decimals: 6,
    icon: "/tokens/pyusd.svg"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" as `0x${string}`, // Sepolia USDC
    decimals: 6,
    icon: "/tokens/usdc.svg"
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c" as `0x${string}`, // Sepolia WETH
    decimals: 18,
    icon: "/tokens/weth.svg"
  },
  {
    symbol: "DAI",
    name: "DAI Stablecoin",
    address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574" as `0x${string}`, // Sepolia DAI
    decimals: 18,
    icon: "/tokens/dai.svg"
  },
];

// Function to get token list based on chain ID
export function getTokenListForChain(chainId: number): TokenMeta[] {
  switch (chainId) {
    case MAINNET_CHAIN_ID:
      return MAINNET_TOKEN_LIST;
    case SEPOLIA_CHAIN_ID:
      return SEPOLIA_TOKEN_LIST;
    default:
      return MAINNET_TOKEN_LIST; // Default to mainnet
  }
}

// Legacy TOKEN_LIST for backward compatibility (defaults to mainnet)
export const TOKEN_LIST: TokenMeta[] = MAINNET_TOKEN_LIST;

// Legacy TOKENS object for backward compatibility
export const TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    isNative: true,
  },
  PYUSD: {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    decimals: 6,
    address: PYUSD_ADDRESS_SEPOLIA,
    isNative: false,
  },
};

// ENS Configuration
export const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

// Time Constants
export const MIN_LOCK_TIME = 60 * 60; // 1 hour minimum lock
export const MAX_LOCK_TIME = 365 * 24 * 60 * 60; // 1 year maximum lock

// UI Constants
export const DATE_FORMAT = 'MMM dd, yyyy HH:mm';
export const TRANSACTION_TOAST_DURATION = 5000;
