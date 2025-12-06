import { db } from '../client';
import { sellers } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewSeller } from '../schema';

/**
 * Получить продавца по PIN (для авторизации)
 */
export async function getSellerByPin(pin: string) {
	const result = await db.select().from(sellers).where(eq(sellers.pin, pin)).limit(1);
	return result[0] || null;
}

/**
 * Получить продавца по ID
 */
export async function getSellerById(id: number) {
	const result = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
	return result[0] || null;
}

/**
 * Получить всех продавцов (без PIN-кодов)
 */
export async function getAllSellers() {
	return await db
		.select({
			id: sellers.id,
			name: sellers.name,
			is_active: sellers.is_active,
			created_at: sellers.created_at
		})
		.from(sellers)
		.orderBy(desc(sellers.created_at));
}

/**
 * Создать нового продавца
 */
export async function createSeller(data: NewSeller) {
	const result = await db.insert(sellers).values(data).returning();
	return result[0];
}

/**
 * Обновить продавца
 */
export async function updateSeller(
	id: number,
	data: { name?: string; pin?: string; is_active?: boolean }
) {
	const result = await db.update(sellers).set(data).where(eq(sellers.id, id)).returning();
	return result[0] || null;
}

/**
 * Удалить продавца
 */
export async function deleteSeller(id: number) {
	await db.delete(sellers).where(eq(sellers.id, id));
	return true;
}

/**
 * Проверить существует ли PIN (для валидации уникальности)
 */
export async function isPinExists(pin: string, excludeId?: number) {
	const result = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.pin, pin));
	if (excludeId) {
		return result.some(s => s.id !== excludeId);
	}
	return result.length > 0;
}
