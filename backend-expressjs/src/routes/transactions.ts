/**
 * Transactions API Routes
 * Endpoints для работы с транзакциями программы лояльности
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { transactions, loyaltyUsers } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

const router = Router();

// ==================== GET /api/transactions/recent ====================
/**
 * Получить последние транзакции для магазина
 *
 * Query params:
 * - storeId: number - ID магазина
 * - limit: number - количество транзакций (default: 10, max: 50)
 *
 * Response: Transaction[]
 * [
 *   {
 *     "id": "TXN-1234567890",
 *     "customerId": "654321",
 *     "customerName": "Мария Сидорова",
 *     "checkAmount": 1000,
 *     "pointsRedeemed": 200,
 *     "cashbackEarned": 40,
 *     "finalAmount": 800,
 *     "timestamp": "2025-11-04T12:30:00Z",
 *     "storeId": 1
 *   }
 * ]
 */
router.get('/recent', async (req: Request, res: Response) => {
	try {
		const storeIdStr = req.query.storeId as string;
		const limitStr = req.query.limit as string;

		if (!storeIdStr) {
			return res.status(400).json({
				error: 'Missing required parameter: storeId'
			});
		}

		const storeId = parseInt(storeIdStr);
		const limit = Math.min(parseInt(limitStr) || 10, 50); // Max 50 transactions

		if (isNaN(storeId)) {
			return res.status(400).json({
				error: 'Invalid storeId format',
				received: storeIdStr
			});
		}

		// Fetch recent transactions for this store
		const recentTransactions = await db
			.select({
				id: transactions.id,
				customerId: loyaltyUsers.card_number,
				customerName: loyaltyUsers.first_name,
				customerLastName: loyaltyUsers.last_name,
				amount: transactions.amount,
				type: transactions.type,
				title: transactions.title,
				checkAmount: transactions.check_amount,
				pointsRedeemed: transactions.points_redeemed,
				cashbackEarned: transactions.cashback_earned,
				createdAt: transactions.created_at
			})
			.from(transactions)
			.innerJoin(loyaltyUsers, eq(transactions.loyalty_user_id, loyaltyUsers.id))
			.where(eq(transactions.store_id, storeId))
			.orderBy(desc(transactions.created_at))
			.limit(limit);

		// Transform to frontend format
		const formattedTransactions = recentTransactions.map(tx => {
			// Use saved values directly (no parsing needed)
			const checkAmount = tx.checkAmount || Math.abs(tx.amount);
			const pointsRedeemed = tx.pointsRedeemed || 0;
			const cashbackEarned = tx.cashbackEarned || 0;
			const finalAmount = checkAmount - pointsRedeemed;

			return {
				id: `TXN-${tx.id}`,
				customerId: tx.customerId,
				customerName: `${tx.customerName} ${tx.customerLastName || ''}`.trim() || 'Без имени',
				checkAmount,
				pointsRedeemed,
				cashbackEarned,
				finalAmount,
				timestamp: tx.createdAt,
				storeId
			};
		});

		console.log(`[TRANSACTIONS API] Found ${formattedTransactions.length} recent transactions for store #${storeId}`);

		return res.json(formattedTransactions);

	} catch (error) {
		console.error('[TRANSACTIONS API] Error fetching recent transactions:', error);
		return res.status(500).json({
			error: 'Internal server error'
		});
	}
});

// ==================== POST /api/transactions ====================
/**
 * Создать новую транзакцию (earn/redeem)
 *
 * Body:
 * {
 *   "customer": { "id": 1, "cardNumber": "654321", "name": "Мария Сидорова", "balance": 2210 },
 *   "storeId": 1,
 *   "checkAmount": 1000,
 *   "pointsToRedeem": 200,
 *   "cashbackAmount": 40,
 *   "finalAmount": 800
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "transaction": { ... }
 * }
 */
router.post('/', async (req: Request, res: Response) => {
	try {
		const { customer, storeId, checkAmount, pointsToRedeem, cashbackAmount, finalAmount } = req.body;

		// Validation
		if (!customer || !customer.id) {
			return res.status(400).json({
				error: 'Missing required field: customer.id'
			});
		}

		if (typeof checkAmount !== 'number' || checkAmount <= 0) {
			return res.status(400).json({
				error: 'Invalid checkAmount',
				received: checkAmount
			});
		}

		if (typeof cashbackAmount !== 'number' || cashbackAmount < 0) {
			return res.status(400).json({
				error: 'Invalid cashbackAmount',
				received: cashbackAmount
			});
		}

		if (typeof pointsToRedeem !== 'number' || pointsToRedeem < 0) {
			return res.status(400).json({
				error: 'Invalid pointsToRedeem',
				received: pointsToRedeem
			});
		}

		// Verify customer exists and has enough balance if redeeming
		const customerRecord = await db.query.loyaltyUsers.findFirst({
			where: eq(loyaltyUsers.id, customer.id)
		});

		if (!customerRecord) {
			return res.status(404).json({
				error: 'Customer not found',
				customerId: customer.id
			});
		}

		if (pointsToRedeem > 0 && customerRecord.current_balance < pointsToRedeem) {
			return res.status(400).json({
				error: 'Insufficient balance',
				required: pointsToRedeem,
				available: customerRecord.current_balance
			});
		}

		// Calculate new balance
		const newBalance = customerRecord.current_balance - pointsToRedeem + cashbackAmount;

		// Create transaction record
		const title = pointsToRedeem > 0
			? `Списание: -${pointsToRedeem}₽, Начисление: +${cashbackAmount}₽`
			: `Начисление: +${cashbackAmount}₽`;

		const [newTransaction] = await db.insert(transactions).values({
			loyalty_user_id: customer.id,
			store_id: storeId || null,
			title,
			amount: pointsToRedeem > 0 ? -pointsToRedeem : cashbackAmount,
			type: pointsToRedeem > 0 ? 'spend' : 'earn',
			check_amount: checkAmount, // Сохраняем сумму чека
			points_redeemed: pointsToRedeem, // Сохраняем списание
			cashback_earned: cashbackAmount, // Сохраняем начисление
			spent: pointsToRedeem > 0 ? 'Оплата покупки' : null,
			store_name: null
		}).returning();

		// Update customer balance
		await db.update(loyaltyUsers)
			.set({ current_balance: newBalance })
			.where(eq(loyaltyUsers.id, customer.id));

		console.log(`[TRANSACTIONS API] Created transaction #${newTransaction.id} for customer #${customer.id}`);
		console.log(`  Balance: ${customerRecord.current_balance} → ${newBalance}`);

		// Если есть списание - создаём pending_discount для Agent'а
		if (pointsToRedeem > 0) {
			const { pendingDiscounts } = await import('../db/schema');
			const expiresAt = new Date(Date.now() + 30000).toISOString(); // 30 секунд

			await db.insert(pendingDiscounts).values({
				store_id: storeId,
				transaction_id: newTransaction.id,
				discount_amount: pointsToRedeem,
				status: 'pending',
				expires_at: expiresAt
			});

			console.log(`  📝 Created pending_discount: ${pointsToRedeem}₽ (expires in 30s)`);
		}

		// Return formatted response
		return res.json({
			success: true,
			transaction: {
				id: `TXN-${newTransaction.id}`,
				customerId: customer.cardNumber,
				customerName: customer.name,
				checkAmount,
				pointsRedeemed: pointsToRedeem,
				cashbackEarned: cashbackAmount,
				finalAmount,
				timestamp: newTransaction.created_at,
				storeId
			}
		});

	} catch (error) {
		console.error('[TRANSACTIONS API] Error creating transaction:', error);
		return res.status(500).json({
			error: 'Internal server error'
		});
	}
});

export default router;
