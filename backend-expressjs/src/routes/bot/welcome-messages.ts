/**
 * Bot API: Welcome Messages (Public)
 * Публичные endpoints для Telegram бота (БЕЗ авторизации)
 */

import { Router } from 'express';
import { getActiveWelcomeMessages } from '../../db/queries/welcomeMessages';

const router = Router();

/**
 * GET /api/bot/welcome-messages/active
 * Получить активные приветственные сообщения для бота
 * Публичный endpoint (без авторизации)
 */
router.get('/active', async (req, res) => {
	try {
		const messages = await getActiveWelcomeMessages();
		res.json({ success: true, data: messages });
	} catch (error) {
		console.error('[BOT API] Error fetching active welcome messages:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
