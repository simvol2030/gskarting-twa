import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { queries } from '../db/database';
import { checkRateLimit, resetRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '../utils/rate-limit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/**
 * POST /api/seller/auth - авторизация продавца по PIN-коду
 */
router.post('/auth', async (req, res) => {
	const { pin } = req.body;

	// Validate PIN
	if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
		return res.status(400).json({ error: 'PIN должен быть 4-значным числом' });
	}

	// Rate limiting check
	const clientIP = getClientIP(req);
	const rateLimitResult = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.LOGIN);

	if (!rateLimitResult.allowed) {
		return res.status(429).json({
			error: rateLimitResult.message,
			retryAfter: rateLimitResult.retryAfterMs
		});
	}

	try {
		// Ищем продавца по хэшированному PIN
		const allSellers = await queries.getAllSellers();

		// Получаем полные данные продавцов для проверки PIN
		const { db } = await import('../db/client');
		const { sellers } = await import('../db/schema');
		const sellersWithPin = await db.select().from(sellers);

		let foundSeller = null;

		// Проверяем каждый PIN с bcrypt
		for (const seller of sellersWithPin) {
			const isMatch = await bcrypt.compare(pin, seller.pin);
			if (isMatch && seller.is_active) {
				foundSeller = seller;
				break;
			}
		}

		if (!foundSeller) {
			return res.status(401).json({ error: 'Неверный PIN-код' });
		}

		// Reset rate limit on successful login
		resetRateLimit(clientIP);

		// Генерируем JWT токен для продавца
		const token = jwt.sign(
			{
				id: foundSeller.id,
				name: foundSeller.name,
				type: 'seller'
			},
			JWT_SECRET,
			{ expiresIn: '12h' } // Токен на 12 часов (рабочая смена)
		);

		res.json({
			success: true,
			token,
			seller: {
				id: foundSeller.id,
				name: foundSeller.name
			}
		});
	} catch (error) {
		console.error('Seller auth error:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

/**
 * GET /api/seller/me - получить текущего продавца по токену
 */
router.get('/me', async (req, res) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ error: 'Требуется токен доступа' });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		// Проверяем что это токен продавца
		if (decoded.type !== 'seller') {
			return res.status(403).json({ error: 'Неверный тип токена' });
		}

		// Получаем актуальные данные продавца
		const seller = await queries.getSellerById(decoded.id);

		if (!seller || !seller.is_active) {
			return res.status(403).json({ error: 'Продавец не найден или деактивирован' });
		}

		res.json({
			seller: {
				id: seller.id,
				name: seller.name
			}
		});
	} catch (error) {
		res.status(403).json({ error: 'Неверный или истекший токен' });
	}
});

/**
 * POST /api/seller/logout - выход продавца
 * (Клиент должен удалить токен локально, это просто для логирования)
 */
router.post('/logout', (req, res) => {
	res.json({ success: true, message: 'Logged out' });
});

export default router;
