import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSentGifts, useReceivedGifts, useGift, useTotalGifts } from '../../hooks/useGifts';

// Mock wagmi hooks
const mockUseAccount = vi.fn();
const mockUseReadContract = vi.fn();
const mockUseReadContracts = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useReadContract: (config: any) => mockUseReadContract(config),
  useReadContracts: (config: any) => mockUseReadContracts(config),
}));

describe('useGifts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseAccount.mockReturnValue({
      address: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      isConnected: true,
    });
  });

  describe('useSentGifts', () => {
    it('should fetch sent gifts when user is connected', async () => {
      const mockGiftIds = [BigInt(1), BigInt(2), BigInt(3)];
      const mockGifts = [
        {
          status: 'success',
          result: {
            sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
            recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
            unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400),
            claimed: false,
            assetType: 0,
            token: '0x0000000000000000000000000000000000000000',
            tokenId: BigInt(0),
            amount: BigInt('1000000000000000000'),
            recipientENS: 'test.eth',
            message: 'Happy Birthday!',
          },
        },
        {
          status: 'success',
          result: {
            sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
            recipient: '0x789d35Cc6cC00532e7D9A0f7e3B1234567890789',
            unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 172800),
            claimed: false,
            assetType: 0,
            token: '0x0000000000000000000000000000000000000000',
            tokenId: BigInt(0),
            amount: BigInt('2000000000000000000'),
            recipientENS: 'another.eth',
            message: 'Congratulations!',
          },
        },
      ];

      mockUseReadContract
        .mockReturnValueOnce({
          data: mockGiftIds,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });

      mockUseReadContracts
        .mockReturnValueOnce({
          data: mockGifts,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });

      const { result } = renderHook(() => useSentGifts());

      await waitFor(() => {
        expect(result.current.gifts).toHaveLength(2);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(result.current.gifts[0].id).toBe(1);
      expect(result.current.gifts[0].recipientENS).toBe('test.eth');
      expect(result.current.gifts[1].id).toBe(2);
      expect(result.current.gifts[1].recipientENS).toBe('another.eth');
    });

    it('should not fetch when user is not connected', () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });

      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useSentGifts());

      expect(result.current.gifts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      mockUseReadContracts.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useSentGifts());

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle errors', () => {
      const mockError = new Error('Network error');
      
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useSentGifts());

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useReceivedGifts', () => {
    it('should fetch received gifts when user is connected', async () => {
      const mockGiftIds = [BigInt(4), BigInt(5)];
      const mockGifts = [
        {
          status: 'success',
          result: {
            sender: '0x123d35Cc6cC00532e7D9A0f7e3B1234567890123',
            recipient: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
            unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
            claimed: false,
            assetType: 0,
            token: '0x0000000000000000000000000000000000000000',
            tokenId: BigInt(0),
            amount: BigInt('500000000000000000'),
            recipientENS: '',
            message: 'For you!',
          },
        },
      ];

      mockUseReadContract.mockReturnValue({
        data: mockGiftIds,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockUseReadContracts.mockReturnValue({
        data: mockGifts,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useReceivedGifts());

      await waitFor(() => {
        expect(result.current.gifts).toHaveLength(1);
      });

      expect(result.current.gifts[0].id).toBe(4);
      expect(result.current.gifts[0].isUnlocked).toBe(true); // Should be unlocked since timestamp is in the past
    });
  });

  describe('useGift', () => {
    it('should fetch a specific gift by ID', async () => {
      const mockGift = {
        sender: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
        recipient: '0x456d35Cc6cC00532e7D9A0f7e3B1234567890456',
        unlockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400),
        claimed: false,
        assetType: 0,
        token: '0x0000000000000000000000000000000000000000',
        tokenId: BigInt(0),
        amount: BigInt('1000000000000000000'),
        recipientENS: 'test.eth',
        message: 'Special gift!',
      };

      mockUseReadContract.mockReturnValue({
        data: mockGift,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useGift(1));

      await waitFor(() => {
        expect(result.current.gift).toBeDefined();
      });

      expect(result.current.gift?.id).toBe(1);
      expect(result.current.gift?.recipientENS).toBe('test.eth');
      expect(result.current.gift?.message).toBe('Special gift!');
    });

    it('should not fetch when ID is 0 or negative', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useGift(0));

      expect(result.current.gift).toBeNull();
    });
  });

  describe('useTotalGifts', () => {
    it('should fetch total number of gifts', () => {
      mockUseReadContract.mockReturnValue({
        data: BigInt(42),
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useTotalGifts());

      expect(result.current.totalGifts).toBe(42);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return 0 when no data', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useTotalGifts());

      expect(result.current.totalGifts).toBe(0);
    });

    it('should handle loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useTotalGifts());

      expect(result.current.isLoading).toBe(true);
    });
  });
});
