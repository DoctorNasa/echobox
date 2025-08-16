export interface Gift {
  id: string;
  sender: string;
  recipient: string;
  amount: string; // ETH amount as string
  unlockTimestamp: number;
  message: string;
  claimed: boolean;
  createdAt: number;
}

export interface CreateGiftParams {
  recipientENS: string;
  recipientAddress: string;
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