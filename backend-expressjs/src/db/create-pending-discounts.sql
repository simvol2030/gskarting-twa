-- Создание таблицы pending_discounts
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

-- Индексы для быстрого polling
CREATE INDEX IF NOT EXISTS idx_pending_store_status ON pending_discounts(store_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_expires ON pending_discounts(expires_at);

-- Индексы для cashier_transactions (если ещё не созданы)
CREATE INDEX IF NOT EXISTS idx_cashier_tx_store ON cashier_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_cashier_tx_customer ON cashier_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cashier_tx_created ON cashier_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cashier_tx_store_created ON cashier_transactions(store_id, created_at);
