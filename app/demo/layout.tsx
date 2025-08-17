import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";

export const metadata: Metadata = {
  title: "EchoBox - Wallet Demos",
  description: "Wallet integration demos for ETHGlobal judges",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Demo Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Main App</span>
              </Link>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Gift className="h-6 w-6 text-purple-600" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  EchoBox
                </h1>
                <span className="text-sm text-gray-500">Demo Pages</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">ETHGlobal NY</div>
              <div className="text-xs text-purple-600 font-medium">
                Judge Demo
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Content */}
      <main className="container mx-auto px-4 py-12">{children}</main>

      {/* Demo Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/90 backdrop-blur-sm border rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center space-x-4 text-sm">
            <Link
              href="/demo/coinbase"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Coinbase Demo
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <Link
              href="/demo/privy"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Privy Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
