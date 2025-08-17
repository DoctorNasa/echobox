"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { http } from "viem";

interface PrivyOnlyProviderProps {
  children: React.ReactNode;
}

// Create wagmi config for Privy demo
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

// Create query client for Privy demo
const queryClient = new QueryClient();

export function PrivyOnlyProvider({ children }: PrivyOnlyProviderProps) {
  return (
    <PrivyProvider
      appId={
        process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmeegzyir01tyl90b0vc99msz"
      }
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#9333ea", // Purple to match EchoBox theme
          logo: "https://raw.githubusercontent.com/ethereum/ens-app-v3/main/public/android-chrome-192x192.png",
          walletList: [
            "metamask",
            "wallet_connect",
            "coinbase_wallet",
            "rainbow",
          ],
          showWalletLoginFirst: false, // Show email first for demo
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          noPromptOnSignature: false,
        },
        smartWallets: {
          createOnLogin: "users-without-wallets",
        },
        modalSize: "compact",
        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
