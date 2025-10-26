import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ========================================
// ADMIN TABLES (existing)
// ========================================

/**
 * Users table - публичные пользователи системы (для админки)
 */
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

// ========================================
// LOYALTY SYSTEM TABLES
// ========================================

/**
 * Loyalty Users - пользователи программы лояльности из Telegram
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
	first_login_bonus_claimed: integer('first_login_bonus_claimed', { mode: 'boolean' }).notNull().default(false),
	registration_date: text('registration_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
	last_activity: text('last_activity').default(sql`CURRENT_TIMESTAMP`),
	chat_id: integer('chat_id').notNull(),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
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
 * Products - товары каталога
 */
export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	price: real('price').notNull(),
	old_price: real('old_price'),
	image: text('image').notNull(),
	category: text('category').notNull(),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

/**
 * Offers - акции и специальные предложения
 */
export const offers = sqliteTable('offers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	description: text('description').notNull(),
	icon: text('icon').notNull(),
	icon_color: text('icon_color').notNull(),
	deadline: text('deadline').notNull(),
	deadline_class: text('deadline_class').notNull(),
	details: text('details').notNull(),
	conditions: text('conditions').notNull(), // JSON array as string
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

/**
 * Stores - магазины сети
 */
export const stores = sqliteTable('stores', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	address: text('address').notNull(),
	phone: text('phone').notNull(),
	hours: text('hours').notNull(),
	features: text('features').notNull(), // JSON array as string
	icon_color: text('icon_color').notNull(),
	coords_lat: real('coords_lat').notNull(),
	coords_lng: real('coords_lng').notNull(),
	status: text('status').notNull(),
	distance: text('distance').notNull(),
	closed: integer('closed', { mode: 'boolean' }).notNull().default(false),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

/**
 * Transactions - история операций (начисление/списание баллов)
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
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

/**
 * Recommendations - персональные рекомендации товаров
 */
export const recommendations = sqliteTable('recommendations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	loyalty_user_id: integer('loyalty_user_id').references(() => loyaltyUsers.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description').notNull(),
	price: real('price').notNull(),
	image: text('image').notNull(),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
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

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Recommendation = typeof recommendations.$inferSelect;
export type NewRecommendation = typeof recommendations.$inferInsert;
