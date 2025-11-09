'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Wallet, ShieldCheck, TrendingUp, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { 
  createPurchaseTransaction, 
  recordPurchase, 
  grantTwinAccess,
  calculatePriceBreakdown 
} from '@/lib/services/purchaseService';

interface BuyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    name: string;
    creator?: string;
    description: string;
    price: number;
  };
  onSuccess: () => void;
}

export function BuyAccessModal({ isOpen, onClose, listing, onSuccess }: BuyAccessModalProps) {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { totalPrice, platformFee, creatorReceives } = calculatePriceBreakdown(listing.price);

  const handlePurchase = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    setIsPurchasing(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('Starting purchase flow...');
      console.log('Buyer:', account.address);
      console.log('Price:', listing.price, 'SUI');
      console.log('Creator:', listing.creator || 'Unknown');

      // Validate creator address exists
      if (!listing.creator) {
        setError('This listing does not have a valid creator address. Please contact support.');
        setIsPurchasing(false);
        return;
      }

      // Create the payment transaction
      const tx = await createPurchaseTransaction({
        twinId: listing.id,
        twinName: listing.name,
        price: listing.price,
        creatorAddress: listing.creator,
        buyerAddress: account.address,
      });

      console.log('Transaction created, requesting signature...');

      // Execute the transaction
      const result = await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful!', result);
          },
        }
      );

      console.log('Transaction executed:', result.digest);
      setSuccessMessage('Payment successful! Granting access...');

      // Wait a moment for transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Record the purchase
      recordPurchase({
        twinId: listing.id,
        twinName: listing.name,
        price: listing.price,
        buyerAddress: account.address,
        transactionDigest: result.digest,
      });

      // Grant access to the twin
      grantTwinAccess(listing.id);

      console.log('Access granted!');
      setSuccessMessage('Purchase complete! Access granted.');

      // Wait a moment to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsPurchasing(false);
      onSuccess();
      
      // Close modal after showing success
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (err: any) {
      console.error('Purchase failed:', err);
      
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (err.message?.includes('Insufficient')) {
        errorMessage = 'Insufficient SUI balance to complete purchase.';
      } else if (err.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsPurchasing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase AI Twin Access" maxWidth="2xl">
      <div className="space-y-6">
        {/* Twin Info */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center">
              <span className="text-xl text-white font-bold">
                {listing.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#F5F5F5]">{listing.name}</h3>
              <p className="text-sm text-[#737373]">by {listing.creator || 'Anonymous'}</p>
            </div>
          </div>
          <p className="text-sm text-[#A3A3A3] mt-3">{listing.description}</p>
        </div>

        {/* Price Breakdown */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4">
          <h4 className="text-sm font-semibold text-[#F5F5F5] mb-3">Price Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#A3A3A3]">Access Price</span>
              <span className="text-[#F5F5F5] font-semibold">{totalPrice.toFixed(2)} SUI</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#A3A3A3]">Platform Fee (10%)</span>
              <span className="text-[#F5F5F5]">{platformFee.toFixed(2)} SUI</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#A3A3A3]">Creator Receives (90%)</span>
              <span className="text-[#059669] font-semibold">{creatorReceives.toFixed(2)} SUI</span>
            </div>
            <div className="border-t border-[#262626] pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-[#F5F5F5] font-semibold">You Pay</span>
                <span className="text-[#F5F5F5] font-bold text-lg">{totalPrice.toFixed(2)} SUI</span>
              </div>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="bg-[#D97706]/10 border border-[#D97706]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#F5F5F5]">
              <p className="font-semibold mb-2">What you get with this purchase:</p>
              <ul className="text-[#A3A3A3] space-y-1">
                <li>• Unlimited chat access to this AI twin</li>
                <li>• Access to all training data and personality traits</li>
                <li>• Lifetime access - no recurring fees</li>
                <li>• Ability to use in your projects</li>
                <li>• Support the creator directly (90% goes to them)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {!account ? (
          <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              <div className="text-sm text-[#F5F5F5]">
                <p className="font-semibold">Wallet not connected</p>
                <p className="text-[#A3A3A3] mt-1">Please connect your wallet to purchase access</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#059669]/10 border border-[#059669]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-[#059669]" />
              <div className="text-sm text-[#F5F5F5]">
                <p className="font-semibold">Wallet Connected</p>
                <p className="text-[#A3A3A3] mt-1 font-mono text-xs">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-[#059669]/10 border border-[#059669]/30 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#059669]" />
              <p className="text-sm text-[#059669] font-semibold">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              <p className="text-sm text-[#DC2626]">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isPurchasing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePurchase}
            className="flex-1"
            disabled={!account || isPurchasing}
          >
            {isPurchasing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Purchase for {totalPrice.toFixed(2)} SUI
              </>
            )}
          </Button>
        </div>

        {/* Note */}
        <p className="text-xs text-[#525252] text-center">
          By purchasing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </Modal>
  );
}
