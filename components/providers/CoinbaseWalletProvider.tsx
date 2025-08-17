"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import { sepolia } from "viem/chains";

interface WalletState {
  isConnected: boolean;
  address?: string;
  isConnecting: boolean;
  error?: string;
}

interface CoinbaseWalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const CoinbaseWalletContext = createContext<CoinbaseWalletContextType | null>(
  null,
);

interface CoinbaseWalletProviderProps {
  children: React.ReactNode;
}

export function CoinbaseWalletProvider({
  children,
}: CoinbaseWalletProviderProps) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

  const [coinbaseWallet, setCoinbaseWallet] = useState<any>(null);

  useEffect(() => {
    // Initialize Coinbase Wallet SDK
    const sdk = new CoinbaseWalletSDK({
      appName: "EchoBox",
      appLogoUrl:
        "https://i.postimg.cc/VzYzhXL8/Chat-GPT-Image-16-2568-16-43-31.png",
    });

    const provider = sdk.makeWeb3Provider({
      options: "smartWalletOnly", // Use smart wallet only for demo
    });

    setCoinbaseWallet(provider);

    // Check if already connected
    provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const accountsArray = accounts as string[];
        if (accountsArray.length > 0) {
          setWallet({
            isConnected: true,
            address: accountsArray[0],
            isConnecting: false,
          });
        }
      })
      .catch(console.error);

    // Listen for account changes
    provider.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        setWallet({
          isConnected: true,
          address: accounts[0],
          isConnecting: false,
        });
      } else {
        setWallet({
          isConnected: false,
          isConnecting: false,
        });
      }
    });

    // Listen for chain changes
    provider.on("chainChanged", (chainId: string) => {
      console.log("Chain changed:", chainId);
    });

    return () => {
      provider.removeAllListeners();
    };
  }, []);

  const connect = async () => {
    if (!coinbaseWallet) return;

    try {
      setWallet((prev) => ({ ...prev, isConnecting: true, error: undefined }));

      // Request account access
      const accounts = await coinbaseWallet.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        // Switch to Sepolia network
        try {
          await coinbaseWallet.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${sepolia.id.toString(16)}` }],
          });
        } catch (switchError: any) {
          // If chain doesn't exist, add it
          if (switchError.code === 4902) {
            await coinbaseWallet.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${sepolia.id.toString(16)}`,
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            });
          }
        }

        setWallet({
          isConnected: true,
          address: accounts[0],
          isConnecting: false,
        });
      }
    } catch (error: any) {
      console.error("Failed to connect:", error);
      setWallet({
        isConnected: false,
        isConnecting: false,
        error: error.message || "Failed to connect wallet",
      });
    }
  };

  const disconnect = () => {
    if (coinbaseWallet) {
      coinbaseWallet.disconnect();
    }
    setWallet({
      isConnected: false,
      isConnecting: false,
    });
  };

  const value = {
    wallet,
    connect,
    disconnect,
  };

  return (
    <CoinbaseWalletContext.Provider value={value}>
      {children}
    </CoinbaseWalletContext.Provider>
  );
}

export const useCoinbaseWallet = () => {
  const context = useContext(CoinbaseWalletContext);
  if (!context) {
    throw new Error(
      "useCoinbaseWallet must be used within CoinbaseWalletProvider",
    );
  }
  return context;
};
