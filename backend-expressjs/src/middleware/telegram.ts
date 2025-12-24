/**
 * Telegram WebApp validation middleware
 * Validates initData from Telegram WebApp to ensure requests come from legitimate users
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

interface TelegramUser {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
}

declare global {
	namespace Express {
		interface Request {
			telegramUser?: TelegramUser;
		}
	}
}

/**
 * Validate Telegram WebApp initData
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateInitData(initData: string): TelegramUser | null {
	if (!BOT_TOKEN) {
		console.warn('[Telegram] BOT_TOKEN not configured, skipping validation');
		return null;
	}

	try {
		const params = new URLSearchParams(initData);
		const hash = params.get('hash');
		params.delete('hash');

		// Sort parameters alphabetically
		const sortedParams = Array.from(params.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => `${key}=${value}`)
			.join('\n');

		// Calculate secret key
		const secretKey = crypto
			.createHmac('sha256', 'WebAppData')
			.update(BOT_TOKEN)
			.digest();

		// Calculate hash
		const calculatedHash = crypto
			.createHmac('sha256', secretKey)
			.update(sortedParams)
			.digest('hex');

		if (calculatedHash !== hash) {
			console.warn('[Telegram] Invalid hash');
			return null;
		}

		// Parse user data
		const userStr = params.get('user');
		if (!userStr) {
			console.warn('[Telegram] No user data in initData');
			return null;
		}

		const user = JSON.parse(userStr) as TelegramUser;

		// Check auth_date is not too old (max 24 hours)
		const authDate = parseInt(params.get('auth_date') || '0');
		const now = Math.floor(Date.now() / 1000);
		if (now - authDate > 86400) {
			console.warn('[Telegram] initData too old');
			return null;
		}

		return user;
	} catch (error) {
		console.error('[Telegram] Error validating initData:', error);
		return null;
	}
}

/**
 * Middleware to validate Telegram WebApp requests
 * Requires initData in Authorization header or body
 */
export function validateTelegramWebApp(req: Request, res: Response, next: NextFunction) {
	// Try to get initData from various sources
	const initData =
		req.headers['x-telegram-init-data'] as string ||
		req.headers.authorization?.replace('tma ', '') ||
		req.body?.initData;

	if (!initData) {
		// In development, allow requests with telegramUserId in body
		if (process.env.NODE_ENV === 'development' && req.body?.telegramUserId) {
			req.telegramUser = {
				id: parseInt(req.body.telegramUserId),
				first_name: 'Dev User'
			};
			return next();
		}

		return res.status(401).json({
			success: false,
			error: 'Missing Telegram authentication'
		});
	}

	const user = validateInitData(initData);

	if (!user) {
		return res.status(401).json({
			success: false,
			error: 'Invalid Telegram authentication'
		});
	}

	req.telegramUser = user;
	next();
}

/**
 * Optional validation - passes through if no initData, but validates if present
 */
export function optionalTelegramValidation(req: Request, res: Response, next: NextFunction) {
	const initData =
		req.headers['x-telegram-init-data'] as string ||
		req.headers.authorization?.replace('tma ', '');

	if (initData) {
		const user = validateInitData(initData);
		if (user) {
			req.telegramUser = user;
		}
	}

	next();
}
