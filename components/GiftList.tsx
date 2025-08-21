import React, { useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { GiftCard } from "./GiftCard";
import { GiftStatus } from "../types/gift";
import { Send, Inbox, Package, Loader2 } from "lucide-react";
import { useGifts } from "../src/hooks/useGifts";

interface GiftListProps {
  userAddress: string;
}

export function GiftList({ userAddress }: GiftListProps) {
  // Use the blockchain hook to fetch real gift data
  const {
    sentGifts,
    receivedGifts,
    isLoading,
    error,
    claimGift,
    isClaimingGift,
  } = useGifts();

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

  // Handle loading state
  if (isLoading && sentGifts.length === 0 && receivedGifts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading gifts from blockchain...</p>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error && !sentGifts.length && !receivedGifts.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mb-2">Unable to load gifts</h3>
          <p className="text-center text-muted-foreground mb-6">
            {process.env.NODE_ENV === 'development' 
              ? 'Using mock data. Deploy the smart contract to see real data.'
              : 'Please check your connection and try again.'}
          </p>
        </CardContent>
      </Card>
    );
  }

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
                  onClaim={claimGift}
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
