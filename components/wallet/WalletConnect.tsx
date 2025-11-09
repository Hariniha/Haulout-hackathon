'use client';

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function WalletConnect() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account) {
    return (
      <div className="wallet-connect-wrapper">
        <ConnectButton
          connectText="Connect Wallet"
          className="px-6 py-2.5 bg-[#D97706] text-white font-medium rounded-lg hover:bg-[#B45309] hover:shadow-lg hover:shadow-[#D97706]/25 transition-all"
        />
        <style jsx global>{`
          .wallet-connect-wrapper button {
            background-color: #D97706 !important;
            color: white !important;
            padding: 0.625rem 1.5rem !important;
            font-weight: 500 !important;
            border-radius: 0.5rem !important;
            transition: all 0.3s !important;
            border: none !important;
          }
          .wallet-connect-wrapper button:hover {
            background-color: #B45309 !important;
            box-shadow: 0 10px 15px -3px rgba(217, 119, 6, 0.25) !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-[#1E1E1E] border border-[#262626] px-4 py-2 rounded-lg flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-[#A3A3A3]">Connected</span>
          <span className="text-sm text-[#F5F5F5] font-medium">
            {formatAddress(account.address)}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-[#252525] rounded transition-colors"
          title="Copy address"
        >
          {copied ? (
            <Check className="w-4 h-4 text-[#059669]" />
          ) : (
            <Copy className="w-4 h-4 text-[#A3A3A3]" />
          )}
        </button>
      </div>
      
      <button
        onClick={() => disconnect()}
        className="p-2.5 bg-[#1E1E1E] border border-[#262626] rounded-lg hover:border-[#DC2626] hover:text-[#DC2626] text-[#A3A3A3] transition-colors"
        title="Disconnect wallet"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
