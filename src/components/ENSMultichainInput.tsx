"use client";

import { useState, useEffect } from 'react';
import { useEnsAddress } from 'wagmi';
import { normalize } from 'viem/ens';
import { mainnet } from 'wagmi/chains';
import { Address } from 'viem';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  User,
  Globe,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { evmChainIdToCoinType } from '../hooks/useENSMultichain';

interface ENSMultichainInputProps {
  value: string;
  onChange: (value: string, addresses: AddressResult) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  showMultichain?: boolean;
  chains?: ChainConfig[];
}

interface ChainConfig {
  name: string;
  coinType: number;
  icon?: string;
}

interface AddressResult {
  primary: Address | null; // Ethereum address
  multichain?: Map<string, Address>; // Other chain addresses
}

const DEFAULT_CHAINS: ChainConfig[] = [
  { name: 'Bitcoin', coinType: 0, icon: '₿' },
  { name: 'Solana', coinType: 501, icon: '◎' },
  { name: 'Polygon', coinType: evmChainIdToCoinType(137), icon: '🟣' },
  { name: 'Base', coinType: evmChainIdToCoinType(8453), icon: '🔷' },
];

export function ENSMultichainInput({
  value,
  onChange,
  placeholder = "vitalik.eth or 0x...",
  className,
  label = "Recipient (Address or ENS)",
  required = false,
  showMultichain = false,
  chains = DEFAULT_CHAINS,
}: ENSMultichainInputProps) {
  const [input, setInput] = useState(value);
  const [normalizedName, setNormalizedName] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [showChains, setShowChains] = useState(false);
  const [resolvePressed, setResolvePressed] = useState(false);

  // Normalize ENS name when input changes
  useEffect(() => {
    const trimmed = input.trim();
    
    // Check if it's an Ethereum address
    if (trimmed.startsWith('0x') && trimmed.length === 42) {
      try {
        setIsValid(true);
        setNormalizedName(null);
        onChange(trimmed, { primary: trimmed as Address });
      } catch {
        setIsValid(false);
      }
      return;
    }

    // Check if it's an ENS name
    if (trimmed.endsWith('.eth')) {
      try {
        const normalized = normalize(trimmed);
        setNormalizedName(normalized);
        setIsValid(false); // Will be valid after resolution
      } catch (error) {
        console.error('Error normalizing ENS name:', error);
        setNormalizedName(null);
        setIsValid(false);
      }
    } else {
      setNormalizedName(null);
      setIsValid(false);
      onChange(trimmed, { primary: null });
    }
  }, [input]);

  // Primary Ethereum address resolution
  const { 
    data: ethAddress, 
    isLoading: ethLoading,
    error: ethError,
    refetch: refetchEth
  } = useEnsAddress({
    name: normalizedName || undefined,
    chainId: mainnet.id,
    enabled: !!normalizedName && resolvePressed,
  });

  // Optional: Fetch other chain addresses
  const { data: btcAddress } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: 0,
    chainId: mainnet.id,
    enabled: showMultichain && !!normalizedName && resolvePressed,
  });

  const { data: solAddress } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: 501,
    chainId: mainnet.id,
    enabled: showMultichain && !!normalizedName && resolvePressed,
  });

  // Update validity and call onChange when address is resolved
  useEffect(() => {
    if (ethAddress) {
      setIsValid(true);
      const multichain = new Map<string, Address>();
      if (btcAddress) multichain.set('Bitcoin', btcAddress as Address);
      if (solAddress) multichain.set('Solana', solAddress as Address);
      
      onChange(input, { 
        primary: ethAddress as Address,
        multichain: showMultichain ? multichain : undefined
      });
    } else if (normalizedName && !ethLoading && resolvePressed) {
      setIsValid(false);
      onChange(input, { primary: null });
    }
  }, [ethAddress, btcAddress, solAddress, ethLoading, normalizedName, resolvePressed]);

  const handleResolve = async () => {
    if (normalizedName) {
      setResolvePressed(true);
      refetchEth();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();
    setInput(newValue);
    setResolvePressed(false); // Reset resolve state when input changes
  };

  const getStatusIcon = () => {
    if (ethLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    if (isValid && (ethAddress || input.startsWith('0x'))) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (resolvePressed && !ethAddress && normalizedName) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-xl border-2 px-4 py-3 pr-10 transition-colors focus:outline-none",
              isValid && (ethAddress || input.startsWith('0x'))
                ? "border-green-500 focus:border-green-600"
                : resolvePressed && !ethAddress && normalizedName
                ? "border-red-500 focus:border-red-600"
                : "border-gray-200 focus:border-purple-500",
              className
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        
        {normalizedName && !ethAddress && !ethLoading && (
          <button
            type="button"
            onClick={handleResolve}
            disabled={ethLoading}
            className={cn(
              "px-4 py-3 rounded-xl font-medium transition-colors",
              "bg-purple-600 hover:bg-purple-700 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Resolve
          </button>
        )}
      </div>

      {/* Resolution Status */}
      {resolvePressed && !ethLoading && !ethAddress && normalizedName && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-600 font-medium">
                ENS name could not be resolved
              </p>
              <p className="text-xs text-red-500 mt-1">
                Make sure the ENS name is registered on Ethereum mainnet
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Result */}
      {ethAddress && isValid && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {input.startsWith('0x') ? 'Wallet Address' : 'ENS Name Resolved'}
                </div>
                <code className="text-xs text-gray-500">
                  {formatAddress(ethAddress)}
                </code>
              </div>
            </div>
            
            {showMultichain && (btcAddress || solAddress) && (
              <button
                type="button"
                onClick={() => setShowChains(!showChains)}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
              >
                <Globe className="h-3 w-3" />
                Multi-chain
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  showChains && "rotate-180"
                )} />
              </button>
            )}
          </div>
          
          {/* Multi-chain addresses */}
          {showMultichain && showChains && (btcAddress || solAddress) && (
            <div className="mt-3 pt-3 border-t border-green-200 space-y-2">
              {btcAddress && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span>₿</span> Bitcoin
                  </span>
                  <code className="text-gray-600">{formatAddress(btcAddress)}</code>
                </div>
              )}
              {solAddress && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span>◎</span> Solana
                  </span>
                  <code className="text-gray-600">{formatAddress(solAddress)}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {ethLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Resolving ENS name...</span>
        </div>
      )}

      {/* Help Text */}
      {!input && (
        <p className="text-xs text-gray-500">
          Enter an ENS name (e.g., vitalik.eth) or Ethereum address
        </p>
      )}
    </div>
  );
}
