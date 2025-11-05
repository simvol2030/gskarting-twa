/**
 * Stores API Routes
 * Endpoints для конфигурации магазинов
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { stores } from '../db/schema';
import { eq } from 'drizzle-orm';

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

		// Возвращаем конфигурацию
		return res.json({
			storeId: store.id,
			storeName: store.name,
			location: store.address || 'г. Москва',
			cashbackPercent: 4,  // Фиксированная ставка
			maxDiscountPercent: 20  // Фиксированная ставка
		});

	} catch (error) {
		console.error('[STORES API] Error getting store config:', error);
		return res.status(500).json({
			error: 'Internal server error'
		});
	}
});

export default router;
