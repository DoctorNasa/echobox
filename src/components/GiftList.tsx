"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { Gift, Clock, Send, Inbox, Loader2 } from "lucide-react";
import GiftCard from "./GiftCard";
import { GIFTBOX_V2_ADDRESS } from "@/lib/constants";
import { getDisplayName } from "@/lib/ens";
import { cn } from "@/lib/utils";
import type { GiftAsset } from "@/types/asset";

const GIFTBOX_V2_ABI = [
  {
    name: "getSentGifts",
    type: "function",
    inputs: [{ name: "sender", type: "address" }],
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    name: "getReceivedGifts",
    type: "function",
    inputs: [{ name: "recipient", type: "address" }],
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    name: "getMultipleGifts",
    type: "function",
    inputs: [{ name: "ids", type: "uint256[]" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "sender", type: "address" },
          { name: "recipient", type: "address" },
          { name: "unlockTimestamp", type: "uint256" },
          { name: "claimed", type: "bool" },
          { name: "assetType", type: "uint8" },
          { name: "token", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "recipientENS", type: "string" },
          { name: "message", type: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

type Tab = "sent" | "received";

export default function GiftList() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [gifts, setGifts] = useState<GiftAsset[]>([]);
  const [displayNames, setDisplayNames] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Get sent gift IDs
  const { data: sentIds, refetch: refetchSent } = useReadContract({
    address: GIFTBOX_V2_ADDRESS as `0x${string}`,
    abi: GIFTBOX_V2_ABI,
    functionName: "getSentGifts",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && activeTab === "sent",
    },
  });

  // Get received gift IDs
  const { data: receivedIds, refetch: refetchReceived } = useReadContract({
    address: GIFTBOX_V2_ADDRESS as `0x${string}`,
    abi: GIFTBOX_V2_ABI,
    functionName: "getReceivedGifts",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && activeTab === "received",
    },
  });

  const currentIds = activeTab === "sent" ? sentIds : receivedIds;

  // Get gift details
  const { data: giftDetails } = useReadContract({
    address: GIFTBOX_V2_ADDRESS as `0x${string}`,
    abi: GIFTBOX_V2_ABI,
    functionName: "getMultipleGifts",
    args: currentIds && currentIds.length > 0 ? [currentIds] : undefined,
    query: {
      enabled: !!currentIds && currentIds.length > 0,
    },
  });

  // Process gift details and resolve ENS names
  useEffect(() => {
    if (!giftDetails) return;

    const processGifts = async () => {
      setIsLoading(true);
      const processedGifts: GiftAsset[] = [];
      const nameMap = new Map<string, string>();

      for (let i = 0; i < giftDetails.length; i++) {
        const gift = giftDetails[i];
        const id = currentIds![i];

        // Convert asset type number to string
        const assetTypes = ["ETH", "ERC20", "ERC721", "ERC1155"];
        const assetType = assetTypes[Number(gift.assetType)] as any;

        processedGifts.push({
          id: id,
          sender: gift.sender,
          recipient: gift.recipient,
          unlockTimestamp: gift.unlockTimestamp,
          claimed: gift.claimed,
          assetType,
          token: gift.token,
          tokenId: gift.tokenId,
          amount: gift.amount,
          recipientENS: gift.recipientENS,
          message: gift.message,
        });

        // Resolve display names
        if (!nameMap.has(gift.sender)) {
          const name = await getDisplayName(gift.sender);
          nameMap.set(gift.sender, name);
        }
        if (!nameMap.has(gift.recipient)) {
          const name = gift.recipientENS || await getDisplayName(gift.recipient);
          nameMap.set(gift.recipient, name);
        }
      }

      setGifts(processedGifts);
      setDisplayNames(nameMap);
      setIsLoading(false);
    };

    processGifts();
  }, [giftDetails, currentIds]);

  const handleRefresh = () => {
    if (activeTab === "sent") {
      refetchSent();
    } else {
      refetchReceived();
    }
  };

  const handleClaimSuccess = () => {
    handleRefresh();
  };

  const getEmptyMessage = () => {
    if (!isConnected) {
      return "Connect your wallet to view gifts";
    }
    if (activeTab === "sent") {
      return "You haven't sent any gifts yet";
    }
    return "You haven't received any gifts yet";
  };

  const pendingGifts = gifts.filter(g => !g.claimed);
  const claimedGifts = gifts.filter(g => g.claimed);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Your Gifts
        </h2>
        <p className="text-gray-600 mt-2">
          Manage your sent and received time-locked gifts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("received")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all",
            activeTab === "received"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Inbox className="w-4 h-4" />
          Received
          {receivedIds && receivedIds.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {receivedIds.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all",
            activeTab === "sent"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Send className="w-4 h-4" />
          Sent
          {sentIds && sentIds.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {sentIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Loading gifts...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && gifts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{getEmptyMessage()}</p>
        </div>
      )}

      {/* Gift Lists */}
      {!isLoading && gifts.length > 0 && (
        <div className="space-y-6">
          {/* Pending Gifts */}
          {pendingGifts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Pending Gifts
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingGifts.map((gift) => (
                  <GiftCard
                    key={gift.id.toString()}
                    gift={gift}
                    displayName={displayNames.get(
                      activeTab === "sent" ? gift.recipient : gift.sender
                    ) || "Unknown"}
                    isSent={activeTab === "sent"}
                    onClaimSuccess={handleClaimSuccess}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Claimed Gifts */}
          {claimedGifts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-500" />
                Claimed Gifts
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {claimedGifts.map((gift) => (
                  <GiftCard
                    key={gift.id.toString()}
                    gift={gift}
                    displayName={displayNames.get(
                      activeTab === "sent" ? gift.recipient : gift.sender
                    ) || "Unknown"}
                    isSent={activeTab === "sent"}
                    onClaimSuccess={handleClaimSuccess}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
