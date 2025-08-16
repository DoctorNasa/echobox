// Contract Addresses
export const ECHOBOX_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECHOBOX_CONTRACT_ADDRESS || "0xb5aa12ccb861827a0d2daf47082780247a6d254e";
export const PYUSD_ADDRESS_SEPOLIA = process.env.NEXT_PUBLIC_PYUSD_ADDRESS_SEPOLIA || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a9c";

// Chain Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SUPPORTED_CHAINS = [SEPOLIA_CHAIN_ID];

// Contract ABI
export { default as ECHOBOX_ABI } from './EchoBoxABI.json';

// Token Configuration
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
    decimals: 6, // PYUSD typically uses 6 decimals
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
