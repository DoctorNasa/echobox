// ENS Resolution Utilities

/**
 * Resolves an ENS name to an Ethereum address
 * In production, this would use ethers.js or wagmi hooks
 */
export async function resolveENS(ensName: string): Promise<string | null> {
  if (!ensName.endsWith('.eth')) {
    return null;
  }
  
  try {
    // Mock ENS resolution for development
    const mockAddresses: Record<string, string> = {
      'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      'test.eth': '0x742d35Cc6cC00532e7D9A0f7e3B1234567890123',
    };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockAddresses[ensName.toLowerCase()] || null;
  } catch (error) {
    console.error('ENS resolution failed:', error);
    return null;
  }
}

/**
 * Validates if a string is a valid ENS name
 */
export function isValidENS(name: string): boolean {
  return /^[a-zA-Z0-9-]+\.eth$/.test(name);
}

/**
 * Validates if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Resolves either ENS name or address to a valid address
 */
export async function resolveRecipient(input: string): Promise<{
  address: string | null;
  isENS: boolean;
  error?: string;
}> {
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    return { address: null, isENS: false, error: 'Please enter an address or ENS name' };
  }
  
  // Check if it's already a valid address
  if (isValidAddress(trimmedInput)) {
    return { address: trimmedInput, isENS: false };
  }
  
  // Check if it's an ENS name
  if (isValidENS(trimmedInput)) {
    const resolvedAddress = await resolveENS(trimmedInput);
    if (resolvedAddress) {
      return { address: resolvedAddress, isENS: true };
    } else {
      return { address: null, isENS: true, error: 'ENS name could not be resolved' };
    }
  }
  
  return { address: null, isENS: false, error: 'Invalid address or ENS name format' };
}