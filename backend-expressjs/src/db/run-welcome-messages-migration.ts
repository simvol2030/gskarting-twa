/**
 * Скрипт для применения миграции welcome_messages
 * Запуск: npx tsx src/db/run-welcome-messages-migration.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

const SQLITE_PATH = join(process.cwd(), '..', '..', 'data', 'db', 'sqlite', 'app.db');
const MIGRATION_SQL = join(process.cwd(), 'migrations', '007_welcome_messages.sql');

console.log('🔄 Применение миграции welcome_messages...');
console.log(`📁 База данных: ${SQLITE_PATH}`);
console.log(`📁 Миграция: ${MIGRATION_SQL}`);

const db = new Database(SQLITE_PATH);

try {
	const migration = readFileSync(MIGRATION_SQL, 'utf8');

	db.exec(migration);

	console.log('✅ Миграция применена успешно!');
	console.log('✅ Таблица welcome_messages создана');
	console.log('✅ Индексы созданы');
	console.log('✅ Начальные данные загружены (3 сообщения)');
} catch (error) {
	console.error('❌ Ошибка миграции:', error);
	process.exit(1);
} finally {
	db.close();
}
