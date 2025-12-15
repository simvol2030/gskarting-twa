-- Migration: Add active_checks table for persistent pre-check storage
-- Created: 2025-12-06
-- Description: Replace in-memory preCheckStore with DB table for reliability
-- Issue: BUG-4 - preCheckStore is lost on backend restart

-- Create active_checks table
CREATE TABLE IF NOT EXISTS active_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL UNIQUE,
    store_name TEXT NOT NULL,
    check_amount REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Index for fast lookup by store_id
CREATE INDEX IF NOT EXISTS idx_active_checks_store ON active_checks(store_id);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_active_checks_expires ON active_checks(expires_at);

-- Migration complete
