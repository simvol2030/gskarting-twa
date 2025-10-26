-- Loyalty System Tables Migration
-- Created: 2025-10-23

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

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    old_price REAL,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    icon_color TEXT NOT NULL,
    deadline TEXT NOT NULL,
    deadline_class TEXT NOT NULL,
    details TEXT NOT NULL,
    conditions TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL
);

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
    is_active INTEGER DEFAULT 1 NOT NULL
);

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

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loyalty_user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    FOREIGN KEY (loyalty_user_id) REFERENCES loyalty_users(id) ON DELETE CASCADE
);
