import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther, formatUnits } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { Gift, GiftWithStatus, GiftStatus } from '../../types/gift';
import { GIFTBOX_V2_ABI, GIFTBOX_V2_ADDRESS, AssetType, type ProcessedGift } from '../../lib/giftbox-abi';

// Legacy ABI for backward compatibility (keeping some functions)
const LEGACY_ECHOBOX_ABI = [
  {
    name: 'getGiftDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'recipientENS', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTimestamp', type: 'uint256' },
      { name: 'message', type: 'string' },
      { name: 'claimed', type: 'bool' },
      { name: 'tokenType', type: 'uint8' },
      { name: 'tokenAddress', type: 'address' }
    ]
  },
  {
    name: 'getSentGifts',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getReceivedGifts',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'claimGift',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_id', type: 'uint256' }]
  },
  {
    name: 'createGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_recipient', type: 'address' },
      { name: '_recipientENS', type: 'string' },
      { name: '_unlockTimestamp', type: 'uint256' },
      { name: '_message', type: 'string' }
    ]
  },
  {
    name: 'createTokenGift',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_recipient', type: 'address' },
      { name: '_recipientENS', type: 'string' },
      { name: '_tokenAddress', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_unlockTimestamp', type: 'uint256' },
      { name: '_message', type: 'string' }
    ]
  },
  {
    name: 'GiftCreated',
    type: 'event',
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'recipientENS', type: 'string' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'unlockTimestamp', type: 'uint256' },
      { indexed: false, name: 'tokenType', type: 'uint8' },
      { indexed: false, name: 'tokenAddress', type: 'address' }
    ]
  },
  {
    name: 'GiftClaimed',
    type: 'event',
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ]
  }
] as const;

// Contract addresses - using the new GiftBoxV2 contract
const ECHOBOX_ADDRESSES = {
  [sepolia.id]: GIFTBOX_V2_ADDRESS,
  [mainnet.id]: process.env.NEXT_PUBLIC_ECHOBOX_ADDRESS_MAINNET || GIFTBOX_V2_ADDRESS,
};

// Token addresses for common tokens
const TOKEN_INFO = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
  },
  USDC: {
    [sepolia.id]: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      symbol: 'USDC',
      decimals: 6,
    },
    [mainnet.id]: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
    },
  },
  PYUSD: {
    [sepolia.id]: {
      address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
      symbol: 'PYUSD',
      decimals: 6,
    },
    [mainnet.id]: {
      address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
      symbol: 'PYUSD',
      decimals: 6,
    },
  },
};

export class BlockchainService {
  private publicClient;
  private chain;
  private contractAddress: string;

  constructor(chainId?: number) {
    this.chain = chainId === mainnet.id ? mainnet : sepolia;
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(
        process.env.NEXT_PUBLIC_RPC_URL ||
        (this.chain.id === mainnet.id
          ? 'https://eth-mainnet.g.alchemy.com/v2/demo'
          : 'https://eth-sepolia.g.alchemy.com/v2/demo')
      ),
    });
    this.contractAddress = ECHOBOX_ADDRESSES[this.chain.id];
  }

  // Get gift details from the blockchain using new GiftBoxV2 contract
  async getGiftDetails(giftId: string): Promise<GiftWithStatus | null> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GIFTBOX_V2_ABI,
        functionName: 'getGiftDetails',
        args: [BigInt(giftId)],
      });

      const gift = result as any;

      const now = Math.floor(Date.now() / 1000);
      let status: GiftStatus;

      if (gift.claimed) {
        status = GiftStatus.CLAIMED;
      } else if (Number(gift.unlockTimestamp) > now) {
        status = GiftStatus.PENDING;
      } else {
        status = GiftStatus.CLAIMABLE;
      }

      // Format amount based on asset type
      let formattedAmount: string;
      switch (gift.assetType) {
        case AssetType.ETH:
          formattedAmount = formatEther(gift.amount);
          break;
        case AssetType.ERC20:
          formattedAmount = formatUnits(gift.amount, 18); // Default to 18 decimals
          break;
        case AssetType.ERC721:
          formattedAmount = '1';
          break;
        case AssetType.ERC1155:
          formattedAmount = gift.amount.toString();
          break;
        default:
          formattedAmount = gift.amount.toString();
      }

      return {
        id: giftId,
        sender: gift.sender as string,
        recipient: gift.recipient as string,
        recipientENS: gift.recipientENS as string,
        amount: formattedAmount,
        unlockTimestamp: Number(gift.unlockTimestamp),
        message: gift.message as string,
        claimed: gift.claimed as boolean,
        assetType: gift.assetType as number,
        token: gift.token as string,
        tokenId: gift.tokenId.toString(),
        createdAt: 0, // Would need to fetch from events
        status,
      };
    } catch (error) {
      console.error('Error fetching gift details:', error);
      return null;
    }
  }

  // Get all gift IDs sent by a user
  async getSentGifts(userAddress: string): Promise<string[]> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GIFTBOX_V2_ABI,
        functionName: 'getSentGifts',
        args: [userAddress as `0x${string}`],
      });

      return (result as bigint[]).map(id => id.toString());
    } catch (error) {
      console.error('Error fetching sent gifts:', error);
      return [];
    }
  }

  // Get all gift IDs received by a user
  async getReceivedGifts(userAddress: string): Promise<string[]> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GIFTBOX_V2_ABI,
        functionName: 'getReceivedGifts',
        args: [userAddress as `0x${string}`],
      });

      return (result as bigint[]).map(id => id.toString());
    } catch (error) {
      console.error('Error fetching received gifts:', error);
      return [];
    }
  }

  // Get all gifts for a user (both sent and received)
  async getUserGifts(userAddress: string): Promise<{
    sentGifts: GiftWithStatus[];
    receivedGifts: GiftWithStatus[];
  }> {
    try {
      const [sentIds, receivedIds] = await Promise.all([
        this.getSentGifts(userAddress),
        this.getReceivedGifts(userAddress),
      ]);

      // Fetch details for all gifts in parallel
      const allIds = [...new Set([...sentIds, ...receivedIds])];
      const giftDetailsPromises = allIds.map(id => this.getGiftDetails(id));
      const allGifts = await Promise.all(giftDetailsPromises);
      
      // Filter out any null results
      const validGifts = allGifts.filter((gift): gift is GiftWithStatus => gift !== null);
      
      // Create a map for quick lookup
      const giftMap = new Map(validGifts.map((gift: GiftWithStatus) => [gift.id, gift]));
      
      const sentGifts = sentIds
        .map(id => giftMap.get(id))
        .filter((gift): gift is GiftWithStatus => gift !== undefined);
        
      const receivedGifts = receivedIds
        .map(id => giftMap.get(id))
        .filter((gift): gift is GiftWithStatus => gift !== undefined);

      return { sentGifts, receivedGifts };
    } catch (error) {
      console.error('Error fetching user gifts:', error);
      return { sentGifts: [], receivedGifts: [] };
    }
  }

  // Claim a gift (requires wallet connection)
  async claimGift(giftId: string, walletClient: any): Promise<string> {
    try {
      const hash = await walletClient.writeContract({
        address: this.contractAddress as `0x${string}`,
        abi: GIFTBOX_V2_ABI,
        functionName: 'claimGift',
        args: [BigInt(giftId)],
      });

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return receipt.transactionHash;
    } catch (error) {
      console.error('Error claiming gift:', error);
      throw error;
    }
  }

  // Get recent gift events from the blockchain
  async getRecentGiftEvents(fromBlock?: bigint, toBlock?: bigint): Promise<any[]> {
    try {
      const logs = await this.publicClient.getLogs({
        address: this.contractAddress as `0x${string}`,
        events: ECHOBOX_ABI.filter(item => item.type === 'event'),
        fromBlock: fromBlock || 'earliest',
        toBlock: toBlock || 'latest',
      });

      return logs;
    } catch (error) {
      console.error('Error fetching gift events:', error);
      return [];
    }
  }

  // Get Etherscan URL for a transaction
  getEtherscanUrl(txHash: string): string {
    const baseUrl = this.chain.id === mainnet.id
      ? 'https://etherscan.io'
      : 'https://sepolia.etherscan.io';
    
    return `${baseUrl}/tx/${txHash}`;
  }

  // Get Etherscan URL for a gift (using the creation transaction)
  async getGiftEtherscanUrl(giftId: string): Promise<string | null> {
    try {
      // We would need to query events to find the creation transaction
      // For now, return a placeholder
      const baseUrl = this.chain.id === mainnet.id
        ? 'https://etherscan.io'
        : 'https://sepolia.etherscan.io';
      
      return `${baseUrl}/address/${this.contractAddress}#readContract`;
    } catch (error) {
      console.error('Error getting Etherscan URL:', error);
      return null;
    }
  }

  // Format gift amount based on token type
  formatAmount(amount: string, tokenType: number, tokenAddress?: string): string {
    if (tokenType === 0) {
      // ETH
      return `${amount} ETH`;
    } else {
      // For ERC20, we'd need to fetch token info
      // For now, return a generic format
      return `${amount} Tokens`;
    }
  }

  // Get estimated USD value (would need price oracle integration)
  async getEstimatedValue(amount: string, tokenType: number): Promise<string> {
    // This would integrate with a price oracle
    // For demo, return a mock value
    if (tokenType === 0) {
      // Assuming ETH = $2500
      const ethAmount = parseFloat(amount);
      const usdValue = ethAmount * 2500;
      return `$${usdValue.toFixed(2)}`;
    }
    return '$0.00';
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
