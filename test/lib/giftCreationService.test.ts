import { describe, it, expect, vi } from 'vitest';
import { GiftCreationService } from '../../lib/giftCreationService';
import { AssetType } from '../../lib/giftbox-abi';

describe('GiftCreationService', () => {
  describe('validateParams', () => {
    const validParams = {
      recipient: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      recipientENS: 'test.eth',
      unlockDate: new Date(Date.now() + 86400000), // 1 day from now
      message: 'Happy Birthday!',
      assetType: AssetType.ETH,
      amount: '1.0',
    };

    it('should validate correct ETH gift parameters', () => {
      const result = GiftCreationService.validateParams(validParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid recipient address', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        recipient: 'invalid-address',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid recipient address format');
    });

    it('should reject empty recipient', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        recipient: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Recipient address is required');
    });

    it('should reject zero or negative amount', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        amount: '0',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than 0');
    });

    it('should reject past unlock date', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        unlockDate: new Date(Date.now() - 86400000), // 1 day ago
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unlock date must be in the future');
    });

    it('should reject empty message', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        message: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message is required');
    });

    it('should reject message that is too long', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        message: 'a'.repeat(501), // 501 characters
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message must be less than 500 characters');
    });

    it('should require token address for ERC20', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        assetType: AssetType.ERC20,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid token address is required for ERC20 gifts');
    });

    it('should require token address and token ID for ERC721', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        assetType: AssetType.ERC721,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid token address is required for NFT gifts');
      expect(result.errors).toContain('Valid token ID is required for NFT gifts');
    });

    it('should validate ERC721 with valid token address and ID', () => {
      const result = GiftCreationService.validateParams({
        ...validParams,
        assetType: AssetType.ERC721,
        token: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        tokenId: '42',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('prepareContractCall', () => {
    const baseParams = {
      recipient: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      recipientENS: 'test.eth',
      unlockDate: new Date('2024-12-25T00:00:00Z'),
      message: 'Merry Christmas!',
      amount: '1.5',
    };

    it('should prepare ETH gift contract call', () => {
      const params = {
        ...baseParams,
        assetType: AssetType.ETH,
      };

      const result = GiftCreationService.prepareContractCall(params);

      expect(result.functionName).toBe('createGiftETH');
      expect(result.args).toHaveLength(4);
      expect(result.args[0]).toBe(params.recipient);
      expect(result.args[2]).toBe(params.recipientENS);
      expect(result.args[3]).toBe(params.message);
      expect(result.value).toBeDefined();
    });

    it('should prepare ERC20 gift contract call', () => {
      const params = {
        ...baseParams,
        assetType: AssetType.ERC20,
        token: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        decimals: 18,
      };

      const result = GiftCreationService.prepareContractCall(params);

      expect(result.functionName).toBe('createGiftERC20');
      expect(result.args).toHaveLength(6);
      expect(result.args[2]).toBe(params.token);
      expect(result.value).toBeUndefined();
    });

    it('should prepare ERC721 gift contract call', () => {
      const params = {
        ...baseParams,
        assetType: AssetType.ERC721,
        token: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        tokenId: '42',
      };

      const result = GiftCreationService.prepareContractCall(params);

      expect(result.functionName).toBe('createGiftERC721');
      expect(result.args).toHaveLength(6);
      expect(result.args[2]).toBe(params.token);
      expect(result.args[3]).toBe(BigInt(42));
    });

    it('should throw error for ERC20 without token address', () => {
      const params = {
        ...baseParams,
        assetType: AssetType.ERC20,
      };

      expect(() => GiftCreationService.prepareContractCall(params)).toThrow(
        'Token address required for ERC20'
      );
    });
  });

  describe('getAssetDisplayInfo', () => {
    it('should return correct display info for ETH', () => {
      const params = {
        recipient: '0x123',
        recipientENS: '',
        unlockDate: new Date(),
        message: '',
        assetType: AssetType.ETH,
        amount: '1.23456',
      };

      const result = GiftCreationService.getAssetDisplayInfo(params);

      expect(result.displayAmount).toBe('1.2346');
      expect(result.displaySymbol).toBe('ETH');
      expect(result.displayIcon).toBe('💎');
    });

    it('should return correct display info for ERC20', () => {
      const params = {
        recipient: '0x123',
        recipientENS: '',
        unlockDate: new Date(),
        message: '',
        assetType: AssetType.ERC20,
        amount: '100.567',
      };

      const result = GiftCreationService.getAssetDisplayInfo(params);

      expect(result.displayAmount).toBe('100.57');
      expect(result.displaySymbol).toBe('Tokens');
      expect(result.displayIcon).toBe('🪙');
    });

    it('should return correct display info for ERC721', () => {
      const params = {
        recipient: '0x123',
        recipientENS: '',
        unlockDate: new Date(),
        message: '',
        assetType: AssetType.ERC721,
        amount: '1',
        tokenId: '42',
      };

      const result = GiftCreationService.getAssetDisplayInfo(params);

      expect(result.displayAmount).toBe('1');
      expect(result.displaySymbol).toBe('NFT #42');
      expect(result.displayIcon).toBe('🖼️');
    });
  });

  describe('formatUnlockDate', () => {
    it('should format tomorrow correctly', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = GiftCreationService.formatUnlockDate(tomorrow);
      expect(result).toBe('Tomorrow');
    });

    it('should format days correctly', () => {
      const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const result = GiftCreationService.formatUnlockDate(threeDays);
      expect(result).toBe('In 3 days');
    });

    it('should format weeks correctly', () => {
      const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const result = GiftCreationService.formatUnlockDate(twoWeeks);
      expect(result).toBe('In 2 weeks');
    });

    it('should format months correctly', () => {
      const twoMonths = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const result = GiftCreationService.formatUnlockDate(twoMonths);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Should be a date string
    });
  });

  describe('checkSufficientBalance', () => {
    it('should return sufficient for adequate ETH balance', () => {
      const result = GiftCreationService.checkSufficientBalance('2.0', '1.5', AssetType.ETH);
      expect(result.sufficient).toBe(true);
      expect(result.shortfall).toBeUndefined();
    });

    it('should return insufficient for inadequate ETH balance', () => {
      const result = GiftCreationService.checkSufficientBalance('1.0', '1.5', AssetType.ETH);
      expect(result.sufficient).toBe(false);
      expect(result.shortfall).toBe('0.500000');
    });

    it('should return sufficient for ERC721 (assumes ownership)', () => {
      const result = GiftCreationService.checkSufficientBalance('0', '1', AssetType.ERC721);
      expect(result.sufficient).toBe(true);
    });

    it('should handle edge case of exact balance', () => {
      const result = GiftCreationService.checkSufficientBalance('1.5', '1.5', AssetType.ETH);
      expect(result.sufficient).toBe(true);
    });
  });

  describe('estimateGas', () => {
    it('should return reasonable gas estimates for different asset types', async () => {
      const baseParams = {
        recipient: '0x123',
        recipientENS: '',
        unlockDate: new Date(),
        message: '',
        amount: '1.0',
      };

      const ethEstimate = await GiftCreationService.estimateGas({
        ...baseParams,
        assetType: AssetType.ETH,
      });
      expect(ethEstimate.gasLimit).toBe(BigInt(150000));

      const erc20Estimate = await GiftCreationService.estimateGas({
        ...baseParams,
        assetType: AssetType.ERC20,
      });
      expect(erc20Estimate.gasLimit).toBe(BigInt(200000));

      const erc721Estimate = await GiftCreationService.estimateGas({
        ...baseParams,
        assetType: AssetType.ERC721,
      });
      expect(erc721Estimate.gasLimit).toBe(BigInt(250000));
    });

    it('should include estimated cost in ETH', async () => {
      const params = {
        recipient: '0x123',
        recipientENS: '',
        unlockDate: new Date(),
        message: '',
        assetType: AssetType.ETH,
        amount: '1.0',
      };

      const estimate = await GiftCreationService.estimateGas(params);
      expect(estimate.estimatedCost).toMatch(/^\d+\.\d{6}$/); // Should be a decimal with 6 places
      expect(parseFloat(estimate.estimatedCost)).toBeGreaterThan(0);
    });
  });
});
