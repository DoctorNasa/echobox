import { useCallback, useEffect, useState } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { 
  disconnectWallet, 
  saveWalletSession, 
  getRecentWallet,
  type DisconnectOptions,
  type WalletSession 
} from '../lib/walletUtils';
import { clearAssetCache } from '../lib/walletAssets';

/**
 * Hook for comprehensive wallet management
 */
export function useWalletManager() {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { logout: privyLogout, authenticated, user } = usePrivy();
  
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [recentWallet, setRecentWallet] = useState<string | null>(null);

  // Load recent wallet on mount
  useEffect(() => {
    const recent = getRecentWallet();
    setRecentWallet(recent);
  }, []);

  // Save session when connected
  useEffect(() => {
    if (isConnected && address && chainId) {
      const session: WalletSession = {
        address,
        chainId,
        connectedAt: new Date(),
        connector: connector?.name,
      };
      saveWalletSession(session);
    }
  }, [isConnected, address, chainId, connector]);

  /**
   * Enhanced disconnect function with cleanup
   */
  const disconnect = useCallback(async (options: DisconnectOptions = {}) => {
    setIsDisconnecting(true);
    
    try {
      // Show loading toast
      const toastId = toast.loading('Disconnecting wallet...');

      // If using Privy, logout through Privy
      if (authenticated && privyLogout) {
        await privyLogout();
      } else {
        // Use wagmi disconnect
        wagmiDisconnect();
      }

      // Perform additional cleanup
      await disconnectWallet({
        clearCache: true,
        clearLocalStorage: true,
        ...options,
      });

      // Clear asset cache
      clearAssetCache();

      // Update toast
      toast.success('Wallet disconnected successfully', { id: toastId });

      // Optional redirect
      if (options.redirectTo) {
        window.location.href = options.redirectTo;
      }

    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    } finally {
      setIsDisconnecting(false);
    }
  }, [authenticated, privyLogout, wagmiDisconnect]);

  /**
   * Quick reconnect to recent wallet
   */
  const reconnectRecent = useCallback(async () => {
    if (!recentWallet || !connectors.length) {
      toast.error('No recent wallet found');
      return;
    }

    try {
      const toastId = toast.loading('Reconnecting to wallet...');
      
      // Try to connect with the first available connector
      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
        toast.success('Wallet reconnected', { id: toastId });
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      toast.error('Failed to reconnect wallet');
    }
  }, [recentWallet, connectors, connect]);

  /**
   * Switch wallet (disconnect current and open connection modal)
   */
  const switchWallet = useCallback(async () => {
    try {
      // First disconnect current wallet
      await disconnect({ clearCache: false, clearLocalStorage: false });
      
      // Small delay to ensure disconnect completes
      setTimeout(() => {
        // Open connection modal (this depends on your setup)
        // For Privy:
        if (window.Privy) {
          window.Privy.login();
        }
        // For wagmi, you'd trigger your connection UI
      }, 100);
    } catch (error) {
      console.error('Error switching wallet:', error);
      toast.error('Failed to switch wallet');
    }
  }, [disconnect]);

  /**
   * Format wallet address for display
   */
  const formatAddress = useCallback((addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  /**
   * Get wallet display name (ENS, email, or formatted address)
   */
  const getDisplayName = useCallback(() => {
    // If using Privy and has email
    if (user?.email?.address) {
      return user.email.address;
    }
    
    // TODO: Add ENS resolution here if needed
    // const ensName = useEnsName({ address });
    
    // Fallback to formatted address
    return address ? formatAddress(address) : '';
  }, [user, address, formatAddress]);

  return {
    // State
    address,
    isConnected,
    isDisconnecting,
    chainId,
    connector: connector?.name,
    recentWallet,
    displayName: getDisplayName(),
    formattedAddress: address ? formatAddress(address) : '',
    
    // Actions
    disconnect,
    reconnectRecent,
    switchWallet,
    
    // Utilities
    formatAddress,
  };
}

// Type exports for external use
export type { DisconnectOptions, WalletSession } from '../lib/walletUtils';
