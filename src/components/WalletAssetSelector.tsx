"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther, parseEther, formatUnits } from 'viem';
import {
  Wallet,
  Coins,
  Image,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Sparkles,
  FileText,
  Upload,
  X
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { parseCSV } from '../lib/csvParser';
import { BulkGiftEntry } from '../types/bulkGift';
import { useWalletNFTs } from '../hooks/useWalletNFTs';
import { useWalletAssets } from '../hooks/useWalletAssets';

interface AssetSelectorProps {
  onAssetSelect?: (asset: any) => void;
  onBulkUpload?: (entries: BulkGiftEntry[]) => void;
  showBulkUpload?: boolean;
}

type AssetType = 'tokens' | 'nfts' | 'bulk';

export function WalletAssetSelector({ 
  onAssetSelect, 
  onBulkUpload,
  showBulkUpload = true 
}: AssetSelectorProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { nfts, loading: nftsLoading, error: nftsError } = useWalletNFTs();
  
  // Fetch wallet assets including ERC20 tokens
  const { assets, isLoading: assetsLoading } = useWalletAssets({
    includeNative: true,
    includeERC20: true,
    includeNFTs: false,
    enabled: isConnected
  });
  const [selectedType, setSelectedType] = useState<AssetType>('tokens');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkEntries, setBulkEntries] = useState<BulkGiftEntry[]>([]);

  // Handle CSV file drop
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setBulkFile(file);
    
    try {
      const text = await file.text();
      const result = parseCSV(text);
      
      if (result.success && result.entries.length > 0) {
        setBulkEntries(result.entries);
        if (onBulkUpload) {
          onBulkUpload(result.entries);
        }
        toast.success(`Loaded ${result.entries.length} recipients`);
      } else {
        toast.error('Failed to parse CSV file');
      }
    } catch (error) {
      toast.error('Failed to read file');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    multiple: false,
    disabled: !showBulkUpload,
  });

  const clearBulkFile = () => {
    setBulkFile(null);
    setBulkEntries([]);
  };

  const handleAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    if (onAssetSelect) {
      onAssetSelect(asset);
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 p-3 bg-orange-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-lg font-medium text-gray-800 mb-2">
            Connect your wallet to see your asset balances
          </p>
          <p className="text-sm text-gray-600">
            You need to connect your wallet to select assets for gifting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Wallet className="h-5 w-5 text-purple-600" />
        Select Asset from Your Wallet
      </h3>

      {/* Asset Type Tabs */}
      <div className={cn(
        "grid gap-2",
        showBulkUpload ? "grid-cols-3" : "grid-cols-2"
      )}>
        <button
          onClick={() => setSelectedType('tokens')}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
            "border-2",
            selectedType === 'tokens'
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <Coins className="h-5 w-5" />
          Tokens
        </button>
        <button
          onClick={() => setSelectedType('nfts')}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
            "border-2",
            selectedType === 'nfts'
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <Image className="h-5 w-5" />
          NFTs
        </button>
        {showBulkUpload && (
          <button
            onClick={() => setSelectedType('bulk')}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
              "border-2",
              selectedType === 'bulk'
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <FileText className="h-5 w-5" />
            Bulk CSV
          </button>
        )}
      </div>

      {/* Tokens View */}
      {selectedType === 'tokens' && (
        <div className="space-y-3">
          {/* ETH Balance */}
          <button
            onClick={() => handleAssetSelect({ type: 'ETH', balance: balance?.value })}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
              selectedAsset?.type === 'ETH'
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">Ξ</span>
              </div>
              <div className="text-left">
                <p className="font-semibold">Ethereum</p>
                <p className="text-sm text-gray-500">Native Token</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-semibold">
                {balance ? formatEther(balance.value).slice(0, 8) : '0.0'} ETH
              </p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
          </button>

          {/* ERC20 Tokens */}
          {assetsLoading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                <span>Loading tokens...</span>
              </div>
            </div>
          )}
          
          {!assetsLoading && assets?.erc20 && assets.erc20.map((token) => (
            <button
              key={token.address}
              onClick={() => handleAssetSelect({ 
                type: 'ERC20', 
                address: token.address,
                balance: token.balance,
                decimals: token.decimals,
                symbol: token.metadata?.symbol || 'TOKEN',
                name: token.metadata?.name || 'Unknown Token'
              })}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                selectedAsset?.address === token.address
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {(token.metadata?.symbol || 'T').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold">{token.metadata?.symbol || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{token.metadata?.name || 'ERC20 Token'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold">
                  {formatUnits(token.balance, token.decimals)} {token.metadata?.symbol || 'TOKEN'}
                </p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
            </button>
          ))}
          
          {!assetsLoading && (!assets?.erc20 || assets.erc20.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No ERC20 tokens found</p>
              <p className="text-xs mt-1">Make sure you have tokens in your wallet</p>
            </div>
          )}
        </div>
      )}

      {/* NFTs View */}
      {selectedType === 'nfts' && (
        <div className="space-y-3">
          {nftsLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span>Loading NFTs...</span>
              </div>
            </div>
          ) : nftsError ? (
            <div className="text-center py-8 text-orange-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-3" />
              <p className="font-medium mb-1">Failed to load NFTs</p>
              <p className="text-sm">{nftsError}</p>
            </div>
          ) : nfts.length > 0 ? (
            nfts.map((nft) => (
              <button
                key={nft.id}
                onClick={() => handleAssetSelect({ 
                  type: 'NFT', 
                  ...nft,
                  contractAddress: nft.collection.address 
                })}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  selectedAsset?.id === nft.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {nft.image.startsWith('http') ? (
                    <img 
                      src={nft.image} 
                      alt={nft.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <Image className="h-6 w-6 text-purple-600" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold line-clamp-1">{nft.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{nft.collection.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Token ID</p>
                    <p className="font-mono text-sm">#{nft.tokenId.length > 6 ? `${nft.tokenId.slice(0, 6)}...` : nft.tokenId}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Image className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No NFTs found in your wallet</p>
              <p className="text-sm mt-1">Try switching to a different network</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk CSV View */}
      {selectedType === 'bulk' && showBulkUpload && (
        <div className="space-y-4">
          {!bulkFile ? (
            <div
              {...getRootProps()}
              className={cn(
                "rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
                "bg-gradient-to-br from-purple-50/30 to-pink-50/30",
                isDragActive
                  ? "border-purple-500 bg-purple-50 scale-[1.01]"
                  : "border-purple-300 hover:border-purple-400"
              )}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-full shadow-sm mb-4">
                  <Upload className={cn(
                    "h-8 w-8 transition-colors",
                    isDragActive ? "text-purple-600" : "text-purple-500"
                  )} />
                </div>
                
                {isDragActive ? (
                  <p className="text-lg font-semibold text-purple-700">
                    Drop your CSV file here
                  </p>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-gray-800 mb-2">
                      Drop CSV file here
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      or click to browse files
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>• recipient, amount, date, message</span>
                      <span>• Up to 100 recipients</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">{bulkFile.name}</p>
                    <p className="text-sm text-green-700">
                      {bulkEntries.length} recipients loaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearBulkFile}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-green-600" />
                </button>
              </div>

              {/* Preview first few recipients */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {bulkEntries.slice(0, 3).map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 bg-white rounded-lg text-sm">
                    <span className="font-mono">{entry.recipient}</span>
                    <span className="text-gray-600">{entry.amount} ETH</span>
                  </div>
                ))}
                {bulkEntries.length > 3 && (
                  <p className="text-xs text-center text-gray-500 py-1">
                    +{bulkEntries.length - 3} more recipients
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CSV Template Info */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h4 className="font-medium text-blue-900 mb-2 text-sm">CSV Format:</h4>
            <code className="text-xs text-blue-800 block p-2 bg-white/50 rounded">
              recipient,amount,unlock_date,message<br/>
              vitalik.eth,0.01,2025-02-14,Happy Birthday!<br/>
              0x742d...,0.02,2025-03-01,Thank you!
            </code>
          </div>
        </div>
      )}

      {/* Selected Asset Summary */}
      {selectedAsset && (
        <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-purple-900 font-medium">
              Selected: {selectedAsset.type === 'NFT' ? selectedAsset.name : `${selectedAsset.type} Token`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
