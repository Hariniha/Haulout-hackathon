/**
 * Sui Smart Contract Integration
 * DatasetNFT Contract Functions
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// Contract addresses from environment
export const CONTRACT_CONFIG = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x4dfd3d1dde59af6141c2e85798f2338b3180aff08b402779173fd94414a2d0f7',
  UPGRADE_CAP_ID: process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || '0x4e1749288b153da2e9bcdd9c55507f84cd87feffb937b0ceac14546eab9b7cc2',
  ADMIN_CAP_ID: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '0x84a26b52546264cc00cc8013cf52569767923f1f476241e27a8509d926943446',
  AI_TWIN_REGISTRY: process.env.NEXT_PUBLIC_AI_TWIN_REGISTRY || '0x990936173d8a3f4ca6384fd3de4d315f48566648aff1be5515e387678f271f9e',
  MARKETPLACE_REGISTRY: process.env.NEXT_PUBLIC_MARKETPLACE_REGISTRY || '0x7eaaefb9ead0e6efee6fa967665bcb394dc31c650466e645ae22ac29dc4dbf66',
  ACCESS_REGISTRY: process.env.NEXT_PUBLIC_ACCESS_REGISTRY || '0x185a5507276ab26fddf8d44d0a435b495dc8e26dbcfb0743b2fc9c08061b1535',
  REVENUE_POOL: process.env.NEXT_PUBLIC_REVENUE_POOL || '0x08661f12eb93c714dab29edb99fcc7cc680f7fef9f5e0641c719b9f748560062',
  NETWORK: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet',
};

// Initialize Sui client
export const suiClient = new SuiClient({
  url: CONTRACT_CONFIG.NETWORK === 'mainnet' 
    ? 'https://fullnode.mainnet.sui.io:443'
    : CONTRACT_CONFIG.NETWORK === 'devnet'
    ? 'https://fullnode.devnet.sui.io:443'
    : 'https://fullnode.testnet.sui.io:443',
});

/**
 * Dataset NFT Interface
 */
export interface DatasetNFT {
  id: string;
  owner: string;
  dataset_title: string;
  blob_id: string;
  quality_score: number;
  diversity_score: number;
  accuracy_score: number;
  completeness_score: number;
  consistency_score: number;
  bias_level: string;
  timestamp: number;
  dataset_type: string;
  total_records: number;
  image_url?: string;
}

/**
 * Mint a new Dataset NFT
 */
export async function mintDatasetNFT(params: {
  signAndExecute: (transaction: { transaction: Transaction }) => Promise<any>;
  dataset_title: string;
  blob_id: string;
  quality_score: number;
  diversity_score: number;
  accuracy_score: number;
  completeness_score: number;
  consistency_score: number;
  bias_level: string;
  timestamp: number;
  dataset_type: string;
  total_records: number;
  image_url?: string;
}) {
  const tx = new Transaction();

  // Call the mint_dataset_nft function
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::dataset_nft::mint_dataset_nft`,
    arguments: [
      tx.pure.string(params.dataset_title),
      tx.pure.string(params.blob_id),
      tx.pure.u64(params.quality_score),
      tx.pure.u64(params.diversity_score),
      tx.pure.u64(params.accuracy_score),
      tx.pure.u64(params.completeness_score),
      tx.pure.u64(params.consistency_score),
      tx.pure.string(params.bias_level),
      tx.pure.u64(params.timestamp),
      tx.pure.string(params.dataset_type),
      tx.pure.u64(params.total_records),
      tx.pure.string(params.image_url || ''),
    ],
  });

  // Execute transaction
  const result = await params.signAndExecute({
    transaction: tx,
  });

  return result;
}

/**
 * Update Dataset NFT metadata
 */
export async function updateDatasetNFT(params: {
  signAndExecute: (transaction: { transaction: Transaction }) => Promise<any>;
  nft_id: string;
  quality_score: number;
  diversity_score: number;
  accuracy_score: number;
  completeness_score: number;
  consistency_score: number;
  bias_level: string;
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::dataset_nft::update_quality_scores`,
    arguments: [
      tx.object(params.nft_id),
      tx.pure.u64(params.quality_score),
      tx.pure.u64(params.diversity_score),
      tx.pure.u64(params.accuracy_score),
      tx.pure.u64(params.completeness_score),
      tx.pure.u64(params.consistency_score),
      tx.pure.string(params.bias_level),
    ],
  });

  const result = await params.signAndExecute({
    transaction: tx,
  });

  return result;
}

/**
 * Transfer Dataset NFT to another address
 */
export async function transferDatasetNFT(params: {
  signAndExecute: (transaction: { transaction: Transaction }) => Promise<any>;
  nft_id: string;
  recipient: string;
}) {
  const tx = new Transaction();

  tx.transferObjects([tx.object(params.nft_id)], params.recipient);

  const result = await params.signAndExecute({
    transaction: tx,
  });

  return result;
}

/**
 * Get all Dataset NFTs owned by an address
 */
export async function getOwnedDatasetNFTs(ownerAddress: string): Promise<DatasetNFT[]> {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: ownerAddress,
      filter: {
        StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::dataset_nft::DatasetNFT`,
      },
      options: {
        showContent: true,
        showDisplay: true,
      },
    });

    const nfts: DatasetNFT[] = [];

    for (const obj of objects.data) {
      if (obj.data?.content?.dataType === 'moveObject') {
        const fields = (obj.data.content as any).fields;
        nfts.push({
          id: obj.data.objectId,
          owner: ownerAddress,
          dataset_title: fields.dataset_title || '',
          blob_id: fields.blob_id || '',
          quality_score: parseInt(fields.quality_score || '0'),
          diversity_score: parseInt(fields.diversity_score || '0'),
          accuracy_score: parseInt(fields.accuracy_score || '0'),
          completeness_score: parseInt(fields.completeness_score || '0'),
          consistency_score: parseInt(fields.consistency_score || '0'),
          bias_level: fields.bias_level || '',
          timestamp: parseInt(fields.timestamp || '0'),
          dataset_type: fields.dataset_type || '',
          total_records: parseInt(fields.total_records || '0'),
          image_url: fields.image_url || '',
        });
      }
    }

    return nfts;
  } catch (error) {
    console.error('Error fetching Dataset NFTs:', error);
    return [];
  }
}

/**
 * Get a specific Dataset NFT by ID
 */
export async function getDatasetNFT(nftId: string): Promise<DatasetNFT | null> {
  try {
    const object = await suiClient.getObject({
      id: nftId,
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true,
      },
    });

    if (!object.data?.content || object.data.content.dataType !== 'moveObject') {
      return null;
    }

    const fields = (object.data.content as any).fields;
    const owner = object.data.owner;

    return {
      id: object.data.objectId,
      owner: owner && typeof owner === 'object' && 'AddressOwner' in owner ? owner.AddressOwner : '',
      dataset_title: fields.dataset_title || '',
      blob_id: fields.blob_id || '',
      quality_score: parseInt(fields.quality_score || '0'),
      diversity_score: parseInt(fields.diversity_score || '0'),
      accuracy_score: parseInt(fields.accuracy_score || '0'),
      completeness_score: parseInt(fields.completeness_score || '0'),
      consistency_score: parseInt(fields.consistency_score || '0'),
      bias_level: fields.bias_level || '',
      timestamp: parseInt(fields.timestamp || '0'),
      dataset_type: fields.dataset_type || '',
      total_records: parseInt(fields.total_records || '0'),
      image_url: fields.image_url || '',
    };
  } catch (error) {
    console.error('Error fetching Dataset NFT:', error);
    return null;
  }
}

/**
 * Verify dataset ownership via NFT
 */
export async function verifyDatasetOwnership(
  ownerAddress: string,
  blobId: string
): Promise<boolean> {
  try {
    const nfts = await getOwnedDatasetNFTs(ownerAddress);
    return nfts.some(nft => nft.blob_id === blobId);
  } catch (error) {
    console.error('Error verifying dataset ownership:', error);
    return false;
  }
}

/**
 * Get contract statistics
 */
export async function getContractStats() {
  try {
    // Get all events from the contract
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::dataset_nft::DatasetMinted`,
      },
      limit: 1000,
    });

    return {
      totalMinted: events.data.length,
      packageId: CONTRACT_CONFIG.PACKAGE_ID,
      network: CONTRACT_CONFIG.NETWORK,
    };
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    return {
      totalMinted: 0,
      packageId: CONTRACT_CONFIG.PACKAGE_ID,
      network: CONTRACT_CONFIG.NETWORK,
    };
  }
}
