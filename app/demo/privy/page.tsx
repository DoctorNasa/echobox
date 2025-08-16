'use client';

import { PrivyOnlyProvider } from '@/components/providers/PrivyOnlyProvider';
import { PrivyConnectWallet } from '@/components/demo/PrivyConnectWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PrivyDemoPage() {
  return (
    <PrivyOnlyProvider>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Demo Header */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
            Privy Authentication & Wallet
          </Badge>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Privy Integration Demo
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Demonstrate modern Web3 authentication with email + wallet integration for ETHGlobal judges
          </p>
        </div>

        {/* Prize Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>🏆</span>
              <span>Prize Category Target</span>
            </CardTitle>
            <CardDescription>
              This demo targets the Privy prize category with modern Web3 UX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Integration:</span>
                <span>Privy React SDK</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Authentication:</span>
                <span>Email + Multiple Wallets</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Features:</span>
                <span>Embedded Wallets, Smart Wallets</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Use Case:</span>
                <span>ENS GiftBox User Onboarding</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection Demo */}
        <PrivyConnectWallet />

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">SDK:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">@privy-io/react-auth</code>
              </div>
              <div>
                <span className="font-medium">Wagmi Integration:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">@privy-io/wagmi</code>
              </div>
              <div>
                <span className="font-medium">Key Features:</span>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>• Email-first authentication</li>
                  <li>• Multi-wallet support (MetaMask, Coinbase, etc.)</li>
                  <li>• Embedded wallet creation</li>
                  <li>• Smart wallet integration</li>
                  <li>• Seamless Web2 → Web3 onboarding</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Web3 UX Innovation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Web3 UX Innovation</CardTitle>
            <CardDescription>
              How Privy enhances ENS GiftBox user experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800">Email-First Onboarding</h4>
                <p className="text-sm text-purple-700">
                  Users can sign up with just email, removing Web3 barriers
                </p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <h4 className="font-medium text-pink-800">Embedded Wallets</h4>
                <p className="text-sm text-pink-700">
                  Automatic wallet creation for users without existing wallets
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Multi-Wallet Support</h4>
                <p className="text-sm text-blue-700">
                  Connect existing wallets (MetaMask, Coinbase, WalletConnect)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ENS GiftBox Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Smart Contract Deployed</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✅ Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>ENS Name Support</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✅ Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>PYUSD Token Support</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✅ Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>User Experience</span>
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  🚀 Enhanced
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <p className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
                Contract: 0xb5aa12ccb861827a0d2daf47082780247a6d254e • Network: Sepolia
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PrivyOnlyProvider>
  );
}
