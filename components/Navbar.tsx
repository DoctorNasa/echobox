"use client";

import React from "react";
import { Gift } from "lucide-react";
import { ConnectWallet } from "./ConnectWalletPrivy";

export function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-primary" />
            <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              EchoBox
            </h1>
            <span className="ml-2 text-sm text-muted-foreground hidden sm:inline">
              Time-locked crypto gifts with ENS
            </span>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </nav>
  );
}
