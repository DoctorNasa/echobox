'use client';

import React from 'react';
import { useCoinbaseWallet } from '../providers/CoinbaseWalletProvider';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function CoinbaseConnectWallet() {
  const { wallet, connect, disconnect } = useCoinbaseWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Coinbase Smart Wallet</CardTitle>
              <CardDescription>Demo for ETHGlobal Judges</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex items-center space-x-2">
              {wallet.isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-600">Connecting...</span>
                </>
              ) : wallet.isConnected ? (
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

          {/* Wallet Info */}
          {wallet.isConnected && wallet.address && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium">Address:</span>
                <code className="text-sm font-mono text-green-700">
                  {formatAddress(wallet.address)}
                </code>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span className="text-sm font-medium">Network:</span>
                <span className="text-sm text-blue-700">Sepolia Testnet</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {wallet.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{wallet.error}</p>
            </div>
          )}

          {/* Connect/Disconnect Button */}
          <div className="pt-4">
            {wallet.isConnected ? (
              <Button
                onClick={disconnect}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Wallet className="mr-2 h-5 w-5" />
                Disconnect Wallet
              </Button>
            ) : (
              <Button
                onClick={connect}
                disabled={wallet.isConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {wallet.isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Coinbase Wallet
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
            <li>✅ Smart Wallet Integration</li>
            <li>✅ Sepolia Testnet</li>
            <li>✅ Auto Network Switching</li>
            <li>✅ ENS GiftBox Compatible</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
