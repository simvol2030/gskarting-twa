/**
 * Profile API routes (for Telegram Web App users)
 * Secured with Telegram WebApp validation
 */

import { Router } from 'express';
import { db } from '../db/client';
import { loyaltyUsers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { validateTelegramWebApp } from '../middleware/telegram';

const router = Router();

/**
 * PUT /api/profile/birthday - Update user birthday
 * Requires Telegram WebApp authentication
 */
router.put('/birthday', validateTelegramWebApp, async (req, res) => {
	try {
		// Get telegramUserId from validated Telegram user (not from body for security)
		const telegramUserId = req.telegramUser?.id;

		if (!telegramUserId) {
			return res.status(401).json({
				success: false,
				error: 'Authentication required'
			});
		}

		const { birthday } = req.body;

		if (!birthday) {
			return res.status(400).json({
				success: false,
				error: 'Missing birthday'
			});
		}

		// Validate birthday format (MM-DD)
		const birthdayRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
		if (!birthdayRegex.test(birthday)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid birthday format. Use MM-DD (e.g., 12-25)'
			});
		}

		// Validate day for the given month
		const [month, day] = birthday.split('-').map(Number);
		const daysInMonth: Record<number, number> = {
			1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
			7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
		};

		if (day > daysInMonth[month]) {
			return res.status(400).json({
				success: false,
				error: `Invalid day ${day} for month ${month}`
			});
		}

		// Find user
		const [user] = await db
			.select()
			.from(loyaltyUsers)
			.where(eq(loyaltyUsers.telegram_user_id, telegramUserId))
			.limit(1);

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Update birthday
		await db
			.update(loyaltyUsers)
			.set({
				birthday,
				last_activity: new Date().toISOString()
			})
			.where(eq(loyaltyUsers.id, user.id));

		res.json({
			success: true,
			message: 'Birthday saved',
			data: { birthday }
		});

	} catch (error: any) {
		console.error('Error saving birthday:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

/**
 * GET /api/profile/birthday - Get current user's birthday
 * Requires Telegram WebApp authentication
 */
router.get('/birthday', validateTelegramWebApp, async (req, res) => {
	try {
		const telegramUserId = req.telegramUser?.id;

		if (!telegramUserId) {
			return res.status(401).json({
				success: false,
				error: 'Authentication required'
			});
		}

		const [user] = await db
			.select({ birthday: loyaltyUsers.birthday })
			.from(loyaltyUsers)
			.where(eq(loyaltyUsers.telegram_user_id, telegramUserId))
			.limit(1);

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		res.json({
			success: true,
			data: { birthday: user.birthday }
		});

	} catch (error: any) {
		console.error('Error fetching birthday:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

export default router;
