import type { TokenMeta } from '@/types/asset';

// Contract Addresses
export const ECHOBOX_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECHOBOX_CONTRACT_ADDRESS || "0xb5aa12ccb861827a0d2daf47082780247a6d254e";
export const GIFTBOX_V2_ADDRESS = process.env.NEXT_PUBLIC_GIFTBOX_V2_ADDRESS || "0x6802ec0997148cd10257c449702E900405c64cbC";
export const PYUSD_ADDRESS_SEPOLIA = process.env.NEXT_PUBLIC_PYUSD_ADDRESS_SEPOLIA || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a9c";

// Chain Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SUPPORTED_CHAINS = [SEPOLIA_CHAIN_ID];

// Contract ABI
export { default as ECHOBOX_ABI } from './EchoBoxABI.json';

// Enhanced Token Registry for Multi-Asset Support
export const TOKEN_LIST: TokenMeta[] = [
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
