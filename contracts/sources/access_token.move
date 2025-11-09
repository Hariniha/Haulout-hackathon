module ai_twin_marketplace::access_token {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;

    // ===== Constants =====
    const SECONDS_PER_DAY: u64 = 86400;

    // ===== Errors =====
    const ERROR_NOT_AUTHORIZED: u64 = 5;

    // ===== Structs =====

    /// NFT representing access rights to an AI Twin
    public struct AccessToken has key, store {
        id: UID,
        twin_id: String,
        owner: address,
        access_type: u8,
        granted_at: u64,
        expires_at: u64,
        encrypted_key: vector<u8>, // Encrypted decryption key for AI twin data
        purchase_listing_id: ID,
        is_active: bool,
        original_seller: address,
    }

    /// Registry to track all access tokens
    public struct AccessRegistry has key {
        id: UID,
        total_granted: u64,
        active_accesses: Table<address, vector<ID>>, // owner -> token_ids
    }

    /// Admin capability for revoking access
    public struct AdminCap has key {
        id: UID,
    }

    // ===== Events =====

    public struct AccessGranted has copy, drop {
        token_id: ID,
        twin_id: String,
        owner: address,
        access_type: u8,
        expires_at: u64,
        timestamp: u64,
    }

    public struct AccessRevoked has copy, drop {
        token_id: ID,
        twin_id: String,
        owner: address,
        reason: String,
        timestamp: u64,
    }

    public struct AccessTransferred has copy, drop {
        token_id: ID,
        twin_id: String,
        from: address,
        to: address,
        timestamp: u64,
    }

    // ===== Functions =====

    /// Initialize registry (called once on publish)
    fun init(ctx: &mut TxContext) {
        let registry = AccessRegistry {
            id: object::new(ctx),
            total_granted: 0,
            active_accesses: table::new(ctx),
        };
        transfer::share_object(registry);

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Mint access token after purchase (called by marketplace)
    public fun mint_access_token(
        registry: &mut AccessRegistry,
        twin_id: vector<u8>,
        owner: address,
        access_type: u8,
        duration_days: u64,
        encrypted_key: vector<u8>,
        listing_id: ID,
        original_seller: address,
        clock: &Clock,
        ctx: &mut TxContext
    ): AccessToken {
        let current_time = clock::timestamp_ms(clock) / 1000; // Convert to seconds
        let expires_at = current_time + (duration_days * SECONDS_PER_DAY);
        
        let twin_id_string = string::utf8(twin_id);

        let token = AccessToken {
            id: object::new(ctx),
            twin_id: twin_id_string,
            owner,
            access_type,
            granted_at: current_time,
            expires_at,
            encrypted_key,
            purchase_listing_id: listing_id,
            is_active: true,
            original_seller,
        };

        let token_id = object::id(&token);

        // Register in registry
        if (!table::contains(&registry.active_accesses, owner)) {
            table::add(&mut registry.active_accesses, owner, vector::empty<ID>());
        };
        
        let owner_tokens = table::borrow_mut(&mut registry.active_accesses, owner);
        vector::push_back(owner_tokens, token_id);
        
        registry.total_granted = registry.total_granted + 1;

        // Emit event
        event::emit(AccessGranted {
            token_id,
            twin_id: twin_id_string,
            owner,
            access_type,
            expires_at,
            timestamp: current_time,
        });

        token
    }

    /// Mint and transfer access token (entry function)
    public entry fun mint_and_transfer_access(
        registry: &mut AccessRegistry,
        twin_id: vector<u8>,
        owner: address,
        access_type: u8,
        duration_days: u64,
        encrypted_key: vector<u8>,
        listing_id: ID,
        original_seller: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let token = mint_access_token(
            registry,
            twin_id,
            owner,
            access_type,
            duration_days,
            encrypted_key,
            listing_id,
            original_seller,
            clock,
            ctx
        );

        transfer::public_transfer(token, owner);
    }

    /// Revoke access token (only by original seller or admin)
    public entry fun revoke_access(
        _admin: &AdminCap,
        token: &mut AccessToken,
        reason: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Only original seller or admin can revoke
        assert!(
            sender == token.original_seller,
            ERROR_NOT_AUTHORIZED
        );

        token.is_active = false;

        event::emit(AccessRevoked {
            token_id: object::id(token),
            twin_id: token.twin_id,
            owner: token.owner,
            reason: string::utf8(reason),
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Check if access is valid (active and not expired)
    public fun check_access(token: &AccessToken, clock: &Clock): bool {
        if (!token.is_active) {
            return false
        };

        let current_time = clock::timestamp_ms(clock) / 1000;
        current_time < token.expires_at
    }

    /// Transfer access token to another user
    public entry fun transfer_access(
        registry: &mut AccessRegistry,
        token: AccessToken,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let token_id = object::id(&token);
        let twin_id = token.twin_id;

        // Update registry
        if (table::contains(&registry.active_accesses, sender)) {
            let sender_tokens = table::borrow_mut(&mut registry.active_accesses, sender);
            let (exists, index) = vector::index_of(sender_tokens, &token_id);
            if (exists) {
                vector::remove(sender_tokens, index);
            };
        };

        if (!table::contains(&registry.active_accesses, recipient)) {
            table::add(&mut registry.active_accesses, recipient, vector::empty<ID>());
        };
        let recipient_tokens = table::borrow_mut(&mut registry.active_accesses, recipient);
        vector::push_back(recipient_tokens, token_id);

        // Emit event
        event::emit(AccessTransferred {
            token_id,
            twin_id,
            from: sender,
            to: recipient,
            timestamp: tx_context::epoch(ctx),
        });

        // Transfer token
        transfer::public_transfer(token, recipient);
    }

    // ===== View Functions =====

    public fun get_encrypted_key(token: &AccessToken): vector<u8> {
        token.encrypted_key
    }

    public fun get_twin_id(token: &AccessToken): String {
        token.twin_id
    }

    public fun get_expires_at(token: &AccessToken): u64 {
        token.expires_at
    }

    public fun is_active(token: &AccessToken): bool {
        token.is_active
    }

    public fun get_access_type(token: &AccessToken): u8 {
        token.access_type
    }
}