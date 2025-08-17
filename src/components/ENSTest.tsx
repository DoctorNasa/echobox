"use client";

import { useState } from 'react';
import { resolveENSName, isValidENSName } from '../lib/ens';
import { Address } from 'viem';

export function ENSTest() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testENS = async () => {
    if (!input) {
      setResult('Please enter an ENS name');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      // First check if it's valid
      const isValid = isValidENSName(input);
      console.log(`Is "${input}" a valid ENS name?`, isValid);
      
      if (!isValid) {
        setResult(`❌ "${input}" is not a valid ENS name format`);
        setIsLoading(false);
        return;
      }

      // Try to resolve
      console.log(`Attempting to resolve: ${input}`);
      const address = await resolveENSName(input);
      
      if (address) {
        setResult(`✅ Resolved to: ${address}`);
      } else {
        setResult(`❌ Could not resolve "${input}". Make sure it's registered on mainnet.`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test some known ENS names
  const testKnownNames = async () => {
    const knownNames = [
      'vitalik.eth',
      'nick.eth',
      'brantly.eth',
      'linly.eth',  // The one from your screenshot
    ];

    setIsLoading(true);
    let results = [];
    
    for (const name of knownNames) {
      try {
        const address = await resolveENSName(name);
        results.push(`${name}: ${address || 'Not resolved'}`);
      } catch (error) {
        results.push(`${name}: Error`);
      }
    }
    
    setResult(results.join('\n'));
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">ENS Resolution Test</h2>
      
      <div className="space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter ENS name (e.g., vitalik.eth)"
          className="w-full px-4 py-2 border rounded-lg"
        />
        
        <div className="flex gap-2">
          <button
            onClick={testENS}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test ENS Resolution'}
          </button>
          
          <button
            onClick={testKnownNames}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Test Known Names
          </button>
        </div>
      </div>

      {result && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Note: ENS resolution uses Ethereum mainnet even if the app is on testnet.</p>
        <p>Check browser console for detailed logs.</p>
      </div>
    </div>
  );
}
