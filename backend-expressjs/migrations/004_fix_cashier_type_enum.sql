-- Migration: Fix cashier_transactions type enum
-- Created: 2025-12-06
-- Description: Change 'redeem' to 'spend' for consistency with transactions table
-- Issue: BUG-1 - Schema mismatch between migration (redeem) and Drizzle schema (spend)

-- SQLite doesn't support ALTER COLUMN, so we need to:
-- 1. Create new table with correct CHECK constraint
-- 2. Copy data (converting 'redeem' to 'spend')
-- 3. Drop old table
-- 4. Rename new table

-- Step 1: Create new table with corrected CHECK constraint
CREATE TABLE IF NOT EXISTS cashier_transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('earn', 'spend')),
    purchase_amount REAL NOT NULL,
    points_amount INTEGER NOT NULL,
    discount_amount REAL DEFAULT 0 NOT NULL,
    metadata TEXT,
    synced_with_1c INTEGER DEFAULT 0 NOT NULL,
    synced_at TEXT,
    onec_transaction_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES loyalty_users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Step 2: Copy data, converting 'redeem' to 'spend'
INSERT INTO cashier_transactions_new (
    id, customer_id, store_id, type, purchase_amount, points_amount,
    discount_amount, metadata, synced_with_1c, synced_at, onec_transaction_id,
    created_at, updated_at
)
SELECT
    id, customer_id, store_id,
    CASE WHEN type = 'redeem' THEN 'spend' ELSE type END as type,
    purchase_amount, points_amount, discount_amount, metadata,
    synced_with_1c, synced_at, onec_transaction_id, created_at, updated_at
FROM cashier_transactions;

-- Step 3: Drop old table
DROP TABLE IF EXISTS cashier_transactions;

-- Step 4: Rename new table
ALTER TABLE cashier_transactions_new RENAME TO cashier_transactions;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_cashier_tx_store ON cashier_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_cashier_tx_customer ON cashier_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cashier_tx_created ON cashier_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cashier_tx_store_created ON cashier_transactions(store_id, created_at);

-- Migration complete
