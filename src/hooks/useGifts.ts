import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { blockchainService } from '../services/blockchain';
import { GiftWithStatus, GiftStatus } from '../../types/gift';
import { toast } from 'sonner';

export interface UseGiftsReturn {
  sentGifts: GiftWithStatus[];
  receivedGifts: GiftWithStatus[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  claimGift: (giftId: string) => Promise<void>;
  isClaimingGift: boolean;
}

export function useGifts(): UseGiftsReturn {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [sentGifts, setSentGifts] = useState<GiftWithStatus[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<GiftWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isClaimingGift, setIsClaimingGift] = useState(false);

  // Fetch gifts from blockchain
  const fetchGifts = useCallback(async () => {
    if (!address || !isConnected) {
      setSentGifts([]);
      setReceivedGifts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { sentGifts: sent, receivedGifts: received } = 
        await blockchainService.getUserGifts(address);
      
      setSentGifts(sent);
      setReceivedGifts(received);
    } catch (err) {
      console.error('Error fetching gifts:', err);
      setError(err as Error);
      
      // Fallback to mock data if blockchain service fails
      // This is useful for development/testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data as fallback');
        setSentGifts(getMockSentGifts(address));
        setReceivedGifts(getMockReceivedGifts(address));
      }
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Claim a gift
  const claimGift = useCallback(async (giftId: string) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsClaimingGift(true);
    
    try {
      // Show pending toast
      const toastId = toast.loading('Claiming gift...');
      
      // Call blockchain service to claim the gift
      const txHash = await blockchainService.claimGift(giftId, walletClient);
      
      // Update toast to success
      toast.success(
        `🎉 Gift claimed successfully! 🎊\nTransaction: ${txHash.slice(0, 10)}...`,
        { id: toastId }
      );
      
      // Refetch gifts to update the UI
      await fetchGifts();
      
    } catch (err: any) {
      console.error('Error claiming gift:', err);
      
      // Handle specific errors
      if (err.message?.includes('NotRecipient')) {
        toast.error('You are not the recipient of this gift');
      } else if (err.message?.includes('AlreadyClaimed')) {
        toast.error('This gift has already been claimed');
      } else if (err.message?.includes('GiftLocked')) {
        toast.error('This gift is still locked');
      } else {
        toast.error('Failed to claim gift. Please try again.');
      }
    } finally {
      setIsClaimingGift(false);
    }
  }, [walletClient, address, fetchGifts]);

  // Initial fetch and setup listeners
  useEffect(() => {
    fetchGifts();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchGifts, 30000);
    
    return () => clearInterval(interval);
  }, [fetchGifts]);

  // Listen for blockchain events
  useEffect(() => {
    if (!publicClient || !address) return;

    // Watch for GiftCreated events
    const unwatch = publicClient.watchContractEvent({
      address: process.env.NEXT_PUBLIC_ECHOBOX_ADDRESS_SEPOLIA as `0x${string}`,
      abi: [
        {
          name: 'GiftCreated',
          type: 'event',
          inputs: [
            { indexed: true, name: 'id', type: 'uint256' },
            { indexed: true, name: 'sender', type: 'address' },
            { indexed: true, name: 'recipient', type: 'address' },
          ],
        },
        {
          name: 'GiftClaimed',
          type: 'event',
          inputs: [
            { indexed: true, name: 'id', type: 'uint256' },
            { indexed: true, name: 'recipient', type: 'address' },
          ],
        },
      ] as const,
      onLogs: (logs) => {
        // Refresh gifts when new events are detected
        console.log('Gift event detected:', logs);
        fetchGifts();
      },
    });

    return () => {
      unwatch?.();
    };
  }, [publicClient, address, fetchGifts]);

  return {
    sentGifts,
    receivedGifts,
    isLoading,
    error,
    refetch: fetchGifts,
    claimGift,
    isClaimingGift,
  };
}

// Mock data functions for development
function getMockSentGifts(address: string): GiftWithStatus[] {
  return [
    {
      id: '0x234567',
      sender: address.toLowerCase(),
      recipient: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      recipientENS: 'alice.eth',
      amount: '0.1',
      unlockTimestamp: Math.floor(Date.now() / 1000) + 86400 * 7,
      message: 'Happy birthday! Hope you have an amazing day!',
      claimed: false,
      assetType: 0,
      token: '0x0000000000000000000000000000000000000000',
      tokenId: '0',
      createdAt: Math.floor(Date.now() / 1000) - 3600,
      status: 1, // PENDING
    },
  ];
}

function getMockReceivedGifts(address: string): GiftWithStatus[] {
  return [
    {
      id: '0x234567',
      sender: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      recipient: address.toLowerCase(),
      recipientENS: 'you.eth',
      amount: '0.1',
      unlockTimestamp: Math.floor(Date.now() / 1000) - 3600,
      message: 'Thanks for helping me with the project!',
      claimed: false,
      assetType: 0,
      token: '0x0000000000000000000000000000000000000000',
      tokenId: '0',
      createdAt: Math.floor(Date.now() / 1000) - 86400,
      status: 2, // CLAIMABLE
    },
  ];
}
