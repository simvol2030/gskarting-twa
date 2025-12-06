-- Migration: Add card_number and missing fields
-- Created: 2025-12-06
-- Description: Add card_number column to loyalty_users table
-- Issues: BUG-3 - card_number missing, API search fails

-- Step 1: Add card_number column to loyalty_users
ALTER TABLE loyalty_users ADD COLUMN card_number TEXT UNIQUE;

-- Step 2: Generate card numbers for existing users (6-digit based on id)
-- Format: 100000 + id (ensures 6 digits starting from 100001)
UPDATE loyalty_users
SET card_number = CAST(100000 + id AS TEXT)
WHERE card_number IS NULL;

-- Step 3: Create index for fast card lookup
CREATE INDEX IF NOT EXISTS idx_loyalty_users_card_number ON loyalty_users(card_number);

-- Step 4: Add missing columns to transactions table if not exist
-- These are used for detailed transaction history
ALTER TABLE transactions ADD COLUMN check_amount REAL;
ALTER TABLE transactions ADD COLUMN points_redeemed REAL;
ALTER TABLE transactions ADD COLUMN cashback_earned REAL;

-- Step 5: Add pending_discounts table if not exists
CREATE TABLE IF NOT EXISTS pending_discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    discount_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK(status IN ('pending', 'processing', 'applied', 'failed', 'expired')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    applied_at TEXT,
    expires_at TEXT NOT NULL,
    error_message TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pending_store_status ON pending_discounts(store_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_expires ON pending_discounts(expires_at);

-- Step 6: Add loyalty_settings table if not exists
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    earning_percent REAL DEFAULT 4.0 NOT NULL,
    max_discount_percent REAL DEFAULT 20.0 NOT NULL,
    expiry_days INTEGER DEFAULT 45 NOT NULL,
    welcome_bonus REAL DEFAULT 500.0 NOT NULL,
    birthday_bonus REAL DEFAULT 0.0 NOT NULL,
    min_redemption_amount REAL DEFAULT 1.0 NOT NULL,
    points_name TEXT DEFAULT 'Мурзи-коины' NOT NULL,
    support_email TEXT,
    support_phone TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default settings if not exists
INSERT OR IGNORE INTO loyalty_settings (id) VALUES (1);

-- Step 7: Add city column to stores if not exists
ALTER TABLE stores ADD COLUMN city TEXT;

-- Migration complete
