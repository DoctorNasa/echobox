import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { GiftCard } from "./GiftCard";
import { GiftWithStatus, GiftStatus } from "../types/gift";
import { Gift, Send, Inbox, Package } from "lucide-react";
import { toast } from "sonner";

interface GiftListProps {
  userAddress: string;
}

// Mock gift data - in production, this would come from smart contract queries
const mockGifts: GiftWithStatus[] = [
  {
    id: "0x1234567890123456",
    sender: "0x742d35Cc6cC00532e7D9A0f7e3B1234567890123",
    recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    unlockTimestamp: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
    claimed: false,
    assetType: 0, // ETH
    token: "0x0000000000000000000000000000000000000000",
    tokenId: "0",
    amount: "0.5",
    recipientENS: "alice.eth",
    message: "Happy birthday! Hope you have an amazing day!",
    createdAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    status: GiftStatus.PENDING,
  },
  {
    id: "0x2345678901234567",
    sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    recipient: "0x742d35Cc6cC00532e7D9A0f7e3B1234567890123",
    unlockTimestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    claimed: false,
    assetType: 1, // ERC20
    token: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
    tokenId: "0",
    amount: "0.1",
    recipientENS: "bob.eth",
    message: "Thanks for helping me with the project!",
    createdAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    status: GiftStatus.CLAIMABLE,
  },
  {
    id: "0x3456789012345678",
    sender: "0x742d35Cc6cC00532e7D9A0f7e3B1234567890123",
    recipient: "0x1234567890123456789012345678901234567890",
    unlockTimestamp: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
    claimed: true,
    assetType: 2, // ERC721
    token: "0x1234567890123456789012345678901234567890",
    tokenId: "42",
    amount: "1",
    recipientENS: "charlie.eth",
    message: "Congratulations on your graduation!",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 7, // 1 week ago
    status: GiftStatus.CLAIMED,
  },
];

export function GiftList({ userAddress }: GiftListProps) {
  const [claimingGifts, setClaimingGifts] = useState<Set<string>>(new Set());

  // Filter gifts based on user role
  const { sentGifts, receivedGifts } = useMemo(() => {
    const sent = mockGifts.filter(
      (gift) => gift.sender.toLowerCase() === userAddress.toLowerCase(),
    );
    const received = mockGifts.filter(
      (gift) => gift.recipient.toLowerCase() === userAddress.toLowerCase(),
    );

    return { sentGifts: sent, receivedGifts: received };
  }, [userAddress]);

  // Count gifts by status
  const giftCounts = useMemo(() => {
    const allUserGifts = [...sentGifts, ...receivedGifts];
    return {
      total: allUserGifts.length,
      pending: allUserGifts.filter((g) => g.status === GiftStatus.PENDING)
        .length,
      claimable: receivedGifts.filter((g) => g.status === GiftStatus.CLAIMABLE)
        .length,
      claimed: allUserGifts.filter((g) => g.status === GiftStatus.CLAIMED)
        .length,
    };
  }, [sentGifts, receivedGifts]);

  const handleClaimGift = async (giftId: string) => {
    setClaimingGifts((prev) => new Set(prev).add(giftId));

    try {
      // Mock claiming delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would call the smart contract's claimGift function
      console.log(`Claiming gift ${giftId}`);

      // Update mock data (in production, this would be handled by wagmi query invalidation)
      const giftIndex = mockGifts.findIndex((g) => g.id === giftId);
      if (giftIndex !== -1) {
        mockGifts[giftIndex] = {
          ...mockGifts[giftIndex],
          claimed: true,
          status: GiftStatus.CLAIMED,
        };
      }

      toast.success("🎉 Gift claimed successfully! 🎊\nCelebration time!");
    } catch (error) {
      console.error("Failed to claim gift:", error);
      throw error;
    } finally {
      setClaimingGifts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(giftId);
        return newSet;
      });
    }
  };

  if (sentGifts.length === 0 && receivedGifts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mb-2">No gifts yet</h3>
          <p className="text-center text-muted-foreground mb-6">
            Create your first crypto gift or wait for someone to send you one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-primary mb-1">{giftCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total Gifts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-yellow-600 mb-1">
              {giftCounts.pending}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-green-600 mb-1">
              {giftCounts.claimable}
            </div>
            <div className="text-sm text-muted-foreground">Claimable</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-gray-600 mb-1">
              {giftCounts.claimed}
            </div>
            <div className="text-sm text-muted-foreground">Claimed</div>
          </CardContent>
        </Card>
      </div>

      {/* Gift Lists */}
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Received ({receivedGifts.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent ({sentGifts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedGifts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No received gifts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {receivedGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  isRecipient={true}
                  onClaim={handleClaimGift}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentGifts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Send className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No sent gifts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sentGifts.map((gift) => (
                <GiftCard key={gift.id} gift={gift} isRecipient={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
