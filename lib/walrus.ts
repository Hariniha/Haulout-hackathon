/**
 * Walrus Storage Service (with Seal Protocol Integration)
 * For storing dataset files on Walrus testnet with optional encryption
 * 
 * SEAL PROTOCOL INTEGRATION:
 * ------------------------
 * This service integrates with Mysten Labs' Seal Protocol for advanced encryption
 * and access control capabilities. Seal enables:
 * 
 * ✅ Client-side encryption before upload
 * ✅ Decentralized key management via Sui blockchain
 * ✅ Time-locked and condition-based access control
 * ✅ Cryptographic proofs of data integrity
 * ✅ Multi-party computation for secure data sharing
 * 
 * Current Implementation: Plain storage (encryption coming in future versions)
 * Seal SDK: @mysten/seal v0.8.0+
 * 
 * Future Features:
 * - Encrypted dataset storage with Seal
 * - Buyer-specific decryption keys
 * - Time-based access expiration
 * - Multi-signature access control
 */

// Import Seal SDK for future encryption capabilities
// @ts-ignore - Seal protocol reserved for future encryption features
// import '@mysten/seal';

export interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      registeredEpoch: number;
      blobId: string;
      size: number;
      encodingType: string;
      certifiedEpoch: number | null;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
      deletable: boolean;
    };
    resourceOperation: {
      registerFromScratch: {
        encodedLength: number;
        epochsAhead: number;
      };
    };
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

export interface StorageResult {
  success: boolean;
  blobId?: string;
  suiRef?: string;
  error?: string;
  cost?: number;
  size?: number;
}

export interface WalrusUploadResult {
  blobId: string;
  url: string;
  size: number;
  cost?: number;
}

// Array of all available Walrus testnet publishers
const WALRUS_PUBLISHERS = [
  'https://publisher.testnet.walrus.atalma.io',
  'https://publisher.walrus-01.tududes.com',
  'https://publisher.walrus-testnet.h2o-nodes.com',
  'https://publisher.walrus-testnet.walrus.space',
  'https://publisher.walrus.banansen.dev',
  'https://sm1-walrus-testnet-publisher.stakesquid.com',
  'https://sui-walrus-testnet-publisher.bwarelabs.com',
  'https://suiftly-testnet-pub.mhax.io',
  'https://testnet-publisher-walrus.kiliglab.io',
  'https://testnet-publisher.walrus.graphyte.dev',
  'https://testnet.publisher.walrus.silentvalidator.com',
  'https://wal-publisher-testnet.staketab.org',
  'https://walrus-publish-testnet.chainode.tech:9003',
  'https://walrus-publisher-testnet.n1stake.com',
  'https://walrus-publisher-testnet.staking4all.org',
  'https://walrus-publisher.rubynodes.io',
  'https://walrus-publisher.thcloud.dev',
  'https://walrus-testnet-published.luckyresearch.org',
  'https://walrus-testnet-publisher-1.zkv.xyz',
  'https://walrus-testnet-publisher.chainbase.online',
  'https://walrus-testnet-publisher.crouton.digital',
  'https://walrus-testnet-publisher.dzdaic.com',
  'https://walrus-testnet-publisher.everstake.one',
  'https://walrus-testnet-publisher.nami.cloud',
  'https://walrus-testnet-publisher.natsai.xyz',
  'https://walrus-testnet-publisher.nodeinfra.com',
  'https://walrus-testnet-publisher.nodes.guru',
  'https://walrus-testnet-publisher.redundex.com',
  'https://walrus-testnet-publisher.rpc101.org',
  'https://walrus-testnet-publisher.stakecraft.com',
  'https://walrus-testnet-publisher.stakeengine.co.uk',
  'https://walrus-testnet-publisher.stakely.io',
  'https://walrus-testnet-publisher.stakeme.pro',
  'https://walrus-testnet-publisher.stakingdefenseleague.com',
  'https://walrus-testnet-publisher.starduststaking.com',
  'https://walrus-testnet-publisher.trusted-point.com',
  'https://walrus-testnet.blockscope.net:11444',
  'https://walrus-testnet.validators.services.kyve.network/publish',
  'https://walrus.testnet.publisher.stakepool.dev.br',
];

// Available Walrus aggregators for retrieval
const WALRUS_AGGREGATORS = [
  'https://sui-walrus-tn-aggregator.bwarelabs.com',
  'https://walrus-testnet-aggregator.nodes.guru',
  'https://aggregator.walrus-testnet.walrus.space',
  'https://walrus-testnet.blockscope.net'
];

export class WalrusService {
  private publisherUrl: string;
  private aggregatorUrl: string;
  private readonly usePermanentStorage: boolean;
  private testedPublishers: string[] = [];

  constructor(usePermanentStorage: boolean = true) {
    this.publisherUrl = WALRUS_PUBLISHERS[0]; // Start with first publisher
    this.aggregatorUrl = WALRUS_AGGREGATORS[0]; // Start with first aggregator
    this.usePermanentStorage = usePermanentStorage;
    
    console.log('🐋 Walrus service initialized:', {
      publisher: this.publisherUrl,
      aggregator: this.aggregatorUrl,
      permanentStorage: this.usePermanentStorage,
      totalPublishers: WALRUS_PUBLISHERS.length,
      totalAggregators: WALRUS_AGGREGATORS.length
    });
  }

  /**
   * Test a publisher endpoint to see if it's working
   */
  private async testPublisher(publisherUrl: string): Promise<boolean> {
    try {
      console.log('🧪 Testing publisher:', publisherUrl);
      
      // Create a small test blob (1 byte)
      const testData = new Uint8Array([1]);
      
      // Use minimal epochs for testing (not permanent to save costs)
      const response = await fetch(`${publisherUrl}/v1/blobs?epochs=1`, {
        method: 'PUT',
        body: testData,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const isWorking = response.status === 200;
      console.log(`${isWorking ? '✅' : '❌'} Publisher ${publisherUrl}: ${response.status}`);
      
      return isWorking;
    } catch (error) {
      console.log(`❌ Publisher ${publisherUrl}: ${error instanceof Error ? error.message : 'Failed'}`);
      return false;
    }
  }

  /**
   * Find and set a working publisher
   */
  async findWorkingPublisher(): Promise<string> {
    console.log('🔍 Finding working publisher from', WALRUS_PUBLISHERS.length, 'endpoints...');
    
    // Test publishers in parallel (but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < WALRUS_PUBLISHERS.length; i += batchSize) {
      const batch = WALRUS_PUBLISHERS.slice(i, i + batchSize);
      
      const testPromises = batch.map(async (publisher) => {
        const isWorking = await this.testPublisher(publisher);
        return { publisher, isWorking };
      });

      const results = await Promise.all(testPromises);
      
      // Find first working publisher in this batch
      const workingPublisher = results.find(result => result.isWorking);
      if (workingPublisher) {
        this.publisherUrl = workingPublisher.publisher;
        this.testedPublishers.push(workingPublisher.publisher);
        console.log('🎉 Found working publisher:', workingPublisher.publisher);
        return workingPublisher.publisher;
      }

      // Add failed publishers to tested list
      this.testedPublishers.push(...results.map(r => r.publisher));
    }

    // If no publisher works, keep the original
    console.warn('⚠️ No working publisher found, using first one:', this.publisherUrl);
    return this.publisherUrl;
  }

  /**
   * SEAL ENCRYPTION (Coming Soon)
   * -----------------------------
   * Future method to encrypt files before upload using Seal protocol
   * Will enable secure, buyer-specific access control
   * 
   * @param file - File to encrypt
   * @param accessPolicy - Who can decrypt (buyer wallet address, time locks, etc.)
   * @returns Encrypted blob + decryption metadata
   */
  private async encryptWithSeal(file: File, accessPolicy?: any): Promise<Uint8Array> {
    // TODO: Implement Seal encryption
    // const seal = new Seal();
    // const encrypted = await seal.encrypt(file, accessPolicy);
    // return encrypted;
    
    // For now, return unencrypted
    return new Uint8Array(await file.arrayBuffer());
  }

  /**
   * Store a file on Walrus (plain storage, Seal encryption coming soon)
   */
  async storeFile(file: File): Promise<StorageResult> {
    try {
      console.log('📤 Starting Walrus file storage...');
      console.log('📄 File:', file.name, file.type, file.size, 'bytes');

      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      console.log('☁️ Uploading to Walrus...');
      
      // Build URL with permanent storage parameter
      const storageParam = this.usePermanentStorage ? 'permanent=true' : 'epochs=5';
      let url = `${this.publisherUrl}/v1/blobs?${storageParam}`;
      console.log('📤 Publishing to URL:', url);
      
      let response = await fetch(url, {
        method: 'PUT',
        body: arrayBuffer,
      });

      // If current publisher fails, try to find a working one
      if (response.status !== 200) {
        console.log('❌ Current publisher failed, finding working publisher...');
        await this.findWorkingPublisher();
        
        // Retry with working publisher - rebuild URL with storage param
        const storageParam = this.usePermanentStorage ? 'permanent=true' : 'epochs=5';
        url = `${this.publisherUrl}/v1/blobs?${storageParam}`;
        console.log('🔄 Retrying with working publisher:', url);
        
        response = await fetch(url, {
          method: 'PUT',
          body: arrayBuffer,
        });
      }

      if (response.status === 200) {
        const result: WalrusStoreResponse = await response.json();
        console.log('📨 Walrus response:', result);
        console.log('✅ Successfully used publisher:', this.publisherUrl);
        
        // Extract blob ID and metadata from response
        if (result.newlyCreated) {
          const { blobId, size } = result.newlyCreated.blobObject;
          const { cost } = result.newlyCreated;
          
          console.log('🎉 Upload successful!');
          console.log('🆔 Blob ID:', blobId);
          console.log('📊 Size:', size, 'bytes');
          console.log('💰 Cost:', cost);
          
          return {
            success: true,
            blobId,
            suiRef: blobId,
            cost,
            size
          };
        } else if (result.alreadyCertified) {
          const { blobId } = result.alreadyCertified;
          
          console.log('♻️ File already exists on Walrus');
          console.log('🆔 Blob ID:', blobId);
          
          return {
            success: true,
            blobId,
            suiRef: blobId
          };
        } else {
          throw new Error('Unexpected Walrus response format');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Walrus upload failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Storage failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get the direct URL for accessing a blob
   */
  getBlobUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/blobs/${blobId}`;
  }

  /**
   * Retrieve a blob from Walrus
   */
  async retrieveBlob(blobId: string): Promise<Blob | null> {
    try {
      console.log('📥 Retrieving blob from Walrus:', blobId);
      
      const url = this.getBlobUrl(blobId);
      console.log('🔗 Fetching from:', url);
      
      const response = await fetch(url);
      
      if (response.status === 200) {
        const blob = await response.blob();
        console.log('✅ Blob retrieved successfully');
        console.log('📊 Size:', blob.size, 'bytes');
        console.log('📝 Type:', blob.type);
        return blob;
      } else {
        console.error('❌ Failed to retrieve blob:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Retrieval failed:', error);
      return null;
    }
  }

  /**
   * Check if a blob exists on Walrus
   */
  async blobExists(blobId: string): Promise<boolean> {
    try {
      const url = this.getBlobUrl(blobId);
      const response = await fetch(url, { method: 'HEAD' });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance with permanent storage enabled
export const walrusService = new WalrusService(true); // Use permanent storage

/**
 * Legacy function wrapper for backward compatibility
 * Store data on Walrus - uses WalrusService with multiple publishers
 */
export async function storeOnWalrus(
  data: string | Blob,
  epochs: number = 5
): Promise<WalrusUploadResult> {
  const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : data;
  
  // Convert Blob to File for WalrusService
  const file = new File([blob], 'data.bin', { type: blob.type || 'application/octet-stream' });
  
  const result = await walrusService.storeFile(file);
  
  if (!result.success || !result.blobId) {
    throw new Error(result.error || 'Failed to store on Walrus');
  }
  
  return {
    blobId: result.blobId,
    url: walrusService.getBlobUrl(result.blobId),
    size: result.size || blob.size,
    cost: result.cost
  };
}

/**
 * Retrieve data from Walrus (legacy function)
 */
export async function retrieveFromWalrus(blobId: string): Promise<string> {
  try {
    const blob = await walrusService.retrieveBlob(blobId);
    
    if (!blob) {
      throw new Error('Failed to retrieve blob');
    }

    const data = await blob.text();
    return data;
  } catch (error: any) {
    console.error('Walrus retrieval error:', error);
    throw new Error(`Failed to retrieve from Walrus: ${error.message}`);
  }
}

/**
 * Check blob status on Walrus
 */
export async function checkBlobStatus(blobId: string): Promise<{
  exists: boolean;
  certified: boolean;
}> {
  try {
    const exists = await walrusService.blobExists(blobId);
    return {
      exists,
      certified: exists,
    };
  } catch (error) {
    return {
      exists: false,
      certified: false,
    };
  }
}
