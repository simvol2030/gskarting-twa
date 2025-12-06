-- Migration: 004_app_customization
-- Description: Add app_customization table for white-label branding and styling
-- Created: 2024-12-06

-- =====================================================
-- APP CUSTOMIZATION TABLE
-- Singleton table (always 1 row with id=1)
-- Allows customizing branding, colors, navigation for any business
-- =====================================================

CREATE TABLE IF NOT EXISTS app_customization (
    id INTEGER PRIMARY KEY DEFAULT 1,

    -- === БРЕНДИНГ ===
    app_name TEXT NOT NULL DEFAULT 'Мурзико',
    app_slogan TEXT NOT NULL DEFAULT 'Лояльность',
    logo_url TEXT NOT NULL DEFAULT '/logo.png',
    favicon_url TEXT DEFAULT '/favicon.ico',

    -- === ЦВЕТОВАЯ СХЕМА (LIGHT THEME) ===
    primary_color TEXT NOT NULL DEFAULT '#ff6b00',
    primary_color_dark TEXT NOT NULL DEFAULT '#e55d00',
    primary_color_light TEXT NOT NULL DEFAULT '#ff8533',
    secondary_color TEXT NOT NULL DEFAULT '#10b981',
    secondary_color_dark TEXT NOT NULL DEFAULT '#059669',
    accent_color TEXT NOT NULL DEFAULT '#dc2626',

    -- === ЦВЕТОВАЯ СХЕМА (DARK THEME) ===
    dark_bg_primary TEXT NOT NULL DEFAULT '#17212b',
    dark_bg_secondary TEXT NOT NULL DEFAULT '#0e1621',
    dark_bg_tertiary TEXT NOT NULL DEFAULT '#1f2c38',
    dark_primary_color TEXT NOT NULL DEFAULT '#ff8533',
    dark_text_primary TEXT NOT NULL DEFAULT '#ffffff',
    dark_text_secondary TEXT NOT NULL DEFAULT '#aaaaaa',
    dark_border_color TEXT NOT NULL DEFAULT '#2b3943',

    -- === НАВИГАЦИЯ ===
    bottom_nav_items TEXT NOT NULL DEFAULT '[{"id":"home","href":"/","label":"Главная","icon":"home","visible":true},{"id":"offers","href":"/offers","label":"Акции","icon":"tag","visible":true},{"id":"stores","href":"/stores","label":"Магазины","icon":"location","visible":true},{"id":"history","href":"/history","label":"Бонусы","icon":"coins","visible":true},{"id":"profile","href":"/profile","label":"Профиль","icon":"user","visible":true}]',

    sidebar_menu_items TEXT NOT NULL DEFAULT '[{"id":"home","href":"/","label":"Главная","icon":"📊","visible":true,"isExternal":false},{"id":"products","href":"/products","label":"Товары","icon":"🛍️","visible":true,"isExternal":false},{"id":"offers","href":"/offers","label":"Акции","icon":"🎁","visible":true,"isExternal":false},{"id":"stores","href":"/stores","label":"Магазины","icon":"🏪","visible":true,"isExternal":false},{"id":"history","href":"/history","label":"История","icon":"📜","visible":true,"isExternal":false},{"id":"profile","href":"/profile","label":"Профиль","icon":"👤","visible":true,"isExternal":false}]',

    -- === МЕТА ===
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ensure only one row exists
    CHECK (id = 1)
);

-- Insert default row if not exists
INSERT OR IGNORE INTO app_customization (id) VALUES (1);

-- Log migration
SELECT 'Migration 004_app_customization completed successfully' as status;
