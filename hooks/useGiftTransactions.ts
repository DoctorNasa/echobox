import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GIFTBOX_V2_ABI, GIFTBOX_V2_ADDRESS, AssetType } from '../lib/giftbox-abi';
import { parseEther, parseUnits } from 'viem';
import { useState } from 'react';

export interface CreateGiftParams {
  recipient: string;
  unlockTimestamp: number;
  recipientENS: string;
  message: string;
  assetType: AssetType;
  token?: string;
  tokenId?: string;
  amount: string;
  decimals?: number; // For ERC20 tokens
}

export function useCreateGift() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [giftId, setGiftId] = useState<number | null>(null);

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createGift = async (params: CreateGiftParams) => {
    try {
      setIsCreating(true);
      setError(null);
      setGiftId(null);

      const unlockTimestamp = BigInt(params.unlockTimestamp);
      
      switch (params.assetType) {
        case AssetType.ETH:
          await writeContract({
            address: GIFTBOX_V2_ADDRESS,
            abi: GIFTBOX_V2_ABI,
            functionName: 'createGiftETH',
            args: [
              params.recipient as `0x${string}`,
              unlockTimestamp,
              params.recipientENS,
              params.message,
            ],
            value: parseEther(params.amount),
          });
          break;

        case AssetType.ERC20:
          if (!params.token) throw new Error('Token address required for ERC20');
          const decimals = params.decimals || 18;
          await writeContract({
            address: GIFTBOX_V2_ADDRESS,
            abi: GIFTBOX_V2_ABI,
            functionName: 'createGiftERC20',
            args: [
              params.recipient as `0x${string}`,
              unlockTimestamp,
              params.token as `0x${string}`,
              parseUnits(params.amount, decimals),
              params.recipientENS,
              params.message,
            ],
          });
          break;

        case AssetType.ERC721:
          if (!params.token || !params.tokenId) {
            throw new Error('Token address and token ID required for ERC721');
          }
          await writeContract({
            address: GIFTBOX_V2_ADDRESS,
            abi: GIFTBOX_V2_ABI,
            functionName: 'createGiftERC721',
            args: [
              params.recipient as `0x${string}`,
              unlockTimestamp,
              params.token as `0x${string}`,
              BigInt(params.tokenId),
              params.recipientENS,
              params.message,
            ],
          });
          break;

        case AssetType.ERC1155:
          if (!params.token || !params.tokenId) {
            throw new Error('Token address and token ID required for ERC1155');
          }
          await writeContract({
            address: GIFTBOX_V2_ADDRESS,
            abi: GIFTBOX_V2_ABI,
            functionName: 'createGiftERC1155',
            args: [
              params.recipient as `0x${string}`,
              unlockTimestamp,
              params.token as `0x${string}`,
              BigInt(params.tokenId),
              BigInt(params.amount),
              params.recipientENS,
              params.message,
            ],
          });
          break;

        default:
          throw new Error('Invalid asset type');
      }
    } catch (err) {
      console.error('Error creating gift:', err);
      setError(err instanceof Error ? err.message : 'Failed to create gift');
      setIsCreating(false);
    }
  };

  // Reset state when transaction is successful
  if (isSuccess && isCreating) {
    setIsCreating(false);
    // TODO: Extract gift ID from transaction logs
  }

  return {
    createGift,
    isCreating: isCreating || isWritePending || isConfirming,
    isSuccess,
    error,
    hash,
    giftId,
  };
}

export function useClaimGift() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimGift = async (giftId: number) => {
    try {
      setIsClaiming(true);
      setError(null);

      await writeContract({
        address: GIFTBOX_V2_ADDRESS,
        abi: GIFTBOX_V2_ABI,
        functionName: 'claimGift',
        args: [BigInt(giftId)],
      });
    } catch (err) {
      console.error('Error claiming gift:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim gift');
      setIsClaiming(false);
    }
  };

  // Reset state when transaction is successful
  if (isSuccess && isClaiming) {
    setIsClaiming(false);
  }

  return {
    claimGift,
    isClaiming: isClaiming || isWritePending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook to check if user needs to approve tokens before creating gift
export function useTokenApproval() {
  // TODO: Implement token approval checking and execution
  // This would check if the user has approved the GiftBox contract to spend their tokens
  // and provide functions to approve if needed
  
  return {
    checkApproval: async (token: string, amount: string, decimals: number = 18) => {
      // Implementation would check current allowance vs required amount
      return true; // Placeholder
    },
    approve: async (token: string, amount: string, decimals: number = 18) => {
      // Implementation would call approve on the token contract
    },
    isApproving: false,
    approvalHash: null,
  };
}

// Utility function to estimate gas for gift creation
export function useGasEstimation() {
  return {
    estimateGas: async (params: CreateGiftParams) => {
      // TODO: Implement gas estimation for different gift types
      // This would help users understand transaction costs
      return {
        gasLimit: BigInt(200000), // Placeholder
        gasPrice: BigInt(20000000000), // Placeholder
        estimatedCost: '0.004', // ETH
      };
    },
  };
}
