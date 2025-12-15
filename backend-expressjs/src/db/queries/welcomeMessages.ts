import { db } from '../client';
import { welcomeMessages } from '../schema';
import { eq, asc, sql } from 'drizzle-orm';
import type { NewWelcomeMessage } from '../schema';

/**
 * Получить все приветственные сообщения (отсортированные по order_number)
 */
export async function getAllWelcomeMessages() {
	return await db
		.select()
		.from(welcomeMessages)
		.orderBy(asc(welcomeMessages.order_number));
}

/**
 * Получить активные приветственные сообщения (для бота)
 */
export async function getActiveWelcomeMessages() {
	return await db
		.select()
		.from(welcomeMessages)
		.where(eq(welcomeMessages.is_active, true))
		.orderBy(asc(welcomeMessages.order_number));
}

/**
 * Получить сообщение по ID
 */
export async function getWelcomeMessageById(id: number) {
	const result = await db
		.select()
		.from(welcomeMessages)
		.where(eq(welcomeMessages.id, id))
		.limit(1);
	return result[0] || null;
}

/**
 * Создать новое сообщение
 */
export async function createWelcomeMessage(data: NewWelcomeMessage) {
	const result = await db.insert(welcomeMessages).values(data).returning();
	return result[0];
}

/**
 * Обновить сообщение
 */
export async function updateWelcomeMessage(
	id: number,
	data: {
		message_text?: string;
		message_image?: string | null;
		button_text?: string | null;
		button_url?: string | null;
		delay_seconds?: number;
		is_active?: boolean;
		order_number?: number;
	}
) {
	const updateData: any = {
		...data,
		updated_at: sql`CURRENT_TIMESTAMP`
	};

	const result = await db
		.update(welcomeMessages)
		.set(updateData)
		.where(eq(welcomeMessages.id, id))
		.returning();
	return result[0] || null;
}

/**
 * Удалить сообщение
 */
export async function deleteWelcomeMessage(id: number) {
	await db.delete(welcomeMessages).where(eq(welcomeMessages.id, id));
	return true;
}

/**
 * Обновить порядок сообщений (batch update)
 * @param updates - массив объектов { id, order_number }
 */
export async function reorderWelcomeMessages(updates: Array<{ id: number; order_number: number }>) {
	// Выполняем update для каждого элемента
	for (const update of updates) {
		await db
			.update(welcomeMessages)
			.set({
				order_number: update.order_number,
				updated_at: sql`CURRENT_TIMESTAMP`
			})
			.where(eq(welcomeMessages.id, update.id));
	}
	return true;
}
