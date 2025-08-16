import React, { useState } from 'react';
import { WalletProvider } from './components/WalletProvider';
import { Navbar } from './components/Navbar';
import { GiftForm } from './components/GiftForm';
import { GiftList } from './components/GiftList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { Gift, List } from 'lucide-react';
import { CreateGiftParams } from './types/gift';

// Mock user address - in production, this would come from wagmi
const MOCK_USER_ADDRESS = '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123';

function EchoBoxApp() {
  const [activeTab, setActiveTab] = useState('create');

  const handleGiftCreated = (gift: CreateGiftParams) => {
    console.log('Gift created:', gift);
    // Switch to gifts list after creation
    setActiveTab('gifts');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="mb-2">
            Send Crypto Gifts to the Future
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Lock ETH in smart contracts and send them as gifts that unlock on specific dates. 
            Perfect for birthdays, holidays, or any special occasion.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Create Gift
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              My Gifts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="max-w-2xl mx-auto">
              <GiftForm onGiftCreated={handleGiftCreated} />
            </div>
          </TabsContent>

          <TabsContent value="gifts">
            <GiftList userAddress={MOCK_USER_ADDRESS} />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <EchoBoxApp />
      <Toaster position="top-right" />
    </WalletProvider>
  );
}