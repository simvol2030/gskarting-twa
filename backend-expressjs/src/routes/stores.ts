/**
 * Stores API Routes
 * Endpoints для конфигурации магазинов
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { stores, loyaltySettings, storeImages } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

const router = Router();

// ==================== GET /api/stores/:id/config ====================
/**
 * Получить конфигурацию магазина (для TWA кассира)
 *
 * Params:
 * - id: number - ID магазина
 *
 * Response:
 * {
 *   "storeId": 1,
 *   "storeName": "Ашукино",
 *   "location": "г. Москва",
 *   "cashbackPercent": 4,
 *   "maxDiscountPercent": 20
 * }
 */
router.get('/:id/config', async (req: Request, res: Response) => {
	try {
		const storeId = parseInt(req.params.id);

		if (!storeId || isNaN(storeId)) {
			return res.status(400).json({
				error: 'Invalid storeId parameter'
			});
		}

		// Получаем магазин из БД
		const store = await db.query.stores.findFirst({
			where: eq(stores.id, storeId)
		});

		if (!store) {
			return res.status(404).json({
				error: 'Store not found',
				storeId
			});
		}

		// FIX: Получаем настройки из loyaltySettings вместо хардкода
		const settings = await db.query.loyaltySettings.findFirst();
		const cashbackPercent = settings?.earning_percent ?? 4;
		const maxDiscountPercent = settings?.max_discount_percent ?? 20;

		// Возвращаем конфигурацию с реальными настройками
		return res.json({
			storeId: store.id,
			storeName: store.name,
			location: store.address || 'г. Москва',
			cashbackPercent,
			maxDiscountPercent
		});

	} catch (error) {
		console.error('[STORES API] Error getting store config:', error);
		return res.status(500).json({
			error: 'Internal server error'
		});
	}
});

// ==================== GET /api/stores/:id/images ====================
/**
 * Получить изображения магазина для слайдера (публичный endpoint)
 *
 * Params:
 * - id: number - ID магазина
 *
 * Response:
 * {
 *   "images": [
 *     { "id": 1, "url": "/uploads/stores/store_1_xxx.webp" }
 *   ]
 * }
 */
router.get('/:id/images', async (req: Request, res: Response) => {
	try {
		const storeId = parseInt(req.params.id);

		if (!storeId || isNaN(storeId)) {
			return res.status(400).json({
				error: 'Invalid storeId parameter'
			});
		}

		const images = await db
			.select()
			.from(storeImages)
			.where(eq(storeImages.store_id, storeId))
			.orderBy(asc(storeImages.sort_order));

		return res.json({
			images: images.map(img => ({
				id: img.id,
				url: `/api/uploads/stores/${img.filename}`
			}))
		});

	} catch (error) {
		console.error('[STORES API] Error getting store images:', error);
		return res.status(500).json({
			error: 'Internal server error'
		});
	}
});

export default router;
