import { drizzle as drizzleSQLite, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres, NodePgDatabase } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { join } from 'path';
import * as schema from './schema';

/**
 * Тип базы данных - переключатель между SQLite и PostgreSQL
 * Изменить значение для переключения БД:
 * - 'sqlite' - использовать SQLite (по умолчанию для разработки)
 * - 'postgres' - использовать PostgreSQL (для production)
 */
const DATABASE_TYPE = (process.env.DATABASE_TYPE || 'sqlite') as 'sqlite' | 'postgres';

/**
 * Пути к базам данных
 */
const SQLITE_PATH = join(process.cwd(), '..', 'data', 'db', 'sqlite', 'app.db');
const POSTGRES_CONNECTION_STRING =
	process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/projectbox';

/**
 * Инициализация Drizzle клиента
 * Автоматически выбирает драйвер в зависимости от DATABASE_TYPE
 */
function initializeDrizzle(): BetterSQLite3Database<typeof schema> {
	// 🔴 TEMPORARY: Frontend БД отключена - всё через Backend API
	// Это решает проблему Windows/WSL конфликта доступа к БД
	console.log('⚠️ Frontend DB disabled - using Backend API only');

	// Возвращаем mock объект (не используется в cashier)
	return null as any;
}

/**
 * Экспортируемый Drizzle клиент
 * Типизирован как SQLite (основной драйвер для разработки)
 */
export const db = initializeDrizzle();

/**
 * Прямой доступ к нативному клиенту БД (для специфичных операций)
 * Используйте с осторожностью! Предпочитайте методы Drizzle ORM
 */
export const nativeClient = DATABASE_TYPE === 'postgres'
	? undefined // Pool не экспортируется для PostgreSQL
	: new Database(SQLITE_PATH);

/**
 * Информация о текущем типе БД
 */
export const dbInfo = {
	type: DATABASE_TYPE,
	path: DATABASE_TYPE === 'sqlite' ? SQLITE_PATH : POSTGRES_CONNECTION_STRING,
	isProduction: process.env.NODE_ENV === 'production'
};

console.log(`✅ Database initialized: ${dbInfo.type} (${dbInfo.isProduction ? 'production' : 'development'})`);
