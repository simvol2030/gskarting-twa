import { db } from '../client';
import { sellers } from '../schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { NewSeller } from '../schema';

/**
 * Получить продавца по PIN (для авторизации)
 * Использует bcrypt.compare для сравнения хэшированных PIN-кодов
 */
export async function getSellerByPin(pin: string) {
	const allSellers = await db.select().from(sellers);
	for (const seller of allSellers) {
		if (seller.is_active) {
			const isMatch = await bcrypt.compare(pin, seller.pin);
			if (isMatch) {
				return seller;
			}
		}
	}
	return null;
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
 * Использует bcrypt.compare для сравнения хэшированных PIN-кодов
 */
export async function isPinExists(pin: string, excludeId?: number): Promise<boolean> {
	const allSellers = await db.select({ id: sellers.id, pin: sellers.pin }).from(sellers);
	for (const seller of allSellers) {
		if (excludeId && seller.id === excludeId) {
			continue; // Пропускаем текущего продавца при обновлении
		}
		const isMatch = await bcrypt.compare(pin, seller.pin);
		if (isMatch) {
			return true;
		}
	}
	return false;
}
