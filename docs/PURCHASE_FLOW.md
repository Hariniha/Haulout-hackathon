# Purchase Flow Documentation

## Overview
The AI Twin Marketplace purchase system handles SUI token payments for granting access to AI Digital Twins. The system splits payments between creators (90%) and the platform (10%).

## Flow Diagram

```
User clicks "Purchase" 
    ↓
Wallet prompts for payment (e.g., 2.5 SUI)
    ↓
Transaction created with split payment:
  - 90% → Creator wallet (2.25 SUI)
  - 10% → Platform wallet (0.25 SUI)
    ↓
User signs transaction
    ↓
Transaction executed on Sui blockchain
    ↓
Purchase recorded in localStorage
    ↓
Access granted to AI Twin
    ↓
Success message shown
```

## Implementation Files

### 1. Purchase Service (`lib/services/purchaseService.ts`)
Core service handling payment logic:
- `createPurchaseTransaction()` - Creates SUI payment transaction
- `verifyPurchaseTransaction()` - Verifies transaction success
- `calculatePriceBreakdown()` - Calculates platform fee and creator payment
- `recordPurchase()` - Records purchase in localStorage
- `grantTwinAccess()` - Grants user access to purchased twin

### 2. Buy Access Modal (`components/marketplace/BuyAccessModal.tsx`)
UI component for purchase flow:
- Displays price breakdown
- Shows creator and platform fee split
- Handles wallet connection check
- Executes payment transaction
- Shows success/error states

### 3. Create Twin Page (`app/create-twin/page.tsx`)
Stores creator wallet address when listing:
- Captures `account.address` when twin is listed
- Saves creator address to marketplace listing
- Used for routing payments to creators

## Payment Split

**Example: 2.5 SUI Purchase**
- Total Price: 2.50 SUI
- Platform Fee (10%): 0.25 SUI → Platform wallet
- Creator Receives (90%): 2.25 SUI → Creator wallet

## Configuration

### Platform Wallet
Located in `lib/services/purchaseService.ts`:
```typescript
const PLATFORM_WALLET = '0x742e3a5b85f1a7d14e5a5b85f1a7d14e5a5b85f1a7d14e5a5b85f1a7d14e5a5b';
```

**⚠️ Important:** Update this with your actual platform wallet address before deployment!

## Currency Conversion

- 1 SUI = 1,000,000,000 MIST
- All blockchain transactions use MIST
- UI displays SUI (user-friendly)
- Automatic conversion: `Math.floor(sui * 1_000_000_000)`

## Usage Example

### Listing an AI Twin (Creator)
```typescript
// User lists their AI twin on marketplace
handleSetPrice(100, true); // 100 SUI, public listing

// System stores:
{
  id: "twin_123",
  name: "My AI Twin",
  price: 100,
  creator: "0x1234...", // Creator's wallet address
  isPublic: true
}
```

### Purchasing Access (Buyer)
```typescript
// User clicks "Purchase" button
// Modal shows price breakdown:
// - Access Price: 100 SUI
// - Platform Fee (10%): 10 SUI
// - Creator Receives (90%): 90 SUI
// - You Pay: 100 SUI

// Transaction created:
const tx = await createPurchaseTransaction({
  twinId: "twin_123",
  twinName: "My AI Twin",
  price: 100,
  creatorAddress: "0x1234...",
  buyerAddress: "0x5678..."
});

// User signs and executes
const result = await signAndExecute({ transaction: tx });

// Purchase recorded
recordPurchase({
  twinId: "twin_123",
  twinName: "My AI Twin",
  price: 100,
  buyerAddress: "0x5678...",
  transactionDigest: result.digest
});

// Access granted
grantTwinAccess("twin_123");
```

## Error Handling

The system handles common errors:
- ❌ **Insufficient Balance**: "Insufficient SUI balance to complete purchase"
- ❌ **Transaction Rejected**: "Transaction was rejected. Please try again"
- ❌ **Wallet Not Connected**: "Please connect your wallet first"
- ❌ **Network Error**: Generic error message with retry option

## Testing

### Test Flow
1. **Setup**: Connect wallet with testnet SUI
2. **Create Twin**: Create an AI twin
3. **List on Marketplace**: Set price (e.g., 0.1 SUI for testing)
4. **Connect Second Wallet**: Switch to buyer account
5. **Purchase**: Click "Purchase" on the listing
6. **Verify Payment**: Check both wallets for balance changes
7. **Verify Access**: Check buyer can now chat with purchased twin

### Recommended Test Amounts
- **Development**: 0.1 SUI (100,000,000 MIST)
- **Staging**: 1 SUI (1,000,000,000 MIST)
- **Production**: Actual pricing (e.g., 100-1000 SUI)

## Security Considerations

1. **Wallet Verification**: Always check `account.address` before transactions
2. **Amount Validation**: Validate price is positive and reasonable
3. **Transaction Verification**: Verify transaction success on-chain
4. **Double Purchase**: Check if user already has access before allowing purchase
5. **Creator Address**: Verify creator address exists before creating transaction

## Future Enhancements

- [ ] On-chain purchase records (instead of localStorage)
- [ ] Refund mechanism
- [ ] Subscription-based pricing
- [ ] Bulk purchase discounts
- [ ] Creator royalties for secondary sales
- [ ] Price history tracking
- [ ] Purchase analytics dashboard

## Support

For issues or questions:
1. Check transaction on [Sui Explorer](https://suiexplorer.com/)
2. Verify wallet balances
3. Check browser console for error logs
4. Review purchase records in localStorage
