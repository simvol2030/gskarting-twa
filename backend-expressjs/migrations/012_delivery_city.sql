-- Migration: Add delivery_city field to orders table
-- Date: 2025-12-18
-- Description: Adds city/town field for delivery addresses

-- Add delivery_city column to orders table
ALTER TABLE orders ADD COLUMN delivery_city TEXT;
