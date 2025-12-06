import bcrypt from 'bcrypt';
import { db, nativeClient } from './client';
import { users, posts, admins, shopSettings } from './schema';
import { count, eq } from 'drizzle-orm';

/**
 * Инициализация базы данных
 * Создаёт таблицы если их нет (выполняется автоматически Drizzle)
 */
export async function initializeDatabase() {
	// Create store_images table if it doesn't exist (for image gallery feature)
	if (nativeClient) {
		try {
			nativeClient.exec(`
				CREATE TABLE IF NOT EXISTS store_images (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
					filename TEXT NOT NULL,
					original_name TEXT NOT NULL,
					sort_order INTEGER NOT NULL DEFAULT 0,
					created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_store_images_store_id ON store_images(store_id);
				CREATE INDEX IF NOT EXISTS idx_store_images_sort ON store_images(store_id, sort_order);
			`);
			console.log('✅ Store images table initialized');
		} catch (error) {
			console.log('ℹ️ Store images table already exists or error:', error);
		}

		// Create shop e-commerce tables
		try {
			nativeClient.exec(`
				-- Cart Items table
				CREATE TABLE IF NOT EXISTS cart_items (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					session_id TEXT,
					user_id INTEGER REFERENCES loyalty_users(id) ON DELETE CASCADE,
					product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
					quantity INTEGER NOT NULL DEFAULT 1,
					created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);
				CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
				CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_items(product_id);

				-- Orders table
				CREATE TABLE IF NOT EXISTS orders (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					order_number TEXT NOT NULL UNIQUE,
					user_id INTEGER REFERENCES loyalty_users(id) ON DELETE SET NULL,
					status TEXT NOT NULL DEFAULT 'new',
					customer_name TEXT NOT NULL,
					customer_phone TEXT NOT NULL,
					customer_email TEXT,
					delivery_type TEXT NOT NULL,
					delivery_address TEXT,
					delivery_entrance TEXT,
					delivery_floor TEXT,
					delivery_apartment TEXT,
					delivery_intercom TEXT,
					store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
					subtotal INTEGER NOT NULL,
					delivery_cost INTEGER NOT NULL DEFAULT 0,
					discount_amount INTEGER NOT NULL DEFAULT 0,
					total INTEGER NOT NULL,
					notes TEXT,
					created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
				CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
				CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
				CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
				CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);

				-- Order Items table
				CREATE TABLE IF NOT EXISTS order_items (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
					product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
					product_name TEXT NOT NULL,
					product_price INTEGER NOT NULL,
					quantity INTEGER NOT NULL,
					total INTEGER NOT NULL,
					created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
				CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

				-- Shop Settings table
				CREATE TABLE IF NOT EXISTS shop_settings (
					id INTEGER PRIMARY KEY DEFAULT 1,
					shop_name TEXT NOT NULL DEFAULT 'Магазин',
					shop_type TEXT NOT NULL DEFAULT 'general',
					currency TEXT NOT NULL DEFAULT 'RUB',
					delivery_enabled INTEGER NOT NULL DEFAULT 1,
					pickup_enabled INTEGER NOT NULL DEFAULT 1,
					delivery_cost INTEGER NOT NULL DEFAULT 0,
					free_delivery_from INTEGER,
					min_order_amount INTEGER NOT NULL DEFAULT 0,
					telegram_bot_token TEXT,
					telegram_bot_username TEXT,
					telegram_notifications_enabled INTEGER NOT NULL DEFAULT 0,
					telegram_group_id TEXT,
					email_notifications_enabled INTEGER NOT NULL DEFAULT 0,
					email_recipients TEXT,
					customer_telegram_notifications INTEGER NOT NULL DEFAULT 0,
					smtp_host TEXT,
					smtp_port INTEGER,
					smtp_user TEXT,
					smtp_password TEXT,
					smtp_from TEXT,
					updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				);

				-- Order Status History table
				CREATE TABLE IF NOT EXISTS order_status_history (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
					old_status TEXT,
					new_status TEXT NOT NULL,
					changed_by TEXT,
					notes TEXT,
					created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
			`);
			console.log('✅ Shop e-commerce tables initialized');
		} catch (error) {
			console.log('ℹ️ Shop e-commerce tables already exist or error:', error);
		}
	}
	console.log('✅ Database tables initialized (managed by Drizzle ORM)');
}

/**
 * Seed данных - заполнение БД тестовыми данными
 */
export async function seedDatabase() {
	try {
		// Проверяем количество пользователей
		const [userCountResult] = await db.select({ count: count() }).from(users);
		const userCount = userCountResult?.count || 0;

		if (userCount === 0) {
			// Создаём пользователей
			await db.insert(users).values([
				{ name: 'Alice Johnson', email: 'alice@example.com' },
				{ name: 'Bob Smith', email: 'bob@example.com' },
				{ name: 'Charlie Brown', email: 'charlie@example.com' }
			]);

			// Создаём посты
			await db.insert(posts).values([
				{
					user_id: 1,
					title: 'Getting Started with SvelteKit',
					content: 'SvelteKit is an amazing framework for building web applications.',
					published: true
				},
				{
					user_id: 1,
					title: 'SQLite with WAL Mode',
					content: 'Write-Ahead Logging provides better concurrency and performance.',
					published: true
				},
				{
					user_id: 2,
					title: 'Building Modern Web Apps',
					content: 'Modern web development is exciting with tools like Svelte.',
					published: true
				},
				{
					user_id: 3,
					title: 'Draft Post',
					content: 'This is a draft post, not yet published.',
					published: false
				}
			]);

			console.log('✅ Database seeded with sample data');
		}

		// Проверяем количество админов
		const [adminCountResult] = await db.select({ count: count() }).from(admins);
		const adminCount = adminCountResult?.count || 0;

		if (adminCount === 0) {
			// Создаём дефолтного супер-админа с хешированным паролем
			const hashedPassword = await bcrypt.hash('Admin123!@#$', 10);

			await db.insert(admins).values({
				email: 'admin@example.com',
				password: hashedPassword,
				role: 'super-admin',
				name: 'Super Admin'
			});

			console.log(
				'✅ Default super-admin created (email: admin@example.com, password: Admin123!@#$)'
			);
			console.log('✅ Password is securely hashed with bcrypt');
		}

		// Initialize shop settings if not exists
		const [shopSettingsCount] = await db.select({ count: count() }).from(shopSettings);
		if ((shopSettingsCount?.count || 0) === 0) {
			await db.insert(shopSettings).values({
				id: 1,
				shop_name: 'Мурзико',
				shop_type: 'pet_shop',
				currency: 'RUB',
				delivery_enabled: true,
				pickup_enabled: true,
				delivery_cost: 0, // Free delivery by default
				min_order_amount: 0
			});
			console.log('✅ Default shop settings created');
		}
	} catch (error) {
		console.error('❌ Error seeding database:', error);
	}
}

// Инициализация при импорте модуля
initializeDatabase();
seedDatabase();
