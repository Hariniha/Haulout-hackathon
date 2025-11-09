module ai_twin_marketplace::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use ai_twin_marketplace::ai_twin_nft::{Self, AITwinNFT};

    // ===== Constants =====
    const PLATFORM_FEE_PERCENT: u64 = 5; // 5% platform fee
    const ACCESS_TYPE_FULL: u8 = 1;
    const ACCESS_TYPE_LIMITED: u8 = 2;
    const ACCESS_TYPE_TEMPORARY: u8 = 3;

    // ===== Errors =====
    const ERROR_INSUFFICIENT_PAYMENT: u64 = 1;
    const ERROR_LISTING_INACTIVE: u64 = 2;
    const ERROR_INVALID_ACCESS_TYPE: u64 = 3;
    const ERROR_NOT_SELLER: u64 = 4;

    // ===== Structs =====

    /// Listing for an AI Twin on the marketplace
    public struct Listing has key, store {
        id: UID,
        twin_id: String,
        nft_id: ID,
        seller: address,
        price: u64, // in MIST (1 SUI = 1,000,000,000 MIST)
        access_type: u8,
        access_duration_days: u64,
        terms: String,
        is_active: bool,
        created_at: u64,
    }

    /// Marketplace registry to track all listings and stats
    public struct MarketplaceRegistry has key {
        id: UID,
        platform_fee_percent: u64,
        platform_fee_recipient: address,
        total_listings: u64,
        total_sales: u64,
        total_volume: u64, // Total SUI traded
        listings: Table<ID, bool>, // listing_id -> is_active
    }

    // ===== Events =====

    public struct ListingCreated has copy, drop {
        listing_id: ID,
        twin_id: String,
        seller: address,
        price: u64,
        access_type: u8,
        timestamp: u64,
    }

    public struct ListingUpdated has copy, drop {
        listing_id: ID,
        new_price: u64,
        new_terms: String,
        timestamp: u64,
    }

    public struct ListingDelisted has copy, drop {
        listing_id: ID,
        twin_id: String,
        seller: address,
        timestamp: u64,
    }

    public struct PurchaseCompleted has copy, drop {
        listing_id: ID,
        twin_id: String,
        buyer: address,
        seller: address,
        price: u64,
        platform_fee: u64,
        seller_amount: u64,
        timestamp: u64,
    }

    // ===== Functions =====

    /// Initialize marketplace (called once on publish)
    fun init(ctx: &mut TxContext) {
        let registry = MarketplaceRegistry {
            id: object::new(ctx),
            platform_fee_percent: PLATFORM_FEE_PERCENT,
            platform_fee_recipient: tx_context::sender(ctx),
            total_listings: 0,
            total_sales: 0,
            total_volume: 0,
            listings: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    /// List an AI Twin for sale (NFT stays with seller until purchase)
    public entry fun list_ai_twin(
        registry: &mut MarketplaceRegistry,
        nft: &AITwinNFT,
        price: u64,
        access_type: u8,
        access_duration_days: u64,
        terms: vector<u8>,
        ctx: &mut TxContext
    ) {
        let seller = tx_context::sender(ctx);
        
        // Validate access type
        assert!(
            access_type == ACCESS_TYPE_FULL || 
            access_type == ACCESS_TYPE_LIMITED || 
            access_type == ACCESS_TYPE_TEMPORARY,
            ERROR_INVALID_ACCESS_TYPE
        );

        // Get NFT details
        let nft_id = object::id(nft);
        let twin_id = ai_twin_nft::get_twin_id(nft);

        let listing = Listing {
            id: object::new(ctx),
            twin_id,
            nft_id,
            seller,
            price,
            access_type,
            access_duration_days,
            terms: string::utf8(terms),
            is_active: true,
            created_at: tx_context::epoch(ctx),
        };

        let listing_id = object::id(&listing);

        // Register listing
        table::add(&mut registry.listings, listing_id, true);
        registry.total_listings = registry.total_listings + 1;

        // Emit event
        event::emit(ListingCreated {
            listing_id,
            twin_id,
            seller,
            price,
            access_type,
            timestamp: tx_context::epoch(ctx),
        });

        // Share listing object
        transfer::share_object(listing);
    }

    /// Update listing price and terms
    public entry fun update_listing(
        listing: &mut Listing,
        new_price: u64,
        new_terms: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == listing.seller, ERROR_NOT_SELLER);
        assert!(listing.is_active, ERROR_LISTING_INACTIVE);

        listing.price = new_price;
        listing.terms = string::utf8(new_terms);

        event::emit(ListingUpdated {
            listing_id: object::id(listing),
            new_price,
            new_terms: string::utf8(new_terms),
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Delist an AI Twin (cancel listing)
    public entry fun delist_ai_twin(
        registry: &mut MarketplaceRegistry,
        listing: &mut Listing,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == listing.seller, ERROR_NOT_SELLER);
        assert!(listing.is_active, ERROR_LISTING_INACTIVE);

        listing.is_active = false;
        
        let listing_id = object::id(listing);
        if (table::contains(&registry.listings, listing_id)) {
            table::remove(&mut registry.listings, listing_id);
        };

        event::emit(ListingDelisted {
            listing_id,
            twin_id: listing.twin_id,
            seller: listing.seller,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Purchase access to AI Twin (transfers NFT and creates access token)
    public fun purchase_access(
        registry: &mut MarketplaceRegistry,
        listing: &mut Listing,
        nft: AITwinNFT,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ): (AITwinNFT, Coin<SUI>, Coin<SUI>, Coin<SUI>) {
        let buyer = tx_context::sender(ctx);
        
        // Verify listing is active
        assert!(listing.is_active, ERROR_LISTING_INACTIVE);
        
        // Verify payment amount
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= listing.price, ERROR_INSUFFICIENT_PAYMENT);

        // Calculate fees
        let platform_fee = (listing.price * registry.platform_fee_percent) / 100;
        let seller_amount = listing.price - platform_fee;

        // Split payment
        let platform_fee_coin = coin::split(&mut payment, platform_fee, ctx);
        let seller_payment = coin::split(&mut payment, seller_amount, ctx);

        // Mark listing as inactive
        listing.is_active = false;

        // Update registry stats
        registry.total_sales = registry.total_sales + 1;
        registry.total_volume = registry.total_volume + listing.price;

        // Emit event
        event::emit(PurchaseCompleted {
            listing_id: object::id(listing),
            twin_id: listing.twin_id,
            buyer,
            seller: listing.seller,
            price: listing.price,
            platform_fee,
            seller_amount,
            timestamp: tx_context::epoch(ctx),
        });

        // Return: NFT for buyer, platform fee, seller payment, change
        (nft, platform_fee_coin, seller_payment, payment)
    }

    /// Complete purchase by transferring assets
    public entry fun complete_purchase(
        registry: &mut MarketplaceRegistry,
        listing: &mut Listing,
        nft: AITwinNFT,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        
        let (nft_for_buyer, platform_fee, seller_payment, change) = 
            purchase_access(registry, listing, nft, payment, ctx);

        // Transfer NFT to buyer
        transfer::public_transfer(nft_for_buyer, buyer);

        // Transfer platform fee
        transfer::public_transfer(platform_fee, registry.platform_fee_recipient);

        // Transfer payment to seller
        transfer::public_transfer(seller_payment, listing.seller);

        // Return change to buyer
        if (coin::value(&change) > 0) {
            transfer::public_transfer(change, buyer);
        } else {
            coin::destroy_zero(change);
        };
    }

    // ===== View Functions =====

    public fun get_listing_price(listing: &Listing): u64 {
        listing.price
    }

    public fun is_listing_active(listing: &Listing): bool {
        listing.is_active
    }

    public fun get_seller(listing: &Listing): address {
        listing.seller
    }

    public fun get_twin_id(listing: &Listing): String {
        listing.twin_id
    }
}