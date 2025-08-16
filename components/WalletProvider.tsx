'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { sepolia } from 'viem/chains';
import { http } from 'viem';

interface WalletProviderProps {
  children: React.ReactNode;
}

// Create wagmi config
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

// Create query client
const queryClient = new QueryClient();

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clzerb9o8003nvtap1ykrtgmr'}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#9333ea', // Purple to match our theme
          logo: 'https://raw.githubusercontent.com/ethereum/ens-app-v3/main/public/android-chrome-192x192.png',
          walletList: [
            'coinbase_wallet',
            'metamask', 
            'wallet_connect',
            'rainbow',
            'phantom'
          ],
          showWalletLoginFirst: false, // Show email first, then wallet options
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          noPromptOnSignature: false,
        },
        externalWallets: {
          coinbaseWallet: {
            // Use smart wallets only for better UX and gasless transactions
            connectionOptions: 'smartWalletOnly'
          },
          metamask: {
            connectionOptions: 'all'
          }
        },
        // Enable smart wallets for better UX
        smartWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Customize the modal
        modalSize: 'compact',
        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
