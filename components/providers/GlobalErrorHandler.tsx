'use client';

import { useEffect } from 'react';

/**
 * Global Error Handler Component
 * Suppresses non-critical wallet extension errors from console
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Suppress specific wallet extension errors
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error
    console.error = (...args: any[]) => {
      const errorString = args.join(' ');
      
      // List of error patterns to suppress
      const suppressPatterns = [
        'disconnected port',
        'chrome-extension://',
        'extensionServiceWorker',
        'fldfpgipfncgndfolcbkdeeknbbbnhcc', // TON wallet extension
        "Cannot read properties of undefined (reading 'ton')",
        'requestAccounts',
        'sendToOrigin',
        'onDappSendUpdates',
        'dApp.connect',
        'opcgpfmipidbgpenhmajoajpbobppdil',
      ];

      // Check if error should be suppressed
      const shouldSuppress = suppressPatterns.some(pattern => 
        errorString.includes(pattern)
      );

      if (!shouldSuppress) {
        originalError.apply(console, args);
      }
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const warnString = args.join(' ');
      
      const suppressPatterns = [
        'chrome-extension://',
        'disconnected port',
        'ton',
        'extensionServiceWorker',
      ];

      const shouldSuppress = suppressPatterns.some(pattern => 
        warnString.includes(pattern)
      );

      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };

    // Handle uncaught errors globally
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      
      const suppressPatterns = [
        'disconnected port',
        'chrome-extension',
        'extensionServiceWorker',
        'ton',
      ];

      const shouldSuppress = suppressPatterns.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldSuppress) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || '';
      
      const suppressPatterns = [
        'disconnected port',
        'chrome-extension',
        'extensionServiceWorker',
        'ton',
      ];

      const shouldSuppress = suppressPatterns.some(pattern => 
        String(reason).toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldSuppress) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}
