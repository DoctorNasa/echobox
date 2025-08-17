import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';

export interface NFT {
  id: string;
  name: string;
  description?: string;
  image: string;
  collection: {
    name: string;
    address: string;
  };
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  balance?: string;
  metadata?: any;
}

interface UseWalletNFTsResult {
  nfts: NFT[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Alchemy API key - in production, use environment variable
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';

const CHAIN_TO_ALCHEMY: Record<number, string> = {
  1: 'eth-mainnet',
  11155111: 'eth-sepolia',
  137: 'polygon-mainnet',
  80001: 'polygon-mumbai',
  42161: 'arb-mainnet',
  421614: 'arb-sepolia',
  10: 'opt-mainnet',
  11155420: 'opt-sepolia',
  8453: 'base-mainnet',
  84532: 'base-sepolia',
};

export function useWalletNFTs(): UseWalletNFTsResult {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    if (!address || !isConnected) {
      setNfts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const network = CHAIN_TO_ALCHEMY[chainId] || 'eth-mainnet';
      const baseURL = `https://${network}.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner`;

      const response = await fetch(`${baseURL}?owner=${address}&withMetadata=true&pageSize=100`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();

      // Transform Alchemy response to our NFT interface
      const transformedNFTs: NFT[] = data.ownedNfts.map((nft: any) => ({
        id: `${nft.contract.address}-${nft.tokenId}`,
        name: nft.name || nft.title || `${nft.contract.name} #${nft.tokenId}`,
        description: nft.description,
        image: nft.image?.cachedUrl || nft.image?.thumbnailUrl || nft.image?.originalUrl || '',
        collection: {
          name: nft.contract.name || 'Unknown Collection',
          address: nft.contract.address,
        },
        tokenId: nft.tokenId,
        tokenType: nft.tokenType as 'ERC721' | 'ERC1155',
        balance: nft.balance || '1',
        metadata: nft.raw?.metadata || {},
      })).filter((nft: NFT) => nft.image); // Only include NFTs with images

      setNfts(transformedNFTs);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      
      // Fallback to mock data if API fails
      setNfts([
        {
          id: '1',
          name: 'Cool Cat #1234',
          description: 'A cool cat from the Cool Cats collection',
          image: 'https://via.placeholder.com/150',
          collection: {
            name: 'Cool Cats',
            address: '0x1a92f7381b9f03921564a437210bb9396471050c',
          },
          tokenId: '1234',
          tokenType: 'ERC721',
        },
        {
          id: '2',
          name: 'Bored Ape #5678',
          description: 'A bored ape from BAYC',
          image: 'https://via.placeholder.com/150',
          collection: {
            name: 'Bored Ape Yacht Club',
            address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
          },
          tokenId: '5678',
          tokenType: 'ERC721',
        },
      ]);
      
      setError('Using demo NFTs (API key not configured)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [address, chainId, isConnected]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs,
  };
}

// Alternative: Use OpenSea API (requires API key)
export async function fetchNFTsFromOpenSea(address: string, chain: string = 'ethereum') {
  const OPENSEA_API_KEY = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
  
  if (!OPENSEA_API_KEY) {
    throw new Error('OpenSea API key not configured');
  }

  const response = await fetch(
    `https://api.opensea.io/api/v2/chain/${chain}/account/${address}/nfts`,
    {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch NFTs from OpenSea');
  }

  return response.json();
}

// Alternative: Use Moralis API (requires API key)
export async function fetchNFTsFromMoralis(address: string, chain: string = '0x1') {
  const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
  
  if (!MORALIS_API_KEY) {
    throw new Error('Moralis API key not configured');
  }

  const response = await fetch(
    `https://deep-index.moralis.io/api/v2.2/${address}/nft?chain=${chain}&format=decimal&media_items=true`,
    {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch NFTs from Moralis');
  }

  return response.json();
}
