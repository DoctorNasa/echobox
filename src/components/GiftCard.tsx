"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatDistanceToNowStrict } from "date-fns";
import { Gift, Clock, CheckCircle, PackageCheck, Send, ArrowDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatEther, formatUnits } from "viem";
import { TOKEN_LIST, GIFTBOX_V2_ADDRESS } from "@/lib/constants";
import { getENSAvatar, formatAddress, getDisplayName } from "@/lib/ens";
import { cn } from "@/lib/utils";
import type { GiftAsset } from "@/types/asset";

const GIFTBOX_V2_ABI = [
  {
    name: "claimGift",
    type: "function",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

type Props = {
  gift: GiftAsset;
  displayName: string;
  isSent: boolean;
  onClaimSuccess: () => void;
};

export default function GiftCard({ gift, displayName, isSent, onClaimSuccess }: Props) {
  const { address } = useAccount();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isClaiming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    const checkUnlock = () => {
      const now = Date.now() / 1000;
      if (now >= gift.unlockTimestamp) {
        setIsUnlocked(true);
        setCountdown("Ready to claim!");
      } else {
        setIsUnlocked(false);
        const distance = formatDistanceToNowStrict(new Date(Number(gift.unlockTimestamp) * 1000));
        setCountdown(`${distance} left`);
      }
    };

    checkUnlock();
    const interval = setInterval(checkUnlock, 1000);

    return () => clearInterval(interval);
  }, [gift.unlockTimestamp]);

  useEffect(() => {
    if (gift.recipientENS) {
      getENSAvatar(gift.recipientENS).then(setEnsAvatar);
    }
  }, [gift.recipientENS]);

  const handleClaim = async () => {
    if (!address) {
      toast.error("Please connect your wallet to claim");
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: GIFTBOX_V2_ADDRESS as `0x${string}`,
        abi: GIFTBOX_V2_ABI,
        functionName: "claimGift",
        args: [gift.id],
      });

      setTxHash(hash);
      toast.success("Claiming your gift... 🎁");
      
      if (hash) {
        onClaimSuccess(); // Refresh list
      }
    } catch (error: any) {
      console.error("Error claiming gift:", error);
      toast.error(error.message || "Failed to claim gift");
    }
  };

  const getAssetInfo = () => {
    const tokenMeta = TOKEN_LIST.find(t => t.address === gift.token);
    
    switch (gift.assetType) {
      case "ETH":
        return `${formatEther(gift.amount)} ETH`;
      case "ERC20":
        return `${formatUnits(gift.amount, tokenMeta?.decimals || 18)} ${tokenMeta?.symbol}`;
      case "ERC721":
        return `NFT #${gift.tokenId.toString()}`;
      case "ERC1155":
        return `${gift.amount.toString()} of NFT #${gift.tokenId.toString()}`;
      default:
        return "Unknown Asset";
    }
  };
  
  const cardGradient = gift.claimed
    ? "from-gray-100 to-gray-200"
    : isUnlocked
    ? "from-green-400 to-emerald-500"
    : "from-purple-500 to-pink-500";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 text-white shadow-lg transition-all transform hover:-translate-y-1",
        `bg-gradient-to-br ${cardGradient}`
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {isSent ? (
            <Send className="w-5 h-5 opacity-80" />
          ) : (
            <ArrowDown className="w-5 h-5 opacity-80" />
          )}
          <p className="font-semibold">{isSent ? "To:" : "From:"}</p>
          <p className="font-medium truncate">{displayName}</p>
        </div>
        {gift.claimed ? (
          <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
            <PackageCheck className="w-3 h-3" />
            Claimed
          </div>
        ) : isUnlocked ? (
          <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Unlocked
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            Locked
          </div>
        )}
      </div>

      {/* Asset Info */}
      <div className="my-6 text-center">
        <p className="text-3xl font-bold tracking-tight">{getAssetInfo()}</p>
        <p className="opacity-80 text-sm mt-1">{gift.assetType}</p>
      </div>

      {/* Message */}
      {gift.message && (
        <p className="text-center text-sm italic bg-white/10 p-3 rounded-lg">
          “{gift.message}”
        </p>
      )}

      {/* Footer & Countdown/Claim */}
      <div className="mt-6">
        {gift.claimed ? (
          <div className="text-center text-sm opacity-80">
            Gift claimed successfully
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center text-sm font-medium">
              {countdown}
            </div>
            {!isSent && (
              <button
                onClick={handleClaim}
                disabled={!isUnlocked || isClaiming}
                className={cn(
                  "w-full rounded-xl py-3 font-semibold transition-all",
                  "bg-white text-purple-600 hover:bg-opacity-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isClaiming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Claim Gift
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Etherscan Link */}
      <div className="mt-4 text-center">
        <a 
          href={`https://sepolia.etherscan.io/tx/${txHash || ''}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-white/70 hover:text-white transition-all flex items-center justify-center gap-1"
        >
          View on Etherscan <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
