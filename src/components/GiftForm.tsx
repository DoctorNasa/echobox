"use client";
import { useState } from "react";
import { Address, parseEther, parseUnits, isAddress } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Calendar, Clock, Gift, MessageSquare, Send, Wallet, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import ENSInput from "./ENSInput";
import AssetPicker from "./AssetPicker";
import WalletAssetPicker from "./WalletAssetPicker";
import { cn } from "../lib/utils";
import { GIFTBOX_V2_ADDRESS } from "../lib/constants";
import { ensureErc20Allowance } from "../lib/erc20";
import { ensureErc721ApprovalForAll } from "../lib/erc721";
import { ensureErc1155ApprovalForAll } from "../lib/erc1155";
import type { SelectedAsset } from "../types/asset";

// GiftBoxV2 ABI (minimal for the functions we need)
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
    outputs: [],
    stateMutability: "payable",
  },
  {
    name: "createGiftToken",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "createGiftERC721",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "token", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "createGiftERC1155",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "unlockTimestamp", type: "uint256" },
      { name: "token", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "recipientENS", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export default function GiftForm({ onGiftCreated }: { onGiftCreated?: (gift: any) => void }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  // Form state
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientAddress, setRecipientAddress] = useState<Address | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset>({ type: "ETH" });
  const [unlockDate, setUnlockDate] = useState("");
  const [unlockTime, setUnlockTime] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useWalletAssets, setUseWalletAssets] = useState(true); // Toggle between wallet assets and manual input

  // Transaction state
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleRecipientChange = (input: string, resolved: Address | null) => {
    setRecipientInput(input);
    setRecipientAddress(resolved);
  };

  const handleAssetChange = (asset: SelectedAsset) => {
    setSelectedAsset(asset);
  };

  const getUnlockTimestamp = () => {
    if (!unlockDate || !unlockTime) return 0;
    const dateTime = new Date(`${unlockDate}T${unlockTime}`);
    return Math.floor(dateTime.getTime() / 1000);
  };

  const validateForm = () => {
    if (!recipientAddress) {
      toast.error("Please enter a valid recipient address or ENS name");
      return false;
    }

    if (!unlockDate || !unlockTime) {
      toast.error("Please select unlock date and time");
      return false;
    }

    const unlockTimestamp = getUnlockTimestamp();
    if (unlockTimestamp <= Math.floor(Date.now() / 1000)) {
      toast.error("Unlock time must be in the future");
      return false;
    }

    if (selectedAsset.type === "ETH" || selectedAsset.type === "ERC20") {
      if (!selectedAsset.amount || parseFloat(selectedAsset.amount) <= 0) {
        toast.error("Please enter a valid amount");
        return false;
      }
    }

    if (selectedAsset.type === "ERC721" || selectedAsset.type === "ERC1155") {
      if (!selectedAsset.nft?.address || !isAddress(selectedAsset.nft.address)) {
        toast.error("Please enter a valid NFT contract address");
        return false;
      }
      if (!selectedAsset.nft?.tokenId) {
        toast.error("Please enter a token ID");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const unlockTimestamp = BigInt(getUnlockTimestamp());
      const ensName = recipientInput.endsWith(".eth") ? recipientInput : "";
      const contractAddress = GIFTBOX_V2_ADDRESS as Address;

      let hash: `0x${string}`;

      if (selectedAsset.type === "ETH") {
        // Create ETH gift
        const amount = parseEther(selectedAsset.amount || "0");
        
        hash = await writeContractAsync({
          address: contractAddress,
          abi: GIFTBOX_V2_ABI,
          functionName: "createGiftETH",
          args: [recipientAddress!, unlockTimestamp, ensName, giftMessage],
          value: amount,
        });
        
        toast.success("Creating ETH gift...");
      } 
      else if (selectedAsset.type === "ERC20" && selectedAsset.token) {
        // Ensure approval first
        await ensureErc20Allowance({
          token: selectedAsset.token.address as Address,
          owner: address,
          spender: contractAddress,
          amount: selectedAsset.amount!,
          decimals: selectedAsset.token.decimals,
        });

        const amount = parseUnits(
          selectedAsset.amount!,
          selectedAsset.token.decimals || 18
        );

        hash = await writeContractAsync({
          address: contractAddress,
          abi: GIFTBOX_V2_ABI,
          functionName: "createGiftToken",
          args: [
            recipientAddress!,
            unlockTimestamp,
            selectedAsset.token.address as Address,
            amount,
            ensName,
            giftMessage,
          ],
        });
        
        toast.success(`Creating ${selectedAsset.token.symbol} gift...`);
      }
      else if (selectedAsset.type === "ERC721" && selectedAsset.nft) {
        // Ensure approval first
        await ensureErc721ApprovalForAll({
          token: selectedAsset.nft.address,
          owner: address,
          operator: contractAddress,
        });

        hash = await writeContractAsync({
          address: contractAddress,
          abi: GIFTBOX_V2_ABI,
          functionName: "createGiftERC721",
          args: [
            recipientAddress!,
            unlockTimestamp,
            selectedAsset.nft.address,
            BigInt(selectedAsset.nft.tokenId),
            ensName,
            giftMessage,
          ],
        });
        
        toast.success("Creating NFT gift...");
      }
      else if (selectedAsset.type === "ERC1155" && selectedAsset.nft) {
        // Ensure approval first
        await ensureErc1155ApprovalForAll({
          token: selectedAsset.nft.address,
          owner: address,
          operator: contractAddress,
        });

        const amount = BigInt(selectedAsset.nft.amount || "1");

        hash = await writeContractAsync({
          address: contractAddress,
          abi: GIFTBOX_V2_ABI,
          functionName: "createGiftERC1155",
          args: [
            recipientAddress!,
            unlockTimestamp,
            selectedAsset.nft.address,
            BigInt(selectedAsset.nft.tokenId),
            amount,
            ensName,
            giftMessage,
          ],
        });
        
        toast.success("Creating multi-edition NFT gift...");
      } else {
        throw new Error("Invalid asset configuration");
      }

      setTxHash(hash);
      
      if (hash && onGiftCreated) {
        onGiftCreated(selectedAsset);
      }
      
      // Reset form on success
      if (hash) {
        toast.success("Gift created successfully! 🎁");
        setRecipientInput("");
        setRecipientAddress(null);
        setSelectedAsset({ type: "ETH" });
        setUnlockDate("");
        setUnlockTime("");
        setGiftMessage("");
      }
    } catch (error: any) {
      console.error("Error creating gift:", error);
      toast.error(error.message || "Failed to create gift");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get current time + 1 hour for minimum time
  const minTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16).split('T')[1];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Create Crypto Gift
        </h2>
        <p className="text-gray-600 mt-2">
          Send ETH, tokens, or NFTs that unlock at a future date
        </p>
      </div>

      {/* Recipient Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recipient (Address or ENS)</h3>
        <ENSInput
          value={recipientInput}
          onChange={handleRecipientChange}
          label=""
          placeholder="0x742d... or vitalik.eth"
          required
        />
      </div>

      {/* Asset Selection with Toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Asset</h3>
          <button
            type="button"
            onClick={() => setUseWalletAssets(!useWalletAssets)}
            className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            {useWalletAssets ? (
              <>
                <Wallet className="w-4 h-4" />
                From Wallet
                <ToggleRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                Manual Input
                <Gift className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        
        {useWalletAssets ? (
          <WalletAssetPicker 
            onChange={handleAssetChange}
            showBalance={true}
            showRefresh={true}
          />
        ) : (
          <AssetPicker onChange={handleAssetChange} />
        )}
      </div>

      {/* Unlock Date & Time */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Unlock Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              Unlock Date
            </label>
            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              min={today}
              required
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4" />
              Unlock Time
            </label>
            <input
              type="time"
              value={unlockTime}
              onChange={(e) => setUnlockTime(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
        {unlockDate && unlockTime && (
          <p className="mt-3 text-sm text-gray-600">
            Gift will unlock on {new Date(`${unlockDate}T${unlockTime}`).toLocaleString()}
          </p>
        )}
      </div>

      {/* Gift Message */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <label className="flex items-center gap-2 text-lg font-semibold mb-4">
          <MessageSquare className="w-5 h-5" />
          Personal Message (Optional)
        </label>
        <textarea
          value={giftMessage}
          onChange={(e) => setGiftMessage(e.target.value)}
          placeholder="Write a special message for the recipient..."
          rows={4}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isConnected || isSubmitting || isConfirming}
        className={cn(
          "w-full rounded-2xl py-4 px-6 font-semibold text-white transition-all",
          "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        {isSubmitting || isConfirming ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isConfirming ? "Confirming..." : "Creating Gift..."}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Create Gift
          </>
        )}
      </button>

      {!isConnected && (
        <p className="text-center text-sm text-red-600">
          Please connect your wallet to create a gift
        </p>
      )}
    </form>
  );
}
