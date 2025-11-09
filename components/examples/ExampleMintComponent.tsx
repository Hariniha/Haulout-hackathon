'use client';

import { useState } from 'react';
import { useSuiWallet } from '@/lib/sui/useSuiWallet';
import { mintPatentNFT } from '@/lib/sui/contracts';
import { Button } from '@/components/ui/Button';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Example component showing how to use Sui wallet integration
 * This demonstrates minting a Patent NFT with wallet connection
 */
export function ExampleMintComponent() {
  const { address, isConnected, executeTransaction, isLoading } = useSuiWallet();
  const [mintStatus, setMintStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txDigest, setTxDigest] = useState('');

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Example: Mint a Patent NFT
      const tx = mintPatentNFT(
        process.env.NEXT_PUBLIC_PATENT_CONTRACT_ADDRESS || '0xPACKAGE_ID',
        'walrus_blob_123456', // This would come from Walrus upload
        'inventor.sui', // This would come from SuiNS input
        {
          title: 'Revolutionary AI Algorithm',
          description: 'A novel machine learning algorithm for...',
          inventor: 'John Doe',
        }
      );

      // Execute the transaction
      const result = await executeTransaction(tx) as { digest?: string };
      
      console.log('Transaction result:', result);
      setTxDigest(result.digest || 'Transaction successful');
      setMintStatus('success');

    } catch (error) {
      console.error('Mint error:', error);
      setMintStatus('error');
    }
  };

  // If wallet not connected
  if (!isConnected) {
    return (
      <div className="bg-[#1E1E1E] border border-[#262626] rounded-xl p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#D97706] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-[#A3A3A3] mb-4">
            Please connect your Sui wallet to mint Patent NFTs
          </p>
          <p className="text-sm text-[#525252]">
            Click &quot;Connect Wallet&quot; in the navigation bar
          </p>
        </div>
      </div>
    );
  }

  // Connected state
  return (
    <div className="bg-[#1E1E1E] border border-[#262626] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">
        Mint Patent NFT
      </h3>

      <div className="space-y-4">
        {/* Connected Address */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4">
          <p className="text-xs text-[#A3A3A3] mb-1">Connected Address</p>
          <p className="text-sm text-[#F5F5F5] font-mono break-all">
            {address}
          </p>
        </div>

        {/* Mint Button */}
        <Button
          variant="primary"
          size="medium"
          icon={isLoading ? Loader2 : Upload}
          iconPosition="left"
          onClick={handleMint}
          disabled={isLoading}
          className={`w-full ${isLoading ? 'animate-pulse' : ''}`}
        >
          {isLoading ? 'Minting NFT...' : 'Mint Patent NFT'}
        </Button>

        {/* Success Message */}
        {mintStatus === 'success' && (
          <div className="bg-[#059669]/10 border border-[#059669] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#059669] font-medium mb-1">
                  NFT Minted Successfully!
                </p>
                <p className="text-xs text-[#A3A3A3] mb-2">
                  Transaction Digest:
                </p>
                <p className="text-xs text-[#F5F5F5] font-mono break-all bg-[#0A0A0A] p-2 rounded">
                  {txDigest}
                </p>
                <a
                  href={`https://suiexplorer.com/txblock/${txDigest}?network=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D97706] hover:text-[#DC2626] mt-2 inline-block"
                >
                  View on Sui Explorer →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {mintStatus === 'error' && (
          <div className="bg-[#DC2626]/10 border border-[#DC2626] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#DC2626] font-medium mb-1">
                  Minting Failed
                </p>
                <p className="text-xs text-[#A3A3A3]">
                  Please check your wallet balance and try again
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-[#D97706]/5 border border-[#D97706]/20 rounded-lg p-4">
          <p className="text-xs text-[#A3A3A3]">
            💡 <span className="text-[#F5F5F5]">Tip:</span> Make sure you have enough SUI in your wallet for gas fees
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * How to use this component:
 * 
 * 1. Import it in any page:
 *    import { ExampleMintComponent } from '@/components/examples/ExampleMintComponent';
 * 
 * 2. Use it:
 *    <ExampleMintComponent />
 * 
 * 3. Customize for your needs:
 *    - Replace mintPatentNFT with your contract function
 *    - Add form inputs for user data
 *    - Add file upload for Walrus integration
 *    - Add SuiNS name input
 */
