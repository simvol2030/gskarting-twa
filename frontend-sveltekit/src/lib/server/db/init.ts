import bcrypt from 'bcrypt';
import { db } from './client';
import { users, posts, admins } from './schema';
import { count } from 'drizzle-orm';

/**
 * Инициализация базы данных
 * Создаёт таблицы если их нет (выполняется автоматически Drizzle)
 */
export async function initializeDatabase() {
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

			console.log('✅ Default super-admin created (email: admin@example.com, password: Admin123!@#$)');
		}
	} catch (error) {
		console.error('❌ Error seeding database:', error);
	}
}

// Инициализация при импорте модуля
initializeDatabase();
seedDatabase();
