-- Migration: Loyalty System Tables
-- Created: 2025-10-24
-- Description: Add loyalty users, stores, transactions, and cashier_transactions tables

-- Loyalty Users table
CREATE TABLE IF NOT EXISTS loyalty_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_user_id INTEGER NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    language_code TEXT,
    current_balance REAL DEFAULT 500.0 NOT NULL,
    total_purchases INTEGER DEFAULT 0 NOT NULL,
    total_saved REAL DEFAULT 0 NOT NULL,
    store_id INTEGER,
    first_login_bonus_claimed INTEGER DEFAULT 1 NOT NULL,
    registration_date TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
    chat_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_users_telegram_user_id ON loyalty_users(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_users_is_active ON loyalty_users(is_active);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    hours TEXT NOT NULL,
    features TEXT NOT NULL,
    icon_color TEXT NOT NULL,
    coords_lat REAL NOT NULL,
    coords_lng REAL NOT NULL,
    status TEXT NOT NULL,
    distance TEXT NOT NULL,
    closed INTEGER DEFAULT 0 NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    terminal_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loyalty_user_id INTEGER NOT NULL,
    store_id INTEGER,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('earn', 'spend')),
    spent TEXT,
    store_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (loyalty_user_id) REFERENCES loyalty_users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_loyalty_user_id ON transactions(loyalty_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Cashier Transactions table
CREATE TABLE IF NOT EXISTS cashier_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('earn', 'redeem')),
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

CREATE INDEX IF NOT EXISTS idx_cashier_transactions_customer_id ON cashier_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cashier_transactions_store_id ON cashier_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_cashier_transactions_created_at ON cashier_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashier_transactions_synced ON cashier_transactions(synced_with_1c);

-- Insert sample data
-- Sample store
INSERT INTO stores (name, address, phone, hours, features, icon_color, coords_lat, coords_lng, status, distance, closed, is_active, terminal_id)
VALUES (
    'Murzico - Центральный',
    'ул. Ленина, 42, г. Москва',
    '+7 (495) 123-45-67',
    'Пн-Вс: 09:00-21:00',
    '["Wi-Fi", "Парковка", "Доставка"]',
    '#667eea',
    55.7558,
    37.6173,
    'Открыт',
    '1.2 км',
    0,
    1,
    'TERMINAL-001'
);

-- Sample loyalty users
INSERT INTO loyalty_users (telegram_user_id, first_name, last_name, username, language_code, current_balance, total_purchases, total_saved, store_id, first_login_bonus_claimed, chat_id, is_active)
VALUES
    (123456789, 'Иван', 'Петров', 'ivan_petrov', 'ru', 1500.0, 5, 250.0, 1, 1, 123456789, 1),
    (987654321, 'Мария', 'Сидорова', 'maria_sidorova', 'ru', 2300.0, 12, 450.0, 1, 1, 987654321, 1),
    (555555555, 'Алексей', 'Иванов', 'alex_ivanov', 'ru', 800.0, 3, 100.0, 1, 1, 555555555, 1);

-- Migration complete
