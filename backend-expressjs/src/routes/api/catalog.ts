/**
 * Public API: Catalog (Categories & Products)
 * Публичные endpoints для Telegram Web App
 */

import { Router } from 'express';
import { db } from '../../db/client';
import { categories, products, productVariations } from '../../db/schema';
import { eq, and, asc, desc, isNull, sql } from 'drizzle-orm';
import { getActiveVariationsByProductId, getDefaultVariation } from '../../db/queries/productVariations';

const router = Router();

/**
 * GET /api/catalog/categories - Получить список активных категорий
 * Публичный endpoint (без авторизации)
 */
router.get('/categories', async (req, res) => {
	try {
		const { parent } = req.query;

		const conditions = [eq(categories.is_active, true)];

		if (parent === 'root' || !parent) {
			conditions.push(isNull(categories.parent_id));
		} else if (parent !== 'all') {
			conditions.push(eq(categories.parent_id, parseInt(parent as string)));
		}

		const dbCategories = await db
			.select()
			.from(categories)
			.where(and(...conditions))
			.orderBy(asc(categories.position), asc(categories.name));

		// Get product counts for each category
		const productCounts = await db
			.select({
				category_id: products.category_id,
				count: sql<number>`COUNT(*)`
			})
			.from(products)
			.where(eq(products.is_active, true))
			.groupBy(products.category_id);

		const countsMap = new Map(productCounts.map(pc => [pc.category_id, Number(pc.count)]));

		const categoriesData = dbCategories.map(cat => ({
			id: cat.id,
			name: cat.name,
			slug: cat.slug,
			description: cat.description,
			image: cat.image,
			parentId: cat.parent_id,
			productCount: countsMap.get(cat.id) || 0
		}));

		res.json({
			success: true,
			data: { categories: categoriesData }
		});
	} catch (error: any) {
		console.error('Error fetching public categories:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/catalog/categories/:slug - Получить категорию по slug
 */
router.get('/categories/:slug', async (req, res) => {
	try {
		const { slug } = req.params;

		const [category] = await db
			.select()
			.from(categories)
			.where(and(
				eq(categories.slug, slug),
				eq(categories.is_active, true)
			));

		if (!category) {
			return res.status(404).json({ success: false, error: 'Категория не найдена' });
		}

		// Get subcategories
		const subcategories = await db
			.select()
			.from(categories)
			.where(and(
				eq(categories.parent_id, category.id),
				eq(categories.is_active, true)
			))
			.orderBy(asc(categories.position));

		// Get product count
		const [productCount] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(products)
			.where(and(
				eq(products.category_id, category.id),
				eq(products.is_active, true)
			));

		res.json({
			success: true,
			data: {
				id: category.id,
				name: category.name,
				slug: category.slug,
				description: category.description,
				image: category.image,
				parentId: category.parent_id,
				productCount: Number(productCount.count),
				subcategories: subcategories.map(sub => ({
					id: sub.id,
					name: sub.name,
					slug: sub.slug,
					image: sub.image
				}))
			}
		});
	} catch (error: any) {
		console.error('Error fetching category by slug:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/catalog/products - Получить список товаров
 * Query params: categoryId, categorySlug, page, limit
 */
router.get('/products', async (req, res) => {
	try {
		const { categoryId, categorySlug, page = '1', limit = '20' } = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
		const offset = (pageNum - 1) * limitNum;

		const conditions = [eq(products.is_active, true)];

		// Filter by category
		if (categoryId) {
			conditions.push(eq(products.category_id, parseInt(categoryId as string)));
		} else if (categorySlug) {
			// Find category by slug first
			const [category] = await db
				.select({ id: categories.id })
				.from(categories)
				.where(eq(categories.slug, categorySlug as string));

			if (category) {
				conditions.push(eq(products.category_id, category.id));
			}
		}

		const whereClause = and(...conditions);

		// Get total count
		const [totalResult] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(products)
			.where(whereClause);

		const total = Number(totalResult.count);

		// Get products
		const dbProducts = await db
			.select({
				id: products.id,
				name: products.name,
				description: products.description,
				price: products.price,
				old_price: products.old_price,
				quantity_info: products.quantity_info,
				image: products.image,
				category_id: products.category_id,
				sku: products.sku,
				position: products.position,
				variation_attribute: products.variation_attribute
			})
			.from(products)
			.where(whereClause)
			.orderBy(asc(products.position), desc(products.id))
			.limit(limitNum)
			.offset(offset);

		// Get variations for all products in one query
		const productIds = dbProducts.map(p => p.id);
		const allVariations = productIds.length > 0
			? await db.select().from(productVariations)
				.where(and(
					sql`${productVariations.product_id} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`,
					eq(productVariations.is_active, true)
				))
				.orderBy(asc(productVariations.position))
			: [];

		const variationsByProduct = new Map<number, typeof allVariations>();
		for (const v of allVariations) {
			if (!variationsByProduct.has(v.product_id)) {
				variationsByProduct.set(v.product_id, []);
			}
			variationsByProduct.get(v.product_id)!.push(v);
		}

		const productsData = dbProducts.map(p => {
			const variations = variationsByProduct.get(p.id) || [];
			const defaultVariation = variations.find(v => v.is_default) || variations[0];

			// Price from default variation if available, otherwise from product
			const displayPrice = defaultVariation ? defaultVariation.price : p.price;
			const displayOldPrice = defaultVariation ? defaultVariation.old_price : p.old_price;

			return {
				id: p.id,
				name: p.name,
				description: p.description,
				price: displayPrice,
				oldPrice: displayOldPrice,
				quantityInfo: p.quantity_info,
				image: p.image,
				categoryId: p.category_id,
				sku: p.sku,
				variationAttribute: p.variation_attribute,
				hasVariations: variations.length > 0,
				variations: variations.map(v => ({
					id: v.id,
					name: v.name,
					price: v.price,
					oldPrice: v.old_price,
					sku: v.sku,
					isDefault: Boolean(v.is_default)
				}))
			};
		});

		res.json({
			success: true,
			data: {
				products: productsData,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					totalPages: Math.ceil(total / limitNum)
				}
			}
		});
	} catch (error: any) {
		console.error('Error fetching products:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/catalog/products/:id - Получить товар по ID
 */
router.get('/products/:id', async (req, res) => {
	try {
		const productId = parseInt(req.params.id);

		const [product] = await db
			.select()
			.from(products)
			.where(and(
				eq(products.id, productId),
				eq(products.is_active, true)
			));

		if (!product) {
			return res.status(404).json({ success: false, error: 'Товар не найден' });
		}

		// Get category info
		let categoryInfo = null;
		if (product.category_id) {
			const [category] = await db
				.select({ id: categories.id, name: categories.name, slug: categories.slug })
				.from(categories)
				.where(eq(categories.id, product.category_id));
			categoryInfo = category || null;
		}

		// Get variations
		const variations = await getActiveVariationsByProductId(productId);
		const defaultVariation = variations.find(v => v.is_default) || variations[0];

		// Price from default variation if available
		const displayPrice = defaultVariation ? defaultVariation.price : product.price;
		const displayOldPrice = defaultVariation ? defaultVariation.old_price : product.old_price;

		res.json({
			success: true,
			data: {
				id: product.id,
				name: product.name,
				description: product.description,
				price: displayPrice,
				oldPrice: displayOldPrice,
				quantityInfo: product.quantity_info,
				image: product.image,
				category: categoryInfo,
				sku: product.sku,
				variationAttribute: product.variation_attribute,
				hasVariations: variations.length > 0,
				variations: variations.map(v => ({
					id: v.id,
					name: v.name,
					price: v.price,
					oldPrice: v.old_price,
					sku: v.sku,
					isDefault: Boolean(v.is_default)
				}))
			}
		});
	} catch (error: any) {
		console.error('Error fetching product:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
