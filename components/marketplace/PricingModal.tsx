'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DollarSign, Tag, TrendingUp } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  twinName: string;
  twinId: string;
  onSetPrice: (price: number, isPublic: boolean) => void;
}

export function PricingModal({ isOpen, onClose, twinName, twinId, onSetPrice }: PricingModalProps) {
  const [price, setPrice] = useState<number>(0.1);
  const [isPublic, setIsPublic] = useState(true);
  const [priceError, setpriceError] = useState<string>('');

  const handleSubmit = () => {
    if (price <= 0) {
      setpriceError('Price must be greater than 0');
      return;
    }
    
    if (price > 1000) {
      setpriceError('Price cannot exceed 1,000 SUI');
      return;
    }

    onSetPrice(price, isPublic);
    onClose();
  };

  const suggestedPrices = [
    { label: 'Demo', value: 0.1, desc: 'For testing' },
    { label: 'Budget', value: 0.5, desc: 'Accessible for everyone' },
    { label: 'Standard', value: 1, desc: 'Most popular choice' },
    { label: 'Premium', value: 2, desc: 'High-value expertise' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="List on Marketplace" maxWidth="2xl">
      <div className="space-y-6">
        {/* Twin Info */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center">
              <span className="text-xl text-white font-bold">
                {twinName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F5F5F5]">{twinName}</h3>
              <p className="text-sm text-[#737373]">Your AI Digital Twin</p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div>
          <label className="block text-sm font-semibold text-[#F5F5F5] mb-3">
            Set Access Price (SUI)
          </label>
          
          {/* Suggested Prices */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {suggestedPrices.map((suggestion) => (
              <button
                key={suggestion.value}
                onClick={() => {
                  setPrice(suggestion.value);
                  setpriceError('');
                }}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  price === suggestion.value
                    ? 'border-[#D97706] bg-[#D97706]/10'
                    : 'border-[#262626] bg-[#1E1E1E] hover:border-[#404040]'
                }`}
              >
                <div className="text-xs text-[#737373] mb-1">{suggestion.label}</div>
                <div className="text-lg font-bold text-[#F5F5F5]">{suggestion.value}</div>
                <div className="text-xs text-[#525252] mt-1">{suggestion.desc}</div>
              </button>
            ))}
          </div>

          {/* Custom Price Input */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
            <input
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(Number(e.target.value));
                setpriceError('');
              }}
              min="0.01"
              max="1000"
              step="0.1"
              className="w-full bg-[#1E1E1E] border border-[#262626] text-[#F5F5F5] pl-10 pr-4 py-3 rounded-lg focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none"
              placeholder="Enter custom price (e.g., 0.5)"
            />
          </div>
          
          {priceError && (
            <p className="text-sm text-[#DC2626] mt-2">{priceError}</p>
          )}

          {/* Revenue Estimate */}
          <div className="mt-4 bg-[#141414] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#059669]" />
              <span className="text-sm font-semibold text-[#F5F5F5]">Potential Revenue</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[#737373]">10 buyers</div>
                <div className="text-[#F5F5F5] font-semibold">{(price * 10 * 0.9).toFixed(0)} SUI</div>
              </div>
              <div>
                <div className="text-[#737373]">50 buyers</div>
                <div className="text-[#F5F5F5] font-semibold">{(price * 50 * 0.9).toFixed(0)} SUI</div>
              </div>
              <div>
                <div className="text-[#737373]">100 buyers</div>
                <div className="text-[#F5F5F5] font-semibold">{(price * 100 * 0.9).toFixed(0)} SUI</div>
              </div>
            </div>
            <p className="text-xs text-[#525252] mt-2">
              * Platform fee: 10% • You receive: 90% of sale price
            </p>
          </div>
        </div>

        {/* Visibility Toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 bg-[#1E1E1E] border-2 border-[#262626] rounded checked:bg-[#D97706] checked:border-[#D97706]"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-[#F5F5F5]">
                List publicly on marketplace
              </span>
              <p className="text-xs text-[#737373] mt-1">
                Make your AI twin discoverable by all users. Uncheck to share only with specific people.
              </p>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-[#D97706]/10 border border-[#D97706]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#F5F5F5]">
              <p className="font-semibold mb-1">What happens next?</p>
              <ul className="text-[#A3A3A3] space-y-1">
                <li>• Your AI twin will be listed on the marketplace</li>
                <li>• Buyers pay the set price to access your twin</li>
                <li>• You earn 90% of each sale automatically</li>
                <li>• You can update pricing anytime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="flex-1"
          >
            List on Marketplace
          </Button>
        </div>
      </div>
    </Modal>
  );
}
