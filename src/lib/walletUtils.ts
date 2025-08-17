import { disconnect } from '@wagmi/core';
import { config } from './wagmi';
import { clearAssetCache } from './walletAssets';

/**
 * Wallet utility functions for connection management
 */

// Storage keys for persisted data
const WALLET_STORAGE_KEYS = {
  RECENT_WALLET: 'recentWallet',
  WALLET_PREFERENCES: 'walletPreferences',
  CONNECTION_HISTORY: 'connectionHistory',
} as const;

/**
 * Interface for wallet session data
 */
export interface WalletSession {
  address: string;
  chainId: number;
  connectedAt: Date;
  connector?: string;
}

/**
 * Interface for disconnect options
 */
export interface DisconnectOptions {
  clearCache?: boolean;
  clearLocalStorage?: boolean;
  redirectTo?: string;
  showNotification?: boolean;
}

/**
 * Complete wallet disconnect/sign-out function
 * Handles all cleanup operations when disconnecting a wallet
 */
export async function disconnectWallet(options: DisconnectOptions = {}): Promise<void> {
  const {
    clearCache = true,
    clearLocalStorage = true,
    showNotification = true,
  } = options;

  try {
    // 1. Disconnect from wagmi
    await disconnect(config);

    // 2. Clear asset cache if requested
    if (clearCache) {
      clearAssetCache();
    }

    // 3. Clear local storage if requested
    if (clearLocalStorage) {
      clearWalletStorage();
    }

    // 4. Clear session storage
    clearSessionStorage();

    // 5. Log the disconnect event
    logDisconnectEvent();

    // Return success
    return Promise.resolve();
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw new Error('Failed to disconnect wallet properly');
  }
}

/**
 * Clear wallet-related data from localStorage
 */
export function clearWalletStorage(): void {
  try {
    // Clear specific wallet keys
    Object.values(WALLET_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear wagmi-related storage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('wagmi') || 
      key.startsWith('privy') ||
      key.startsWith('wallet')
    );

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing wallet storage:', error);
  }
}

/**
 * Clear session storage
 */
export function clearSessionStorage(): void {
  try {
    // Clear session-specific data
    const keysToRemove = Object.keys(sessionStorage).filter(key =>
      key.startsWith('wagmi') || 
      key.startsWith('privy') ||
      key.startsWith('wallet')
    );

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing session storage:', error);
  }
}

/**
 * Save wallet session information
 */
export function saveWalletSession(session: WalletSession): void {
  try {
    const history = getConnectionHistory();
    history.push({
      ...session,
      connectedAt: new Date(),
    });

    // Keep only last 10 connections
    if (history.length > 10) {
      history.shift();
    }

    localStorage.setItem(
      WALLET_STORAGE_KEYS.CONNECTION_HISTORY,
      JSON.stringify(history)
    );

    // Save as recent wallet
    localStorage.setItem(
      WALLET_STORAGE_KEYS.RECENT_WALLET,
      session.address
    );
  } catch (error) {
    console.error('Error saving wallet session:', error);
  }
}

/**
 * Get connection history
 */
export function getConnectionHistory(): WalletSession[] {
  try {
    const history = localStorage.getItem(WALLET_STORAGE_KEYS.CONNECTION_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting connection history:', error);
    return [];
  }
}

/**
 * Get recent wallet address
 */
export function getRecentWallet(): string | null {
  try {
    return localStorage.getItem(WALLET_STORAGE_KEYS.RECENT_WALLET);
  } catch (error) {
    console.error('Error getting recent wallet:', error);
    return null;
  }
}

/**
 * Log disconnect event for analytics
 */
function logDisconnectEvent(): void {
  try {
    const event = {
      type: 'wallet_disconnected',
      timestamp: new Date().toISOString(),
      // Add any additional analytics data here
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Wallet disconnect event:', event);
    }

    // You can add analytics service calls here
    // e.g., analytics.track('wallet_disconnected', event);
  } catch (error) {
    console.error('Error logging disconnect event:', error);
  }
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  try {
    // Check wagmi storage
    const wagmiStore = localStorage.getItem('wagmi.store');
    if (wagmiStore) {
      const store = JSON.parse(wagmiStore);
      return store?.state?.connections?.size > 0;
    }
    return false;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
}

/**
 * Get current connected wallet info
 */
export function getConnectedWalletInfo(): { address: string; chainId: number } | null {
  try {
    const wagmiStore = localStorage.getItem('wagmi.store');
    if (wagmiStore) {
      const store = JSON.parse(wagmiStore);
      const account = store?.state?.current;
      if (account) {
        return {
          address: account,
          chainId: store?.state?.chainId || 1,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting wallet info:', error);
    return null;
  }
}
