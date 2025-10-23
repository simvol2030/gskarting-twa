import { db } from '../client';
import { posts, users } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewPost } from '../schema';

/**
 * Получить все посты с информацией об авторе
 */
export async function getAllPosts() {
	return await db
		.select({
			id: posts.id,
			user_id: posts.user_id,
			title: posts.title,
			content: posts.content,
			published: posts.published,
			created_at: posts.created_at,
			author_name: users.name,
			author_email: users.email
		})
		.from(posts)
		.leftJoin(users, eq(posts.user_id, users.id))
		.orderBy(desc(posts.created_at));
}

/**
 * Получить пост по ID с информацией об авторе
 */
export async function getPostById(id: number) {
	const result = await db
		.select({
			id: posts.id,
			user_id: posts.user_id,
			title: posts.title,
			content: posts.content,
			published: posts.published,
			created_at: posts.created_at,
			author_name: users.name,
			author_email: users.email
		})
		.from(posts)
		.leftJoin(users, eq(posts.user_id, users.id))
		.where(eq(posts.id, id))
		.limit(1);

	return result[0] || null;
}

/**
 * Создать новый пост
 */
export async function createPost(data: NewPost) {
	const result = await db.insert(posts).values(data).returning();
	return result[0];
}

/**
 * Обновить пост
 */
export async function updatePost(id: number, data: Partial<NewPost>) {
	const result = await db.update(posts).set(data).where(eq(posts.id, id)).returning();
	return result[0] || null;
}

/**
 * Удалить пост
 */
export async function deletePost(id: number) {
	await db.delete(posts).where(eq(posts.id, id));
	return true;
}
