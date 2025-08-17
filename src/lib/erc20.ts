import { erc20Abi } from 'viem';
import { Address, parseUnits } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from './wagmi';

export async function checkErc20Balance({
  token,
  owner,
  decimals = 18,
}: {
  token: Address;
  owner: Address;
  decimals?: number;
}) {
  try {
    const balance = await readContract(config, {
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [owner],
    });
    return balance;
  } catch (error) {
    console.error('Error checking ERC20 balance:', error);
    return BigInt(0);
  }
}

export async function checkErc20Allowance({
  token,
  owner,
  spender,
}: {
  token: Address;
  owner: Address;
  spender: Address;
}) {
  try {
    const allowance = await readContract(config, {
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, spender],
    });
    return allowance;
  } catch (error) {
    console.error('Error checking ERC20 allowance:', error);
    return BigInt(0);
  }
}

export async function ensureErc20Allowance({
  token,
  owner,
  spender,
  amount,
  decimals = 18,
}: {
  token: Address;
  owner: Address;
  spender: Address;
  amount: string;
  decimals?: number;
}) {
  try {
    const needed = parseUnits(amount, decimals);
    const current = await checkErc20Allowance({ token, owner, spender });
    
    if (current < needed) {
      console.log(`Approving ${amount} tokens (${needed.toString()} wei)`);
      
      const hash = await writeContract(config, {
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, needed],
      });
      
      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, { hash });
      
      if (receipt.status === 'success') {
        console.log('Token approval successful');
        return true;
      } else {
        throw new Error('Token approval failed');
      }
    }
    
    console.log('Sufficient allowance already exists');
    return true;
  } catch (error) {
    console.error('Error ensuring ERC20 allowance:', error);
    throw error;
  }
}

export async function getTokenMetadata({
  token,
}: {
  token: Address;
}) {
  try {
    const [name, symbol, decimals] = await Promise.all([
      readContract(config, {
        address: token,
        abi: erc20Abi,
        functionName: 'name',
      }),
      readContract(config, {
        address: token,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      readContract(config, {
        address: token,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
    ]);
    
    return { name, symbol, decimals };
  } catch (error) {
    console.error('Error getting token metadata:', error);
    return null;
  }
}
