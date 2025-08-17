import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Calendar, Gift, Loader2, AlertCircle, CheckCircle, Wallet, RefreshCw, Users } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { resolveRecipient } from '../lib/ens';
import { CreateGiftParams, AssetType } from '../types/gift';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { toast } from 'sonner';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { WalletAssetSelector } from '../src/components/WalletAssetSelector';
import { BulkGiftEntry } from '../src/types/bulkGift';

// Simple SelectedAsset type for this component
interface SelectedAsset {
  type: 'ETH' | 'ERC20';
  amount: string;
  token?: {
    symbol: string;
    name?: string;
    address?: string | null;
    decimals: number;
  };
}

// GiftBoxV2 Contract Address
const GIFTBOX_V2_ADDRESS = '0x6802ec0997148cd10257c449702E900405c64cbC' as const;

// GiftBoxV2 ABI (minimal for createGiftETH function)
const GIFTBOX_V2_ABI = [
  {
    name: "createGiftETH",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
  },
] as const;

interface GiftFormProps {
  onGiftCreated?: (gift: CreateGiftParams) => void;
}

export function GiftForm({ onGiftCreated }: GiftFormProps) {
  const { address: userAddress, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch user's ETH balance
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: userAddress,
  });

  const [formData, setFormData] = useState({
    recipientInput: '',
    unlockDate: '',
    unlockTime: '12:00',
    message: ''
  });

  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [bulkEntries, setBulkEntries] = useState<BulkGiftEntry[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [recipientStatus, setRecipientStatus] = useState<{
    resolved: boolean;
    address?: string;
    isENS?: boolean;
    error?: string;
  }>({ resolved: false });

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      const giftParams: CreateGiftParams = {
        recipientENS: recipientStatus.isENS ? formData.recipientInput : '',
        recipientAddress: recipientStatus.address || '',
        assetType: selectedAsset?.type === 'ETH' ? AssetType.ETH : AssetType.ERC20,
        amount: selectedAsset?.amount || '',
        unlockDate: new Date(`${formData.unlockDate}T${formData.unlockTime}`),
        message: formData.message
      };

      onGiftCreated?.(giftParams);

      // Reset form
      setFormData({
        recipientInput: '',
        unlockDate: '',
        unlockTime: '12:00',
        message: ''
      });
      setRecipientStatus({ resolved: false });
      setSelectedAsset(null);

      toast.success('Gift created successfully! 🎁');
    }
  }, [isSuccess, recipientStatus, formData, selectedAsset, onGiftCreated]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset recipient status when input changes
    if (field === 'recipientInput') {
      setRecipientStatus({ resolved: false });
    }
  };

  const handleAssetSelect = (asset: any) => {
    if (asset.type === 'ETH') {
      setSelectedAsset({
        type: 'ETH',
        amount: '',
        token: {
          symbol: 'ETH',
          name: 'Ethereum',
          address: null,
          decimals: 18,
        }
      });
    } else if (asset.type === 'NFT') {
      // Handle NFT selection
      toast.info('NFT gifting coming soon!');
    } else if (asset.type === 'USDC') {
      // Handle ERC20 token
      setSelectedAsset({
        type: 'ERC20',
        amount: '',
        token: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
        }
      });
    }
  };

  const handleBulkUpload = (entries: BulkGiftEntry[]) => {
    setBulkEntries(entries);
    setIsBulkMode(true);
    toast.success(`Loaded ${entries.length} recipients for bulk gifting`);
  };

  const handleResolveRecipient = async () => {
    if (!formData.recipientInput.trim()) return;

    setIsResolving(true);
    try {
      const result = await resolveRecipient(formData.recipientInput);
      setRecipientStatus({
        resolved: !!result.address,
        address: result.address || undefined,
        isENS: result.isENS,
        error: result.error
      });
    } catch (error) {
      setRecipientStatus({
        resolved: false,
        error: 'Failed to resolve recipient'
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleCreateGift = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!recipientStatus.resolved || !recipientStatus.address) {
      toast.error('Please resolve the recipient address first');
      return;
    }

    if (!selectedAsset || !selectedAsset.amount || !formData.unlockDate) {
      toast.error('Please select an asset and fill in all required fields');
      return;
    }

    try {
      // Combine date and time
      const unlockDateTime = new Date(`${formData.unlockDate}T${formData.unlockTime}`);
      const unlockTimestamp = Math.floor(unlockDateTime.getTime() / 1000);

      // Check if unlock time is in the future
      if (unlockTimestamp <= Math.floor(Date.now() / 1000)) {
        toast.error('Unlock time must be in the future');
        return;
      }

      // For now, only support ETH gifts (can be extended later for ERC20)
      if (selectedAsset.type !== 'ETH') {
        toast.error('Only ETH gifts are supported in this version');
        return;
      }

      const value = parseEther(selectedAsset.amount);

      writeContract({
        address: GIFTBOX_V2_ADDRESS,
        abi: GIFTBOX_V2_ABI,
        functionName: 'createGiftETH',
        args: [
          recipientStatus.address as `0x${string}`,
          BigInt(unlockTimestamp),
          recipientStatus.isENS ? formData.recipientInput : '',
          formData.message || ''
        ],
        value,
      });

      toast.success('Transaction submitted! Please wait for confirmation...');
    } catch (error) {
      console.error('Failed to create gift:', error);
      toast.error('Failed to create gift. Please try again.');
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Create Crypto Gift
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Send crypto assets from your wallet as time-locked gifts
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show bulk mode indicator */}
        {isBulkMode && (
          <Alert className="bg-purple-50 border-purple-200">
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>Bulk Mode:</strong> {bulkEntries.length} recipients loaded from CSV.
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setIsBulkMode(false);
                  setBulkEntries([]);
                }}
                className="ml-2 p-0 h-auto"
              >
                Switch to single gift
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Recipient - only show in single mode */}
        {!isBulkMode && (
          <div>
            <Label htmlFor="recipient">Recipient (Address or ENS)</Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                value={formData.recipientInput}
                onChange={(e) => handleInputChange('recipientInput', e.target.value)}
                placeholder="0x742d... or vitalik.eth"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleResolveRecipient}
                disabled={isResolving || !formData.recipientInput.trim()}
              >
                {isResolving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Resolve'
                )}
              </Button>
            </div>
            
            {/* Recipient Status */}
            {recipientStatus.error && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{recipientStatus.error}</AlertDescription>
              </Alert>
            )}
            
            {recipientStatus.resolved && recipientStatus.address && (
              <Alert className="mt-2">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {recipientStatus.isENS ? 'ENS resolved to: ' : 'Valid address: '}
                  <code className="text-sm">{recipientStatus.address}</code>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Asset Selection with WalletAssetSelector */}
        <div>
          <WalletAssetSelector
            onAssetSelect={handleAssetSelect}
            onBulkUpload={handleBulkUpload}
            showBulkUpload={true}
          />

          {/* Amount Input for selected asset */}
          {selectedAsset && !isBulkMode && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="amount">
                Amount ({selectedAsset.token?.symbol || 'ETH'})
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0"
                max={balance ? formatEther(balance.value) : undefined}
                value={selectedAsset.amount}
                onChange={(e) => {
                  setSelectedAsset(prev => prev ? {
                    ...prev,
                    amount: e.target.value
                  } : null);
                }}
                placeholder="0.1"
                className="mt-1"
              />
              {balance && selectedAsset.amount && parseFloat(selectedAsset.amount) > parseFloat(formatEther(balance.value)) && (
                <p className="text-sm text-red-600 mt-1">
                  Insufficient balance. You have {formatEther(balance.value)} {selectedAsset.token?.symbol} available.
                </p>
              )}
            </div>
          )}

          {/* Bulk Recipients Summary */}
          {isBulkMode && bulkEntries.length > 0 && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium mb-2">Bulk Recipients Summary</h4>
              <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                {bulkEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex justify-between">
                    <span className="font-mono text-xs">{entry.recipient}</span>
                    <span className="font-medium">{entry.amount} ETH</span>
                  </div>
                ))}
                {bulkEntries.length > 5 && (
                  <p className="text-gray-600 text-xs">+{bulkEntries.length - 5} more...</p>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-purple-200">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{bulkEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unlock Date & Time - show for both single and bulk */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unlockDate">Unlock Date</Label>
            <Input
              id="unlockDate"
              type="date"
              min={minDate}
              value={formData.unlockDate}
              onChange={(e) => handleInputChange('unlockDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unlockTime">Unlock Time</Label>
            <Input
              id="unlockTime"
              type="time"
              value={formData.unlockTime}
              onChange={(e) => handleInputChange('unlockTime', e.target.value)}
            />
          </div>
        </div>

        {/* Message - only for single gifts */}
        {!isBulkMode && (
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Happy birthday! Hope you enjoy this gift..."
              rows={3}
            />
          </div>
        )}

        {/* Create Button */}
        <Button
          onClick={handleCreateGift}
          disabled={
            !isConnected || 
            (!isBulkMode && !recipientStatus.resolved) ||
            (isBulkMode && bulkEntries.length === 0) ||
            isPending || 
            isConfirming || 
            (!isBulkMode && !selectedAsset?.amount) || 
            !formData.unlockDate
          }
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming Transaction...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating {isBulkMode ? `${bulkEntries.length} Gifts` : 'Gift'}...
            </>
          ) : !isConnected ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Connect Wallet
            </>
          ) : isBulkMode ? (
            <>
              <Users className="h-4 w-4 mr-2" />
              Create {bulkEntries.length} Bulk Gifts
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 mr-2" />
              Create Gift
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Your selected assets will be locked in a smart contract until the unlock date</p>
          <p>• Only the recipient can claim the gift after the unlock time</p>
          <p>• Asset balances are fetched directly from your connected wallet</p>
          <p>• Make sure you have enough ETH for gas fees</p>
        </div>
      </CardContent>
    </Card>
  );
}