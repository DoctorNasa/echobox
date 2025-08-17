"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import { 
  Users, 
  Gift, 
  AlertCircle, 
  CheckCircle,
  Send,
  Loader2,
  Edit,
  Trash2,
  Coffee,
  Heart,
  Star
} from 'lucide-react';
import { BulkGiftUpload } from './BulkGiftUpload';
import { BulkGiftEntry, BulkGiftSummary } from '../types/bulkGift';
import { resolveENSName } from '../lib/ens';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export function BulkGiftSender() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const [entries, setEntries] = useState<BulkGiftEntry[]>([]);
  const [validatedEntries, setValidatedEntries] = useState<BulkGiftEntry[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'validate' | 'preview' | 'send'>('upload');
  const [summary, setSummary] = useState<BulkGiftSummary | null>(null);

  // Example templates for coffee shops
  const templates = [
    { icon: Coffee, name: "Coffee Loyalty", message: "Thanks for being a loyal customer! ☕" },
    { icon: Heart, name: "Valentine's Special", message: "Happy Valentine's Day! ❤️" },
    { icon: Star, name: "VIP Customer", message: "You're a VIP! Enjoy this special gift 🌟" },
  ];

  // Handle entries loaded from CSV
  const handleEntriesLoaded = (loadedEntries: BulkGiftEntry[]) => {
    setEntries(loadedEntries);
    setCurrentStep('validate');
    validateEntries(loadedEntries);
  };

  // Validate all entries
  const validateEntries = async (entriesToValidate: BulkGiftEntry[]) => {
    setIsValidating(true);
    const validated: BulkGiftEntry[] = [];
    let totalAmount = 0;
    let validCount = 0;
    let invalidCount = 0;

    for (const entry of entriesToValidate) {
      const updatedEntry = { ...entry };
      updatedEntry.status = 'validating';

      try {
        // Validate recipient
        if (isAddress(entry.recipient)) {
          updatedEntry.resolvedAddress = entry.recipient as any;
          updatedEntry.status = 'valid';
        } else if (entry.recipient.endsWith('.eth')) {
          // Resolve ENS
          const resolved = await resolveENSName(entry.recipient);
          if (resolved) {
            updatedEntry.resolvedAddress = resolved;
            updatedEntry.status = 'valid';
          } else {
            updatedEntry.status = 'invalid';
            updatedEntry.error = 'ENS name could not be resolved';
          }
        } else {
          updatedEntry.status = 'invalid';
          updatedEntry.error = 'Invalid address format';
        }

        // Validate amount
        const amount = parseFloat(entry.amount);
        if (isNaN(amount) || amount <= 0) {
          updatedEntry.status = 'invalid';
          updatedEntry.error = 'Invalid amount';
        } else if (updatedEntry.status === 'valid') {
          totalAmount += amount;
        }

        // Validate date
        const unlockDate = new Date(entry.unlockDate);
        if (isNaN(unlockDate.getTime()) || unlockDate <= new Date()) {
          updatedEntry.status = 'invalid';
          updatedEntry.error = 'Invalid or past unlock date';
        }

        if (updatedEntry.status === 'valid') {
          validCount++;
        } else {
          invalidCount++;
        }
      } catch (error) {
        updatedEntry.status = 'invalid';
        updatedEntry.error = 'Validation error';
        invalidCount++;
      }

      validated.push(updatedEntry);
    }

    setValidatedEntries(validated);
    setSummary({
      totalRecipients: validated.length,
      totalAmount: totalAmount.toFixed(4),
      estimatedGas: (validated.length * 0.002).toFixed(4), // Rough estimate
      validEntries: validCount,
      invalidEntries: invalidCount,
      currency: 'ETH',
    });

    setIsValidating(false);
    
    if (validCount > 0) {
      setCurrentStep('preview');
      toast.success(`Validated ${validCount} recipients`);
    } else {
      toast.error('No valid recipients found');
    }

    if (invalidCount > 0) {
      toast.warning(`${invalidCount} invalid entries found`);
    }
  };

  // Remove an entry
  const removeEntry = (id: string) => {
    const filtered = validatedEntries.filter(e => e.id !== id);
    setValidatedEntries(filtered);
    if (filtered.length === 0) {
      setCurrentStep('upload');
      setSummary(null);
    } else {
      // Recalculate summary
      const validCount = filtered.filter(e => e.status === 'valid').length;
      const totalAmount = filtered
        .filter(e => e.status === 'valid')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      setSummary(prev => prev ? {
        ...prev,
        totalRecipients: filtered.length,
        totalAmount: totalAmount.toFixed(4),
        validEntries: validCount,
        invalidEntries: filtered.length - validCount,
      } : null);
    }
  };

  // Apply template message
  const applyTemplate = (message: string) => {
    const updated = validatedEntries.map(entry => ({
      ...entry,
      message: message,
    }));
    setValidatedEntries(updated);
    toast.success('Template applied to all recipients');
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = () => {
    if (!balance || !summary) return false;
    const required = parseEther(summary.totalAmount) + parseEther(summary.estimatedGas);
    return balance.value >= required;
  };

  // Send bulk gifts
  const sendBulkGifts = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!hasSufficientBalance()) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSending(true);
    setCurrentStep('send');

    // TODO: Implement actual contract calls here
    // This would involve batching transactions and calling the gift contract

    // Simulate sending
    for (const entry of validatedEntries) {
      if (entry.status !== 'valid') continue;
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      // Update entry status
      const updated = validatedEntries.map(e => 
        e.id === entry.id ? { ...e, status: 'sent' as const, txHash: '0x...' } : e
      );
      setValidatedEntries(updated);
    }

    setIsSending(false);
    toast.success('All gifts sent successfully! 🎉');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Bulk Gift Sender
        </h1>
        <p className="text-gray-600">
          Send crypto gifts to multiple recipients at once - perfect for coffee shops, restaurants, and businesses
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {['upload', 'validate', 'preview', 'send'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              currentStep === step
                ? "bg-purple-600 text-white"
                : index < ['upload', 'validate', 'preview', 'send'].indexOf(currentStep)
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            )}>
              {index < ['upload', 'validate', 'preview', 'send'].indexOf(currentStep) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < 3 && (
              <div className={cn(
                "w-20 h-1 mx-2",
                index < ['upload', 'validate', 'preview', 'send'].indexOf(currentStep)
                  ? "bg-green-500"
                  : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex items-center justify-center gap-16 text-sm">
        <span className={cn(
          "font-medium",
          currentStep === 'upload' ? "text-purple-600" : "text-gray-600"
        )}>Upload</span>
        <span className={cn(
          "font-medium",
          currentStep === 'validate' ? "text-purple-600" : "text-gray-600"
        )}>Validate</span>
        <span className={cn(
          "font-medium",
          currentStep === 'preview' ? "text-purple-600" : "text-gray-600"
        )}>Preview</span>
        <span className={cn(
          "font-medium",
          currentStep === 'send' ? "text-purple-600" : "text-gray-600"
        )}>Send</span>
      </div>

      {/* Content based on step */}
      {currentStep === 'upload' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <BulkGiftUpload onEntriesLoaded={handleEntriesLoaded} />
        </div>
      )}

      {(currentStep === 'validate' || currentStep === 'preview') && isValidating && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-lg font-medium">Validating recipients...</p>
            <p className="text-sm text-gray-600 mt-2">Resolving ENS names and checking addresses</p>
          </div>
        </div>
      )}

      {currentStep === 'preview' && !isValidating && summary && (
        <>
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold">{summary.totalRecipients}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid</p>
                <p className="text-2xl font-bold text-green-600">{summary.validEntries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invalid</p>
                <p className="text-2xl font-bold text-red-600">{summary.invalidEntries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">{summary.totalAmount} ETH</p>
              </div>
            </div>
            
            {/* Balance Check */}
            {balance && (
              <div className="mt-4 p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Balance:</span>
                  <span className="font-mono font-medium">
                    {formatEther(balance.value).slice(0, 8)} ETH
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-600">Required:</span>
                  <span className="font-mono font-medium">
                    {(parseFloat(summary.totalAmount) + parseFloat(summary.estimatedGas)).toFixed(4)} ETH
                  </span>
                </div>
                {!hasSufficientBalance() && (
                  <div className="mt-2 p-2 bg-red-50 rounded flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">Insufficient balance</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Quick Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => applyTemplate(template.message)}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <template.icon className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-gray-600">{template.message}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipients List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Recipients</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {validatedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between p-4 border-b border-gray-100",
                    entry.status === 'invalid' && "bg-red-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      entry.status === 'valid' ? "bg-green-500" :
                      entry.status === 'invalid' ? "bg-red-500" :
                      entry.status === 'sent' ? "bg-blue-500" :
                      "bg-gray-300"
                    )} />
                    <div className="flex-1">
                      <p className="font-mono text-sm">{entry.recipient}</p>
                      {entry.resolvedAddress && entry.recipient.endsWith('.eth') && (
                        <p className="text-xs text-gray-500">
                          → {entry.resolvedAddress.slice(0, 6)}...{entry.resolvedAddress.slice(-4)}
                        </p>
                      )}
                      {entry.error && (
                        <p className="text-xs text-red-600">{entry.error}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.amount} ETH</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.unlockDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentStep('upload');
                setEntries([]);
                setValidatedEntries([]);
                setSummary(null);
              }}
              className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={sendBulkGifts}
              disabled={!isConnected || !hasSufficientBalance() || summary.validEntries === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
                "hover:from-purple-700 hover:to-pink-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-5 w-5" />
              Send {summary.validEntries} Gifts
            </button>
          </div>
        </>
      )}

      {currentStep === 'send' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sending Gifts...</h3>
            {validatedEntries.filter(e => e.status === 'valid' || e.status === 'sent').map((entry) => (
              <div key={entry.id} className="flex items-center gap-3">
                {entry.status === 'sent' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                )}
                <span className="font-mono text-sm flex-1">{entry.recipient}</span>
                <span className="text-sm text-gray-600">{entry.amount} ETH</span>
                {entry.status === 'sent' && entry.txHash && (
                  <a
                    href={`https://etherscan.io/tx/${entry.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    View TX
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
