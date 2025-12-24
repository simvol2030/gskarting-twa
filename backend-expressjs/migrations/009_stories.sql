-- Migration: 007_stories.sql
-- Description: Web Stories module (highlights, items, settings, analytics)
-- Date: 2025-12-07

-- ============================================
-- 1. STORIES HIGHLIGHTS (Groups/Circles)
-- ============================================
CREATE TABLE IF NOT EXISTS stories_highlights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover_image TEXT,
    position INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_highlights_position ON stories_highlights(position);
CREATE INDEX IF NOT EXISTS idx_highlights_active ON stories_highlights(is_active);
CREATE INDEX IF NOT EXISTS idx_highlights_active_position ON stories_highlights(is_active, position);

-- ============================================
-- 2. STORIES ITEMS (Content inside highlights)
-- ============================================
CREATE TABLE IF NOT EXISTS stories_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    highlight_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('photo', 'video')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 5,
    link_url TEXT,
    link_text TEXT,
    position INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (highlight_id) REFERENCES stories_highlights(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_highlight ON stories_items(highlight_id);
CREATE INDEX IF NOT EXISTS idx_items_position ON stories_items(highlight_id, position);
CREATE INDEX IF NOT EXISTS idx_items_active ON stories_items(is_active);

-- ============================================
-- 3. STORIES SETTINGS (Singleton configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS stories_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enabled INTEGER DEFAULT 1,
    shape TEXT DEFAULT 'circle' CHECK(shape IN ('circle', 'square')),
    border_width INTEGER DEFAULT 3,
    border_color TEXT DEFAULT '#ff6b00',
    border_gradient TEXT,
    show_title INTEGER DEFAULT 1,
    title_position TEXT DEFAULT 'bottom' CHECK(title_position IN ('bottom', 'inside')),
    highlight_size INTEGER DEFAULT 70,
    max_video_duration INTEGER DEFAULT 45,
    max_video_size_mb INTEGER DEFAULT 50,
    auto_convert_webp INTEGER DEFAULT 1,
    webp_quality INTEGER DEFAULT 85,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Initialize singleton row
INSERT OR IGNORE INTO stories_settings (id) VALUES (1);

-- ============================================
-- 4. STORIES VIEWS (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS stories_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_item_id INTEGER NOT NULL,
    user_id INTEGER,
    session_id TEXT,
    view_duration REAL DEFAULT 0,
    completed INTEGER DEFAULT 0,
    link_clicked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (story_item_id) REFERENCES stories_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES loyalty_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_views_item ON stories_views(story_item_id);
CREATE INDEX IF NOT EXISTS idx_views_user ON stories_views(user_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON stories_views(created_at);
CREATE INDEX IF NOT EXISTS idx_views_item_date ON stories_views(story_item_id, created_at);

-- ============================================
-- 5. TRIGGER for updated_at
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_stories_highlights_timestamp
    AFTER UPDATE ON stories_highlights
    FOR EACH ROW
BEGIN
    UPDATE stories_highlights SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_stories_items_timestamp
    AFTER UPDATE ON stories_items
    FOR EACH ROW
BEGIN
    UPDATE stories_items SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_stories_settings_timestamp
    AFTER UPDATE ON stories_settings
    FOR EACH ROW
BEGIN
    UPDATE stories_settings SET updated_at = datetime('now') WHERE id = OLD.id;
END;
