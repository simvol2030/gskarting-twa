/**
 * Admin API: Clients Management
 * Based on API-CONTRACT-Clients.md
 */

import { Router } from 'express';
import { db } from '../../db/client';
import { loyaltyUsers, transactions, stores } from '../../db/schema';
import { eq, and, desc, like, sql, or } from 'drizzle-orm';
import { authenticateSession, requireRole, AuthRequest } from '../../middleware/session-auth';

const router = Router();

// 🔒 SECURITY: All admin routes require session authentication
router.use(authenticateSession);

/**
 * GET /api/admin/clients - Список клиентов с фильтрами
 */
router.get('/', async (req, res) => {
	try {
		const {
			search,
			status = 'all',
			storeId,
			page = '1',
			limit = '20'
		} = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const offset = (pageNum - 1) * limitNum;

		// Build WHERE conditions
		const conditions: any[] = [];

		if (status === 'active') {
			conditions.push(eq(loyaltyUsers.is_active, true));
		} else if (status === 'inactive') {
			conditions.push(eq(loyaltyUsers.is_active, false));
		}

		if (storeId && storeId !== 'all') {
			conditions.push(eq(loyaltyUsers.store_id, parseInt(storeId as string)));
		}

		// Search across multiple fields
		if (search && typeof search === 'string' && search.trim()) {
			const searchTerm = `%${search.trim()}%`;
			conditions.push(
				sql`(
					${loyaltyUsers.first_name} LIKE ${searchTerm} OR
					${loyaltyUsers.last_name} LIKE ${searchTerm} OR
					${loyaltyUsers.username} LIKE ${searchTerm} OR
					${loyaltyUsers.card_number} LIKE ${searchTerm} OR
					CAST(${loyaltyUsers.telegram_user_id} AS TEXT) LIKE ${searchTerm}
				)`
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Get total count
		const totalResult = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(loyaltyUsers)
			.where(whereClause);
		const total = Number(totalResult[0].count);

		// Get clients with pagination
		const clientsQuery = db
			.select({
				id: loyaltyUsers.id,
				telegram_user_id: loyaltyUsers.telegram_user_id,
				card_number: loyaltyUsers.card_number,
				first_name: loyaltyUsers.first_name,
				last_name: loyaltyUsers.last_name,
				username: loyaltyUsers.username,
				current_balance: loyaltyUsers.current_balance,
				total_purchases: loyaltyUsers.total_purchases,
				total_saved: loyaltyUsers.total_saved,
				store_id: loyaltyUsers.store_id,
				registration_date: loyaltyUsers.registration_date,
				last_activity: loyaltyUsers.last_activity,
				is_active: loyaltyUsers.is_active,
				chat_id: loyaltyUsers.chat_id,
				store_name: stores.name
			})
			.from(loyaltyUsers)
			.leftJoin(stores, eq(loyaltyUsers.store_id, stores.id))
			.where(whereClause)
			.orderBy(desc(loyaltyUsers.last_activity))
			.limit(limitNum)
			.offset(offset);

		const dbClients = await clientsQuery;

		// Transform to frontend format
		const clients = dbClients.map((c) => ({
			id: c.id,
			telegramId: c.telegram_user_id.toString(),
			cardNumber: c.card_number,
			name: `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`,
			firstName: c.first_name,
			lastName: c.last_name,
			username: c.username,
			balance: c.current_balance,
			totalPurchases: c.total_purchases,
			totalSaved: c.total_saved,
			registeredStoreId: c.store_id,
			registeredStoreName: c.store_name,
			registrationDate: c.registration_date,
			lastActivity: c.last_activity || c.registration_date,
			isActive: Boolean(c.is_active),
			chatId: c.chat_id
		}));

		res.json({
			success: true,
			data: {
				clients,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					totalPages: Math.ceil(total / limitNum)
				}
			}
		});
	} catch (error: any) {
		console.error('Error fetching clients:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error',
			code: 'INTERNAL_ERROR'
		});
	}
});

/**
 * GET /api/admin/clients/:id - Детали клиента
 */
router.get('/:id', async (req, res) => {
	try {
		const clientId = parseInt(req.params.id);

		if (isNaN(clientId)) {
			return res.status(400).json({
				success: false,
				error: 'Неверный ID клиента'
			});
		}

		// Get client with store name
		const clientResult = await db
			.select({
				id: loyaltyUsers.id,
				telegram_user_id: loyaltyUsers.telegram_user_id,
				card_number: loyaltyUsers.card_number,
				first_name: loyaltyUsers.first_name,
				last_name: loyaltyUsers.last_name,
				username: loyaltyUsers.username,
				language_code: loyaltyUsers.language_code,
				current_balance: loyaltyUsers.current_balance,
				total_purchases: loyaltyUsers.total_purchases,
				total_saved: loyaltyUsers.total_saved,
				store_id: loyaltyUsers.store_id,
				registration_date: loyaltyUsers.registration_date,
				last_activity: loyaltyUsers.last_activity,
				is_active: loyaltyUsers.is_active,
				chat_id: loyaltyUsers.chat_id,
				store_name: stores.name
			})
			.from(loyaltyUsers)
			.leftJoin(stores, eq(loyaltyUsers.store_id, stores.id))
			.where(eq(loyaltyUsers.id, clientId))
			.limit(1);

		if (clientResult.length === 0) {
			return res.status(404).json({
				success: false,
				error: 'Клиент не найден'
			});
		}

		const c = clientResult[0];

		// Calculate stats
		const daysSinceRegistration = Math.floor(
			(Date.now() - new Date(c.registration_date).getTime()) / (1000 * 60 * 60 * 24)
		);

		// Mock expired points (TODO: calculate real expired points)
		const expiredPoints = 0;

		const client = {
			id: c.id,
			telegramId: c.telegram_user_id.toString(),
			cardNumber: c.card_number,
			name: `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`,
			firstName: c.first_name,
			lastName: c.last_name,
			username: c.username,
			balance: c.current_balance,
			totalPurchases: c.total_purchases,
			totalSaved: c.total_saved,
			registeredStoreId: c.store_id,
			registeredStoreName: c.store_name,
			registrationDate: c.registration_date,
			lastActivity: c.last_activity || c.registration_date,
			isActive: Boolean(c.is_active),
			chatId: c.chat_id,
			languageCode: c.language_code,
			email: null,
			phone: null,
			birthdate: null
		};

		const stats = {
			currentBalance: c.current_balance,
			effectiveBalance: c.current_balance - expiredPoints,
			expiredPoints,
			totalPurchases: c.total_purchases,
			totalSpent: c.total_purchases * 1200, // Mock average check
			totalSaved: c.total_saved,
			averageCheck: c.total_purchases > 0 ? (c.total_purchases * 1200) / c.total_purchases : 0,
			lastPurchaseDate: c.last_activity,
			registrationDate: c.registration_date,
			daysSinceRegistration
		};

		res.json({
			success: true,
			data: { client, stats }
		});
	} catch (error: any) {
		console.error('Error fetching client:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

/**
 * GET /api/admin/clients/:id/transactions - История транзакций
 */
router.get('/:id/transactions', async (req, res) => {
	try {
		const clientId = parseInt(req.params.id);
		const { type = 'all', storeId, page = '1', limit = '20' } = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const offset = (pageNum - 1) * limitNum;

		// Build conditions
		const conditions: any[] = [eq(transactions.loyalty_user_id, clientId)];

		if (type !== 'all') {
			if (type === 'earn') {
				conditions.push(eq(transactions.type, 'earn'));
			} else if (type === 'spend') {
				conditions.push(eq(transactions.type, 'spend'));
			}
		}

		if (storeId && storeId !== 'all') {
			conditions.push(eq(transactions.store_id, parseInt(storeId as string)));
		}

		const whereClause = and(...conditions);

		// Get total count
		const totalResult = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(transactions)
			.where(whereClause);
		const total = Number(totalResult[0].count);

		// Get transactions
		const txs = await db
			.select()
			.from(transactions)
			.where(whereClause)
			.orderBy(desc(transactions.created_at))
			.limit(limitNum)
			.offset(offset);

		// BUG-C3 FIX: Get customer current balance for running balance calculation
		const customerResult = await db
			.select({ current_balance: loyaltyUsers.current_balance })
			.from(loyaltyUsers)
			.where(eq(loyaltyUsers.id, clientId))
			.limit(1);

		let startingBalance = customerResult[0]?.current_balance ?? 0;

		// For pagination: calculate net effect of all transactions newer than our page
		if (offset > 0) {
			const newerTxsResult = await db
				.select({
					type: transactions.type,
					amount: transactions.amount
				})
				.from(transactions)
				.where(whereClause)
				.orderBy(desc(transactions.created_at))
				.limit(offset);

			for (const tx of newerTxsResult) {
				if (tx.type === 'earn') {
					startingBalance -= tx.amount;
				} else if (tx.type === 'spend') {
					startingBalance += tx.amount;
				}
			}
		}

		// Calculate running balance (txs sorted DESC - newest first)
		let runningBalance = startingBalance;

		// Transform to frontend format with calculated balanceAfter
		const transactionsData = txs.map((tx) => {
			const balanceAfter = runningBalance;

			// Undo this transaction's effect to get balance before it
			if (tx.type === 'earn') {
				runningBalance -= tx.amount;
			} else if (tx.type === 'spend') {
				runningBalance += tx.amount;
			}

			return {
				id: tx.id,
				date: tx.created_at,
				storeId: tx.store_id,
				storeName: tx.store_name,
				type: tx.type as 'earn' | 'spend',
				purchaseAmount: tx.check_amount,
				pointsChange: tx.amount,
				balanceAfter: balanceAfter,
				description: tx.title
			};
		});

		res.json({
			success: true,
			data: {
				transactions: transactionsData,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					totalPages: Math.ceil(total / limitNum)
				}
			}
		});
	} catch (error: any) {
		console.error('Error fetching transactions:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

/**
 * POST /api/admin/clients/:id/balance/adjust - Ручное изменение баланса
 * ONLY: super-admin, editor
 */
router.post('/:id/balance/adjust', requireRole('super-admin', 'editor'), async (req: AuthRequest, res) => {
	try {
		const clientId = parseInt(req.params.id);
		const { operation, amount, reason } = req.body;

		// 🔒 FIX: Comprehensive validation
		const errors: string[] = [];

		// Validate clientId
		if (isNaN(clientId) || clientId <= 0) {
			errors.push('Invalid client ID');
		}

		// Validate operation
		if (!operation || !['add', 'subtract'].includes(operation)) {
			errors.push('Operation must be "add" or "subtract"');
		}

		// Validate amount (check type and range)
		const amt = Number(amount);
		if (isNaN(amt) || amt <= 0 || amt > 100000) {
			errors.push('Amount must be a number between 1 and 100000');
		}

		// Validate reason
		if (typeof reason !== 'string' || reason.length < 10 || reason.length > 500) {
			errors.push('Reason must be 10-500 characters');
		}

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				error: errors.join('; ')
			});
		}

		// Get current client
		const client = await db
			.select()
			.from(loyaltyUsers)
			.where(eq(loyaltyUsers.id, clientId))
			.limit(1);

		if (client.length === 0) {
			return res.status(404).json({
				success: false,
				error: 'Клиент не найден'
			});
		}

		const currentBalance = client[0].current_balance;

		// Check sufficient balance for subtract
		if (operation === 'subtract' && amount > currentBalance) {
			return res.status(400).json({
				success: false,
				error: 'Недостаточно баллов для списания',
				details: {
					currentBalance,
					requested: amount
				}
			});
		}

		// Perform atomic balance update
		const delta = operation === 'add' ? amount : -amount;

		await db.transaction(async (tx) => {
			// Update balance atomically
			await tx
				.update(loyaltyUsers)
				.set({ current_balance: sql`current_balance + ${delta}` })
				.where(eq(loyaltyUsers.id, clientId));

			// Create transaction record
			await tx.insert(transactions).values({
				loyalty_user_id: clientId,
				store_id: client[0].store_id,
				title: reason,
				amount: Math.abs(delta),
				type: operation === 'add' ? 'earn' : 'spend',
				check_amount: null,
				points_redeemed: operation === 'subtract' ? amount : null,
				cashback_earned: operation === 'add' ? amount : null,
				store_name: null,
				created_at: new Date().toISOString()
			});
		});

		// Get new balance
		const updatedClient = await db
			.select()
			.from(loyaltyUsers)
			.where(eq(loyaltyUsers.id, clientId))
			.limit(1);

		const newBalance = updatedClient[0].current_balance;

		res.json({
			success: true,
			data: {
				newBalance,
				transaction: {
					id: Date.now(),
					date: new Date().toISOString(),
					operation,
					amount,
					balanceBefore: currentBalance,
					balanceAfter: newBalance,
					reason,
					adminId: req.user!.id, // ✅ FIXED: Get admin ID from session
					adminName: req.user!.name // ✅ FIXED: Get admin name from session
				}
			}
		});
	} catch (error: any) {
		console.error('Error adjusting balance:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

/**
 * PATCH /api/admin/clients/:id/toggle-active - Блокировка/разблокировка
 * ONLY: super-admin
 */
router.patch('/:id/toggle-active', requireRole('super-admin'), async (req, res) => {
	try {
		const clientId = parseInt(req.params.id);
		const { isActive, reason } = req.body;

		if (typeof isActive !== 'boolean') {
			return res.status(400).json({
				success: false,
				error: 'Параметр isActive обязателен (boolean)'
			});
		}

		// Update is_active
		await db
			.update(loyaltyUsers)
			.set({ is_active: isActive })
			.where(eq(loyaltyUsers.id, clientId));

		res.json({
			success: true,
			data: {
				clientId,
				isActive,
				reason: reason || '',
				updatedAt: new Date().toISOString()
			}
		});
	} catch (error: any) {
		console.error('Error toggling client status:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

/**
 * GET /api/admin/clients/:id/balance-history - История изменений баланса
 */
router.get('/:id/balance-history', async (req, res) => {
	try {
		const clientId = parseInt(req.params.id);
		const { page = '1', limit = '20' } = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const offset = (pageNum - 1) * limitNum;

		// Get manual balance adjustments from transactions
		// 🔒 FIX: Use safe Drizzle operators instead of raw sql``
		const whereClause = and(
			eq(transactions.loyalty_user_id, clientId),
			or(
				like(transactions.title, '%ручн%'),
				like(transactions.title, '%Компенсац%'),
				like(transactions.title, '%админ%')
			)
		);

		const txs = await db
			.select()
			.from(transactions)
			.where(whereClause)
			.orderBy(desc(transactions.created_at))
			.limit(limitNum)
			.offset(offset);

		// BUG-C3 FIX: Get customer current balance for running balance calculation
		const customerResult = await db
			.select({ current_balance: loyaltyUsers.current_balance })
			.from(loyaltyUsers)
			.where(eq(loyaltyUsers.id, clientId))
			.limit(1);

		let runningBalance = customerResult[0]?.current_balance ?? 0;

		// Transform to balance history format with calculated balances
		const history = txs.map((tx) => {
			const balanceAfter = runningBalance;
			const balanceBefore = tx.type === 'earn'
				? runningBalance - tx.amount
				: runningBalance + tx.amount;

			// Update running balance for next (older) transaction
			runningBalance = balanceBefore;

			return {
				id: tx.id,
				date: tx.created_at,
				adminId: 1, // TODO: store admin_id in transactions
				adminName: 'Admin',
				operation: tx.type === 'earn' ? 'add' : 'subtract',
				amount: tx.amount,
				reason: tx.title,
				balanceBefore: balanceBefore,
				balanceAfter: balanceAfter
			};
		});

		const total = txs.length;

		res.json({
			success: true,
			data: {
				history,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					totalPages: Math.ceil(total / limitNum)
				}
			}
		});
	} catch (error: any) {
		console.error('Error fetching balance history:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

/**
 * DELETE /api/admin/clients/:id - Удалить клиента
 * ONLY: super-admin
 */
router.delete('/:id', requireRole('super-admin'), async (req, res) => {
	try {
		const clientId = parseInt(req.params.id);
		const { soft = true } = req.query;

		if (soft === 'true' || soft === true) {
			// Soft delete (is_active = false)
			await db
				.update(loyaltyUsers)
				.set({ is_active: false })
				.where(eq(loyaltyUsers.id, clientId));

			res.json({
				success: true,
				message: 'Клиент заблокирован',
				data: { id: clientId, isActive: false }
			});
		} else {
			// Hard delete
			await db.delete(loyaltyUsers).where(eq(loyaltyUsers.id, clientId));

			res.json({
				success: true,
				message: 'Клиент удален'
			});
		}
	} catch (error: any) {
		console.error('Error deleting client:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

export default router;
