'use client';

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { Button } from './ui/button';
import { Wallet, ChevronDown, LogOut, User, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';

export function ConnectWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address, isConnected } = useAccount();

  const handleConnect = () => {
    login();
  };

  const handleDisconnect = () => {
    logout();
  };

  // Get display information
  const displayAddress = address || user?.wallet?.address;
  const displayEmail = user?.email?.address;
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Show loading state
  if (!ready) {
    return (
      <Button disabled variant="outline" className="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  // Show connect button if not authenticated
  if (!authenticated || !displayAddress) {
    return (
      <Button 
        onClick={handleConnect}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  // Show connected state with dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <div className="flex flex-col items-start">
            {displayEmail && (
              <span className="text-xs text-muted-foreground">{displayEmail}</span>
            )}
            <span className="font-mono text-sm">
              {formatAddress(displayAddress)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {displayEmail && (
          <>
            <DropdownMenuItem disabled>
              <Mail className="h-4 w-4 mr-2" />
              {displayEmail}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem disabled>
          <Wallet className="h-4 w-4 mr-2" />
          {formatAddress(displayAddress)}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <span className="text-xs text-muted-foreground">
            Network: Sepolia
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
