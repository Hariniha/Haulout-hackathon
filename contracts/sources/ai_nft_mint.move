module ai_twin_marketplace::ai_twin_nft {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // ===== Errors =====
    const ERROR_TWIN_ALREADY_EXISTS: u64 = 1;
    const ERROR_TWIN_NOT_FOUND: u64 = 2;

    // ===== Structs =====
    
    /// NFT representing ownership of an AI Twin
    public struct AITwinNFT has key, store {
        id: UID,
        twin_id: String,
        creator: address,
        name: String,
        description: String,
        training_data_blob_id: String,
        created_at: u64,
        metadata: vector<u8>,
    }

    /// Shared registry to track all AI Twin NFTs
    public struct AITwinRegistry has key {
        id: UID,
        total_minted: u64,
        twins: Table<String, address>, // twin_id -> current_owner
    }

    // ===== Events =====
    
    public struct AITwinMinted has copy, drop {
        twin_id: String,
        nft_id: ID,
        creator: address,
        name: String,
        timestamp: u64,
    }

    public struct AITwinTransferred has copy, drop {
        twin_id: String,
        nft_id: ID,
        from: address,
        to: address,
        timestamp: u64,
    }

    public struct AITwinBurned has copy, drop {
        twin_id: String,
        nft_id: ID,
        owner: address,
        timestamp: u64,
    }

    // ===== Functions =====

    /// Initialize the registry (called once on publish)
    fun init(ctx: &mut TxContext) {
        let registry = AITwinRegistry {
            id: object::new(ctx),
            total_minted: 0,
            twins: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    /// Mint a new AI Twin NFT when user creates an AI twin
    public entry fun mint_ai_twin(
        registry: &mut AITwinRegistry,
        twin_id: vector<u8>,
        name: vector<u8>,
        description: vector<u8>,
        training_data_blob_id: vector<u8>,
        metadata: vector<u8>,
        ctx: &mut TxContext
    ) {
        let twin_id_string = string::utf8(twin_id);
        let creator = tx_context::sender(ctx);
        
        // Ensure twin_id doesn't already exist
        assert!(!table::contains(&registry.twins, twin_id_string), ERROR_TWIN_ALREADY_EXISTS);

        let nft = AITwinNFT {
            id: object::new(ctx),
            twin_id: twin_id_string,
            creator,
            name: string::utf8(name),
            description: string::utf8(description),
            training_data_blob_id: string::utf8(training_data_blob_id),
            created_at: tx_context::epoch(ctx),
            metadata,
        };

        let nft_id = object::id(&nft);
        
        // Register in registry
        table::add(&mut registry.twins, twin_id_string, creator);
        registry.total_minted = registry.total_minted + 1;

        // Emit event
        event::emit(AITwinMinted {
            twin_id: twin_id_string,
            nft_id,
            creator,
            name: string::utf8(name),
            timestamp: tx_context::epoch(ctx),
        });

        // Transfer NFT to creator
        transfer::public_transfer(nft, creator);
    }

    /// Transfer AI Twin NFT to another address
    public entry fun transfer_twin(
        registry: &mut AITwinRegistry,
        nft: AITwinNFT,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let twin_id = nft.twin_id;
        let nft_id = object::id(&nft);

        // Update registry
        if (table::contains(&registry.twins, twin_id)) {
            table::remove(&mut registry.twins, twin_id);
        };
        table::add(&mut registry.twins, twin_id, recipient);

        // Emit event
        event::emit(AITwinTransferred {
            twin_id,
            nft_id,
            from: sender,
            to: recipient,
            timestamp: tx_context::epoch(ctx),
        });

        // Transfer NFT
        transfer::public_transfer(nft, recipient);
    }

    /// Burn AI Twin NFT (delete)
    public entry fun burn_twin(
        registry: &mut AITwinRegistry,
        nft: AITwinNFT,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let twin_id = nft.twin_id;
        let nft_id = object::id(&nft);

        // Remove from registry
        if (table::contains(&registry.twins, twin_id)) {
            table::remove(&mut registry.twins, twin_id);
        };

        // Emit event
        event::emit(AITwinBurned {
            twin_id,
            nft_id,
            owner,
            timestamp: tx_context::epoch(ctx),
        });

        // Destroy NFT
        let AITwinNFT { 
            id, 
            twin_id: _, 
            creator: _, 
            name: _, 
            description: _, 
            training_data_blob_id: _, 
            created_at: _, 
            metadata: _ 
        } = nft;
        object::delete(id);
    }

    // ===== View Functions =====

    /// Get twin owner from registry
    public fun get_twin_owner(registry: &AITwinRegistry, twin_id: String): address {
        assert!(table::contains(&registry.twins, twin_id), ERROR_TWIN_NOT_FOUND);
        *table::borrow(&registry.twins, twin_id)
    }

    /// Check if twin exists
    public fun twin_exists(registry: &AITwinRegistry, twin_id: String): bool {
        table::contains(&registry.twins, twin_id)
    }

    /// Get total minted count
    public fun get_total_minted(registry: &AITwinRegistry): u64 {
        registry.total_minted
    }

    /// Get twin_id from NFT
    public fun get_twin_id(nft: &AITwinNFT): String {
        nft.twin_id
    }
}