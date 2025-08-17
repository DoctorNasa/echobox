import { Address } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from './wagmi';

const erc721Abi = [
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }]
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
] as const;

export async function checkErc721Ownership({
  token,
  tokenId,
  owner,
}: {
  token: Address;
  tokenId: bigint;
  owner: Address;
}) {
  try {
    const actualOwner = await readContract(config, {
      address: token,
      abi: erc721Abi,
      functionName: 'ownerOf',
      args: [tokenId],
    });
    return actualOwner.toLowerCase() === owner.toLowerCase();
  } catch (error) {
    console.error('Error checking ERC721 ownership:', error);
    return false;
  }
}

export async function checkErc721ApprovalForAll({
  token,
  owner,
  operator,
}: {
  token: Address;
  owner: Address;
  operator: Address;
}) {
  try {
    const isApproved = await readContract(config, {
      address: token,
      abi: erc721Abi,
      functionName: 'isApprovedForAll',
      args: [owner, operator],
    });
    return isApproved;
  } catch (error) {
    console.error('Error checking ERC721 approval:', error);
    return false;
  }
}

export async function ensureErc721ApprovalForAll({
  token,
  owner,
  operator,
}: {
  token: Address;
  owner: Address;
  operator: Address;
}) {
  try {
    const isApproved = await checkErc721ApprovalForAll({ token, owner, operator });
    
    if (!isApproved) {
      console.log(`Setting approval for all NFTs to ${operator}`);
      
      const hash = await writeContract(config, {
        address: token,
        abi: erc721Abi,
        functionName: 'setApprovalForAll',
        args: [operator, true],
      });
      
      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, { hash });
      
      if (receipt.status === 'success') {
        console.log('NFT approval for all successful');
        return true;
      } else {
        throw new Error('NFT approval failed');
      }
    }
    
    console.log('NFT approval already exists');
    return true;
  } catch (error) {
    console.error('Error ensuring ERC721 approval:', error);
    throw error;
  }
}

export async function ensureErc721Approval({
  token,
  tokenId,
  operator,
}: {
  token: Address;
  tokenId: bigint;
  operator: Address;
}) {
  try {
    const approved = await readContract(config, {
      address: token,
      abi: erc721Abi,
      functionName: 'getApproved',
      args: [tokenId],
    });
    
    if (approved.toLowerCase() !== operator.toLowerCase()) {
      console.log(`Approving NFT #${tokenId} to ${operator}`);
      
      const hash = await writeContract(config, {
        address: token,
        abi: erc721Abi,
        functionName: 'approve',
        args: [operator, tokenId],
      });
      
      const receipt = await waitForTransactionReceipt(config, { hash });
      
      if (receipt.status === 'success') {
        console.log('NFT approval successful');
        return true;
      } else {
        throw new Error('NFT approval failed');
      }
    }
    
    console.log('NFT already approved');
    return true;
  } catch (error) {
    console.error('Error ensuring ERC721 approval:', error);
    throw error;
  }
}

export async function getNftMetadata({
  token,
}: {
  token: Address;
}) {
  try {
    const [name, symbol] = await Promise.all([
      readContract(config, {
        address: token,
        abi: erc721Abi,
        functionName: 'name',
      }),
      readContract(config, {
        address: token,
        abi: erc721Abi,
        functionName: 'symbol',
      }),
    ]);
    
    return { name, symbol };
  } catch (error) {
    console.error('Error getting NFT metadata:', error);
    return null;
  }
}
