import type { PageServerLoad } from './$types';
import { queries } from '$lib/server/db/database';

export const load: PageServerLoad = async () => {
	// Получаем данные (queries теперь async)
	const users = await queries.getAllUsers();
	const posts = await queries.getAllPosts();

	// Вычисляем статистику
	const usersCount = users.length;
	const postsCount = posts.length;
	const publishedCount = posts.filter((p) => p.published).length;

	// Получаем недавние посты
	const recentPosts = posts.slice(0, 5);

	return {
		stats: {
			users: usersCount,
			posts: postsCount,
			published: publishedCount,
			drafts: postsCount - publishedCount
		},
		recentPosts
	};
};
