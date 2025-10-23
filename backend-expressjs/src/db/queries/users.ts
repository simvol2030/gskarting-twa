import { db } from '../client';
import { users } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewUser } from '../schema';

/**
 * Получить всех пользователей
 */
export async function getAllUsers() {
	return await db.select().from(users).orderBy(desc(users.created_at));
}

/**
 * Получить пользователя по ID
 */
export async function getUserById(id: number) {
	const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return result[0] || null;
}

/**
 * Получить пользователя по email
 */
export async function getUserByEmail(email: string) {
	const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
	return result[0] || null;
}

/**
 * Создать нового пользователя
 */
export async function createUser(data: NewUser) {
	const result = await db.insert(users).values(data).returning();
	return result[0];
}

/**
 * Обновить пользователя
 */
export async function updateUser(id: number, data: Partial<NewUser>) {
	const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
	return result[0] || null;
}

/**
 * Удалить пользователя
 */
export async function deleteUser(id: number) {
	await db.delete(users).where(eq(users.id, id));
	return true;
}
