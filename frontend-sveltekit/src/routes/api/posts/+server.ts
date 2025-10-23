import { json } from '@sveltejs/kit';
import { queries } from '$lib/server/db/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Получаем все посты с информацией об авторах
		const allPosts = await queries.getAllPosts();

		// Фильтруем только опубликованные посты
		const publishedPosts = allPosts.filter(post => post.published);

		return json(publishedPosts);
	} catch (error) {
		console.error('Error fetching posts:', error);
		return json({ error: 'Failed to fetch posts' }, { status: 500 });
	}
};
