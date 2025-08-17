import { Address } from 'viem';

export interface BulkGiftEntry {
  id: string;
  recipient: string; // Can be address or ENS name
  resolvedAddress?: Address; // Resolved address after validation
  amount: string; // Amount in ETH or tokens
  unlockDate: string; // ISO date string
  message?: string;
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'sending' | 'sent' | 'failed';
  error?: string;
  txHash?: string;
}

export interface BulkGiftSummary {
  totalRecipients: number;
  totalAmount: string;
  estimatedGas: string;
  validEntries: number;
  invalidEntries: number;
  currency: 'ETH' | 'USDC' | 'PYUSD' | string;
}

export interface CSVParseResult {
  success: boolean;
  entries: BulkGiftEntry[];
  errors: string[];
  warnings: string[];
}

export interface BulkGiftConfig {
  maxRecipients: number;
  defaultUnlockHours: number;
  defaultMessage: string;
  allowPartialFailure: boolean;
  batchSize: number;
}

export const DEFAULT_BULK_CONFIG: BulkGiftConfig = {
  maxRecipients: 100,
  defaultUnlockHours: 24,
  defaultMessage: 'A special gift for you!',
  allowPartialFailure: true,
  batchSize: 10,
};

// CSV column mappings
export const CSV_COLUMNS = {
  RECIPIENT: ['recipient', 'address', 'wallet', 'ens', 'to'],
  AMOUNT: ['amount', 'value', 'quantity', 'eth'],
  UNLOCK_DATE: ['unlock_date', 'unlock', 'date', 'when'],
  MESSAGE: ['message', 'note', 'memo', 'description'],
} as const;

// Example CSV template
export const CSV_TEMPLATE = `recipient,amount,unlock_date,message
vitalik.eth,0.01,2025-02-14,Happy Valentine's Day!
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0,0.02,2025-03-01,Thank you for being a loyal customer
alice.eth,0.015,2025-02-14,Enjoy your special gift
bob.eth,0.01,2025-02-20,Coffee on us!`;

export const CSV_TEMPLATE_HEADERS = 'recipient,amount,unlock_date,message';
