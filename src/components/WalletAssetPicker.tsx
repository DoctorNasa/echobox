"use client";
import { useMemo, useState } from "react";
import { Coins, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { useWalletAssets } from "../hooks/useWalletAssets";
import { formatAssetValue } from "../lib/walletAssets";
import type { SelectedAsset } from "../types/asset";
import type { ERC20Asset, NativeAsset } from "../types/wallet";
import { cn } from "../lib/utils";

interface WalletAssetPickerProps {
  onChange: (asset: SelectedAsset) => void;
  defaultType?: "ETH" | "ERC20";
  showBalance?: boolean;
  showRefresh?: boolean;
}

export default function WalletAssetPicker({
  onChange,
  defaultType = "ETH",
  showBalance = true,
  showRefresh = true,
}: WalletAssetPickerProps) {
  const [selectedType, setSelectedType] = useState<"ETH" | "ERC20">(defaultType);
  const [selectedAsset, setSelectedAsset] = useState<NativeAsset | ERC20Asset | null>(null);
  const [amount, setAmount] = useState("");

  // Fetch wallet assets
  const { assets, isLoading, error, refetch, clearCache } = useWalletAssets({
    includeNative: true,
    includeERC20: true,
    includeNFTs: false,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter available assets based on type
  const availableAssets = useMemo(() => {
    if (!assets) return [];
    
    if (selectedType === "ETH") {
      return assets.native ? [assets.native] : [];
    } else {
      return assets.erc20;
    }
  }, [assets, selectedType]);

  // Handle asset selection
  const handleAssetSelect = (asset: NativeAsset | ERC20Asset) => {
    setSelectedAsset(asset);
    
    // Emit the selected asset
    const selected: SelectedAsset = {
      type: asset.type === 'native' ? 'ETH' : 'ERC20',
      token: asset.type === 'erc20' ? {
        symbol: asset.metadata?.symbol || 'TOKEN',
        name: asset.metadata?.name,
        address: asset.address,
        decimals: asset.decimals,
      } : {
        symbol: 'ETH',
        name: 'Ethereum',
        address: null,
        decimals: 18,
      },
      amount,
    };
    
    onChange(selected);
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      
      if (selectedAsset) {
        const selected: SelectedAsset = {
          type: selectedAsset.type === 'native' ? 'ETH' : 'ERC20',
          token: selectedAsset.type === 'erc20' ? {
            symbol: selectedAsset.metadata?.symbol || 'TOKEN',
            name: selectedAsset.metadata?.name,
            address: selectedAsset.address,
            decimals: selectedAsset.decimals,
          } : {
            symbol: 'ETH',
            name: 'Ethereum',
            address: null,
            decimals: 18,
          },
          amount: value,
        };
        onChange(selected);
      }
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    clearCache();
    await refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Select Asset from Wallet</h3>
        </div>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "border border-gray-200 hover:bg-gray-50",
              isLoading && "cursor-not-allowed opacity-50"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </button>
        )}
      </div>

      {/* Asset Type Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType("ETH")}
          className={cn(
            "flex-1 rounded-xl border-2 px-4 py-3 font-medium transition-all",
            selectedType === "ETH"
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <Coins className="mb-1 h-5 w-5 mx-auto" />
          Ethereum
        </button>
        <button
          onClick={() => setSelectedType("ERC20")}
          className={cn(
            "flex-1 rounded-xl border-2 px-4 py-3 font-medium transition-all",
            selectedType === "ERC20"
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <Coins className="mb-1 h-5 w-5 mx-auto" />
          ERC-20 Tokens
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading wallet assets...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Error loading assets</p>
              <p className="text-sm text-red-600 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Asset List */}
      {!isLoading && !error && availableAssets.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Available Assets</p>
          <div className="grid gap-2">
            {availableAssets.map((asset) => {
              const isSelected = selectedAsset?.address === asset.address;
              const symbol = asset.type === 'native' ? 'ETH' : asset.metadata?.symbol || 'TOKEN';
              const name = asset.type === 'native' ? 'Ethereum' : asset.metadata?.name || 'Unknown Token';
              const decimals = asset.type === 'native' ? 18 : asset.decimals;
              
              return (
                <button
                  key={asset.address || 'native'}
                  onClick={() => handleAssetSelect(asset)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                    isSelected
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                      <span className="text-sm font-bold text-white">
                        {symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{symbol}</div>
                      <div className="text-xs text-gray-500">{name}</div>
                    </div>
                  </div>
                  
                  {showBalance && (
                    <div className="text-right">
                      <div className="font-mono text-sm font-medium">
                        {formatAssetValue(asset.balance, decimals, 6)}
                      </div>
                      <div className="text-xs text-gray-500">Balance</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && availableAssets.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
          <Wallet className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            No {selectedType === "ETH" ? "ETH" : "tokens"} found in your wallet
          </p>
        </div>
      )}

      {/* Amount Input */}
      {selectedAsset && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-24 font-mono text-lg focus:border-purple-500 focus:outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  {selectedAsset.type === 'native' ? 'ETH' : selectedAsset.metadata?.symbol}
                </span>
                {showBalance && amount && (
                  <button
                    onClick={() => {
                      const decimals = selectedAsset.type === 'native' ? 18 : selectedAsset.decimals;
                      const maxAmount = formatAssetValue(selectedAsset.balance, decimals, decimals);
                      handleAmountChange(maxAmount);
                    }}
                    className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-200"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Balance info */}
          {showBalance && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Available balance:</span>
              <span className="font-mono">
                {formatAssetValue(
                  selectedAsset.balance,
                  selectedAsset.type === 'native' ? 18 : selectedAsset.decimals,
                  6
                )} {selectedAsset.type === 'native' ? 'ETH' : selectedAsset.metadata?.symbol}
              </span>
            </div>
          )}
          
          {/* Insufficient balance warning */}
          {amount && parseFloat(amount) > 0 && (
            (() => {
              const decimals = selectedAsset.type === 'native' ? 18 : selectedAsset.decimals;
              const balance = formatAssetValue(selectedAsset.balance, decimals, decimals);
              const hasInsufficient = parseFloat(amount) > parseFloat(balance);
              
              if (hasInsufficient) {
                return (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <p className="text-sm text-orange-800">Insufficient balance</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()
          )}
        </div>
      )}
    </div>
  );
}
