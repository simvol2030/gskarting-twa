import type { Config } from 'drizzle-kit';
import { join } from 'path';

/**
 * Конфигурация Drizzle Kit для управления миграциями БД
 *
 * Использование:
 * - npm run db:generate - генерация миграций из схемы
 * - npm run db:migrate - применение миграций к БД
 * - npm run db:studio - запуск Drizzle Studio (GUI для БД)
 */

const DATABASE_TYPE = (process.env.DATABASE_TYPE || 'sqlite') as 'sqlite' | 'postgres';

const config: Config = {
	schema: './src/db/schema.ts',
	out: './drizzle/migrations',
	dialect: DATABASE_TYPE === 'postgres' ? 'postgresql' : 'sqlite',

	// Конфигурация для SQLite
	...(DATABASE_TYPE === 'sqlite' && {
		dbCredentials: {
			url: join(__dirname, '..', 'data', 'db', 'sqlite', 'app.db')
		}
	}),

	// Конфигурация для PostgreSQL
	...(DATABASE_TYPE === 'postgres' && {
		dbCredentials: {
			url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/projectbox'
		}
	}),

	verbose: true,
	strict: true
};

export default config;
