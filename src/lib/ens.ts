import { normalize } from 'viem/ens';
import { Address, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { readContract } from '@wagmi/core';
import { config } from './wagmi';
import { publicClient } from './viemClient';

// ENS cache to reduce RPC calls
const ensCache = new Map<string, { address: Address | null; timestamp: number }>();
const reverseCache = new Map<Address, { name: string | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create a mainnet client specifically for ENS resolution
// ENS names are only on mainnet, even if the app uses testnet
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/demo'),
});

/**
 * Validate ENS name format
 */
export function isValidENSName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  
  // Must end with .eth
  if (!name.endsWith('.eth')) return false;
  
  // Remove .eth and check the rest
  const nameWithoutTld = name.slice(0, -4);
  
  // Name must not be empty
  if (nameWithoutTld.length === 0) return false;
  
  // Allow alphanumeric, hyphens, and dots (for subdomains)
  // But must start and end with alphanumeric
  const validNameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  
  return validNameRegex.test(nameWithoutTld);
}

/**
 * Normalize ENS name for consistency
 */
export function normalizeENSName(name: string): string | null {
  try {
    return normalize(name);
  } catch (error) {
    console.error('Error normalizing ENS name:', error);
    return null;
  }
}

/**
 * Resolve ENS name to address with caching
 */
export async function resolveENSName(ensName: string): Promise<Address | null> {
  if (!isValidENSName(ensName)) {
    console.warn(`Invalid ENS name: ${ensName}`);
    return null;
  }

  const normalizedName = normalizeENSName(ensName);
  if (!normalizedName) return null;

  // Check cache
  const cached = ensCache.get(normalizedName);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached address for ${normalizedName}`);
    return cached.address;
  }

  try {
    console.log(`Resolving ENS name: ${normalizedName}`);
    // Use mainnet client for ENS resolution
    const address = await mainnetClient.getEnsAddress({
      name: normalizedName,
    });

    // Update cache
    ensCache.set(normalizedName, {
      address: address || null,
      timestamp: Date.now(),
    });

    console.log(`Resolved ${normalizedName} to ${address}`);
    return address || null;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    // Try with a backup RPC if the demo endpoint fails
    try {
      const backupClient = createPublicClient({
        chain: mainnet,
        transport: http('https://cloudflare-eth.com'),
      });
      const address = await backupClient.getEnsAddress({
        name: normalizedName,
      });
      
      ensCache.set(normalizedName, {
        address: address || null,
        timestamp: Date.now(),
      });
      
      return address || null;
    } catch (backupError) {
      console.error('Backup ENS resolution also failed:', backupError);
      ensCache.set(normalizedName, {
        address: null,
        timestamp: Date.now(),
      });
      return null;
    }
  }
}

/**
 * Reverse resolve address to ENS name with caching
 */
export async function reverseResolveAddress(address: Address): Promise<string | null> {
  if (!address) return null;

  // Check cache
  const cached = reverseCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached ENS name for ${address}`);
    return cached.name;
  }

  try {
    console.log(`Reverse resolving address: ${address}`);
    // Use mainnet client for ENS resolution
    const name = await mainnetClient.getEnsName({
      address,
    });

    // Update cache
    reverseCache.set(address, {
      name: name || null,
      timestamp: Date.now(),
    });

    return name || null;
  } catch (error) {
    console.error('Error reverse resolving address:', error);
    reverseCache.set(address, {
      name: null,
      timestamp: Date.now(),
    });
    return null;
  }
}

/**
 * Get ENS avatar URL for a given ENS name
 */
export async function getENSAvatar(ensName: string): Promise<string | null> {
  if (!isValidENSName(ensName)) return null;

  const normalizedName = normalizeENSName(ensName);
  if (!normalizedName) return null;

  try {
    // Use mainnet client for ENS avatar
    const avatar = await mainnetClient.getEnsAvatar({
      name: normalizedName,
    });
    return avatar || null;
  } catch (error) {
    console.error('Error getting ENS avatar:', error);
    return null;
  }
}

/**
 * Batch resolve multiple ENS names
 */
export async function batchResolveENSNames(names: string[]): Promise<Map<string, Address | null>> {
  const results = new Map<string, Address | null>();
  
  // Process in parallel but with a limit to avoid rate limiting
  const BATCH_SIZE = 5;
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (name) => {
      const address = await resolveENSName(name);
      return { name, address };
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ name, address }) => {
      results.set(name, address);
    });
  }
  
  return results;
}

/**
 * Clear ENS cache (useful for testing or when data might be stale)
 */
export function clearENSCache() {
  ensCache.clear();
  reverseCache.clear();
  console.log('ENS cache cleared');
}

/**
 * Format address for display (shortened)
 */
export function formatAddress(address: Address): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get display name (ENS or shortened address)
 */
export async function getDisplayName(address: Address): Promise<string> {
  const ensName = await reverseResolveAddress(address);
  return ensName || formatAddress(address);
}
