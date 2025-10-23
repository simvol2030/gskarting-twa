/**
 * Временный скрипт для создания таблиц в SQLite
 * Используется только для инициализации, потом можно удалить
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), '..', 'data', 'db', 'sqlite', 'app.db');
const db = new Database(DB_PATH);

// Включаем WAL режим
db.pragma('journal_mode = WAL');

// Создаём таблицы
db.exec(`
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	user_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	content TEXT,
	published INTEGER DEFAULT 0 NOT NULL,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL,
	role TEXT DEFAULT 'viewer' NOT NULL,
	name TEXT NOT NULL,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`);

console.log('✅ Tables created successfully!');
db.close();
