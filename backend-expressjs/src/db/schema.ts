import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Users table - публичные пользователи системы
 */
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

/**
 * Posts table - посты блога
 */
export const posts = sqliteTable('posts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	user_id: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	content: text('content'),
	published: integer('published', { mode: 'boolean' }).default(false).notNull(),
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

/**
 * Admins table - административные пользователи с аутентификацией
 * ВАЖНО: Backend использует plain text пароли (не безопасно!)
 * Frontend использует bcrypt (безопасно)
 */
export const admins = sqliteTable('admins', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	role: text('role', { enum: ['super-admin', 'editor', 'viewer'] })
		.notNull()
		.default('viewer'),
	name: text('name').notNull(),
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

/**
 * Loyalty Users table - пользователи программы лояльности
 */
export const loyaltyUsers = sqliteTable('loyalty_users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	telegram_user_id: integer('telegram_user_id').notNull().unique(),
	first_name: text('first_name').notNull(),
	last_name: text('last_name'),
	username: text('username'),
	language_code: text('language_code'),
	current_balance: real('current_balance').notNull().default(500.0),
	total_purchases: integer('total_purchases').notNull().default(0),
	total_saved: real('total_saved').notNull().default(0),
	store_id: integer('store_id'),
	first_login_bonus_claimed: integer('first_login_bonus_claimed', { mode: 'boolean' }).notNull().default(true),
	registration_date: text('registration_date').notNull().default(sql`CURRENT_TIMESTAMP`),
	last_activity: text('last_activity').default(sql`CURRENT_TIMESTAMP`),
	chat_id: integer('chat_id').notNull(),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

/**
 * Stores table - магазины/точки продаж
 */
export const stores = sqliteTable('stores', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	address: text('address').notNull(),
	phone: text('phone').notNull(),
	hours: text('hours').notNull(),
	features: text('features').notNull(), // JSON array stored as text
	icon_color: text('icon_color').notNull(),
	coords_lat: real('coords_lat').notNull(),
	coords_lng: real('coords_lng').notNull(),
	status: text('status').notNull(),
	distance: text('distance').notNull(),
	closed: integer('closed', { mode: 'boolean' }).notNull().default(false),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

/**
 * Transactions table - история транзакций лояльности
 */
export const transactions = sqliteTable('transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	loyalty_user_id: integer('loyalty_user_id')
		.notNull()
		.references(() => loyaltyUsers.id, { onDelete: 'cascade' }),
	store_id: integer('store_id').references(() => stores.id, { onDelete: 'set null' }),
	title: text('title').notNull(),
	amount: real('amount').notNull(),
	type: text('type', { enum: ['earn', 'spend'] }).notNull(),
	spent: text('spent'),
	store_name: text('store_name'),
	created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * Cashier Transactions table - транзакции через кассу
 */
export const cashierTransactions = sqliteTable('cashier_transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),

	// Customer & Store
	customer_id: integer('customer_id')
		.notNull()
		.references(() => loyaltyUsers.id, { onDelete: 'cascade' }),
	store_id: integer('store_id')
		.notNull()
		.references(() => stores.id, { onDelete: 'cascade' }),

	// Transaction details
	type: text('type', { enum: ['earn', 'redeem'] }).notNull(),
	purchase_amount: real('purchase_amount').notNull(),
	points_amount: integer('points_amount').notNull(),
	discount_amount: real('discount_amount').notNull().default(0),

	// Metadata (stored as JSON text)
	metadata: text('metadata'), // { cashierName, terminalId, paymentMethod, receiptNumber }

	// 1C Sync
	synced_with_1c: integer('synced_with_1c', { mode: 'boolean' }).notNull().default(false),
	synced_at: text('synced_at'),
	onec_transaction_id: text('onec_transaction_id'),

	// Timestamps
	created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// TypeScript типы, выведенные из схемы
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type LoyaltyUser = typeof loyaltyUsers.$inferSelect;
export type NewLoyaltyUser = typeof loyaltyUsers.$inferInsert;

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type CashierTransaction = typeof cashierTransactions.$inferSelect;
export type NewCashierTransaction = typeof cashierTransactions.$inferInsert;
