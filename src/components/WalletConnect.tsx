"use client";

import React from 'react';
import { useWalletManager } from '../hooks/useWalletManager';
import { usePrivy } from '@privy-io/react-auth';
import { 
  Wallet, 
  ChevronDown, 
  LogOut, 
  Copy, 
  ExternalLink,
  RefreshCw,
  User,
  Settings,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface WalletConnectProps {
  className?: string;
  variant?: 'default' | 'compact' | 'full';
}

export function WalletConnect({ 
  className, 
  variant = 'default' 
}: WalletConnectProps) {
  const { ready, authenticated, login } = usePrivy();
  const {
    address,
    isConnected,
    isDisconnecting,
    chainId,
    displayName,
    formattedAddress,
    disconnect,
    switchWallet,
    reconnectRecent,
    recentWallet,
  } = useWalletManager();

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Copy address to clipboard
  const copyAddress = React.useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  }, [address]);

  // Open explorer
  const openExplorer = React.useCallback(() => {
    if (address) {
      const explorerUrl = chainId === 1 
        ? `https://etherscan.io/address/${address}`
        : `https://sepolia.etherscan.io/address/${address}`;
      window.open(explorerUrl, '_blank');
    }
  }, [address, chainId]);

  // Loading state
  if (!ready) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl",
          "bg-gray-100 text-gray-400 cursor-not-allowed",
          className
        )}
      >
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </button>
    );
  }

  // Not connected state
  if (!authenticated || !isConnected || !address) {
    return (
      <div className="flex items-center gap-2">
        {recentWallet && (
          <button
            onClick={reconnectRecent}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl",
              "border border-gray-200 hover:bg-gray-50 transition-colors",
              "text-sm text-gray-600",
              className
            )}
            title="Reconnect to recent wallet"
          >
            <History className="h-4 w-4" />
            Recent
          </button>
        )}
        <button
          onClick={login}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl",
            "bg-gradient-to-r from-purple-600 to-pink-600",
            "hover:from-purple-700 hover:to-pink-700",
            "text-white font-medium transition-all",
            "shadow-sm hover:shadow-md",
            className
          )}
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </button>
      </div>
    );
  }

  // Connected state - Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={() => disconnect()}
        disabled={isDisconnecting}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl",
          "border border-gray-200 hover:border-red-300",
          "hover:bg-red-50 transition-colors group",
          isDisconnecting && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <Wallet className="h-4 w-4" />
        <span className="font-mono text-sm">{formattedAddress}</span>
        <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
      </button>
    );
  }

  // Connected state - Default/Full variant with dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl",
          "border border-gray-200 hover:bg-gray-50 transition-colors",
          "min-w-[160px]",
          className
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Wallet className="h-4 w-4 text-purple-600" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <div className="text-left">
            {variant === 'full' && displayName !== formattedAddress && (
              <div className="text-xs text-gray-500">{displayName}</div>
            )}
            <div className="font-mono text-sm">{formattedAddress}</div>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform",
          isDropdownOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Menu */}
          <div className={cn(
            "absolute right-0 mt-2 w-64 z-50",
            "bg-white rounded-xl border border-gray-200 shadow-lg",
            "divide-y divide-gray-100",
            "animate-in fade-in-0 zoom-in-95"
          )}>
            {/* Account Info */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {chainId === 1 ? 'Ethereum' : 'Sepolia Testnet'}
                  </div>
                </div>
              </div>
              
              {/* Address with copy */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <code className="text-xs flex-1">{address}</code>
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy address"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => {
                  openExplorer();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span className="text-sm">View on Explorer</span>
              </button>

              <button
                onClick={() => {
                  switchWallet();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <RefreshCw className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Switch Wallet</span>
              </button>

              <button
                onClick={() => {
                  // Add settings navigation here
                  toast.info('Settings coming soon!');
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Settings</span>
              </button>
            </div>

            {/* Disconnect */}
            <div className="p-2">
              <button
                onClick={() => {
                  disconnect();
                  setIsDropdownOpen(false);
                }}
                disabled={isDisconnecting}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  "hover:bg-red-50 hover:text-red-600 transition-colors text-left",
                  "text-red-500",
                  isDisconnecting && "opacity-50 cursor-not-allowed"
                )}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
