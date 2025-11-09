'use client';

import Script from 'next/script';

/**
 * Wallet Filter Script
 * Prevents non-Sui wallet extensions from interfering with the app
 */
export function WalletFilterScript() {
  return (
    <Script
      id="wallet-filter"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Prevent TON and other non-Sui wallets from injecting
            if (typeof window !== 'undefined') {
              // Override ton wallet detection
              Object.defineProperty(window, 'ton', {
                get: function() { return undefined; },
                set: function() {},
                configurable: false
              });
              
              // Suppress extension errors globally
              const originalAddEventListener = EventTarget.prototype.addEventListener;
              EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (type === 'message' || type === 'error') {
                  const wrappedListener = function(event) {
                    try {
                      // Check if error is from TON wallet extension
                      const errorMsg = event.message || event.error?.message || '';
                      if (errorMsg.includes('disconnected port') || 
                          errorMsg.includes('chrome-extension') ||
                          errorMsg.includes('ton')) {
                        return; // Ignore
                      }
                      if (typeof listener === 'function') {
                        listener.call(this, event);
                      }
                    } catch (e) {
                      // Silently catch errors from extension
                    }
                  };
                  return originalAddEventListener.call(this, type, wrappedListener, options);
                }
                return originalAddEventListener.call(this, type, listener, options);
              };
            }
          })();
        `,
      }}
    />
  );
}
