'use client';

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Wallet, CheckCircle, AlertCircle, Mail, User, Loader2 } from 'lucide-react';

export function PrivyConnectWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address, isConnected } = useAccount();

  const displayAddress = address || user?.wallet?.address;
  const displayEmail = user?.email?.address;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Privy Authentication</CardTitle>
              <CardDescription>Demo for ETHGlobal Judges</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex items-center space-x-2">
              {!ready ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-purple-600">Loading...</span>
                </>
              ) : authenticated && displayAddress ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          {authenticated && (
            <div className="space-y-2">
              {displayEmail && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm text-purple-700">{displayEmail}</span>
                </div>
              )}
              
              {displayAddress && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <span className="text-sm font-medium">Wallet:</span>
                  <code className="text-sm font-mono text-green-700">
                    {formatAddress(displayAddress)}
                  </code>
                </div>
              )}
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span className="text-sm font-medium">Network:</span>
                <span className="text-sm text-blue-700">Sepolia Testnet</span>
              </div>
            </div>
          )}

          {/* Connect/Disconnect Button */}
          <div className="pt-4">
            {authenticated ? (
              <Button
                onClick={logout}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <User className="mr-2 h-5 w-5" />
                Logout
              </Button>
            ) : (
              <Button
                onClick={login}
                disabled={!ready}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {!ready ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect with Privy
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demo Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Demo Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>✅ Email + Wallet Authentication</li>
            <li>✅ Embedded Wallet Creation</li>
            <li>✅ Smart Wallet Support</li>
            <li>✅ Multi-Wallet Connection</li>
            <li>✅ ENS GiftBox Integration</li>
          </ul>
        </CardContent>
      </Card>

      {/* Login Options Info */}
      {!authenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Login Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>Email</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wallet className="h-3 w-3" />
                <span>MetaMask</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wallet className="h-3 w-3" />
                <span>Coinbase</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wallet className="h-3 w-3" />
                <span>WalletConnect</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
