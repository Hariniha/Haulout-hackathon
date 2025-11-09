/**
 * React Hook for Dataset NFT Contract Interactions
 */

'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
  mintDatasetNFT,
  updateDatasetNFT,
  transferDatasetNFT,
  getOwnedDatasetNFTs,
  getDatasetNFT,
  verifyDatasetOwnership,
  getContractStats,
  DatasetNFT,
} from '@/lib/sui/contract';

export function useDatasetNFT() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [nfts, setNfts] = useState<DatasetNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user's Dataset NFTs
   */
  const fetchNFTs = async () => {
    if (!currentAccount?.address) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ownedNFTs = await getOwnedDatasetNFTs(currentAccount.address);
      setNfts(ownedNFTs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch NFTs');
      console.error('Error fetching NFTs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mint a new Dataset NFT
   */
  const mintNFT = async (params: {
    dataset_title: string;
    blob_id: string;
    quality_score: number;
    diversity_score: number;
    accuracy_score: number;
    completeness_score: number;
    consistency_score: number;
    bias_level: string;
    dataset_type: string;
    total_records: number;
    image_url?: string;
  }) => {
    if (!currentAccount) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await new Promise((resolve, reject) => {
        mintDatasetNFT({
          signAndExecute: (tx) => {
            signAndExecute(tx, {
              onSuccess: resolve,
              onError: reject,
            });
            return Promise.resolve();
          },
          ...params,
          timestamp: Date.now(),
        }).then(resolve).catch(reject);
      });

      // Refresh NFT list
      await fetchNFTs();

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to mint NFT';
      setError(errorMsg);
      console.error('Error minting NFT:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update Dataset NFT quality scores
   */
  const updateNFT = async (params: {
    nft_id: string;
    quality_score: number;
    diversity_score: number;
    accuracy_score: number;
    completeness_score: number;
    consistency_score: number;
    bias_level: string;
  }) => {
    if (!currentAccount) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await new Promise((resolve, reject) => {
        updateDatasetNFT({
          signAndExecute: (tx) => {
            signAndExecute(tx, {
              onSuccess: resolve,
              onError: reject,
            });
            return Promise.resolve();
          },
          ...params,
        }).then(resolve).catch(reject);
      });

      // Refresh NFT list
      await fetchNFTs();

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update NFT';
      setError(errorMsg);
      console.error('Error updating NFT:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Transfer Dataset NFT to another address
   */
  const transferNFT = async (nft_id: string, recipient: string) => {
    if (!currentAccount) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await new Promise((resolve, reject) => {
        transferDatasetNFT({
          signAndExecute: (tx) => {
            signAndExecute(tx, {
              onSuccess: resolve,
              onError: reject,
            });
            return Promise.resolve();
          },
          nft_id,
          recipient,
        }).then(resolve).catch(reject);
      });

      // Refresh NFT list
      await fetchNFTs();

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to transfer NFT';
      setError(errorMsg);
      console.error('Error transferring NFT:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get a specific NFT by ID
   */
  const getNFTById = async (nftId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const nft = await getDatasetNFT(nftId);
      return nft;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch NFT';
      setError(errorMsg);
      console.error('Error fetching NFT:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify ownership of a dataset
   */
  const verifyOwnership = async (blobId: string) => {
    if (!currentAccount?.address) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isOwner = await verifyDatasetOwnership(currentAccount.address, blobId);
      return isOwner;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to verify ownership';
      setError(errorMsg);
      console.error('Error verifying ownership:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get contract statistics
   */
  const getStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await getContractStats();
      return stats;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch stats';
      setError(errorMsg);
      console.error('Error fetching stats:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch NFTs when account changes
  useEffect(() => {
    if (currentAccount?.address) {
      fetchNFTs();
    } else {
      setNfts([]);
    }
  }, [currentAccount?.address]);

  return {
    // State
    nfts,
    isLoading,
    error,
    isConnected: !!currentAccount,

    // Functions
    fetchNFTs,
    mintNFT,
    updateNFT,
    transferNFT,
    getNFTById,
    verifyOwnership,
    getStats,
  };
}
