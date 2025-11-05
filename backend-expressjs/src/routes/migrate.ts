import { Router } from 'express';
import { sql, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { loyaltyUsers } from '../db/schema';

const router = Router();

// Endpoint для применения миграции (только для dev!)
// Поддерживает и GET и POST для удобства
async function applyMigration(req: any, res: any) {
	try {
		// Создаём таблицу
		await db.run(sql`
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

		// Создаём индексы
		await db.run(sql`CREATE INDEX IF NOT EXISTS idx_pending_store_status ON pending_discounts(store_id, status);`);
		await db.run(sql`CREATE INDEX IF NOT EXISTS idx_pending_expires ON pending_discounts(expires_at);`);

		// Индексы для cashier_transactions
		await db.run(sql`CREATE INDEX IF NOT EXISTS idx_cashier_tx_store ON cashier_transactions(store_id);`);
		await db.run(sql`CREATE INDEX IF NOT EXISTS idx_cashier_tx_customer ON cashier_transactions(customer_id);`);
		await db.run(sql`CREATE INDEX IF NOT EXISTS idx_cashier_tx_created ON cashier_transactions(created_at);`);

		res.json({
			success: true,
			message: 'Migration applied successfully'
		});

	} catch (error) {
		console.error('Migration error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

router.post('/create-pending-discounts', applyMigration);
router.get('/create-pending-discounts', applyMigration);

// Seed магазинов (6 шт)
router.get('/seed-stores', async (req, res) => {
	try {
		const { stores } = await import('../db/schema');

		// Проверяем существующие
		const existing = await db.select().from(stores).all();

		if (existing.length > 0) {
			return res.json({
				success: true,
				message: 'Stores already exist',
				count: existing.length
			});
		}

		// Создаём 7 магазинов (первый тестовый)
		await db.insert(stores).values([
			{ name: 'ТЕСТ (локальная отладка)', address: 'localhost' },
			{ name: 'Ашукино', address: 'г. Москва, Ашукино' },
			{ name: 'Зеленоградский', address: 'г. Москва' },
			{ name: 'Софрино', address: 'г. Москва' },
			{ name: 'Заветы Ильича', address: 'г. Москва' },
			{ name: 'Клязьма', address: 'г. Москва' },
			{ name: 'Зверосовхоз', address: 'г. Москва' }
		] as any);

		res.json({
			success: true,
			message: '7 магазинов созданы (первый тестовый)'
		});

	} catch (error) {
		console.error('Seed stores error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Seed тестовых клиентов (3 карты для отладки)
router.get('/seed-test-customers', async (req, res) => {
	try {
		// Проверяем существующие тестовые карты
		const existing = await db.select().from(loyaltyUsers)
			.where(inArray(loyaltyUsers.card_number, ['421856', '789012', '654321']));

		if (existing.length > 0) {
			return res.json({
				success: true,
				message: 'Test customers already exist',
				count: existing.length,
				customers: existing
			});
		}

		// Создаём 3 тестовых клиента (минимальные required поля)
		const inserted = await db.insert(loyaltyUsers).values([
			{
				telegram_user_id: 111421856,
				card_number: '421856',
				first_name: 'Иван',
				last_name: 'Петров',
				current_balance: 2500,
				chat_id: 111421856
			},
			{
				telegram_user_id: 222789012,
				card_number: '789012',
				first_name: 'Мария',
				last_name: 'Сидорова',
				current_balance: 800,
				chat_id: 222789012
			},
			{
				telegram_user_id: 333654321,
				card_number: '654321',
				first_name: 'Алексей',
				last_name: 'Смирнов',
				current_balance: 150,
				chat_id: 333654321
			}
		] as any).returning();

		res.json({
			success: true,
			message: '3 тестовых клиента созданы',
			customers: inserted
		});

	} catch (error) {
		console.error('Seed test customers error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Пересоздать pending_discounts с правильным FK
router.get('/recreate-pending-discounts', async (req, res) => {
	try {
		// Удаляем старую таблицу
		await db.run(sql`DROP TABLE IF EXISTS pending_discounts;`);

		// Создаём заново с правильным FK на transactions
		await db.run(sql`
			CREATE TABLE pending_discounts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
				transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
				discount_amount REAL NOT NULL,
				status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'applied', 'failed', 'expired')),
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				applied_at TEXT,
				expires_at TEXT NOT NULL,
				error_message TEXT
			);
		`);

		// Индексы
		await db.run(sql`CREATE INDEX idx_pending_store_status ON pending_discounts(store_id, status);`);
		await db.run(sql`CREATE INDEX idx_pending_expires ON pending_discounts(expires_at);`);

		res.json({
			success: true,
			message: 'pending_discounts пересоздана с правильным FK'
		});

	} catch (error) {
		console.error('Recreate pending_discounts error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Добавить колонки в transactions для хранения деталей чека
router.get('/add-transaction-columns', async (req, res) => {
	try {
		// Проверяем существование колонок перед добавлением
		const tableInfo = await db.all(sql`PRAGMA table_info(transactions);`);
		const existingColumns = new Set(tableInfo.map((col: any) => col.name));

		const columnsToAdd = [
			{ name: 'check_amount', type: 'REAL' },
			{ name: 'points_redeemed', type: 'REAL' },
			{ name: 'cashback_earned', type: 'REAL' }
		];

		const addedColumns: string[] = [];
		const skippedColumns: string[] = [];

		for (const column of columnsToAdd) {
			if (!existingColumns.has(column.name)) {
				await db.run(sql.raw(`ALTER TABLE transactions ADD COLUMN ${column.name} ${column.type};`));
				addedColumns.push(column.name);
			} else {
				skippedColumns.push(column.name);
			}
		}

		const message = addedColumns.length > 0
			? `Добавлены колонки: ${addedColumns.join(', ')}`
			: 'Все колонки уже существуют';

		if (skippedColumns.length > 0) {
			console.log(`Пропущены существующие колонки: ${skippedColumns.join(', ')}`);
		}

		res.json({
			success: true,
			message,
			added: addedColumns,
			skipped: skippedColumns
		});

	} catch (error) {
		console.error('Add columns error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

export default router;
