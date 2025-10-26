import { db } from '../client';
import { stores } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewStore } from '../schema';

/**
 * Получить все магазины
 */
export async function getAllStores() {
	return await db.select().from(stores).where(eq(stores.is_active, true));
}

/**
 * Получить магазин по ID
 */
export async function getStoreById(id: number) {
	const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
	return result[0] || null;
}

/**
 * Создать новый магазин
 */
export async function createStore(data: NewStore) {
	const result = await db.insert(stores).values(data).returning();
	return result[0];
}

/**
 * Обновить магазин
 */
export async function updateStore(id: number, data: Partial<NewStore>) {
	const result = await db.update(stores).set(data).where(eq(stores.id, id)).returning();
	return result[0] || null;
}

/**
 * Удалить магазин
 */
export async function deleteStore(id: number) {
	await db.delete(stores).where(eq(stores.id, id));
	return true;
}
