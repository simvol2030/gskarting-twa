// Быстрая миграция через уже существующий db client
const { db } = require('./dist/db/client.js');
const { sql } = require('drizzle-orm');

console.log('🔄 Создание таблицы pending_discounts...');

try {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS pending_discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      transaction_id INTEGER NOT NULL REFERENCES cashier_transactions(id) ON DELETE CASCADE,
      discount_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'applied', 'failed', 'expired')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      applied_at TEXT,
      expires_at TEXT NOT NULL,
      error_message TEXT
    );
  `);

  console.log('✅ Таблица pending_discounts создана');

  db.run(sql`CREATE INDEX IF NOT EXISTS idx_pending_store_status ON pending_discounts(store_id, status);`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_pending_expires ON pending_discounts(expires_at);`);

  console.log('✅ Индексы созданы');
  console.log('✅ Миграция завершена!');

} catch (error) {
  console.error('❌ Ошибка:', error.message);
}
