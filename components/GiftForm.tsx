import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Calendar, Gift, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { resolveRecipient } from '../lib/ens';
import { CreateGiftParams } from '../types/gift';

interface GiftFormProps {
  onGiftCreated?: (gift: CreateGiftParams) => void;
}

export function GiftForm({ onGiftCreated }: GiftFormProps) {
  const [formData, setFormData] = useState({
    recipientInput: '',
    amount: '',
    unlockDate: '',
    unlockTime: '12:00',
    message: ''
  });

  const [isResolving, setIsResolving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [recipientStatus, setRecipientStatus] = useState<{
    resolved: boolean;
    address?: string;
    isENS?: boolean;
    error?: string;
  }>({ resolved: false });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset recipient status when input changes
    if (field === 'recipientInput') {
      setRecipientStatus({ resolved: false });
    }
  };

  const handleResolveRecipient = async () => {
    if (!formData.recipientInput.trim()) return;

    setIsResolving(true);
    try {
      const result = await resolveRecipient(formData.recipientInput);
      setRecipientStatus({
        resolved: !!result.address,
        address: result.address || undefined,
        isENS: result.isENS,
        error: result.error
      });
    } catch (error) {
      setRecipientStatus({
        resolved: false,
        error: 'Failed to resolve recipient'
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleCreateGift = async () => {
    if (!recipientStatus.resolved || !recipientStatus.address) {
      alert('Please resolve the recipient address first');
      return;
    }

    if (!formData.amount || !formData.unlockDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      // Combine date and time
      const unlockDateTime = new Date(`${formData.unlockDate}T${formData.unlockTime}`);
      
      const giftParams: CreateGiftParams = {
        recipientENS: recipientStatus.isENS ? formData.recipientInput : '',
        recipientAddress: recipientStatus.address,
        amount: formData.amount,
        unlockDate: unlockDateTime,
        message: formData.message
      };

      // Mock gift creation - in production, this would call the smart contract
      await new Promise(resolve => setTimeout(resolve, 2000));

      onGiftCreated?.(giftParams);

      // Reset form
      setFormData({
        recipientInput: '',
        amount: '',
        unlockDate: '',
        unlockTime: '12:00',
        message: ''
      });
      setRecipientStatus({ resolved: false });

      alert('Gift created successfully!');
    } catch (error) {
      console.error('Failed to create gift:', error);
      alert('Failed to create gift. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Create Crypto Gift
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient */}
        <div>
          <Label htmlFor="recipient">Recipient (Address or ENS)</Label>
          <div className="flex gap-2">
            <Input
              id="recipient"
              value={formData.recipientInput}
              onChange={(e) => handleInputChange('recipientInput', e.target.value)}
              placeholder="0x742d... or vitalik.eth"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleResolveRecipient}
              disabled={isResolving || !formData.recipientInput.trim()}
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Resolve'
              )}
            </Button>
          </div>
          
          {/* Recipient Status */}
          {recipientStatus.error && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{recipientStatus.error}</AlertDescription>
            </Alert>
          )}
          
          {recipientStatus.resolved && recipientStatus.address && (
            <Alert className="mt-2">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {recipientStatus.isENS ? 'ENS resolved to: ' : 'Valid address: '}
                <code className="text-sm">{recipientStatus.address}</code>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Amount */}
        <div>
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            min="0"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.1"
          />
        </div>

        {/* Unlock Date & Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unlockDate">Unlock Date</Label>
            <Input
              id="unlockDate"
              type="date"
              min={minDate}
              value={formData.unlockDate}
              onChange={(e) => handleInputChange('unlockDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unlockTime">Unlock Time</Label>
            <Input
              id="unlockTime"
              type="time"
              value={formData.unlockTime}
              onChange={(e) => handleInputChange('unlockTime', e.target.value)}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="message">Message (Optional)</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Happy birthday! Hope you enjoy this gift..."
            rows={3}
          />
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateGift}
          disabled={!recipientStatus.resolved || isCreating || !formData.amount || !formData.unlockDate}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Gift...
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 mr-2" />
              Create Gift
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Your ETH will be locked in a smart contract until the unlock date</p>
          <p>• Only the recipient can claim the gift after the unlock time</p>
          <p>• Make sure you have enough ETH + gas fees in your wallet</p>
        </div>
      </CardContent>
    </Card>
  );
}