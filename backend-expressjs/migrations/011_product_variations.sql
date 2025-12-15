-- Migration: Product Variations Support
-- Description: Add support for product variations (sizes, volumes, colors, etc.)
-- Date: 2024-12-15

-- Add variation_attribute column to products table
-- This stores the name of the variation type (e.g., "Размер", "Объём", "Цвет")
ALTER TABLE products ADD COLUMN variation_attribute TEXT;

-- Create product_variations table
CREATE TABLE IF NOT EXISTS product_variations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,                    -- e.g., "25 см", "500 мл", "M", "Красный"
    price REAL NOT NULL,
    old_price REAL,                        -- For showing discounts
    sku TEXT,                              -- SKU for this specific variation
    position INTEGER DEFAULT 0,            -- Sort order
    is_default INTEGER DEFAULT 0,          -- Default variation (shown in catalog)
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_is_default ON product_variations(is_default);
CREATE INDEX IF NOT EXISTS idx_product_variations_is_active ON product_variations(is_active);

-- Add variation_id to cart_items to track which variation was added
ALTER TABLE cart_items ADD COLUMN variation_id INTEGER REFERENCES product_variations(id);

-- Add variation_id to order_items to track which variation was ordered
ALTER TABLE order_items ADD COLUMN variation_id INTEGER REFERENCES product_variations(id);
ALTER TABLE order_items ADD COLUMN variation_name TEXT;  -- Store name for historical reference
