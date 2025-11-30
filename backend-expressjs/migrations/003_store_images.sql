-- Migration: Add store_images table for store photo gallery
-- Date: 2025-11-30

-- Store Images table - изображения магазинов для слайдера в TWA
CREATE TABLE IF NOT EXISTS store_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_images_store_id ON store_images(store_id);
CREATE INDEX IF NOT EXISTS idx_store_images_sort ON store_images(store_id, sort_order);
