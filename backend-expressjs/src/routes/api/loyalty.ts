/**
 * Public API: Loyalty Settings
 * Публичные endpoints для Telegram Web App
 */

import { Router } from 'express';
import { db } from '../../db/client';
import { loyaltySettings } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/loyalty/settings - Получить настройки программы лояльности
 * Публичный endpoint (без авторизации) для отображения в TWA
 */
router.get('/settings', async (req, res) => {
	try {
		const settings = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, 1)).limit(1);

		if (settings.length === 0) {
			// Если настройки не найдены, вернуть дефолтные значения
			return res.json({
				success: true,
				data: {
					earningPercent: 4.0,
					maxDiscountPercent: 20.0,
					expiryDays: 45,
					pointsName: 'Мурзи-коины',
					minRedemptionAmount: 1.0
				}
			});
		}

		const s = settings[0];

		// Возвращаем только необходимые поля для TWA (без support_email/phone)
		res.json({
			success: true,
			data: {
				earningPercent: s.earning_percent,
				maxDiscountPercent: s.max_discount_percent,
				expiryDays: s.expiry_days,
				pointsName: s.points_name,
				minRedemptionAmount: s.min_redemption_amount,
				welcomeBonus: s.welcome_bonus
			}
		});
	} catch (error: any) {
		console.error('Error fetching public loyalty settings:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
