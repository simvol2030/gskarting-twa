/**
 * Script to create cashier_transactions table
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/db/sqlite/app.db');

async function createCashierTransactionsTable() {
	console.log('Opening database:', DB_PATH);
	const db = new Database(DB_PATH);

	try {
		console.log('Creating cashier_transactions table...');

		db.exec(`
			CREATE TABLE IF NOT EXISTS cashier_transactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				customer_id INTEGER NOT NULL,
				store_id INTEGER NOT NULL,
				type TEXT NOT NULL,
				purchase_amount REAL NOT NULL,
				points_amount INTEGER NOT NULL,
				discount_amount REAL DEFAULT 0 NOT NULL,
				metadata TEXT,
				synced_with_1c INTEGER DEFAULT 0 NOT NULL,
				synced_at TEXT,
				onec_transaction_id TEXT,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
				FOREIGN KEY (customer_id) REFERENCES loyalty_users(id) ON DELETE CASCADE,
				FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
			)
		`);

		console.log('✓ cashier_transactions table created successfully');

		// Verify table exists
		const tableInfo = db.pragma('table_info(cashier_transactions)');
		console.log('\n=== cashier_transactions Table Schema ===');
		console.table(tableInfo);

		console.log('\n✓ Migration completed successfully!');
	} catch (error) {
		console.error('Error during migration:', error);
		throw error;
	} finally {
		db.close();
	}
}

createCashierTransactionsTable().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});
