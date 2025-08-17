"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle,
  X,
  Users,
  Gift
} from 'lucide-react';
import { parseCSV, downloadCSVTemplate } from '../lib/csvParser';
import { BulkGiftEntry, CSVParseResult } from '../types/bulkGift';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface BulkGiftUploadProps {
  onEntriesLoaded: (entries: BulkGiftEntry[]) => void;
  maxFileSize?: number; // in bytes
  className?: string;
}

export function BulkGiftUpload({ 
  onEntriesLoaded, 
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  className 
}: BulkGiftUploadProps) {
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const text = await file.text();
      const result = parseCSV(text);
      setParseResult(result);

      if (result.success && result.entries.length > 0) {
        onEntriesLoaded(result.entries);
        toast.success(`Successfully loaded ${result.entries.length} recipients`);
      } else if (result.errors.length > 0) {
        toast.error('Failed to parse CSV file');
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to read file');
      setParseResult({
        success: false,
        entries: [],
        errors: ['Failed to read file'],
        warnings: [],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onEntriesLoaded]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file size
    if (file.size > maxFileSize) {
      toast.error(`File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`);
      return;
    }

    processFile(file);
  }, [processFile, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const clearFile = () => {
    setParseResult(null);
    setFileName('');
    onEntriesLoaded([]);
  };

  const handleTemplateDownload = () => {
    downloadCSVTemplate();
    toast.success('Template downloaded!');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Bulk Gift Upload</h3>
            <p className="text-xs text-gray-500">Send gifts to multiple recipients at once</p>
          </div>
        </div>
        <button
          onClick={handleTemplateDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-purple-200 rounded-xl text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      {/* Upload Area */}
      {!parseResult && (
        <div
          {...getRootProps()}
          className={cn(
            "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer",
            "bg-gradient-to-br from-purple-50/50 to-pink-50/50",
            isDragActive
              ? "border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 scale-[1.02]"
              : "border-purple-300 hover:border-purple-400 hover:from-purple-50 hover:to-pink-50",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          
          <div className="p-12">
            {/* Icon Section */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-purple-400 rounded-full blur-xl opacity-20" />
                <div className="relative bg-white rounded-full p-4 shadow-lg">
                  <Upload className={cn(
                    "h-8 w-8 transition-all",
                    isDragActive ? "text-purple-600 scale-110" : "text-purple-500"
                  )} />
                </div>
              </div>
            </div>
            
            {/* Text Section */}
            {isDragActive ? (
              <div className="space-y-2">
                <p className="text-xl font-semibold text-purple-700">
                  Release to upload
                </p>
                <p className="text-sm text-purple-600">
                  We'll process your recipient list
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-gray-800">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-gray-600">
                  or <span className="text-purple-600 font-medium hover:underline">browse files</span>
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Maximum file size: {maxFileSize / 1024 / 1024}MB
                </p>
              </div>
            )}

            {/* Features */}
            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-700">CSV Format</p>
                  <p className="text-xs text-gray-500">Simple upload</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-pink-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-700">Bulk Send</p>
                  <p className="text-xs text-gray-500">Up to 100</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-700">Smart Gifts</p>
                  <p className="text-xs text-gray-500">Time-locked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 right-4">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" />
          </div>
          <div className="absolute bottom-4 left-4">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping animation-delay-200" />
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            <span className="text-sm text-gray-600">Processing file...</span>
          </div>
        </div>
      )}

      {/* Parse Results */}
      {parseResult && !isProcessing && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium">{fileName}</span>
            </div>
            <button
              onClick={clearFile}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Success Summary */}
          {parseResult.success && parseResult.entries.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">
                    Successfully loaded {parseResult.entries.length} recipients
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Ready to validate addresses and send gifts
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">{parseResult.entries.length} Recipients</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gift className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">Ready to Send</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {parseResult.errors.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="font-medium text-red-900">Errors:</p>
              {parseResult.errors.map((error, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-red-800">{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {parseResult.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-orange-900">Warnings:</p>
              {parseResult.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded text-sm">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-orange-800">{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Entry Preview */}
          {parseResult.entries.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  Recipients Preview
                </p>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  {parseResult.entries.length} total
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {parseResult.entries.slice(0, 5).map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-mono text-sm text-gray-800">{entry.recipient}</p>
                        {entry.message && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                            {entry.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-800">{entry.amount} ETH</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.unlockDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {parseResult.entries.length > 5 && (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">+{parseResult.entries.length - 5} more</span> recipients
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-3">CSV Format Guide</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Recipient</p>
                    <p className="text-xs text-gray-600">Address or ENS (vitalik.eth)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Amount</p>
                    <p className="text-xs text-gray-600">ETH amount (e.g., 0.01)</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Unlock Date</p>
                    <p className="text-xs text-gray-600">YYYY-MM-DD (optional)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Message</p>
                    <p className="text-xs text-gray-600">Personal note (optional)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/70 rounded-lg">
              <p className="text-xs font-mono text-gray-600">
                <span className="text-purple-600">recipient,amount,unlock_date,message</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
