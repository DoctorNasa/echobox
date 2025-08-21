import { type ProcessedGift } from './giftbox-abi';
import { GiftStatus } from '../types/gift';

// Convert blockchain gift to UI gift format
export function convertBlockchainGiftToUIGift(blockchainGift: ProcessedGift): any {
  // Validate required fields
  if (!blockchainGift) {
    throw new Error('blockchainGift is required');
  }

  // Determine status based on blockchain state
  let status: GiftStatus;
  if (blockchainGift.claimed) {
    status = GiftStatus.CLAIMED;
  } else if (blockchainGift.isUnlocked) {
    status = GiftStatus.CLAIMABLE;
  } else {
    status = GiftStatus.PENDING;
  }

  // Safely handle assetType with fallback
  const assetType = blockchainGift.assetType || 'ETH';
  const amount = blockchainGift.amount || '0';
  const token = blockchainGift.token || '';
  const tokenId = blockchainGift.tokenId || '';

  // Convert asset type to UI format
  let assetInfo = {
    type: assetType.toLowerCase(),
    symbol: assetType,
    amount: amount,
    address: token,
  };

  // Enhanced asset info for different types
  if (assetType === 'ETH') {
    assetInfo.symbol = 'ETH';
    assetInfo.address = '0x0000000000000000000000000000000000000000';
  } else if (assetType === 'ERC721') {
    assetInfo.symbol = `NFT #${tokenId}`;
  } else if (assetType === 'ERC1155') {
    assetInfo.symbol = `Token #${tokenId}`;
  }

  // Safely handle dates
  const unlockDate = blockchainGift.unlockDate || new Date();
  const unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);

  return {
    id: (blockchainGift.id || 0).toString(),
    sender: blockchainGift.sender || '',
    recipient: blockchainGift.recipient || '',
    recipientENS: blockchainGift.recipientENS || '',
    message: blockchainGift.message || '',
    asset: assetInfo,
    unlockTimestamp,
    status,
    createdAt: new Date().toISOString(), // We don't have creation time from contract
    claimedAt: blockchainGift.claimed ? new Date().toISOString() : undefined,
  };
}

// Get time until unlock for display
export function getTimeUntilUnlock(unlockTimestamp: number): string | null {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = unlockTimestamp - now;
  
  if (timeLeft <= 0) {
    return null; // Already unlocked
  }
  
  const days = Math.floor(timeLeft / (24 * 60 * 60));
  const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Format asset display
export function formatAssetDisplay(gift: ProcessedGift): string {
  switch (gift.assetType) {
    case 'ETH':
      return `${parseFloat(gift.amount).toFixed(4)} ETH`;
    case 'ERC20':
      return `${parseFloat(gift.amount).toFixed(2)} Tokens`;
    case 'ERC721':
      return `NFT #${gift.tokenId}`;
    case 'ERC1155':
      return `${gift.amount}x Token #${gift.tokenId}`;
    default:
      return gift.amount;
  }
}

// Get asset icon/emoji
export function getAssetIcon(assetType: string): string {
  switch (assetType.toLowerCase()) {
    case 'eth':
      return '💎';
    case 'erc20':
      return '🪙';
    case 'erc721':
      return '🖼️';
    case 'erc1155':
      return '🎨';
    default:
      return '🎁';
  }
}

// Validate gift creation parameters
export function validateGiftParams(params: {
  recipient: string;
  amount: string;
  unlockDate: Date;
  message: string;
  assetType: string;
  token?: string;
  tokenId?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate recipient
  if (!params.recipient || !params.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('Invalid recipient address');
  }

  // Validate amount
  if (!params.amount || parseFloat(params.amount) <= 0) {
    errors.push('Amount must be greater than 0');
  }

  // Validate unlock date
  if (!params.unlockDate || params.unlockDate <= new Date()) {
    errors.push('Unlock date must be in the future');
  }

  // Validate message
  if (!params.message || params.message.trim().length === 0) {
    errors.push('Message is required');
  }

  // Validate asset-specific parameters
  if (params.assetType === 'ERC721' || params.assetType === 'ERC1155') {
    if (!params.token || !params.token.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Valid token address is required for NFTs');
    }
    if (!params.tokenId || parseInt(params.tokenId) < 0) {
      errors.push('Valid token ID is required for NFTs');
    }
  }

  if (params.assetType === 'ERC20') {
    if (!params.token || !params.token.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Valid token address is required for ERC20 tokens');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get gift status color for UI
export function getStatusColor(status: GiftStatus): string {
  switch (status) {
    case GiftStatus.PENDING:
      return 'text-yellow-600 bg-yellow-100';
    case GiftStatus.CLAIMABLE:
      return 'text-green-600 bg-green-100';
    case GiftStatus.CLAIMED:
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get gift status text
export function getStatusText(status: GiftStatus): string {
  switch (status) {
    case GiftStatus.PENDING:
      return 'Pending';
    case GiftStatus.CLAIMABLE:
      return 'Ready to Claim';
    case GiftStatus.CLAIMED:
      return 'Claimed';
    default:
      return 'Unknown';
  }
}

// Sort gifts by priority (claimable first, then by unlock time)
export function sortGiftsByPriority(gifts: ProcessedGift[]): ProcessedGift[] {
  return [...gifts].sort((a, b) => {
    // Claimable gifts first
    if (a.isUnlocked && !a.claimed && (!b.isUnlocked || b.claimed)) return -1;
    if (b.isUnlocked && !b.claimed && (!a.isUnlocked || a.claimed)) return 1;

    // Then by unlock time (soonest first)
    // Handle cases where unlockDate might be undefined or invalid
    const aTime = a.unlockDate?.getTime?.() || 0;
    const bTime = b.unlockDate?.getTime?.() || 0;
    return aTime - bTime;
  });
}

// Sort UI gifts by priority (for gifts that have been converted to UI format)
export function sortUIGiftsByPriority(gifts: any[]): any[] {
  return [...gifts].sort((a, b) => {
    // Claimable gifts first
    const aClaimable = a.status === GiftStatus.CLAIMABLE;
    const bClaimable = b.status === GiftStatus.CLAIMABLE;

    if (aClaimable && !bClaimable) return -1;
    if (bClaimable && !aClaimable) return 1;

    // Then by unlock time (soonest first)
    // UI gifts have unlockTimestamp (number) instead of unlockDate (Date)
    const aTime = a.unlockTimestamp || 0;
    const bTime = b.unlockTimestamp || 0;
    return aTime - bTime;
  });
}

// Filter gifts by status
export function filterGiftsByStatus(gifts: ProcessedGift[], status: GiftStatus): ProcessedGift[] {
  return gifts.filter(gift => {
    switch (status) {
      case GiftStatus.PENDING:
        return !gift.isUnlocked && !gift.claimed;
      case GiftStatus.CLAIMABLE:
        return gift.isUnlocked && !gift.claimed;
      case GiftStatus.CLAIMED:
        return gift.claimed;
      default:
        return true;
    }
  });
}

// Get gift statistics
export function getGiftStatistics(gifts: ProcessedGift[]) {
  const total = gifts.length;
  const pending = gifts.filter(g => !g.isUnlocked && !g.claimed).length;
  const claimable = gifts.filter(g => g.isUnlocked && !g.claimed).length;
  const claimed = gifts.filter(g => g.claimed).length;
  
  const totalValue = gifts.reduce((sum, gift) => {
    if (gift.assetType === 'ETH') {
      return sum + parseFloat(gift.amount);
    }
    return sum; // For now, only count ETH value
  }, 0);

  return {
    total,
    pending,
    claimable,
    claimed,
    totalValue: totalValue.toFixed(4),
  };
}
