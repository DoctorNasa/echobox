import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock viem first before importing anything else
const mockPublicClient = {
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
};

const mockWalletClient = {
  writeContract: vi.fn(),
};

vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => mockPublicClient),
  createWalletClient: vi.fn(() => mockWalletClient),
  http: vi.fn(),
  custom: vi.fn(),
  formatEther: vi.fn((value: bigint) => (Number(value) / 1e18).toString()),
  formatUnits: vi.fn((value: bigint, decimals: number) => (Number(value) / Math.pow(10, decimals)).toString()),
  parseEther: vi.fn((value: string) => BigInt(parseFloat(value) * 1e18)),
  parseUnits: vi.fn((value: string, decimals: number) => BigInt(parseFloat(value) * Math.pow(10, decimals))),
}));

vi.mock('viem/chains', () => ({
  mainnet: { id: 1, name: 'Ethereum' },
  sepolia: { id: 11155111, name: 'Sepolia' },
}));

// Now import after mocking
import { BlockchainService } from '../../src/services/blockchain';
import { GiftStatus } from '../../types/gift';

describe('BlockchainService', () => {
  let blockchainService: BlockchainService;

  beforeEach(() => {
    vi.clearAllMocks();
    blockchainService = new BlockchainService();
  });

  describe('getGiftDetails', () => {
    it('should fetch and format gift details correctly', async () => {
      const mockGiftData = {
        sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
        unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
        claimed: false,
        assetType: 0, // ETH
        token: '0x0000000000000000000000000000000000000000',
        tokenId: BigInt(0),
        amount: BigInt('1500000000000000000'), // 1.5 ETH in wei
        recipientENS: 'test.eth',
        message: 'Happy Birthday!',
      };

      mockPublicClient.readContract.mockResolvedValue(mockGiftData);

      const result = await blockchainService.getGiftDetails('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.sender).toBe(mockGiftData.sender);
      expect(result?.recipient).toBe(mockGiftData.recipient);
      expect(result?.status).toBe(GiftStatus.PENDING);
      expect(result?.claimed).toBe(false);
      expect(result?.recipientENS).toBe('test.eth');
      expect(result?.message).toBe('Happy Birthday!');
    });

    it('should return claimable status for unlocked unclaimed gifts', async () => {
      const mockGiftData = {
        sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
        unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
        claimed: false,
        assetType: 0, // ETH
        token: '0x0000000000000000000000000000000000000000',
        tokenId: BigInt(0),
        amount: BigInt('1000000000000000000'), // 1 ETH in wei
        recipientENS: '',
        message: 'Congratulations!',
      };

      mockPublicClient.readContract.mockResolvedValue(mockGiftData);

      const result = await blockchainService.getGiftDetails('2');

      expect(result?.status).toBe(GiftStatus.CLAIMABLE);
    });

    it('should return claimed status for claimed gifts', async () => {
      const mockGiftData = {
        sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
        unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
        claimed: true,
        assetType: 0, // ETH
        token: '0x0000000000000000000000000000000000000000',
        tokenId: BigInt(0),
        amount: BigInt('500000000000000000'), // 0.5 ETH in wei
        recipientENS: 'recipient.eth',
        message: 'Enjoy!',
      };

      mockPublicClient.readContract.mockResolvedValue(mockGiftData);

      const result = await blockchainService.getGiftDetails('3');

      expect(result?.status).toBe(GiftStatus.CLAIMED);
      expect(result?.claimed).toBe(true);
    });

    it('should handle ERC20 gifts correctly', async () => {
      const mockGiftData = {
        sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
        unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400),
        claimed: false,
        assetType: 1, // ERC20
        token: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        tokenId: BigInt(0),
        amount: BigInt('100000000000000000000'), // 100 tokens (18 decimals)
        recipientENS: '',
        message: 'Token gift!',
      };

      mockPublicClient.readContract.mockResolvedValue(mockGiftData);

      const result = await blockchainService.getGiftDetails('4');

      expect(result?.assetType).toBe(1);
      expect(result?.token).toBe(mockGiftData.token);
    });

    it('should handle ERC721 gifts correctly', async () => {
      const mockGiftData = {
        sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
        unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400),
        claimed: false,
        assetType: 2, // ERC721
        token: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        tokenId: BigInt(42),
        amount: BigInt(1),
        recipientENS: '',
        message: 'NFT gift!',
      };

      mockPublicClient.readContract.mockResolvedValue(mockGiftData);

      const result = await blockchainService.getGiftDetails('5');

      expect(result?.assetType).toBe(2);
      expect(result?.tokenId).toBe('42');
      expect(result?.amount).toBe('1');
    });

    it('should return null on error', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('Contract call failed'));

      const result = await blockchainService.getGiftDetails('999');

      expect(result).toBeNull();
    });
  });

  describe('getSentGifts', () => {
    it('should fetch sent gift IDs correctly', async () => {
      const mockGiftIds = [BigInt(1), BigInt(2), BigInt(3)];
      mockPublicClient.readContract.mockResolvedValue(mockGiftIds);

      const result = await blockchainService.getSentGifts('0x742d35Cc6cC00532e7D9A0f7e3B1234567890123');

      expect(result).toEqual(['1', '2', '3']);
      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: expect.any(String),
        abi: expect.any(Array),
        functionName: 'getSentGifts',
        args: ['0x742d35Cc6cC00532e7D9A0f7e3B1234567890123'],
      });
    });

    it('should return empty array on error', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('Network error'));

      const result = await blockchainService.getSentGifts('0x742d35Cc6cC00532e7D9A0f7e3B1234567890123');

      expect(result).toEqual([]);
    });
  });

  describe('getReceivedGifts', () => {
    it('should fetch received gift IDs correctly', async () => {
      const mockGiftIds = [BigInt(4), BigInt(5), BigInt(6)];
      mockPublicClient.readContract.mockResolvedValue(mockGiftIds);

      const result = await blockchainService.getReceivedGifts('0x456d35Cc6cC00532e7D9A0f7e3B1234567890456');

      expect(result).toEqual(['4', '5', '6']);
      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: expect.any(String),
        abi: expect.any(Array),
        functionName: 'getReceivedGifts',
        args: ['0x456d35Cc6cC00532e7D9A0f7e3B1234567890456'],
      });
    });

    it('should return empty array on error', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('Network error'));

      const result = await blockchainService.getReceivedGifts('0x456d35Cc6cC00532e7D9A0f7e3B1234567890456');

      expect(result).toEqual([]);
    });
  });

  describe('claimGift', () => {
    it('should claim gift successfully', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        transactionHash: mockHash,
        status: 'success',
      };

      mockWalletClient.writeContract.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await blockchainService.claimGift('1', mockWalletClient);

      expect(result).toBe(mockHash);
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith({
        address: expect.any(String),
        abi: expect.any(Array),
        functionName: 'claimGift',
        args: [BigInt(1)],
      });
      expect(mockPublicClient.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: mockHash });
    });

    it('should throw error on claim failure', async () => {
      mockWalletClient.writeContract.mockRejectedValue(new Error('Transaction failed'));

      await expect(blockchainService.claimGift('1', mockWalletClient)).rejects.toThrow('Transaction failed');
    });
  });

  describe('getGiftsByENS', () => {
    it('should fetch gifts by ENS name correctly', async () => {
      const mockGiftIds = [BigInt(7), BigInt(8)];
      mockPublicClient.readContract.mockResolvedValue(mockGiftIds);

      const result = await blockchainService.getGiftsByENS('test.eth');

      expect(result).toEqual(['7', '8']);
      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: expect.any(String),
        abi: expect.any(Array),
        functionName: 'getGiftsByENS',
        args: ['test.eth'],
      });
    });

    it('should return empty array on error', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('ENS resolution failed'));

      const result = await blockchainService.getGiftsByENS('nonexistent.eth');

      expect(result).toEqual([]);
    });
  });

  describe('getMultipleGifts', () => {
    it('should fetch multiple gifts correctly', async () => {
      const mockGifts = [
        {
          sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
          recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
          unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400),
          claimed: false,
          assetType: 0,
          token: '0x0000000000000000000000000000000000000000',
          tokenId: BigInt(0),
          amount: BigInt('1000000000000000000'),
          recipientENS: 'test1.eth',
          message: 'Gift 1',
        },
        {
          sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
          recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
          unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 172800),
          claimed: false,
          assetType: 0,
          token: '0x0000000000000000000000000000000000000000',
          tokenId: BigInt(0),
          amount: BigInt('2000000000000000000'),
          recipientENS: 'test2.eth',
          message: 'Gift 2',
        },
      ];

      mockPublicClient.readContract.mockResolvedValue(mockGifts);

      const result = await blockchainService.getMultipleGifts(['1', '2']);

      expect(result).toHaveLength(2);
      expect(result[0].recipientENS).toBe('test1.eth');
      expect(result[1].recipientENS).toBe('test2.eth');
    });

    it('should return empty array on error', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('Batch call failed'));

      const result = await blockchainService.getMultipleGifts(['1', '2', '3']);

      expect(result).toEqual([]);
    });
  });
});
