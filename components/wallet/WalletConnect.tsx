'use client';

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure wallet provider is fully initialized
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render until client-side mounted to avoid hydration issues
  if (!mounted) {
    return (
      <button 
        className="px-6 py-2.5 bg-[#D97706]/50 text-white font-medium rounded-lg cursor-not-allowed"
        disabled
      >
        <span className="opacity-50">Connect Wallet</span>
      </button>
    );
  }

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
      <ConnectButton
        connectText="Connect Wallet"
        className="!px-6 !py-2.5 !bg-[#D97706] hover:!bg-[#B45309] !text-white !font-medium !rounded-lg !border-none !transition-all !duration-300 hover:!shadow-[0_10px_15px_-3px_rgba(217,119,6,0.25)] !cursor-pointer"
        style={{
          background: '#D97706',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.625rem 1.5rem',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      />
    );
  }

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="flex items-center gap-3">
      {/* Wallet Info */}
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
      
      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        className="p-2.5 bg-[#1E1E1E] border border-[#262626] rounded-lg hover:border-[#DC2626] hover:text-[#DC2626] text-[#A3A3A3] transition-colors"
        title="Disconnect wallet"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
