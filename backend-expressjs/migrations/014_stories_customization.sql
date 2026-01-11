-- Migration: 014_stories_customization
-- Description: Add Stories (Highlights) customization fields to app_customization table
-- Created: 2026-01-11

-- =====================================================
-- Add Stories-related customization fields
-- =====================================================

-- Цвет обводки хайлайтов (единый для светлой и тёмной темы)
ALTER TABLE app_customization ADD COLUMN stories_border_color TEXT NOT NULL DEFAULT '#ff6b00';

-- Цвет текста под хайлайтами (светлая тема)
ALTER TABLE app_customization ADD COLUMN stories_title_color_light TEXT NOT NULL DEFAULT '#374151';

-- Цвет текста под хайлайтами (тёмная тема)
ALTER TABLE app_customization ADD COLUMN stories_title_color_dark TEXT NOT NULL DEFAULT '#ffffff';

-- Log migration
SELECT 'Migration 014_stories_customization completed successfully' as status;
