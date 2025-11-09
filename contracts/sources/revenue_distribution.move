module ai_twin_marketplace::revenue_distribution {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::table::{Self, Table};

    // ===== Errors =====
    const ERROR_INSUFFICIENT_BALANCE: u64 = 0;
    const ERROR_NO_EARNINGS: u64 = 1;

    // ===== Structs =====

    /// Shared object to manage revenue for all users
    public struct RevenuePool has key {
        id: UID,
        balances: Table<address, Balance<SUI>>, // user -> balance
        total_platform_fees: Balance<SUI>,
        platform_fee_recipient: address,
    }

    // ===== Events =====

    public struct SaleRecorded has copy, drop {
        seller: address,
        amount: u64,
        platform_fee: u64,
        timestamp: u64,
    }

    public struct EarningsWithdrawn has copy, drop {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    public struct PlatformFeesWithdrawn has copy, drop {
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    // ===== Functions =====

    /// Initialize revenue pool (called once on publish)
    fun init(ctx: &mut TxContext) {
        let pool = RevenuePool {
            id: object::new(ctx),
            balances: table::new(ctx),
            total_platform_fees: balance::zero<SUI>(),
            platform_fee_recipient: tx_context::sender(ctx),
        };
        transfer::share_object(pool);
    }

    /// Record a sale and add earnings to seller's balance
    public fun record_sale(
        pool: &mut RevenuePool,
        seller: address,
        seller_payment: Coin<SUI>,
        platform_fee: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let seller_amount = coin::value(&seller_payment);
        let fee_amount = coin::value(&platform_fee);

        // Add seller payment to their balance
        if (!table::contains(&pool.balances, seller)) {
            table::add(&mut pool.balances, seller, balance::zero<SUI>());
        };
        
        let seller_balance = table::borrow_mut(&mut pool.balances, seller);
        balance::join(seller_balance, coin::into_balance(seller_payment));

        // Add platform fee to pool
        balance::join(&mut pool.total_platform_fees, coin::into_balance(platform_fee));

        // Emit event
        event::emit(SaleRecorded {
            seller,
            amount: seller_amount,
            platform_fee: fee_amount,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Withdraw earnings (seller withdraws their balance)
    public entry fun withdraw_earnings(
        pool: &mut RevenuePool,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Check if user has balance
        assert!(table::contains(&pool.balances, user), ERROR_NO_EARNINGS);
        
        let user_balance = table::borrow_mut(&mut pool.balances, user);
        let balance_value = balance::value(user_balance);
        
        assert!(balance_value > 0, ERROR_INSUFFICIENT_BALANCE);

        // Withdraw full balance
        let withdrawn_balance = balance::split(user_balance, balance_value);
        let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);

        // Emit event
        event::emit(EarningsWithdrawn {
            user,
            amount: balance_value,
            timestamp: tx_context::epoch(ctx),
        });

        // Transfer to user
        transfer::public_transfer(withdrawn_coin, user);
    }

    /// Withdraw platform fees (only platform admin)
    public entry fun withdraw_platform_fees(
        pool: &mut RevenuePool,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Only platform fee recipient can withdraw
        assert!(sender == pool.platform_fee_recipient, ERROR_NO_EARNINGS);
        
        let total_fees = balance::value(&pool.total_platform_fees);
        assert!(amount <= total_fees, ERROR_INSUFFICIENT_BALANCE);

        // Withdraw requested amount
        let withdrawn_balance = balance::split(&mut pool.total_platform_fees, amount);
        let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);

        // Emit event
        event::emit(PlatformFeesWithdrawn {
            recipient: sender,
            amount,
            timestamp: tx_context::epoch(ctx),
        });

        // Transfer to platform recipient
        transfer::public_transfer(withdrawn_coin, sender);
    }

    // ===== View Functions =====

    /// Get user's available balance
    public fun get_balance(pool: &RevenuePool, user: address): u64 {
        if (!table::contains(&pool.balances, user)) {
            return 0
        };
        
        let user_balance = table::borrow(&pool.balances, user);
        balance::value(user_balance)
    }

    /// Get total platform fees collected
    public fun get_platform_fees(pool: &RevenuePool): u64 {
        balance::value(&pool.total_platform_fees)
    }

    /// Get platform fee recipient address
    public fun get_platform_recipient(pool: &RevenuePool): address {
        pool.platform_fee_recipient
    }
}