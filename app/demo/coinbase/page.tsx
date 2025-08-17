"use client";

import { CoinbaseWalletProvider } from "@/components/providers/CoinbaseWalletProvider";
import { CoinbaseConnectWallet } from "@/components/demo/CoinbaseConnectWallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CoinbaseDemoPage() {
  return (
    <CoinbaseWalletProvider>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Demo Header */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Coinbase Smart Wallet Integration
          </Badge>
          <h1 className="text-3xl font-bold">Coinbase Wallet Demo</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Demonstrate Coinbase Smart Wallet integration with EchoBox for
            ETHGlobal judges
          </p>
        </div>

        {/* Prize Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>🏆</span>
              <span>Prize Category</span>
            </CardTitle>
            <CardDescription>
              This demo showcases our integration for potential wallet-related
              prizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Integration:</span>
                <span>Coinbase Smart Wallet SDK</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Network:</span>
                <span>Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Features:</span>
                <span>Smart Wallet, Auto-switching</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Use Case:</span>
                <span>EchoBox Wallet Connection</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection Demo */}
        <CoinbaseConnectWallet />

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">SDK:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                  @coinbase/wallet-sdk
                </code>
              </div>
              <div>
                <span className="font-medium">Configuration:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                  smartWalletOnly: true
                </code>
              </div>
              <div>
                <span className="font-medium">Features:</span>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>• Isolated provider context</li>
                  <li>• Automatic network switching</li>
                  <li>• Smart wallet prioritization</li>
                  <li>• EchoBox integration ready</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">EchoBox Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Smart Contract Deployed</span>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  ✅ Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>ENS Name Support</span>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  ✅ Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>PYUSD Token Support</span>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  ✅ Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Time-locked Gifts</span>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  ✅ Ready
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                Contract Address:{" "}
                <code>0xb5aa12ccb861827a0d2daf47082780247a6d254e</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CoinbaseWalletProvider>
  );
}
