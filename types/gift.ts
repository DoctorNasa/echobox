export enum AssetType {
  ETH = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3
}

export interface Gift {
  id: string;
  sender: string;
  recipient: string;
  unlockTimestamp: number;
  claimed: boolean;
  assetType: AssetType;
  token: string; // address(0) for ETH
  tokenId: string; // ERC721/1155 only
  amount: string; // ETH/20 amount, or 1155 qty, or 1 for 721
  recipientENS: string; // ENS name for better UX
  message: string; // Personal message
  createdAt?: number;
}

export interface CreateGiftParams {
  recipientENS: string;
  recipientAddress: string;
  assetType: AssetType;
  token?: string; // Required for ERC20/721/1155
  tokenId?: string; // Required for ERC721/1155
  amount: string;
  unlockDate: Date;
  message: string;
}

export enum GiftStatus {
  PENDING = 'pending',
  CLAIMABLE = 'claimable',
  CLAIMED = 'claimed'
}

export interface GiftWithStatus extends Gift {
  status: GiftStatus;
  timeUntilUnlock?: number;
}