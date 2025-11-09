/**
 * Purchase Service - Handles AI Twin access purchases with SUI payments
 * 
 * Flow:
 * 1. User clicks "Purchase" on an AI Twin
 * 2. Wallet prompts for payment (e.g., 2.5 SUI)
 * 3. After successful payment, access is granted
 * 4. Payment is split: 90% to creator, 10% platform fee
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

// Platform wallet that receives the 10% fee
const PLATFORM_WALLET = '0x742e3a5b85f1a7d14e5a5b85f1a7d14e5a5b85f1a7d14e5a5b85f1a7d14e5a5b';

export interface PurchaseParams {
  twinId: string;
  twinName: string;
  price: number; // Price in SUI
  creatorAddress: string;
  buyerAddress: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionDigest?: string;
  error?: string;
}

/**
 * Create a transaction to purchase AI Twin access
 * Sends payment from buyer to creator (90%) and platform (10%)
 */
export async function createPurchaseTransaction(params: PurchaseParams): Promise<Transaction> {
  const { price, creatorAddress, buyerAddress } = params;
  
  const tx = new Transaction();
  
  // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
  const totalAmountInMist = Math.floor(price * 1_000_000_000);
  const platformFeeInMist = Math.floor(totalAmountInMist * 0.1); // 10% platform fee
  const creatorAmountInMist = totalAmountInMist - platformFeeInMist; // 90% to creator
  
  // Split coins for both payments
  const [platformCoin] = tx.splitCoins(tx.gas, [platformFeeInMist]);
  const [creatorCoin] = tx.splitCoins(tx.gas, [creatorAmountInMist]);
  
  // Transfer platform fee to platform wallet
  tx.transferObjects([platformCoin], PLATFORM_WALLET);
  
  // Transfer creator payment to creator wallet
  tx.transferObjects([creatorCoin], creatorAddress);
  
  // Set sender
  tx.setSender(buyerAddress);
  
  return tx;
}

/**
 * Verify transaction success
 */
export async function verifyPurchaseTransaction(
  client: SuiClient,
  transactionDigest: string
): Promise<boolean> {
  try {
    const txResponse = await client.waitForTransaction({
      digest: transactionDigest,
      options: {
        showEffects: true,
      },
    });
    
    return txResponse.effects?.status?.status === 'success';
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

/**
 * Calculate price breakdown
 */
export function calculatePriceBreakdown(price: number) {
  const platformFee = price * 0.1; // 10%
  const creatorReceives = price * 0.9; // 90%
  
  return {
    totalPrice: price,
    platformFee: Number(platformFee.toFixed(2)),
    creatorReceives: Number(creatorReceives.toFixed(2)),
  };
}

/**
 * Record purchase in localStorage (for demo purposes)
 * In production, this would be recorded on-chain or in a database
 */
export function recordPurchase(params: {
  twinId: string;
  twinName: string;
  price: number;
  buyerAddress: string;
  transactionDigest: string;
}) {
  const purchases = JSON.parse(localStorage.getItem('purchasedAccess') || '[]');
  
  const newPurchase = {
    listingId: params.twinId,
    twinName: params.twinName,
    price: params.price,
    purchasedAt: new Date().toISOString(),
    buyer: params.buyerAddress,
    transactionId: params.transactionDigest,
  };
  
  purchases.push(newPurchase);
  localStorage.setItem('purchasedAccess', JSON.stringify(purchases));
  
  return newPurchase;
}

/**
 * Grant access to purchased twin
 */
export function grantTwinAccess(twinId: string) {
  const marketplaceListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
  const purchasedTwin = marketplaceListings.find((l: any) => l.id === twinId);
  
  if (purchasedTwin) {
    const accessibleTwins = JSON.parse(localStorage.getItem('accessibleTwins') || '[]');
    
    // Check if already have access
    const hasAccess = accessibleTwins.some((t: any) => t.id === twinId);
    if (!hasAccess) {
      accessibleTwins.push({
        ...purchasedTwin,
        accessGrantedAt: new Date().toISOString(),
        accessType: 'purchased',
      });
      localStorage.setItem('accessibleTwins', JSON.stringify(accessibleTwins));
    }
  }
}

/**
 * Format SUI amount for display
 */
export function formatSuiAmount(amount: number): string {
  return `${amount.toFixed(2)} SUI`;
}

/**
 * Convert MIST to SUI
 */
export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

/**
 * Convert SUI to MIST
 */
export function suiToMist(sui: number): number {
  return Math.floor(sui * 1_000_000_000);
}
