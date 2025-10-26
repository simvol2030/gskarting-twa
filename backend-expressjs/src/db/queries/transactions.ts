import { db } from '../client';
import { transactions } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewTransaction } from '../schema';

/**
 * Получить все транзакции
 */
export async function getAllTransactions() {
	return await db.select().from(transactions).orderBy(desc(transactions.created_at));
}

/**
 * Получить транзакцию по ID
 */
export async function getTransactionById(id: number) {
	const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
	return result[0] || null;
}

/**
 * Получить транзакции пользователя
 */
export async function getTransactionsByUserId(userId: number, limit: number = 10) {
	return await db
		.select()
		.from(transactions)
		.where(eq(transactions.loyalty_user_id, userId))
		.orderBy(desc(transactions.created_at))
		.limit(limit);
}

/**
 * Создать новую транзакцию
 */
export async function createTransaction(data: NewTransaction) {
	const result = await db.insert(transactions).values(data).returning();
	return result[0];
}

/**
 * Удалить транзакцию
 */
export async function deleteTransaction(id: number) {
	await db.delete(transactions).where(eq(transactions.id, id));
	return true;
}
