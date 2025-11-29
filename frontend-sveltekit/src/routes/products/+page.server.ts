import { db } from '$lib/server/db/client';
import { products } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Получаем параметры фильтрации из URL
	const category = url.searchParams.get('category') || 'all';
	const search = url.searchParams.get('search') || '';

	// Загружаем товары с фильтрацией
	let query = db.select().from(products).where(eq(products.is_active, true));

	let allProducts = await query;

	// Фильтрация по категории (на клиенте, т.к. Drizzle ORM не поддерживает динамические where)
	if (category !== 'all') {
		allProducts = allProducts.filter((p) => p.category === category);
	}

	// Фильтрация по поиску
	if (search) {
		const searchLower = search.toLowerCase();
		allProducts = allProducts.filter((p) => p.name.toLowerCase().includes(searchLower));
	}

	// Получаем уникальные категории для фильтра
	const allProductsForCategories = await db
		.select()
		.from(products)
		.where(eq(products.is_active, true));

	const categories = [...new Set(allProductsForCategories.map((p) => p.category))].sort();

	return {
		products: allProducts,
		categories,
		filters: {
			category,
			search
		}
	};
};
