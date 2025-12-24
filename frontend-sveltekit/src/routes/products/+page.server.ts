import { db } from '$lib/server/db/client';
import { products, categories, productVariations } from '$lib/server/db/schema';
import { eq, and, like, asc, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Получаем параметры фильтрации из URL
	const categorySlug = url.searchParams.get('category') || 'all';
	const search = url.searchParams.get('search') || '';

	// Загружаем активные категории из таблицы categories
	const allCategories = await db
		.select()
		.from(categories)
		.where(eq(categories.is_active, true))
		.orderBy(asc(categories.position), asc(categories.name));

	// Формируем структуру категорий для UI
	const categoryList = allCategories.map(c => ({
		id: c.id,
		name: c.name,
		slug: c.slug,
		image: c.image
	}));

	// Загружаем товары
	let allProducts = await db
		.select()
		.from(products)
		.where(eq(products.is_active, true))
		.orderBy(asc(products.position), desc(products.id));

	// Фильтрация по категории
	if (categorySlug !== 'all') {
		// Сначала найдём категорию по slug
		const selectedCategory = allCategories.find(c => c.slug === categorySlug);
		if (selectedCategory) {
			// Фильтруем по category_id (новая система)
			allProducts = allProducts.filter(
				(p) => p.category_id === selectedCategory.id || p.category === selectedCategory.name
			);
		} else {
			// Fallback: фильтруем по legacy текстовой категории
			allProducts = allProducts.filter((p) => p.category === categorySlug);
		}
	}

	// Фильтрация по поиску
	if (search) {
		const searchLower = search.toLowerCase();
		allProducts = allProducts.filter((p) => p.name.toLowerCase().includes(searchLower));
	}

	// Загружаем вариации для всех продуктов
	const productIds = allProducts.map(p => p.id);
	const allVariations = productIds.length > 0
		? await db
			.select()
			.from(productVariations)
			.where(and(
				sql`${productVariations.product_id} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`,
				eq(productVariations.is_active, true)
			))
			.orderBy(asc(productVariations.position))
		: [];

	// Группируем вариации по product_id
	const variationsByProduct = new Map<number, typeof allVariations>();
	for (const v of allVariations) {
		if (!variationsByProduct.has(v.product_id)) {
			variationsByProduct.set(v.product_id, []);
		}
		variationsByProduct.get(v.product_id)!.push(v);
	}

	// Формируем данные продуктов с вариациями
	const productsWithVariations = allProducts.map(p => {
		const variations = variationsByProduct.get(p.id) || [];
		const defaultVariation = variations.find(v => v.is_default) || variations[0];

		// Цена из дефолтной вариации если есть
		const displayPrice = defaultVariation ? defaultVariation.price : p.price;
		const displayOldPrice = defaultVariation ? defaultVariation.old_price : p.old_price;

		return {
			...p,
			price: displayPrice,
			old_price: displayOldPrice,
			hasVariations: variations.length > 0,
			variationAttribute: p.variation_attribute,
			variations: variations.map(v => ({
				id: v.id,
				name: v.name,
				price: v.price,
				oldPrice: v.old_price,
				sku: v.sku,
				isDefault: v.is_default
			}))
		};
	});

	return {
		products: productsWithVariations,
		categories: categoryList,
		// Также передаём legacy категории для обратной совместимости
		legacyCategories: [...new Set(allProducts.map((p) => p.category))].filter(Boolean).sort(),
		filters: {
			category: categorySlug,
			search
		}
	};
};
