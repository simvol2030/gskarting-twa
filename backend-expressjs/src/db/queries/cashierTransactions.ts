import { db } from '../client';
import { cashierTransactions } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewCashierTransaction } from '../schema';

/**
 * Получить все кассовые транзакции
 */
export async function getAllCashierTransactions() {
	return await db
		.select()
		.from(cashierTransactions)
		.orderBy(desc(cashierTransactions.created_at));
}

/**
 * Получить кассовую транзакцию по ID
 */
export async function getCashierTransactionById(id: number) {
	const result = await db
		.select()
		.from(cashierTransactions)
		.where(eq(cashierTransactions.id, id))
		.limit(1);
	return result[0] || null;
}

/**
 * Получить кассовые транзакции покупателя
 */
export async function getCashierTransactionsByCustomerId(customerId: number, limit: number = 20) {
	return await db
		.select()
		.from(cashierTransactions)
		.where(eq(cashierTransactions.customer_id, customerId))
		.orderBy(desc(cashierTransactions.created_at))
		.limit(limit);
}

/**
 * Получить кассовые транзакции магазина
 */
export async function getCashierTransactionsByStoreId(storeId: number, limit: number = 50) {
	return await db
		.select()
		.from(cashierTransactions)
		.where(eq(cashierTransactions.store_id, storeId))
		.orderBy(desc(cashierTransactions.created_at))
		.limit(limit);
}

/**
 * Создать новую кассовую транзакцию
 */
export async function createCashierTransaction(data: NewCashierTransaction) {
	const result = await db.insert(cashierTransactions).values(data).returning();
	return result[0];
}

/**
 * Обновить статус синхронизации с 1C
 */
export async function updateCashierTransactionSync(
	id: number,
	onecTransactionId: string,
	syncedAt: string
) {
	const result = await db
		.update(cashierTransactions)
		.set({
			synced_with_1c: true,
			synced_at: syncedAt,
			onec_transaction_id: onecTransactionId,
			updated_at: new Date().toISOString()
		})
		.where(eq(cashierTransactions.id, id))
		.returning();

	return result[0] || null;
}

/**
 * Удалить кассовую транзакцию
 */
export async function deleteCashierTransaction(id: number) {
	await db.delete(cashierTransactions).where(eq(cashierTransactions.id, id));
	return true;
}
