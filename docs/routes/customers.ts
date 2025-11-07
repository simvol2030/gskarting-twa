/**
 * Customer API Routes
 * Endpoints для поиска клиентов программы лояльности
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { loyaltyUsers } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// ==================== GET /api/customers/search ====================
/**
 * Найти клиента по номеру карты
 *
 * Query params:
 * - card: string - номер карты (6 цифр, например "654321")
 * - storeId: number - ID магазина (опционально)
 *
 * Response:
 * {
 *   "id": 1,
 *   "cardNumber": "654321",
 *   "name": "Иван Петров",
 *   "balance": 500.0,
 *   "createdAt": "2024-01-15T00:00:00Z"
 * }
 */
router.get('/search', async (req: Request, res: Response) => {
	try {
		const cardNumber = req.query.card as string;
		const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : null;

		if (!cardNumber) {
			return res.status(400).json({
				error: 'Missing required parameter: card'
			});
		}

		// 🔴 FIX: Валидация формата (6 или 8 цифр)
		if (!/^\d{6}$|^\d{8}$/.test(cardNumber)) {
			return res.status(400).json({
				error: 'Invalid card format',
				expected: '6 or 8 digits',
				received: cardNumber
			});
		}

		// Поддержка двух форматов:
		// 1. "654321" - обычный 6-значный номер карты
		// 2. "99654321" - QR код с префиксом "99" (убираем префикс)
		let searchCardNumber = cardNumber;
		if (cardNumber.startsWith('99') && cardNumber.length === 8) {
			searchCardNumber = cardNumber.substring(2); // Убираем "99"
		}

		// Поиск клиента в БД
		const customer = await db.query.loyaltyUsers.findFirst({
			where: eq(loyaltyUsers.card_number, searchCardNumber)
		});

		if (!customer) {
			return res.status(404).json({
				error: 'Customer not found',
				cardNumber: searchCardNumber
			});
		}

		// Проверка активности
		if (!customer.is_active) {
			return res.status(403).json({
				error: 'Customer account is inactive',
				cardNumber: searchCardNumber
			});
		}

		console.log(`[CUSTOMER API] Found customer: card=${searchCardNumber}, balance=${customer.current_balance}₽`);

		// Возвращаем данные клиента
		return res.json({
			id: customer.id,
			cardNumber: customer.card_number,
			name: `${customer.first_name} ${customer.last_name || ''}`.trim() || 'Без имени',
			balance: customer.current_balance,
			createdAt: customer.registration_date
		});

	} catch (error) {
		console.error('[CUSTOMER API] Error searching customer:', error);
		return res.status(500).json({
			error: 'Internal server error'
		});
	}
});

export default router;
