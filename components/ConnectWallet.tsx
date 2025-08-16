import React from 'react';
import { Button } from './ui/button';
import { Wallet, ChevronDown, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

// Mock wallet connection state - in production, use wagmi hooks
interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  isConnecting: boolean;
}

export function ConnectWallet() {
  // Mock state - replace with actual wagmi hooks
  const [wallet, setWallet] = React.useState<WalletState>({
    isConnected: false,
    isConnecting: false
  });

  const handleConnect = async () => {
    setWallet(prev => ({ ...prev, isConnecting: true }));
    
    // Mock connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful connection
    setWallet({
      isConnected: true,
      address: '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
      chainId: 1,
      isConnecting: false
    });
  };

  const handleDisconnect = () => {
    setWallet({
      isConnected: false,
      isConnecting: false
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!wallet.isConnected) {
    return (
      <Button 
        onClick={handleConnect}
        disabled={wallet.isConnecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          {wallet.address && formatAddress(wallet.address)}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}