'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { useState, useEffect } from 'react';
import '@mysten/dapp-kit/dist/index.css';

// Network configuration
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  devnet: { url: getFullnodeUrl('devnet') },
});

export function SuiWalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60000, // 1 minute
      },
    },
  }));

  // Suppress wallet connection errors in development
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      // Filter out known wallet extension errors
      const errorString = args.join(' ');
      if (
        errorString.includes('dApp.connect') ||
        errorString.includes('chrome-extension://') ||
        errorString.includes('opcgpfmipidbgpenhmajoajpbobppdil') ||
        errorString.includes('fldfpgipfncgndfolcbkdeeknbbbnhcc') || // TON wallet
        errorString.includes('disconnected port') ||
        errorString.includes('requestAccounts') ||
        errorString.includes("reading 'ton'") ||
        errorString.includes('extensionServiceWorker')
      ) {
        // Silently ignore wallet extension errors
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const warnString = args.join(' ');
      if (
        warnString.includes('chrome-extension://') ||
        warnString.includes('ton') ||
        warnString.includes('disconnected port')
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider 
          autoConnect={false}
          enableUnsafeBurner={false}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
