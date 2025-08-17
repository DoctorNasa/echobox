import { createPublicClient, http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';

// Determine which chain to use based on environment
const chain = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? mainnet : sepolia;

// Create a public client for reading from the blockchain
export const publicClient = createPublicClient({
  chain,
  transport: http(
    process.env.NEXT_PUBLIC_RPC_URL || 
    (chain.id === 1 
      ? 'https://eth-mainnet.g.alchemy.com/v2/demo' 
      : 'https://eth-sepolia.g.alchemy.com/v2/demo')
  ),
});

// Export chain info for convenience
export const currentChain = chain;
export const chainId = chain.id;
export const chainName = chain.name;
