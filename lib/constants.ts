// Smart Contract Configuration
export const GIFT_BOX_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Placeholder

export const GIFT_BOX_ABI = [
  // createGift function
  {
    "inputs": [
      {"internalType": "address", "name": "_recipient", "type": "address"},
      {"internalType": "uint256", "name": "_unlockTimestamp", "type": "uint256"}
    ],
    "name": "createGift",
    "outputs": [{"internalType": "uint256", "name": "giftId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  // claimGift function
  {
    "inputs": [
      {"internalType": "uint256", "name": "_giftId", "type": "uint256"}
    ],
    "name": "claimGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getGiftDetails function
  {
    "inputs": [
      {"internalType": "uint256", "name": "_giftId", "type": "uint256"}
    ],
    "name": "getGiftDetails",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "sender", "type": "address"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "uint256", "name": "unlockTimestamp", "type": "uint256"},
          {"internalType": "bool", "name": "claimed", "type": "bool"}
        ],
        "internalType": "struct GiftBox.Gift",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getUserGifts function
  {
    "inputs": [
      {"internalType": "address", "name": "_user", "type": "address"}
    ],
    "name": "getUserGifts",
    "outputs": [
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "giftId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "unlockTimestamp", "type": "uint256"}
    ],
    "name": "GiftCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "giftId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"}
    ],
    "name": "GiftClaimed",
    "type": "event"
  }
] as const;

// Network Configuration
export const SUPPORTED_CHAINS = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/y30m-t8IaYUYsX6DcqqVm'
  },
  {
    id: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/y30m-t8IaYUYsX6DcqqVm'
  }
];

// Token Configuration
export const SUPPORTED_TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000' // Native ETH
  },
  PYUSD_MAINNET: {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    decimals: 6,
    address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8' // PYUSD on Ethereum mainnet
  },
  PYUSD_SEPOLIA: {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    decimals: 6,
    address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' // PYUSD on Ethereum Sepolia Testnet
  }
} as const;

// ENS Configuration
export const ENS_RESOLVER_ADDRESS = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63"; // Placeholder