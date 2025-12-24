-- Add delivery_location_id column to orders table
-- Migration: Add support for delivery locations in orders
-- Date: 2025-12-21

-- Add the column (nullable, will be NULL for existing orders)
ALTER TABLE orders ADD COLUMN delivery_location_id INTEGER REFERENCES delivery_locations(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders(delivery_location_id);
