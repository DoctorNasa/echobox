"use client";
import { useState, useEffect, useCallback } from "react";
import { Address, isAddress } from "viem";
import { resolveENSName, isValidENSName, getENSAvatar, formatAddress } from "@/lib/ens";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, User } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string, resolvedAddress: Address | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
};

export default function ENSInput({
  value,
  onChange,
  placeholder = "vitalik.eth or 0x...",
  className,
  label = "Recipient",
  required = false,
}: Props) {
  const [input, setInput] = useState(value);
  const [resolvedAddress, setResolvedAddress] = useState<Address | null>(null);
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Debounced resolution
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input) {
        resolveInput(input);
      } else {
        setResolvedAddress(null);
        setEnsAvatar(null);
        setError(null);
        setIsValid(false);
        onChange("", null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [input]);

  const resolveInput = async (inputValue: string) => {
    setIsResolving(true);
    setError(null);
    setIsValid(false);

    try {
      // Check if it's an Ethereum address
      if (isAddress(inputValue)) {
        setResolvedAddress(inputValue as Address);
        setEnsAvatar(null);
        setIsValid(true);
        onChange(inputValue, inputValue as Address);
      } 
      // Check if it's an ENS name
      else if (inputValue.endsWith('.eth')) {
        // Additional validation
        if (!isValidENSName(inputValue)) {
          setError("Invalid ENS name format");
          setResolvedAddress(null);
          onChange(inputValue, null);
          return;
        }
        
        const address = await resolveENSName(inputValue);
        if (address) {
          setResolvedAddress(address);
          setIsValid(true);
          onChange(inputValue, address);
          
          // Try to get avatar
          try {
            const avatar = await getENSAvatar(inputValue);
            if (avatar) {
              setEnsAvatar(avatar);
            }
          } catch (avatarError) {
            console.warn('Could not fetch ENS avatar:', avatarError);
          }
        } else {
          setError("ENS name could not be resolved");
          setResolvedAddress(null);
          onChange(inputValue, null);
        }
      }
      // Invalid format
      else {
        if (inputValue.length > 0) {
          setError("Enter a valid ENS name (ending with .eth) or Ethereum address");
        }
        setResolvedAddress(null);
        onChange(inputValue, null);
      }
    } catch (err) {
      console.error("Error resolving input:", err);
      if (inputValue.endsWith('.eth')) {
        setError("ENS name could not be resolved. Please check the name and try again.");
      } else {
        setError("Failed to resolve address");
      }
      setResolvedAddress(null);
      onChange(inputValue, null);
    } finally {
      setIsResolving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();
    setInput(newValue);
  };

  const getStatusIcon = () => {
    if (isResolving) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    if (isValid && resolvedAddress) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (error && input) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border-2 px-4 py-3 pr-10 transition-colors focus:outline-none",
            isValid && resolvedAddress
              ? "border-green-500 focus:border-green-600"
              : error && input
              ? "border-red-500 focus:border-red-600"
              : "border-gray-200 focus:border-purple-500",
            className
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Resolution Result */}
      {resolvedAddress && isValid && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
          {ensAvatar ? (
            <img
              src={ensAvatar}
              alt="ENS Avatar"
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700">
              {isAddress(input) ? "Wallet Address" : "ENS Name Resolved"}
            </div>
            <div className="font-mono text-xs text-gray-500">
              {formatAddress(resolvedAddress)}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && input && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              {input.endsWith('.eth') && (
                <p className="text-xs text-red-500 mt-1">
                  Make sure the ENS name is registered on Ethereum mainnet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isResolving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Resolving address...</span>
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
