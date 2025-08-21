"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Gift, 
  Send, 
  Inbox, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { useSentGifts, useReceivedGifts, useTotalGifts } from '../hooks/useGifts';
import { useClaimGift } from '../hooks/useGiftTransactions';
import { useAccount } from 'wagmi';
import { GiftCard } from './GiftCard';
import {
  convertBlockchainGiftToUIGift,
  getGiftStatistics,
  sortGiftsByPriority,
  sortUIGiftsByPriority,
  filterGiftsByStatus,
  getStatusColor,
  getStatusText
} from '../lib/giftService';
import { GiftStatus } from '../types/gift';
import { toast } from 'sonner';

export function GiftDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('received');
  const [statusFilter, setStatusFilter] = useState<'all' | GiftStatus>('all');

  // Fetch blockchain data
  const { 
    gifts: sentGifts, 
    isLoading: sentLoading, 
    error: sentError, 
    refetch: refetchSent 
  } = useSentGifts();
  
  const { 
    gifts: receivedGifts, 
    isLoading: receivedLoading, 
    error: receivedError, 
    refetch: refetchReceived 
  } = useReceivedGifts();

  const { totalGifts } = useTotalGifts();
  const { claimGift, isClaiming } = useClaimGift();

  // Convert blockchain gifts to UI format
  const sentUIGifts = sentGifts.map(convertBlockchainGiftToUIGift);
  const receivedUIGifts = receivedGifts.map(convertBlockchainGiftToUIGift);

  // Calculate statistics
  const sentStats = getGiftStatistics(sentGifts);
  const receivedStats = getGiftStatistics(receivedGifts);

  // Handle gift claiming
  const handleClaimGift = async (giftId: string) => {
    try {
      await claimGift(parseInt(giftId));
      toast.success('Gift claimed successfully!');
      refetchReceived();
    } catch (error) {
      console.error('Error claiming gift:', error);
      toast.error('Failed to claim gift');
    }
  };

  // Filter and sort gifts (gifts are already in UI format)
  const getFilteredGifts = (gifts: any[], type: 'sent' | 'received') => {
    let filtered = gifts;

    if (statusFilter !== 'all') {
      // Filter by status - gifts are already in UI format
      filtered = gifts.filter(gift => {
        switch (statusFilter) {
          case 'pending':
            return gift.status === GiftStatus.PENDING;
          case 'claimable':
            return gift.status === GiftStatus.CLAIMABLE;
          case 'claimed':
            return gift.status === GiftStatus.CLAIMED;
          default:
            return true;
        }
      });
    }

    // Sort received gifts by priority, sent gifts remain as-is
    return type === 'received' ? sortUIGiftsByPriority(filtered) : filtered;
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Gift className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 text-center">
            Connect your wallet to view your gifts and start sending presents to friends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gifts</p>
                <p className="text-2xl font-bold text-gray-900">{totalGifts}</p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-gray-900">{sentStats.total}</p>
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-2xl font-bold text-gray-900">{receivedStats.total}</p>
              </div>
              <Inbox className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Claimable</p>
                <p className="text-2xl font-bold text-green-600">{receivedStats.claimable}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Your Gifts
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchSent();
                refetchReceived();
              }}
              disabled={sentLoading || receivedLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(sentLoading || receivedLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Received ({receivedStats.total})
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Sent ({sentStats.total})
              </TabsTrigger>
            </TabsList>

            {/* Status Filter */}
            <div className="flex gap-2 mt-4 mb-6">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === GiftStatus.PENDING ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(GiftStatus.PENDING)}
              >
                <Clock className="h-4 w-4 mr-1" />
                Pending
              </Button>
              <Button
                variant={statusFilter === GiftStatus.CLAIMABLE ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(GiftStatus.CLAIMABLE)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Claimable
              </Button>
              <Button
                variant={statusFilter === GiftStatus.CLAIMED ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(GiftStatus.CLAIMED)}
              >
                <Gift className="h-4 w-4 mr-1" />
                Claimed
              </Button>
            </div>

            <TabsContent value="received" className="space-y-4">
              {receivedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : receivedError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600">Error loading received gifts</p>
                </div>
              ) : getFilteredGifts(receivedUIGifts, 'received').length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No received gifts found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getFilteredGifts(receivedUIGifts, 'received').map((gift) => (
                    <GiftCard
                      key={gift.id}
                      gift={gift}
                      onClaim={handleClaimGift}
                      isClaimable={gift.status === GiftStatus.CLAIMABLE}
                      isClaiming={isClaiming}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : sentError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600">Error loading sent gifts</p>
                </div>
              ) : getFilteredGifts(sentUIGifts, 'sent').length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No sent gifts found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getFilteredGifts(sentUIGifts, 'sent').map((gift) => (
                    <GiftCard
                      key={gift.id}
                      gift={gift}
                      onClaim={handleClaimGift}
                      isClaimable={false}
                      isClaiming={false}
                      showClaimButton={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
