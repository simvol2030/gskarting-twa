/**
 * Admin API: Promotions Management (Sprint 2 Refactored)
 * Simplified schema: title, description, image, deadline, isActive, showOnHome
 */

import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/client';
import { offers } from '../../db/schema';
import { eq, desc, like, and, or, sql } from 'drizzle-orm';
import { authenticateSession, requireRole } from '../../middleware/session-auth';
import { validatePromotionData } from '../../utils/validation';

const router = Router();

// Uploads directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'promotions');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer configuration - store in memory for processing
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
 * POST /api/admin/promotions/upload - Upload promotion image
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
		const filename = `promotion_${timestamp}_${randomSuffix}.webp`;
		const filepath = path.join(UPLOADS_DIR, filename);

		// Process image with sharp:
		// - Convert to WebP
		// - Resize to max 800px width (keeping aspect ratio)
		// - Quality 85%
		await sharp(file.buffer)
			.resize(800, 800, {
				fit: 'inside',
				withoutEnlargement: true
			})
			.webp({ quality: 85 })
			.toFile(filepath);

		// Return URL path for database storage
		const imageUrl = `/api/uploads/promotions/${filename}`;

		res.status(201).json({
			success: true,
			data: {
				url: imageUrl,
				filename: filename
			}
		});
	} catch (error: any) {
		console.error('Error uploading promotion image:', error);
		res.status(500).json({ success: false, error: error.message || 'Internal server error' });
	}
});

/**
 * GET /api/admin/promotions - Список акций
 */
router.get('/', async (req, res) => {
	try {
		const { search, status = 'all', page = '1', limit = '20' } = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const offset = (pageNum - 1) * limitNum;

		// Build conditions
		const conditions: any[] = [];

		if (status === 'active') {
			conditions.push(eq(offers.is_active, true));
		} else if (status === 'inactive') {
			conditions.push(eq(offers.is_active, false));
		}

		if (search && typeof search === 'string') {
			const searchTerm = `%${search.trim()}%`;
			// 🔒 FIX: Use safe Drizzle operators instead of sql`` template
			conditions.push(
				or(
					like(offers.title, searchTerm),
					like(offers.description, searchTerm)
				)
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Get total
		const totalResult = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(offers)
			.where(whereClause);
		const total = Number(totalResult[0].count);

		// Get promotions
		const dbPromotions = await db
			.select()
			.from(offers)
			.where(whereClause)
			.orderBy(desc(offers.id))
			.limit(limitNum)
			.offset(offset);

		// Transform to frontend format (Sprint 2 refactored)
		const promotions = dbPromotions.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			image: p.image,
			deadline: p.deadline,
			isActive: Boolean(p.is_active),
			showOnHome: Boolean(p.show_on_home)
		}));

		res.json({
			success: true,
			data: {
				promotions,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					totalPages: Math.ceil(total / limitNum)
				}
			}
		});
	} catch (error: any) {
		console.error('Error fetching promotions:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

/**
 * POST /api/admin/promotions - Создать акцию
 * ONLY: super-admin, editor
 */
router.post('/', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const { title, description, image, deadline, isActive = true, showOnHome = false } = req.body;

		// 🔒 FIX: Comprehensive validation (Sprint 2 refactored)
		const validation = validatePromotionData(req.body);
		if (!validation.valid) {
			return res.status(400).json({
				success: false,
				error: validation.errors.join('; ')
			});
		}

		// Insert (only new fields, old fields set to defaults for DB compatibility)
		const result = await db
			.insert(offers)
			.values({
				title,
				description,
				image,
				deadline,
				is_active: isActive,
				show_on_home: showOnHome,
				// Old fields set to defaults for backward compatibility
				icon: '🎁',
				icon_color: 'blue',
				deadline_class: 'normal',
				details: description,
				conditions: '[]'
			})
			.returning();

		const created = result[0];

		res.status(201).json({
			success: true,
			data: {
				id: created.id,
				title: created.title,
				description: created.description,
				image: created.image,
				deadline: created.deadline,
				isActive: Boolean(created.is_active),
				showOnHome: Boolean(created.show_on_home)
			}
		});
	} catch (error: any) {
		console.error('Error creating promotion:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PUT /api/admin/promotions/:id - Обновить акцию
 * ONLY: super-admin, editor
 */
router.put('/:id', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const promotionId = parseInt(req.params.id);
		const { title, description, image, deadline, isActive, showOnHome } = req.body;

		// 🔒 FIX: Add validation (Sprint 2 refactored)
		const validation = validatePromotionData(req.body);
		if (!validation.valid) {
			return res.status(400).json({
				success: false,
				error: validation.errors.join('; ')
			});
		}

		const result = await db
			.update(offers)
			.set({
				title,
				description,
				image,
				deadline,
				is_active: isActive,
				show_on_home: showOnHome,
				// Update old fields for backward compatibility
				details: description
			})
			.where(eq(offers.id, promotionId))
			.returning();

		if (result.length === 0) {
			return res.status(404).json({ success: false, error: 'Акция не найдена' });
		}

		const updated = result[0];

		res.json({
			success: true,
			data: {
				id: updated.id,
				title: updated.title,
				description: updated.description,
				image: updated.image,
				deadline: updated.deadline,
				isActive: Boolean(updated.is_active),
				showOnHome: Boolean(updated.show_on_home)
			}
		});
	} catch (error: any) {
		console.error('Error updating promotion:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * DELETE /api/admin/promotions/:id - Удалить акцию
 * ONLY: super-admin
 */
router.delete('/:id', requireRole('super-admin'), async (req, res) => {
	try {
		const promotionId = parseInt(req.params.id);
		const { soft = 'true' } = req.query;

		if (soft === 'true') {
			// Soft delete
			await db.update(offers).set({ is_active: false }).where(eq(offers.id, promotionId));
			res.json({ success: true, message: 'Акция деактивирована' });
		} else {
			// Hard delete
			await db.delete(offers).where(eq(offers.id, promotionId));
			res.json({ success: true, message: 'Акция удалена' });
		}
	} catch (error: any) {
		console.error('Error deleting promotion:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PATCH /api/admin/promotions/:id/toggle-active - Включить/выключить
 * ONLY: super-admin, editor
 */
router.patch('/:id/toggle-active', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const promotionId = parseInt(req.params.id);
		const { isActive } = req.body;

		await db.update(offers).set({ is_active: isActive }).where(eq(offers.id, promotionId));

		res.json({
			success: true,
			data: {
				id: promotionId,
				isActive,
				updatedAt: new Date().toISOString()
			}
		});
	} catch (error: any) {
		console.error('Error toggling promotion:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
