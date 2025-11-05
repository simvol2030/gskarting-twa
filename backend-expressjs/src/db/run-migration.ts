/**
 * Скрипт для применения миграции pending_discounts
 * Запуск: npx tsx src/db/run-migration.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

const SQLITE_PATH = join(process.cwd(), '..', 'data', 'db', 'sqlite', 'app.db');
const MIGRATION_SQL = join(__dirname, 'create-pending-discounts.sql');

console.log('🔄 Применение миграции pending_discounts...');
console.log(`📁 База данных: ${SQLITE_PATH}`);

const db = new Database(SQLITE_PATH);

try {
  const migration = readFileSync(MIGRATION_SQL, 'utf8');

  db.exec(migration);

  console.log('✅ Миграция применена успешно!');
  console.log('✅ Таблица pending_discounts создана');
  console.log('✅ Индексы созданы');

} catch (error) {
  console.error('❌ Ошибка миграции:', error);
  process.exit(1);
} finally {
  db.close();
}
