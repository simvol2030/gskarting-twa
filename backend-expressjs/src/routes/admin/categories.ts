/**
 * Admin API: Categories Management
 * CRUD операции для категорий товаров
 */

import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/client';
import { categories, products } from '../../db/schema';
import { eq, and, desc, asc, like, sql, isNull } from 'drizzle-orm';
import { authenticateSession, requireRole } from '../../middleware/session-auth';

const router = Router();

// Uploads directory for category images
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'categories');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer configuration
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024 // 5MB max
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Разрешены только изображения (JPEG, PNG, WebP, GIF)'));
		}
	}
});

// 🔒 SECURITY: All admin routes require authentication
router.use(authenticateSession);

/**
 * Helper: Generate slug from name
 */
function generateSlug(name: string): string {
	const translitMap: Record<string, string> = {
		'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
		'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
		'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
		'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
		'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
	};

	return name
		.toLowerCase()
		.split('')
		.map(char => translitMap[char] || char)
		.join('')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.substring(0, 50);
}

/**
 * Helper: Map DB category to API response
 */
function mapCategoryToResponse(cat: typeof categories.$inferSelect) {
	return {
		id: cat.id,
		name: cat.name,
		slug: cat.slug,
		description: cat.description,
		image: cat.image,
		parentId: cat.parent_id,
		position: cat.position,
		isActive: Boolean(cat.is_active),
		createdAt: cat.created_at,
		updatedAt: cat.updated_at
	};
}

/**
 * POST /api/admin/categories/upload - Upload category image
 * ONLY: super-admin, editor
 */
router.post('/upload', requireRole('super-admin', 'editor'), upload.single('image'), async (req, res) => {
	try {
		const file = req.file;

		if (!file) {
			return res.status(400).json({ success: false, error: 'Файл не загружен' });
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomSuffix = Math.random().toString(36).substring(2, 8);
		const filename = `category_${timestamp}_${randomSuffix}.webp`;
		const filepath = path.join(UPLOADS_DIR, filename);

		// Process image with sharp
		await sharp(file.buffer)
			.resize(400, 400, {
				fit: 'cover',
				withoutEnlargement: true
			})
			.webp({ quality: 85 })
			.toFile(filepath);

		const imageUrl = `/api/uploads/categories/${filename}`;

		res.status(201).json({
			success: true,
			data: {
				url: imageUrl,
				filename: filename
			}
		});
	} catch (error: any) {
		console.error('Error uploading category image:', error);
		res.status(500).json({ success: false, error: error.message || 'Internal server error' });
	}
});

/**
 * GET /api/admin/categories - Список всех категорий
 */
router.get('/', async (req, res) => {
	try {
		const { search, status = 'all', parent } = req.query;

		const conditions: any[] = [];

		if (status === 'active') conditions.push(eq(categories.is_active, true));
		else if (status === 'inactive') conditions.push(eq(categories.is_active, false));

		if (parent === 'root') {
			conditions.push(isNull(categories.parent_id));
		} else if (parent && parent !== 'all') {
			conditions.push(eq(categories.parent_id, parseInt(parent as string)));
		}

		if (search && typeof search === 'string') {
			conditions.push(like(categories.name, `%${search.trim()}%`));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const dbCategories = await db
			.select()
			.from(categories)
			.where(whereClause)
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
			...mapCategoryToResponse(cat),
			productCount: countsMap.get(cat.id) || 0
		}));

		res.json({
			success: true,
			data: {
				categories: categoriesData,
				total: categoriesData.length
			}
		});
	} catch (error: any) {
		console.error('Error fetching categories:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/admin/categories/:id - Получить категорию по ID
 */
router.get('/:id', async (req, res) => {
	try {
		const categoryId = parseInt(req.params.id);

		const [category] = await db
			.select()
			.from(categories)
			.where(eq(categories.id, categoryId));

		if (!category) {
			return res.status(404).json({ success: false, error: 'Категория не найдена' });
		}

		// Get product count
		const [productCount] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(products)
			.where(and(
				eq(products.category_id, categoryId),
				eq(products.is_active, true)
			));

		// Get subcategories
		const subcategories = await db
			.select()
			.from(categories)
			.where(eq(categories.parent_id, categoryId))
			.orderBy(asc(categories.position));

		res.json({
			success: true,
			data: {
				...mapCategoryToResponse(category),
				productCount: Number(productCount.count),
				subcategories: subcategories.map(mapCategoryToResponse)
			}
		});
	} catch (error: any) {
		console.error('Error fetching category:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/admin/categories - Создать категорию
 * ONLY: super-admin, editor
 */
router.post('/', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const { name, description, image, parentId, isActive = true } = req.body;

		if (!name || name.trim().length === 0) {
			return res.status(400).json({ success: false, error: 'Название категории обязательно' });
		}

		// Generate slug
		let slug = generateSlug(name);

		// Check if slug exists and make it unique
		const existingSlugs = await db
			.select({ slug: categories.slug })
			.from(categories)
			.where(like(categories.slug, `${slug}%`));

		if (existingSlugs.length > 0) {
			const slugSet = new Set(existingSlugs.map(s => s.slug));
			let counter = 1;
			let newSlug = slug;
			while (slugSet.has(newSlug)) {
				newSlug = `${slug}-${counter}`;
				counter++;
			}
			slug = newSlug;
		}

		// Get max position for parent (or root level)
		const [maxPosition] = await db
			.select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
			.from(categories)
			.where(parentId ? eq(categories.parent_id, parentId) : isNull(categories.parent_id));

		const position = (maxPosition?.maxPos ?? -1) + 1;

		const [created] = await db
			.insert(categories)
			.values({
				name: name.trim(),
				slug,
				description: description?.trim() || null,
				image: image || null,
				parent_id: parentId || null,
				position,
				is_active: isActive
			})
			.returning();

		res.status(201).json({
			success: true,
			data: mapCategoryToResponse(created)
		});
	} catch (error: any) {
		console.error('Error creating category:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PUT /api/admin/categories/:id - Обновить категорию
 * ONLY: super-admin, editor
 */
router.put('/:id', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const categoryId = parseInt(req.params.id);
		const { name, description, image, parentId, isActive } = req.body;

		if (!name || name.trim().length === 0) {
			return res.status(400).json({ success: false, error: 'Название категории обязательно' });
		}

		// Check if category exists
		const [existing] = await db
			.select()
			.from(categories)
			.where(eq(categories.id, categoryId));

		if (!existing) {
			return res.status(404).json({ success: false, error: 'Категория не найдена' });
		}

		// Prevent setting parent to self or descendant
		if (parentId === categoryId) {
			return res.status(400).json({ success: false, error: 'Категория не может быть своим родителем' });
		}

		// Check for circular reference
		if (parentId) {
			let currentParentId: number | null = parentId;
			while (currentParentId !== null) {
				if (currentParentId === categoryId) {
					return res.status(400).json({ success: false, error: 'Обнаружена циклическая ссылка' });
				}
				const [parent] = await db
					.select({ parent_id: categories.parent_id })
					.from(categories)
					.where(eq(categories.id, currentParentId));
				currentParentId = parent?.parent_id ?? null;
			}
		}

		// Update slug if name changed
		let slug = existing.slug;
		if (name.trim() !== existing.name) {
			slug = generateSlug(name);

			// Make slug unique
			const existingSlugs = await db
				.select({ slug: categories.slug })
				.from(categories)
				.where(and(
					like(categories.slug, `${slug}%`),
					sql`${categories.id} != ${categoryId}`
				));

			if (existingSlugs.length > 0) {
				const slugSet = new Set(existingSlugs.map(s => s.slug));
				let counter = 1;
				let newSlug = slug;
				while (slugSet.has(newSlug)) {
					newSlug = `${slug}-${counter}`;
					counter++;
				}
				slug = newSlug;
			}
		}

		const [updated] = await db
			.update(categories)
			.set({
				name: name.trim(),
				slug,
				description: description?.trim() || null,
				image: image || null,
				parent_id: parentId ?? null,
				is_active: isActive ?? existing.is_active,
				updated_at: new Date().toISOString()
			})
			.where(eq(categories.id, categoryId))
			.returning();

		res.json({
			success: true,
			data: mapCategoryToResponse(updated)
		});
	} catch (error: any) {
		console.error('Error updating category:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * DELETE /api/admin/categories/:id - Удалить категорию
 * ONLY: super-admin
 */
router.delete('/:id', requireRole('super-admin'), async (req, res) => {
	try {
		const categoryId = parseInt(req.params.id);
		const { soft = 'true' } = req.query;

		// Check if category has products
		const [productCount] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(products)
			.where(eq(products.category_id, categoryId));

		if (Number(productCount.count) > 0 && soft === 'false') {
			return res.status(400).json({
				success: false,
				error: `Невозможно удалить категорию с товарами (${productCount.count} шт.). Сначала переместите товары в другую категорию.`
			});
		}

		// Check if category has subcategories
		const [subcatCount] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(categories)
			.where(eq(categories.parent_id, categoryId));

		if (Number(subcatCount.count) > 0 && soft === 'false') {
			return res.status(400).json({
				success: false,
				error: `Невозможно удалить категорию с подкатегориями (${subcatCount.count} шт.). Сначала удалите подкатегории.`
			});
		}

		if (soft === 'true') {
			await db.update(categories).set({ is_active: false }).where(eq(categories.id, categoryId));
			res.json({ success: true, message: 'Категория скрыта' });
		} else {
			// Soft delete products in this category (set category_id to null)
			await db.update(products).set({ category_id: null }).where(eq(products.category_id, categoryId));

			await db.delete(categories).where(eq(categories.id, categoryId));
			res.json({ success: true, message: 'Категория удалена' });
		}
	} catch (error: any) {
		console.error('Error deleting category:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PATCH /api/admin/categories/:id/toggle-active - Показать/скрыть
 * ONLY: super-admin, editor
 */
router.patch('/:id/toggle-active', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const categoryId = parseInt(req.params.id);
		const { isActive } = req.body;

		await db.update(categories)
			.set({
				is_active: isActive,
				updated_at: new Date().toISOString()
			})
			.where(eq(categories.id, categoryId));

		res.json({
			success: true,
			data: { id: categoryId, isActive }
		});
	} catch (error: any) {
		console.error('Error toggling category:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PATCH /api/admin/categories/reorder - Изменить порядок категорий
 * ONLY: super-admin, editor
 * Body: { items: [{ id: number, position: number }] }
 */
router.patch('/reorder', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const { items } = req.body;

		if (!Array.isArray(items)) {
			return res.status(400).json({ success: false, error: 'items должен быть массивом' });
		}

		// Update positions in a transaction-like manner
		for (const item of items) {
			if (typeof item.id !== 'number' || typeof item.position !== 'number') {
				continue;
			}
			await db.update(categories)
				.set({
					position: item.position,
					updated_at: new Date().toISOString()
				})
				.where(eq(categories.id, item.id));
		}

		res.json({ success: true, message: 'Порядок обновлен' });
	} catch (error: any) {
		console.error('Error reordering categories:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
