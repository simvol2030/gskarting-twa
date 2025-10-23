import { db } from '../client';
import { admins } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewAdmin } from '../schema';

/**
 * Получить админа по email
 */
export async function getAdminByEmail(email: string) {
	const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
	return result[0] || null;
}

/**
 * Получить всех админов (без паролей)
 */
export async function getAllAdmins() {
	return await db
		.select({
			id: admins.id,
			email: admins.email,
			role: admins.role,
			name: admins.name,
			created_at: admins.created_at
		})
		.from(admins)
		.orderBy(desc(admins.created_at));
}

/**
 * Создать нового админа
 */
export async function createAdmin(data: NewAdmin) {
	const result = await db.insert(admins).values(data).returning();
	return result[0];
}

/**
 * Обновить админа (без пароля)
 */
export async function updateAdmin(
	id: number,
	data: { email?: string; role?: 'super-admin' | 'editor' | 'viewer'; name?: string }
) {
	const result = await db.update(admins).set(data).where(eq(admins.id, id)).returning();
	return result[0] || null;
}

/**
 * Обновить пароль админа
 */
export async function updateAdminPassword(id: number, password: string) {
	await db.update(admins).set({ password }).where(eq(admins.id, id));
	return true;
}

/**
 * Удалить админа
 */
export async function deleteAdmin(id: number) {
	await db.delete(admins).where(eq(admins.id, id));
	return true;
}
