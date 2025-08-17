"use client";

import { useState } from 'react';
import { useEnsAddress } from 'wagmi';
import { normalize } from 'viem/ens';
import { arbitrum, base, optimism, polygon, mainnet } from 'wagmi/chains';
import { 
  Globe, 
  Wallet, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// Helper function to convert EVM chain ID to coin type (ENSIP-11)
const evmChainIdToCoinType = (chainId: number) => {
  return (0x80000000 | chainId) >>> 0;
};

// Coin types based on SLIP-0044 and ENSIP-9
const COIN_TYPES = {
  BITCOIN: 0,
  LITECOIN: 2,
  DOGECOIN: 3,
  ETHEREUM: 60,
  ETHEREUM_CLASSIC: 61,
  ROOTSTOCK: 137,
  RIPPLE: 144,
  BITCOIN_CASH: 145,
  BINANCE: 714,
  SOLANA: 501,
  POLYGON: evmChainIdToCoinType(polygon.id),
  OPTIMISM: evmChainIdToCoinType(optimism.id),
  ARBITRUM: evmChainIdToCoinType(arbitrum.id),
  BASE: evmChainIdToCoinType(base.id),
} as const;

// Chain configurations
const SUPPORTED_CHAINS = [
  { 
    name: 'Ethereum', 
    coinType: COIN_TYPES.ETHEREUM, 
    icon: '⟠',
    explorer: 'https://etherscan.io/address/'
  },
  { 
    name: 'Bitcoin', 
    coinType: COIN_TYPES.BITCOIN, 
    icon: '₿',
    explorer: 'https://www.blockchain.com/btc/address/'
  },
  { 
    name: 'Solana', 
    coinType: COIN_TYPES.SOLANA, 
    icon: '◎',
    explorer: 'https://solscan.io/account/'
  },
  { 
    name: 'Polygon', 
    coinType: COIN_TYPES.POLYGON, 
    icon: '🟣',
    explorer: 'https://polygonscan.com/address/'
  },
  { 
    name: 'Arbitrum', 
    coinType: COIN_TYPES.ARBITRUM, 
    icon: '🔵',
    explorer: 'https://arbiscan.io/address/'
  },
  { 
    name: 'Base', 
    coinType: COIN_TYPES.BASE, 
    icon: '🔷',
    explorer: 'https://basescan.org/address/'
  },
  { 
    name: 'Optimism', 
    coinType: COIN_TYPES.OPTIMISM, 
    icon: '🔴',
    explorer: 'https://optimistic.etherscan.io/address/'
  },
];

interface AddressResult {
  chain: string;
  address: string | undefined;
  coinType: number;
  icon: string;
  explorer: string;
}

export function ENSResolver() {
  const [ensName, setEnsName] = useState('');
  const [normalizedName, setNormalizedName] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Normalize ENS name when input changes
  const handleNameChange = (value: string) => {
    setEnsName(value);
    try {
      if (value && value.endsWith('.eth')) {
        const normalized = normalize(value);
        setNormalizedName(normalized);
      } else {
        setNormalizedName(null);
      }
    } catch (error) {
      console.error('Error normalizing ENS name:', error);
      setNormalizedName(null);
    }
  };

  // Ethereum address (default)
  const { 
    data: ethAddress, 
    isLoading: ethLoading,
    error: ethError 
  } = useEnsAddress({
    name: normalizedName || undefined,
    chainId: mainnet.id,
  });

  // Bitcoin address
  const { 
    data: btcAddress, 
    isLoading: btcLoading 
  } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: COIN_TYPES.BITCOIN,
    chainId: mainnet.id,
  });

  // Solana address
  const { 
    data: solAddress, 
    isLoading: solLoading 
  } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: COIN_TYPES.SOLANA,
    chainId: mainnet.id,
  });

  // Polygon address
  const { 
    data: polyAddress, 
    isLoading: polyLoading 
  } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: COIN_TYPES.POLYGON,
    chainId: mainnet.id,
  });

  // Arbitrum address
  const { 
    data: arbAddress, 
    isLoading: arbLoading 
  } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: COIN_TYPES.ARBITRUM,
    chainId: mainnet.id,
  });

  // Base address
  const { 
    data: baseAddress, 
    isLoading: baseLoading 
  } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: COIN_TYPES.BASE,
    chainId: mainnet.id,
  });

  // Optimism address
  const { 
    data: opAddress, 
    isLoading: opLoading 
  } = useEnsAddress({
    name: normalizedName || undefined,
    coinType: COIN_TYPES.OPTIMISM,
    chainId: mainnet.id,
  });

  // Combine all results
  const allAddresses: AddressResult[] = [
    { 
      chain: 'Ethereum', 
      address: ethAddress, 
      coinType: COIN_TYPES.ETHEREUM,
      icon: '⟠',
      explorer: 'https://etherscan.io/address/'
    },
    { 
      chain: 'Bitcoin', 
      address: btcAddress, 
      coinType: COIN_TYPES.BITCOIN,
      icon: '₿',
      explorer: 'https://www.blockchain.com/btc/address/'
    },
    { 
      chain: 'Solana', 
      address: solAddress, 
      coinType: COIN_TYPES.SOLANA,
      icon: '◎',
      explorer: 'https://solscan.io/account/'
    },
    { 
      chain: 'Polygon', 
      address: polyAddress, 
      coinType: COIN_TYPES.POLYGON,
      icon: '🟣',
      explorer: 'https://polygonscan.com/address/'
    },
    { 
      chain: 'Arbitrum', 
      address: arbAddress, 
      coinType: COIN_TYPES.ARBITRUM,
      icon: '🔵',
      explorer: 'https://arbiscan.io/address/'
    },
    { 
      chain: 'Base', 
      address: baseAddress, 
      coinType: COIN_TYPES.BASE,
      icon: '🔷',
      explorer: 'https://basescan.org/address/'
    },
    { 
      chain: 'Optimism', 
      address: opAddress, 
      coinType: COIN_TYPES.OPTIMISM,
      icon: '🔴',
      explorer: 'https://optimistic.etherscan.io/address/'
    },
  ];

  const isLoading = ethLoading || btcLoading || solLoading || polyLoading || 
                    arbLoading || baseLoading || opLoading;

  const hasAnyAddress = allAddresses.some(a => a.address);

  const copyAddress = (address: string, chain: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success(`${chain} address copied to clipboard`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const openExplorer = (address: string, explorer: string) => {
    window.open(`${explorer}${address}`, '_blank');
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          ENS Multi-Chain Resolver
        </h1>
        <p className="text-gray-600">
          Resolve ENS names to addresses across multiple blockchains
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ENS Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={ensName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="vitalik.eth"
            className={cn(
              "w-full px-4 py-3 pr-10 rounded-xl border-2 transition-colors focus:outline-none",
              normalizedName && hasAnyAddress
                ? "border-green-500 focus:border-green-600"
                : normalizedName && !hasAnyAddress && !isLoading
                ? "border-orange-500 focus:border-orange-600"
                : "border-gray-200 focus:border-purple-500"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
            {!isLoading && normalizedName && hasAnyAddress && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {!isLoading && normalizedName && !hasAnyAddress && (
              <XCircle className="h-5 w-5 text-orange-500" />
            )}
          </div>
        </div>
        {normalizedName && normalizedName !== ensName && (
          <p className="mt-2 text-xs text-gray-500">
            Normalized: {normalizedName}
          </p>
        )}
      </div>

      {/* Results */}
      {normalizedName && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resolved Addresses</h3>
              {hasAnyAddress && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                >
                  {showAll ? 'Show Less' : 'Show All Chains'}
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    showAll && "rotate-180"
                  )} />
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Primary Ethereum Address */}
            {ethAddress && (
              <div className="p-4 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">⟠</div>
                    <div>
                      <div className="font-medium">Ethereum (Primary)</div>
                      <code className="text-sm text-gray-600">
                        {formatAddress(ethAddress)}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyAddress(ethAddress, 'Ethereum')}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Copy address"
                    >
                      {copiedAddress === ethAddress ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => openExplorer(ethAddress, 'https://etherscan.io/address/')}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Other Chain Addresses */}
            {(showAll ? allAddresses : allAddresses.filter(a => a.address && a.chain !== 'Ethereum'))
              .map((result) => {
                if (!result.address || result.chain === 'Ethereum') return null;
                
                return (
                  <div key={result.chain} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{result.icon}</div>
                        <div>
                          <div className="font-medium">{result.chain}</div>
                          <code className="text-sm text-gray-600">
                            {formatAddress(result.address)}
                          </code>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Coin Type: {result.coinType}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyAddress(result.address!, result.chain)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === result.address ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => openExplorer(result.address!, result.explorer)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View on explorer"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* No addresses found */}
            {!hasAnyAddress && !isLoading && (
              <div className="p-8 text-center">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No addresses found for this ENS name
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  This ENS name may not have addresses configured
                </p>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="p-8 text-center">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">
                  Resolving addresses...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ About ENS Multi-Chain Resolution</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• ENS names can store addresses for multiple blockchains</li>
          <li>• Uses ENSIP-9 (SLIP-0044 coin types) for non-Ethereum chains</li>
          <li>• Uses ENSIP-11 for EVM-compatible chains</li>
          <li>• All resolution happens on Ethereum mainnet</li>
        </ul>
      </div>
    </div>
  );
}
