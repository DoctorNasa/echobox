import { Address } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from './wagmi';

const erc1155Abi = [
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
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
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'uri',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ type: 'string' }]
  },
] as const;

export async function checkErc1155Balance({
  token,
  owner,
  tokenId,
}: {
  token: Address;
  owner: Address;
  tokenId: bigint;
}) {
  try {
    const balance = await readContract(config, {
      address: token,
      abi: erc1155Abi,
      functionName: 'balanceOf',
      args: [owner, tokenId],
    });
    return balance;
  } catch (error) {
    console.error('Error checking ERC1155 balance:', error);
    return BigInt(0);
  }
}

export async function checkErc1155ApprovalForAll({
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
      abi: erc1155Abi,
      functionName: 'isApprovedForAll',
      args: [owner, operator],
    });
    return isApproved;
  } catch (error) {
    console.error('Error checking ERC1155 approval:', error);
    return false;
  }
}

export async function ensureErc1155ApprovalForAll({
  token,
  owner,
  operator,
}: {
  token: Address;
  owner: Address;
  operator: Address;
}) {
  try {
    const isApproved = await checkErc1155ApprovalForAll({ token, owner, operator });
    
    if (!isApproved) {
      console.log(`Setting approval for all ERC1155 tokens to ${operator}`);
      
      const hash = await writeContract(config, {
        address: token,
        abi: erc1155Abi,
        functionName: 'setApprovalForAll',
        args: [operator, true],
      });
      
      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, { hash });
      
      if (receipt.status === 'success') {
        console.log('ERC1155 approval for all successful');
        return true;
      } else {
        throw new Error('ERC1155 approval failed');
      }
    }
    
    console.log('ERC1155 approval already exists');
    return true;
  } catch (error) {
    console.error('Error ensuring ERC1155 approval:', error);
    throw error;
  }
}

export async function getErc1155Uri({
  token,
  tokenId,
}: {
  token: Address;
  tokenId: bigint;
}) {
  try {
    const uri = await readContract(config, {
      address: token,
      abi: erc1155Abi,
      functionName: 'uri',
      args: [tokenId],
    });
    return uri;
  } catch (error) {
    console.error('Error getting ERC1155 URI:', error);
    return null;
  }
}
