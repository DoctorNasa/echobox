"use client";
import { useState, useEffect } from "react";
import { TOKEN_LIST } from "@/lib/constants";
import type { SelectedAsset } from "@/types/asset";

// Mock price feed - in a real app, this would use an oracle or API
const MOCK_PRICES: { [symbol: string]: number } = {
  ETH: 3000,   // Mock price for Ethereum
  PYUSD: 1,    // Stablecoin
  USDC: 1,    // Stablecoin
  WETH: 3000,  // Mock price for Wrapped Ether
  DAI: 1,      // Stablecoin
};

export default function useAssetPrice(asset: SelectedAsset | null) {
  const [price, setPrice] = useState<number | null>(null);
  const [usdValue, setUsdValue] = useState<number | null>(null);

  useEffect(() => {
    if (!asset) {
      setPrice(null);
      setUsdValue(null);
      return;
    }

    const getPrice = () => {
      let currentPrice: number | null = null;

      if (asset.type === "ETH" || asset.type === "ERC20") {
        if (asset.token) {
          currentPrice = MOCK_PRICES[asset.token.symbol] || null;
        }
      } else if (asset.type === "ERC721" || asset.type === "ERC1155") {
        // For NFTs, we can't get a price, so we'll just show a placeholder
        currentPrice = null;
      }

      setPrice(currentPrice);

      if (currentPrice && asset.amount) {
        setUsdValue(parseFloat(asset.amount) * currentPrice);
      } else {
        setUsdValue(null);
      }
    };

    getPrice();
  }, [asset]);

  return { price, usdValue };
}
