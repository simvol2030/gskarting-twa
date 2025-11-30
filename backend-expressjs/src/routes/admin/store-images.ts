/**
 * Admin API: Store Images Management
 * Upload, delete, reorder store images with automatic WebP conversion
 */

import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/client';
import { storeImages, stores } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { authenticateSession, requireRole } from '../../middleware/session-auth';

const router = Router();

// Uploads directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'stores');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer configuration - store in memory for processing
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max
		files: 36 // Max 36 images
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
 * GET /api/admin/stores/:storeId/images - Get all images for a store
 */
router.get('/:storeId/images', async (req, res) => {
	try {
		const storeId = parseInt(req.params.storeId);

		const images = await db
			.select()
			.from(storeImages)
			.where(eq(storeImages.store_id, storeId))
			.orderBy(asc(storeImages.sort_order));

		res.json({
			success: true,
			data: {
				images: images.map(img => ({
					id: img.id,
					filename: img.filename,
					originalName: img.original_name,
					sortOrder: img.sort_order,
					url: `/api/uploads/stores/${img.filename}`
				}))
			}
		});
	} catch (error: any) {
		console.error('Error fetching store images:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/admin/stores/:storeId/images - Upload image(s)
 * Automatically converts to WebP and resizes
 * ONLY: super-admin, editor
 */
router.post(
	'/:storeId/images',
	requireRole('super-admin', 'editor'),
	upload.array('images', 36),
	async (req, res) => {
		try {
			const storeId = parseInt(req.params.storeId);
			const files = req.files as Express.Multer.File[];

			if (!files || files.length === 0) {
				return res.status(400).json({ success: false, error: 'Файлы не загружены' });
			}

			// Check store exists
			const store = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
			if (store.length === 0) {
				return res.status(404).json({ success: false, error: 'Магазин не найден' });
			}

			// Get current max sort order
			const existingImages = await db
				.select()
				.from(storeImages)
				.where(eq(storeImages.store_id, storeId))
				.orderBy(asc(storeImages.sort_order));

			// Check limit (36 images max)
			if (existingImages.length + files.length > 36) {
				return res.status(400).json({
					success: false,
					error: `Максимум 36 изображений. Сейчас: ${existingImages.length}, пытаетесь добавить: ${files.length}`
				});
			}

			let maxOrder = existingImages.length > 0
				? Math.max(...existingImages.map(img => img.sort_order))
				: -1;

			const uploadedImages: any[] = [];

			for (const file of files) {
				// Generate unique filename
				const timestamp = Date.now();
				const randomSuffix = Math.random().toString(36).substring(2, 8);
				const filename = `store_${storeId}_${timestamp}_${randomSuffix}.webp`;
				const filepath = path.join(UPLOADS_DIR, filename);

				// Process image with sharp:
				// - Convert to WebP
				// - Resize to max 800px width (keeping aspect ratio)
				// - Quality 85% for good balance
				await sharp(file.buffer)
					.resize(800, 800, {
						fit: 'inside', // Fit within 800x800 maintaining aspect ratio
						withoutEnlargement: true // Don't upscale small images
					})
					.webp({ quality: 85 })
					.toFile(filepath);

				// Save to database
				maxOrder++;
				const result = await db
					.insert(storeImages)
					.values({
						store_id: storeId,
						filename: filename,
						original_name: file.originalname,
						sort_order: maxOrder
					})
					.returning();

				uploadedImages.push({
					id: result[0].id,
					filename: result[0].filename,
					originalName: result[0].original_name,
					sortOrder: result[0].sort_order,
					url: `/api/uploads/stores/${result[0].filename}`
				});
			}

			res.status(201).json({
				success: true,
				data: { images: uploadedImages }
			});
		} catch (error: any) {
			console.error('Error uploading store images:', error);
			res.status(500).json({ success: false, error: error.message || 'Internal server error' });
		}
	}
);

/**
 * PUT /api/admin/stores/:storeId/images/reorder - Reorder images
 * Body: { imageIds: [3, 1, 2] } - new order
 * ONLY: super-admin, editor
 */
router.put(
	'/:storeId/images/reorder',
	requireRole('super-admin', 'editor'),
	async (req, res) => {
		try {
			const storeId = parseInt(req.params.storeId);
			const { imageIds } = req.body;

			if (!Array.isArray(imageIds) || imageIds.length === 0) {
				return res.status(400).json({ success: false, error: 'imageIds должен быть массивом' });
			}

			// Update sort_order for each image
			for (let i = 0; i < imageIds.length; i++) {
				await db
					.update(storeImages)
					.set({ sort_order: i })
					.where(eq(storeImages.id, imageIds[i]));
			}

			// Return updated list
			const images = await db
				.select()
				.from(storeImages)
				.where(eq(storeImages.store_id, storeId))
				.orderBy(asc(storeImages.sort_order));

			res.json({
				success: true,
				data: {
					images: images.map(img => ({
						id: img.id,
						filename: img.filename,
						originalName: img.original_name,
						sortOrder: img.sort_order,
						url: `/api/uploads/stores/${img.filename}`
					}))
				}
			});
		} catch (error: any) {
			console.error('Error reordering store images:', error);
			res.status(500).json({ success: false, error: 'Internal server error' });
		}
	}
);

/**
 * DELETE /api/admin/stores/:storeId/images/:imageId - Delete image
 * ONLY: super-admin, editor
 */
router.delete(
	'/:storeId/images/:imageId',
	requireRole('super-admin', 'editor'),
	async (req, res) => {
		try {
			const storeId = parseInt(req.params.storeId);
			const imageId = parseInt(req.params.imageId);

			// Get image to delete
			const image = await db
				.select()
				.from(storeImages)
				.where(eq(storeImages.id, imageId))
				.limit(1);

			if (image.length === 0) {
				return res.status(404).json({ success: false, error: 'Изображение не найдено' });
			}

			// Verify it belongs to the store
			if (image[0].store_id !== storeId) {
				return res.status(403).json({ success: false, error: 'Изображение не принадлежит этому магазину' });
			}

			// Delete file from disk
			const filepath = path.join(UPLOADS_DIR, image[0].filename);
			if (fs.existsSync(filepath)) {
				fs.unlinkSync(filepath);
			}

			// Delete from database
			await db.delete(storeImages).where(eq(storeImages.id, imageId));

			// Reorder remaining images
			const remaining = await db
				.select()
				.from(storeImages)
				.where(eq(storeImages.store_id, storeId))
				.orderBy(asc(storeImages.sort_order));

			for (let i = 0; i < remaining.length; i++) {
				await db
					.update(storeImages)
					.set({ sort_order: i })
					.where(eq(storeImages.id, remaining[i].id));
			}

			res.json({ success: true, message: 'Изображение удалено' });
		} catch (error: any) {
			console.error('Error deleting store image:', error);
			res.status(500).json({ success: false, error: 'Internal server error' });
		}
	}
);

export default router;
