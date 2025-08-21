import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertBlockchainGiftToUIGift,
  getTimeUntilUnlock,
  formatAssetDisplay,
  getAssetIcon,
  validateGiftParams,
  getStatusColor,
  getStatusText,
  sortGiftsByPriority,
  filterGiftsByStatus,
  getGiftStatistics,
} from '../../lib/giftService';
import { GiftStatus } from '../../types/gift';
import { AssetType, type ProcessedGift } from '../../lib/giftbox-abi';

describe('GiftService', () => {
  describe('convertBlockchainGiftToUIGift', () => {
    it('should convert ETH gift correctly', () => {
      const blockchainGift: ProcessedGift = {
        id: 1,
        sender: '0x123',
        recipient: '0x456',
        unlockDate: new Date(Date.now() + 86400000), // 1 day from now
        claimed: false,
        assetType: 'ETH',
        token: '0x0000000000000000000000000000000000000000',
        tokenId: '0',
        amount: '1.5',
        recipientENS: 'test.eth',
        message: 'Happy Birthday!',
        isUnlocked: false,
        timeRemaining: '1d 0h',
      };

      const result = convertBlockchainGiftToUIGift(blockchainGift);

      expect(result.id).toBe('1');
      expect(result.status).toBe(GiftStatus.PENDING);
      expect(result.asset.type).toBe('eth');
      expect(result.asset.symbol).toBe('ETH');
      expect(result.asset.amount).toBe('1.5');
    });

    it('should convert claimed gift correctly', () => {
      const blockchainGift: ProcessedGift = {
        id: 2,
        sender: '0x123',
        recipient: '0x456',
        unlockDate: new Date(Date.now() - 86400000), // 1 day ago
        claimed: true,
        assetType: 'ETH',
        token: '0x0000000000000000000000000000000000000000',
        tokenId: '0',
        amount: '0.5',
        recipientENS: '',
        message: 'Congratulations!',
        isUnlocked: true,
      };

      const result = convertBlockchainGiftToUIGift(blockchainGift);

      expect(result.status).toBe(GiftStatus.CLAIMED);
      expect(result.claimedAt).toBeDefined();
    });

    it('should convert claimable gift correctly', () => {
      const blockchainGift: ProcessedGift = {
        id: 3,
        sender: '0x123',
        recipient: '0x456',
        unlockDate: new Date(Date.now() - 3600000), // 1 hour ago
        claimed: false,
        assetType: 'ETH',
        token: '0x0000000000000000000000000000000000000000',
        tokenId: '0',
        amount: '2.0',
        recipientENS: 'recipient.eth',
        message: 'Enjoy!',
        isUnlocked: true,
      };

      const result = convertBlockchainGiftToUIGift(blockchainGift);

      expect(result.status).toBe(GiftStatus.CLAIMABLE);
    });

    it('should handle undefined assetType gracefully', () => {
      const giftWithUndefinedAssetType: any = {
        id: 4,
        sender: '0x123',
        recipient: '0x456',
        unlockDate: new Date(),
        claimed: false,
        assetType: undefined,
        token: undefined,
        tokenId: undefined,
        amount: undefined,
        recipientENS: '',
        message: 'Test message',
        isUnlocked: false,
      };

      const result = convertBlockchainGiftToUIGift(giftWithUndefinedAssetType);

      expect(result.asset.type).toBe('eth'); // fallback to ETH
      expect(result.asset.symbol).toBe('ETH');
      expect(result.asset.amount).toBe('0'); // fallback to '0'
      expect(result.asset.address).toBe('0x0000000000000000000000000000000000000000');
    });
  });

  describe('getTimeUntilUnlock', () => {
    it('should return null for past timestamps', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(getTimeUntilUnlock(pastTimestamp)).toBeNull();
    });

    it('should format days and hours correctly', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60) + (3 * 60 * 60); // 2 days 3 hours
      const result = getTimeUntilUnlock(futureTimestamp);
      expect(result).toBe('2d 3h');
    });

    it('should format hours and minutes correctly', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + (2 * 60 * 60) + (30 * 60); // 2 hours 30 minutes
      const result = getTimeUntilUnlock(futureTimestamp);
      expect(result).toBe('2h 30m');
    });

    it('should format minutes only correctly', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + (45 * 60); // 45 minutes
      const result = getTimeUntilUnlock(futureTimestamp);
      expect(result).toBe('45m');
    });
  });

  describe('formatAssetDisplay', () => {
    it('should format ETH correctly', () => {
      const gift: ProcessedGift = {
        id: 1,
        sender: '0x123',
        recipient: '0x456',
        unlockDate: new Date(),
        claimed: false,
        assetType: 'ETH',
        token: '0x0',
        tokenId: '0',
        amount: '1.23456789',
        recipientENS: '',
        message: '',
        isUnlocked: false,
      };

      expect(formatAssetDisplay(gift)).toBe('1.2346 ETH');
    });

    it('should format ERC20 correctly', () => {
      const gift: ProcessedGift = {
        id: 1,
        sender: '0x123',
        recipient: '0x456',
        unlockDate: new Date(),
        claimed: false,
        assetType: 'ERC20',
        token: '0x123',
        tokenId: '0',
        amount: '100.5',
        recipientENS: '',
        message: '',
        isUnlocked: false,
      };

      expect(formatAssetDisplay(gift)).toBe('100.50 Tokens');
    });

    it('should format ERC721 correctly', () => {
      const gift: ProcessedGift = {
        id: 1,
        sender: '0x123',
        recipient: '0x456',
        unlockDate: new Date(),
        claimed: false,
        assetType: 'ERC721',
        token: '0x123',
        tokenId: '42',
        amount: '1',
        recipientENS: '',
        message: '',
        isUnlocked: false,
      };

      expect(formatAssetDisplay(gift)).toBe('NFT #42');
    });
  });

  describe('getAssetIcon', () => {
    it('should return correct icons for asset types', () => {
      expect(getAssetIcon('eth')).toBe('💎');
      expect(getAssetIcon('erc20')).toBe('🪙');
      expect(getAssetIcon('erc721')).toBe('🖼️');
      expect(getAssetIcon('erc1155')).toBe('🎨');
      expect(getAssetIcon('unknown')).toBe('🎁');
    });
  });

  describe('validateGiftParams', () => {
    const validParams = {
      recipient: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      amount: '1.0',
      unlockDate: new Date(Date.now() + 86400000), // 1 day from now
      message: 'Happy Birthday!',
      assetType: 'ETH',
    };

    it('should validate correct parameters', () => {
      const result = validateGiftParams(validParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid recipient address', () => {
      const result = validateGiftParams({
        ...validParams,
        recipient: 'invalid-address',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid recipient address');
    });

    it('should reject zero amount', () => {
      const result = validateGiftParams({
        ...validParams,
        amount: '0',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than 0');
    });

    it('should reject past unlock date', () => {
      const result = validateGiftParams({
        ...validParams,
        unlockDate: new Date(Date.now() - 86400000), // 1 day ago
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unlock date must be in the future');
    });

    it('should reject empty message', () => {
      const result = validateGiftParams({
        ...validParams,
        message: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message is required');
    });

    it('should require token address for ERC721', () => {
      const result = validateGiftParams({
        ...validParams,
        assetType: 'ERC721',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid token address is required for NFTs');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor(GiftStatus.PENDING)).toBe('text-yellow-600 bg-yellow-100');
      expect(getStatusColor(GiftStatus.CLAIMABLE)).toBe('text-green-600 bg-green-100');
      expect(getStatusColor(GiftStatus.CLAIMED)).toBe('text-gray-600 bg-gray-100');
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for each status', () => {
      expect(getStatusText(GiftStatus.PENDING)).toBe('Pending');
      expect(getStatusText(GiftStatus.CLAIMABLE)).toBe('Ready to Claim');
      expect(getStatusText(GiftStatus.CLAIMED)).toBe('Claimed');
    });
  });

  describe('sortGiftsByPriority', () => {
    it('should sort claimable gifts first', () => {
      const gifts: ProcessedGift[] = [
        {
          id: 1,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: new Date(Date.now() + 86400000),
          claimed: false,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '1.0',
          recipientENS: '',
          message: '',
          isUnlocked: false,
        },
        {
          id: 2,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: new Date(Date.now() - 3600000),
          claimed: false,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '1.0',
          recipientENS: '',
          message: '',
          isUnlocked: true,
        },
      ];

      const sorted = sortGiftsByPriority(gifts);
      expect(sorted[0].id).toBe(2); // Claimable gift should be first
    });

    it('should handle gifts with undefined or invalid unlockDate', () => {
      const gifts: ProcessedGift[] = [
        {
          id: 1,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: undefined as any, // Simulate undefined unlockDate
          claimed: false,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '1.0',
          recipientENS: '',
          message: '',
          isUnlocked: false,
        },
        {
          id: 2,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: new Date('invalid date'), // Invalid date
          claimed: false,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '2.0',
          recipientENS: '',
          message: '',
          isUnlocked: false,
        },
        {
          id: 3,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: new Date(Date.now() + 86400000), // Valid date
          claimed: false,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '3.0',
          recipientENS: '',
          message: '',
          isUnlocked: false,
        },
      ];

      // This should not throw an error
      expect(() => sortGiftsByPriority(gifts)).not.toThrow();

      const sorted = sortGiftsByPriority(gifts);
      expect(sorted).toHaveLength(3);
      // The valid date gift should be last (highest timestamp)
      expect(sorted[2].id).toBe(3);
    });
  });

  describe('getGiftStatistics', () => {
    it('should calculate statistics correctly', () => {
      const gifts: ProcessedGift[] = [
        {
          id: 1,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: new Date(Date.now() + 86400000),
          claimed: false,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '1.0',
          recipientENS: '',
          message: '',
          isUnlocked: false,
        },
        {
          id: 2,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: new Date(Date.now() - 3600000),
          claimed: false,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '2.0',
          recipientENS: '',
          message: '',
          isUnlocked: true,
        },
        {
          id: 3,
          sender: '0x123',
          recipient: '0x456',
          unlockDate: new Date(Date.now() - 86400000),
          claimed: true,
          assetType: 'ETH',
          token: '0x0',
          tokenId: '0',
          amount: '0.5',
          recipientENS: '',
          message: '',
          isUnlocked: true,
        },
      ];

      const stats = getGiftStatistics(gifts);
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.claimable).toBe(1);
      expect(stats.claimed).toBe(1);
      expect(stats.totalValue).toBe('3.5000');
    });
  });
});
