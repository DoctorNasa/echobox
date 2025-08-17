import { isAddress } from 'viem';
import { 
  BulkGiftEntry, 
  CSVParseResult, 
  CSV_COLUMNS,
  DEFAULT_BULK_CONFIG 
} from '../types/bulkGift';

/**
 * Parse CSV content into bulk gift entries
 */
export function parseCSV(csvContent: string): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entries: BulkGiftEntry[] = [];

  try {
    // Split into lines and filter empty ones
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      errors.push('CSV file is empty');
      return { success: false, entries: [], errors, warnings };
    }

    // Parse headers
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Find column indices
    const recipientIndex = findColumnIndex(headers, CSV_COLUMNS.RECIPIENT);
    const amountIndex = findColumnIndex(headers, CSV_COLUMNS.AMOUNT);
    const unlockDateIndex = findColumnIndex(headers, CSV_COLUMNS.UNLOCK_DATE);
    const messageIndex = findColumnIndex(headers, CSV_COLUMNS.MESSAGE);

    if (recipientIndex === -1) {
      errors.push('Missing required column: recipient/address');
      return { success: false, entries: [], errors, warnings };
    }

    if (amountIndex === -1) {
      errors.push('Missing required column: amount');
      return { success: false, entries: [], errors, warnings };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      
      if (values.length <= Math.max(recipientIndex, amountIndex)) {
        warnings.push(`Row ${i + 1}: Incomplete data, skipping`);
        continue;
      }

      const recipient = values[recipientIndex]?.trim() || '';
      const amount = values[amountIndex]?.trim() || '';
      const unlockDate = unlockDateIndex !== -1 ? values[unlockDateIndex]?.trim() : '';
      const message = messageIndex !== -1 ? values[messageIndex]?.trim() : DEFAULT_BULK_CONFIG.defaultMessage;

      // Validate recipient
      if (!recipient) {
        errors.push(`Row ${i + 1}: Missing recipient address`);
        continue;
      }

      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        errors.push(`Row ${i + 1}: Invalid amount: ${amount}`);
        continue;
      }

      // Process unlock date
      let processedUnlockDate = unlockDate;
      if (!unlockDate) {
        // Default to 24 hours from now
        const defaultDate = new Date();
        defaultDate.setHours(defaultDate.getHours() + DEFAULT_BULK_CONFIG.defaultUnlockHours);
        processedUnlockDate = defaultDate.toISOString();
        warnings.push(`Row ${i + 1}: No unlock date provided, using default (24 hours from now)`);
      } else {
        // Try to parse the date
        const parsedDate = parseDate(unlockDate);
        if (!parsedDate) {
          errors.push(`Row ${i + 1}: Invalid date format: ${unlockDate}`);
          continue;
        }
        processedUnlockDate = parsedDate.toISOString();
      }

      entries.push({
        id: `entry-${i}`,
        recipient,
        amount: amount,
        unlockDate: processedUnlockDate,
        message: message || DEFAULT_BULK_CONFIG.defaultMessage,
        status: 'pending',
      });
    }

    if (entries.length === 0) {
      errors.push('No valid entries found in CSV');
      return { success: false, entries: [], errors, warnings };
    }

    if (entries.length > DEFAULT_BULK_CONFIG.maxRecipients) {
      errors.push(`Too many recipients: ${entries.length}. Maximum allowed: ${DEFAULT_BULK_CONFIG.maxRecipients}`);
      return { success: false, entries: [], errors, warnings };
    }

    return {
      success: errors.length === 0,
      entries,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, entries: [], errors, warnings };
  }
}

/**
 * Find column index by checking multiple possible names
 */
function findColumnIndex(headers: string[], possibleNames: readonly string[]): number {
  for (const name of possibleNames) {
    const index = headers.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Parse a single CSV line handling quotes and commas
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);

  return values;
}

/**
 * Parse various date formats
 */
function parseDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();
  
  // Try ISO format first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try common formats
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      let year, month, day;
      
      if (format === formats[0]) {
        [, year, month, day] = match;
      } else if (format === formats[1]) {
        [, month, day, year] = match;
      } else if (format === formats[2]) {
        [, day, month, year] = match;
      }

      if (year && month && day) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  }

  return null;
}

/**
 * Generate CSV content from entries
 */
export function entriesToCSV(entries: BulkGiftEntry[]): string {
  const headers = ['recipient', 'amount', 'unlock_date', 'message'];
  const rows = entries.map(entry => {
    const unlockDate = new Date(entry.unlockDate).toISOString().split('T')[0];
    return [
      entry.recipient,
      entry.amount,
      unlockDate,
      `"${(entry.message || '').replace(/"/g, '""')}"`, // Escape quotes in message
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate() {
  const template = `recipient,amount,unlock_date,message
vitalik.eth,0.01,2025-02-14,Happy Valentine's Day!
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0,0.02,2025-03-01,Thank you for your loyalty
alice.eth,0.015,2025-02-14,Enjoy your special gift
bob.eth,0.01,2025-02-20,Coffee on us!
carol.eth,0.02,2025-03-15,Spring promotion gift`;

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gift_recipients_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate if a string is a valid recipient (address or ENS)
 */
export function isValidRecipient(recipient: string): boolean {
  // Check if it's a valid address
  if (isAddress(recipient)) {
    return true;
  }
  
  // Check if it's a valid ENS name
  if (recipient.endsWith('.eth')) {
    // Basic ENS validation
    const name = recipient.slice(0, -4);
    return name.length > 0 && /^[a-zA-Z0-9-]+$/.test(name);
  }
  
  return false;
}
