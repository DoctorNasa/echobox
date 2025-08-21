import { parseEther, parseUnits } from 'viem';
import { GIFTBOX_V2_ABI, GIFTBOX_V2_ADDRESS, AssetType } from './giftbox-abi';
import { resolveRecipient } from './ens';

export interface CreateGiftParams {
  recipient: string;
  recipientENS: string;
  unlockDate: Date;
  message: string;
  assetType: AssetType;
  amount: string;
  token?: string;
  tokenId?: string;
  decimals?: number;
}

export interface GiftCreationResult {
  success: boolean;
  giftId?: number;
  transactionHash?: string;
  error?: string;
}

export class GiftCreationService {
  // Validate gift creation parameters
  static validateParams(params: CreateGiftParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate recipient
    if (!params.recipient) {
      errors.push('Recipient address is required');
    } else if (!params.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Invalid recipient address format');
    }

    // Validate amount
    if (!params.amount || parseFloat(params.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Validate unlock date
    if (!params.unlockDate || params.unlockDate <= new Date()) {
      errors.push('Unlock date must be in the future');
    }

    // Validate message
    if (!params.message || params.message.trim().length === 0) {
      errors.push('Message is required');
    } else if (params.message.length > 500) {
      errors.push('Message must be less than 500 characters');
    }

    // Validate asset-specific parameters
    switch (params.assetType) {
      case AssetType.ERC20:
        if (!params.token || !params.token.match(/^0x[a-fA-F0-9]{40}$/)) {
          errors.push('Valid token address is required for ERC20 gifts');
        }
        break;
      case AssetType.ERC721:
        if (!params.token || !params.token.match(/^0x[a-fA-F0-9]{40}$/)) {
          errors.push('Valid token address is required for NFT gifts');
        }
        if (!params.tokenId || parseInt(params.tokenId) < 0) {
          errors.push('Valid token ID is required for NFT gifts');
        }
        break;
      case AssetType.ERC1155:
        if (!params.token || !params.token.match(/^0x[a-fA-F0-9]{40}$/)) {
          errors.push('Valid token address is required for ERC1155 gifts');
        }
        if (!params.tokenId || parseInt(params.tokenId) < 0) {
          errors.push('Valid token ID is required for ERC1155 gifts');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Prepare contract call parameters based on asset type
  static prepareContractCall(params: CreateGiftParams) {
    const unlockTimestamp = BigInt(Math.floor(params.unlockDate.getTime() / 1000));
    const recipient = params.recipient as `0x${string}`;

    switch (params.assetType) {
      case AssetType.ETH:
        return {
          address: GIFTBOX_V2_ADDRESS,
          abi: GIFTBOX_V2_ABI,
          functionName: 'createGiftETH',
          args: [recipient, unlockTimestamp, params.recipientENS, params.message],
          value: parseEther(params.amount),
        };

      case AssetType.ERC20:
        if (!params.token) throw new Error('Token address required for ERC20');
        const decimals = params.decimals || 18;
        return {
          address: GIFTBOX_V2_ADDRESS,
          abi: GIFTBOX_V2_ABI,
          functionName: 'createGiftERC20',
          args: [
            recipient,
            unlockTimestamp,
            params.token as `0x${string}`,
            parseUnits(params.amount, decimals),
            params.recipientENS,
            params.message,
          ],
        };

      case AssetType.ERC721:
        if (!params.token || !params.tokenId) {
          throw new Error('Token address and token ID required for ERC721');
        }
        return {
          address: GIFTBOX_V2_ADDRESS,
          abi: GIFTBOX_V2_ABI,
          functionName: 'createGiftERC721',
          args: [
            recipient,
            unlockTimestamp,
            params.token as `0x${string}`,
            BigInt(params.tokenId),
            params.recipientENS,
            params.message,
          ],
        };

      case AssetType.ERC1155:
        if (!params.token || !params.tokenId) {
          throw new Error('Token address and token ID required for ERC1155');
        }
        return {
          address: GIFTBOX_V2_ADDRESS,
          abi: GIFTBOX_V2_ABI,
          functionName: 'createGiftERC1155',
          args: [
            recipient,
            unlockTimestamp,
            params.token as `0x${string}`,
            BigInt(params.tokenId),
            BigInt(params.amount),
            params.recipientENS,
            params.message,
          ],
        };

      default:
        throw new Error('Invalid asset type');
    }
  }

  // Resolve recipient address from ENS or address
  static async resolveRecipient(recipientInput: string): Promise<{
    address: string;
    ensName: string;
  }> {
    try {
      const result = await resolveRecipient(recipientInput);
      return {
        address: result.address,
        ensName: result.ensName || '',
      };
    } catch (error) {
      throw new Error(`Failed to resolve recipient: ${error}`);
    }
  }

  // Estimate gas for gift creation
  static async estimateGas(params: CreateGiftParams): Promise<{
    gasLimit: bigint;
    estimatedCost: string;
  }> {
    // This would integrate with a gas estimation service
    // For now, return reasonable estimates based on asset type
    let gasLimit: bigint;
    
    switch (params.assetType) {
      case AssetType.ETH:
        gasLimit = BigInt(150000);
        break;
      case AssetType.ERC20:
        gasLimit = BigInt(200000);
        break;
      case AssetType.ERC721:
        gasLimit = BigInt(250000);
        break;
      case AssetType.ERC1155:
        gasLimit = BigInt(250000);
        break;
      default:
        gasLimit = BigInt(150000);
    }

    // Estimate cost at 20 gwei
    const gasPrice = BigInt(20000000000); // 20 gwei
    const estimatedCostWei = gasLimit * gasPrice;
    const estimatedCostEth = Number(estimatedCostWei) / 1e18;

    return {
      gasLimit,
      estimatedCost: estimatedCostEth.toFixed(6),
    };
  }

  // Get asset display information
  static getAssetDisplayInfo(params: CreateGiftParams): {
    displayAmount: string;
    displaySymbol: string;
    displayIcon: string;
  } {
    switch (params.assetType) {
      case AssetType.ETH:
        return {
          displayAmount: `${parseFloat(params.amount).toFixed(4)}`,
          displaySymbol: 'ETH',
          displayIcon: '💎',
        };
      case AssetType.ERC20:
        return {
          displayAmount: `${parseFloat(params.amount).toFixed(2)}`,
          displaySymbol: 'Tokens',
          displayIcon: '🪙',
        };
      case AssetType.ERC721:
        return {
          displayAmount: '1',
          displaySymbol: `NFT #${params.tokenId}`,
          displayIcon: '🖼️',
        };
      case AssetType.ERC1155:
        return {
          displayAmount: params.amount,
          displaySymbol: `Token #${params.tokenId}`,
          displayIcon: '🎨',
        };
      default:
        return {
          displayAmount: params.amount,
          displaySymbol: 'Unknown',
          displayIcon: '🎁',
        };
    }
  }

  // Format unlock date for display
  static formatUnlockDate(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.ceil(diffDays / 7);
      return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Check if user has sufficient balance for the gift
  static checkSufficientBalance(
    userBalance: string,
    giftAmount: string,
    assetType: AssetType
  ): { sufficient: boolean; shortfall?: string } {
    if (assetType === AssetType.ERC721) {
      // For NFTs, we assume the user owns it if they're trying to gift it
      return { sufficient: true };
    }

    const balance = parseFloat(userBalance);
    const amount = parseFloat(giftAmount);

    if (balance < amount) {
      const shortfall = (amount - balance).toFixed(6);
      return { sufficient: false, shortfall };
    }

    return { sufficient: true };
  }
}
