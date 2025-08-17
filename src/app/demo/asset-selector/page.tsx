"use client";

import { useState } from 'react';
import { WalletAssetSelector } from '../../../components/WalletAssetSelector';
import { BulkGiftEntry } from '../../../types/bulkGift';
import { Gift, Users, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function AssetSelectorDemo() {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [bulkEntries, setBulkEntries] = useState<BulkGiftEntry[]>([]);

  const handleAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    toast.success(`Selected ${asset.type === 'NFT' ? asset.name : asset.type}`);
  };

  const handleBulkUpload = (entries: BulkGiftEntry[]) => {
    setBulkEntries(entries);
    toast.success(`Loaded ${entries.length} recipients from CSV`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-4">
            <Gift className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Asset Selector Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select tokens, NFTs from your wallet, or upload a CSV file with multiple recipients for bulk gifting
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Asset Selector */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <WalletAssetSelector
              onAssetSelect={handleAssetSelect}
              onBulkUpload={handleBulkUpload}
              showBulkUpload={true}
            />
          </div>

          {/* Selection Summary */}
          {selectedAsset && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Selected Asset
              </h3>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                {selectedAsset.type === 'NFT' ? (
                  <div className="flex items-start gap-4">
                    {selectedAsset.image?.startsWith('http') && (
                      <img 
                        src={selectedAsset.image} 
                        alt={selectedAsset.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {selectedAsset.name}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedAsset.collection?.name || 'Unknown Collection'}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-white rounded-full text-gray-700">
                          Token ID: #{selectedAsset.tokenId}
                        </span>
                        <span className="px-2 py-1 bg-white rounded-full text-gray-700">
                          Type: {selectedAsset.tokenType || 'ERC721'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedAsset.type} Token
                      </p>
                      <p className="text-sm text-gray-600">
                        Ready for gifting
                      </p>
                    </div>
                    {selectedAsset.balance && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Balance</p>
                        <p className="font-mono font-semibold">
                          {selectedAsset.type === 'ETH' 
                            ? `${(Number(selectedAsset.balance) / 1e18).toFixed(4)} ETH`
                            : `${selectedAsset.balance} ${selectedAsset.type}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Entries Summary */}
          {bulkEntries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Bulk Recipients ({bulkEntries.length})
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bulkEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-mono text-sm text-gray-900">
                        {entry.recipient}
                      </p>
                      {entry.message && (
                        <p className="text-xs text-gray-600 mt-1">
                          "{entry.message}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {entry.amount} ETH
                      </p>
                      {entry.unlockDate && (
                        <p className="text-xs text-gray-500">
                          Unlock: {entry.unlockDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {bulkEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Coins className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-semibold">Token Support</h4>
              </div>
              <p className="text-sm text-gray-600">
                Select ETH and ERC-20 tokens from your connected wallet
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Image className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="font-semibold">NFT Selection</h4>
              </div>
              <p className="text-sm text-gray-600">
                Choose from your NFT collection with real-time fetching
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="font-semibold">CSV Upload</h4>
              </div>
              <p className="text-sm text-gray-600">
                Bulk send to multiple recipients via CSV file upload
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">How to Use:</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                Connect your wallet to see available assets
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                Choose between Tokens, NFTs, or Bulk CSV upload
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                Select an asset or upload a CSV file with recipients
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                Review your selection and proceed with gifting
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing import
import { Coins, Image } from 'lucide-react';
