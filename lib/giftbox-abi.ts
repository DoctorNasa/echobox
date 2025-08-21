// GiftBoxV2 Contract ABI
export const GIFTBOX_V2_ABI = [
  // Events
  {
    name: "GiftCreated",
    type: "event",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "assetType", type: "uint8" },
      { name: "token", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "recipientENS", type: "string" },
    ],
  },
  {
    name: "GiftClaimed",
    type: "event",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: true },
    ],
  },

  // Write Functions
  {
    name: "createGiftETH",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    name: "createGiftERC20",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "createGiftERC721",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "token", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "createGiftERC1155",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "token", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "claimGift",
    type: "function",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // View Functions
  {
    name: "gifts",
    type: "function",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "claimed", type: "bool" },
      { name: "assetType", type: "uint8" },
      { name: "token", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    stateMutability: "view",
  },
  {
    name: "getSentGifts",
    type: "function",
    inputs: [{ name: "sender", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    name: "getReceivedGifts",
    type: "function",
    inputs: [{ name: "recipient", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    name: "getGiftsByENS",
    type: "function",
    inputs: [{ name: "ensName", type: "string" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    name: "getGiftDetails",
    type: "function",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "sender", type: "address" },
          { name: "recipient", type: "address" },
          { name: "unlockTimestamp", type: "uint256" },
          { name: "claimed", type: "bool" },
          { name: "assetType", type: "uint8" },
          { name: "token", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "recipientENS", type: "string" },
          { name: "message", type: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    name: "getMultipleGifts",
    type: "function",
    inputs: [{ name: "ids", type: "uint256[]" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "sender", type: "address" },
          { name: "recipient", type: "address" },
          { name: "unlockTimestamp", type: "uint256" },
          { name: "claimed", type: "bool" },
          { name: "assetType", type: "uint8" },
          { name: "token", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "recipientENS", type: "string" },
          { name: "message", type: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    name: "nextId",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Contract Address
export const GIFTBOX_V2_ADDRESS = '0x6802ec0997148cd10257c449702E900405c64cbC' as const;

// Asset Types Enum
export enum AssetType {
  ETH = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
}

// Gift Interface
export interface Gift {
  sender: string;
  recipient: string;
  unlockTimestamp: bigint;
  claimed: boolean;
  assetType: AssetType;
  token: string;
  tokenId: bigint;
  amount: bigint;
  recipientENS: string;
  message: string;
}

// Processed Gift Interface for UI
export interface ProcessedGift {
  id: number;
  sender: string;
  recipient: string;
  unlockDate: Date;
  claimed: boolean;
  assetType: 'ETH' | 'ERC20' | 'ERC721' | 'ERC1155';
  token: string;
  tokenId: string;
  amount: string;
  recipientENS: string;
  message: string;
  isUnlocked: boolean;
  timeRemaining?: string;
}
