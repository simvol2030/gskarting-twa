-- Migration 004: Sellers table for PWA application
-- Продавцы с PIN-авторизацией для мобильного приложения

-- Создаём таблицу продавцов
CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,  -- 4-значный PIN (хэшированный bcrypt)
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Примечание: Поля seller_id и seller_name в transactions добавляются через init.ts
-- так как SQLite не поддерживает ADD COLUMN IF NOT EXISTS
