import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { GIFTBOX_V2_ABI, GIFTBOX_V2_ADDRESS, AssetType, type Gift, type ProcessedGift } from '../lib/giftbox-abi';
import { formatEther, formatUnits } from 'viem';
import { useMemo } from 'react';

// Hook to get sent gifts for current user
export function useSentGifts() {
  const { address } = useAccount();

  const { data: giftIds, isLoading: idsLoading, error: idsError, refetch: refetchIds } = useReadContract({
    address: GIFTBOX_V2_ADDRESS,
    abi: GIFTBOX_V2_ABI,
    functionName: 'getSentGifts',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: gifts, isLoading: giftsLoading, error: giftsError, refetch: refetchGifts } = useReadContracts({
    contracts: giftIds?.map((id) => ({
      address: GIFTBOX_V2_ADDRESS,
      abi: GIFTBOX_V2_ABI,
      functionName: 'getGiftDetails',
      args: [id],
    })) || [],
    query: {
      enabled: !!giftIds && giftIds.length > 0,
    },
  });

  const processedGifts = useMemo(() => {
    if (!gifts || !giftIds) return [];
    
    return gifts.map((gift, index) => {
      if (gift.status !== 'success' || !gift.result) return null;
      
      const giftData = gift.result as Gift;
      const id = Number(giftIds[index]);
      
      return processGift(id, giftData);
    }).filter(Boolean) as ProcessedGift[];
  }, [gifts, giftIds]);

  return {
    gifts: processedGifts,
    isLoading: idsLoading || giftsLoading,
    error: idsError || giftsError,
    refetch: () => {
      refetchIds();
      refetchGifts();
    },
  };
}

// Hook to get received gifts for current user
export function useReceivedGifts() {
  const { address } = useAccount();

  const { data: giftIds, isLoading: idsLoading, error: idsError, refetch: refetchIds } = useReadContract({
    address: GIFTBOX_V2_ADDRESS,
    abi: GIFTBOX_V2_ABI,
    functionName: 'getReceivedGifts',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: gifts, isLoading: giftsLoading, error: giftsError, refetch: refetchGifts } = useReadContracts({
    contracts: giftIds?.map((id) => ({
      address: GIFTBOX_V2_ADDRESS,
      abi: GIFTBOX_V2_ABI,
      functionName: 'getGiftDetails',
      args: [id],
    })) || [],
    query: {
      enabled: !!giftIds && giftIds.length > 0,
    },
  });

  const processedGifts = useMemo(() => {
    if (!gifts || !giftIds) return [];
    
    return gifts.map((gift, index) => {
      if (gift.status !== 'success' || !gift.result) return null;
      
      const giftData = gift.result as Gift;
      const id = Number(giftIds[index]);
      
      return processGift(id, giftData);
    }).filter(Boolean) as ProcessedGift[];
  }, [gifts, giftIds]);

  return {
    gifts: processedGifts,
    isLoading: idsLoading || giftsLoading,
    error: idsError || giftsError,
    refetch: () => {
      refetchIds();
      refetchGifts();
    },
  };
}

// Hook to get a specific gift by ID
export function useGift(id: number) {
  const { data: gift, isLoading, error, refetch } = useReadContract({
    address: GIFTBOX_V2_ADDRESS,
    abi: GIFTBOX_V2_ABI,
    functionName: 'getGiftDetails',
    args: [BigInt(id)],
    query: {
      enabled: id > 0,
    },
  });

  const processedGift = useMemo(() => {
    if (!gift) return null;
    return processGift(id, gift as Gift);
  }, [gift, id]);

  return {
    gift: processedGift,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get gifts by ENS name
export function useGiftsByENS(ensName: string) {
  const { data: giftIds, isLoading: idsLoading, error: idsError, refetch: refetchIds } = useReadContract({
    address: GIFTBOX_V2_ADDRESS,
    abi: GIFTBOX_V2_ABI,
    functionName: 'getGiftsByENS',
    args: ensName ? [ensName] : undefined,
    query: {
      enabled: !!ensName,
    },
  });

  const { data: gifts, isLoading: giftsLoading, error: giftsError, refetch: refetchGifts } = useReadContracts({
    contracts: giftIds?.map((id) => ({
      address: GIFTBOX_V2_ADDRESS,
      abi: GIFTBOX_V2_ABI,
      functionName: 'getGiftDetails',
      args: [id],
    })) || [],
    query: {
      enabled: !!giftIds && giftIds.length > 0,
    },
  });

  const processedGifts = useMemo(() => {
    if (!gifts || !giftIds) return [];
    
    return gifts.map((gift, index) => {
      if (gift.status !== 'success' || !gift.result) return null;
      
      const giftData = gift.result as Gift;
      const id = Number(giftIds[index]);
      
      return processGift(id, giftData);
    }).filter(Boolean) as ProcessedGift[];
  }, [gifts, giftIds]);

  return {
    gifts: processedGifts,
    isLoading: idsLoading || giftsLoading,
    error: idsError || giftsError,
    refetch: () => {
      refetchIds();
      refetchGifts();
    },
  };
}

// Utility function to process raw gift data
function processGift(id: number, gift: Gift): ProcessedGift {
  // Safely handle unlockTimestamp - ensure it's a valid number
  const timestamp = Number(gift.unlockTimestamp);
  const unlockDate = isNaN(timestamp) ? new Date() : new Date(timestamp * 1000);

  // Ensure unlockDate is valid
  if (isNaN(unlockDate.getTime())) {
    unlockDate.setTime(Date.now());
  }

  const now = new Date();
  const isUnlocked = now >= unlockDate;
  
  let timeRemaining: string | undefined;
  if (!isUnlocked) {
    const diff = unlockDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      timeRemaining = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m`;
    } else {
      timeRemaining = `${minutes}m`;
    }
  }

  let amount: string;
  let assetType: 'ETH' | 'ERC20' | 'ERC721' | 'ERC1155';

  switch (gift.assetType) {
    case AssetType.ETH:
      amount = formatEther(gift.amount);
      assetType = 'ETH';
      break;
    case AssetType.ERC20:
      amount = formatUnits(gift.amount, 18); // Default to 18 decimals, could be improved
      assetType = 'ERC20';
      break;
    case AssetType.ERC721:
      amount = '1';
      assetType = 'ERC721';
      break;
    case AssetType.ERC1155:
      amount = gift.amount.toString();
      assetType = 'ERC1155';
      break;
    default:
      amount = gift.amount.toString();
      assetType = 'ETH';
  }

  return {
    id,
    sender: gift.sender,
    recipient: gift.recipient,
    unlockDate,
    claimed: gift.claimed,
    assetType,
    token: gift.token,
    tokenId: gift.tokenId.toString(),
    amount,
    recipientENS: gift.recipientENS,
    message: gift.message,
    isUnlocked,
    timeRemaining,
  };
}

// Hook to get total number of gifts
export function useTotalGifts() {
  const { data: nextId, isLoading, error } = useReadContract({
    address: GIFTBOX_V2_ADDRESS,
    abi: GIFTBOX_V2_ABI,
    functionName: 'nextId',
  });

  return {
    totalGifts: nextId ? Number(nextId) : 0,
    isLoading,
    error,
  };
}
