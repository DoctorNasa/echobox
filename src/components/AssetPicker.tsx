"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import type { AssetType, NFTInput, TokenMeta, SelectedAsset } from "../types/asset";
import { getTokenListForChain } from "../lib/constants";
import useAssetPrice from "../hooks/useAssetPrice";
import { cn } from "../lib/utils";
import { useChainId } from "wagmi";

type Props = {
  onChange: (asset: SelectedAsset) => void;
  defaultType?: AssetType;
};

export default function AssetPicker({ onChange, defaultType = "ETH" }: Props) {
  const chainId = useChainId();
  const tokenList = getTokenListForChain(chainId);

  const [type, setType] = useState<AssetType>(defaultType);
  const [selectedToken, setSelectedToken] = useState<TokenMeta | undefined>(tokenList[0]);
  const [amount, setAmount] = useState<string>("");
  const [nft, setNft] = useState<NFTInput>({
    standard: "ERC721",
    address: "0x0000000000000000000000000000000000000000",
    tokenId: "",
    amount: "1"
  });

  const selectedAsset: SelectedAsset | null = useMemo(() => ({
    type,
    token: type === "ETH" || type === "ERC20" ? selectedToken : undefined,
    nft: type === "ERC721" || type === "ERC1155" ? nft : undefined,
    amount: type === "ETH" || type === "ERC20" ? amount : nft.amount,
  }), [type, selectedToken, nft, amount]);

  const { usdValue } = useAssetPrice(selectedAsset);

  const emit = (updates?: Partial<SelectedAsset>) => {
    const asset: SelectedAsset = {
      type,
      token: type === "ETH" || type === "ERC20" ? selectedToken : undefined,
      nft: type === "ERC721" || type === "ERC1155" ? nft : undefined,
      amount: type === "ETH" || type === "ERC20" ? amount : nft.amount,
      ...updates
    };
    onChange(asset);
  };

  const handleTypeChange = (newType: AssetType) => {
    setType(newType);

    // Reset form when changing type
    if (newType === "ETH") {
      setSelectedToken(tokenList[0]); // ETH
      setAmount("");
    } else if (newType === "ERC20") {
      const firstToken = tokenList.find(t => t.address !== null) || tokenList[1];
      setSelectedToken(firstToken);
      setAmount("");
    }

    emit({ type: newType });
  };

  const handleTokenSelect = (token: TokenMeta) => {
    setSelectedToken(token);
    emit({ token });
  };

  const handleAmountChange = (value: string) => {
    // Only allow valid number input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      emit({ amount: value });
    }
  };

  const handleNftChange = (field: keyof NFTInput, value: string) => {
    const updatedNft = { ...nft, [field]: value };
    setNft(updatedNft);
    emit({ nft: updatedNft });
  };

  return (
    <div className="space-y-6">
      {/* Asset Type Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {(["ETH", "ERC20", "ERC721", "ERC1155"] as AssetType[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={cn(
              "rounded-xl border-2 px-4 py-3 font-medium transition-all",
              type === t
                ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {t === "ETH" && "Ether"}
            {t === "ERC20" && "Token"}
            {t === "ERC721" && "NFT"}
            {t === "ERC1155" && "Multi NFT"}
          </button>
        ))}
      </div>

      {/* ETH / ERC-20 Selection */}
      {(type === "ETH" || type === "ERC20") && (
        <div className="space-y-4">
          {type === "ERC20" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Token
              </label>
              <div className="grid gap-2">
                {tokenList.filter(t => t.address !== null).map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => handleTokenSelect(token)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                      selectedToken?.symbol === token.symbol
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="relative h-8 w-8">
                      {token.icon ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          <span className="text-xs font-bold">{token.symbol[0]}</span>
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                          <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-500">{token.name}</div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {token.address ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}` : "Native"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount ({type === "ETH" ? "ETH" : selectedToken?.symbol || "Token"})
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-20 font-mono text-lg focus:border-purple-500 focus:outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                {type === "ETH" ? "ETH" : selectedToken?.symbol}
              </div>
            </div>
            {usdValue && (
              <div className="text-right text-sm text-gray-500">
                ≈ ${usdValue.toFixed(2)}
              </div>
            )}
            {amount && parseFloat(amount) > 0 && type === "ERC20" && selectedToken?.symbol === "PYUSD" && (
              <p className="text-sm text-green-600">
                💵 Stablecoin gift - perfect for international transfers!
              </p>
            )}
          </div>
        </div>
      )}

      {/* NFT Selection (ERC721 / ERC1155) */}
      {(type === "ERC721" || type === "ERC1155") && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              NFT Standard
            </label>
            <select
              value={nft.standard}
              onChange={(e) => {
                const std = e.target.value as "ERC721" | "ERC1155";
                handleNftChange("standard", std);
                setType(std === "ERC721" ? "ERC721" : "ERC1155");
              }}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none"
            >
              <option value="ERC721">ERC-721 (Single NFT)</option>
              <option value="ERC1155">ERC-1155 (Multi-Edition NFT)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              NFT Contract Address
            </label>
            <input
              type="text"
              value={nft.address}
              onChange={(e) => handleNftChange("address", e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-mono text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Token ID
            </label>
            <input
              type="text"
              value={nft.tokenId}
              onChange={(e) => handleNftChange("tokenId", e.target.value)}
              placeholder="e.g., 1234"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {type === "ERC1155" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Amount (Quantity)
              </label>
              <input
                type="text"
                value={nft.amount || "1"}
                onChange={(e) => handleNftChange("amount", e.target.value)}
                placeholder="1"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none"
              />
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-700">
              {type === "ERC721" 
                ? "🖼️ Gifting a unique NFT - make sure you own this token!"
                : "🎨 Gifting multi-edition NFTs - perfect for collections!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
