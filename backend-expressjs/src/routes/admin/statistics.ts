/**
 * Admin API: Statistics & Analytics
 * Based on API-CONTRACT-Statistics.md
 */

import { Router } from 'express';
import { db } from '../../db/client';
import { loyaltyUsers, cashierTransactions, stores } from '../../db/schema';
import { sql, eq, gte } from 'drizzle-orm';
import { authenticateSession } from '../../middleware/session-auth';

const router = Router();

// 🔒 SECURITY: All admin routes require session authentication
router.use(authenticateSession);

/**
 * GET /api/admin/statistics/dashboard - Dashboard stats (аггрегированные данные)
 */
router.get('/dashboard', async (req, res) => {
	try {
		// Clients stats
		const clientsStats = await db
			.select({
				total: sql<number>`COUNT(*)`,
				active: sql<number>`SUM(CASE WHEN ${loyaltyUsers.is_active} = 1 THEN 1 ELSE 0 END)`,
				newThisMonth: sql<number>`SUM(CASE WHEN ${loyaltyUsers.registration_date} >= date('now', 'start of month') THEN 1 ELSE 0 END)`,
				averageBalance: sql<number>`AVG(${loyaltyUsers.current_balance})`
			})
			.from(loyaltyUsers);

		// Transactions stats
		const txStats = await db
			.select({
				totalToday: sql<number>`SUM(CASE WHEN date(${cashierTransactions.created_at}) = date('now') THEN 1 ELSE 0 END)`,
				revenueToday: sql<number>`SUM(CASE WHEN date(${cashierTransactions.created_at}) = date('now') THEN ${cashierTransactions.purchase_amount} ELSE 0 END)`,
				totalThisWeek: sql<number>`SUM(CASE WHEN ${cashierTransactions.created_at} >= date('now', '-7 days') THEN 1 ELSE 0 END)`,
				revenueThisWeek: sql<number>`SUM(CASE WHEN ${cashierTransactions.created_at} >= date('now', '-7 days') THEN ${cashierTransactions.purchase_amount} ELSE 0 END)`
			})
			.from(cashierTransactions);

		// Stores stats
		const storesStats = await db
			.select({
				total: sql<number>`COUNT(*)`,
				active: sql<number>`SUM(CASE WHEN ${stores.is_active} = 1 THEN 1 ELSE 0 END)`
			})
			.from(stores);

		// Top stores
		const topStores = await db
			.select({
				storeId: stores.id,
				storeName: stores.name,
				transactionCount: sql<number>`COUNT(${cashierTransactions.id})`,
				revenue: sql<number>`COALESCE(SUM(${cashierTransactions.purchase_amount}), 0)`
			})
			.from(stores)
			.leftJoin(cashierTransactions, eq(stores.id, cashierTransactions.store_id))
			.groupBy(stores.id, stores.name)
			.orderBy(sql`revenue DESC`)
			.limit(5);

		res.json({
			success: true,
			data: {
				clients: {
					total: Number(clientsStats[0].total),
					active: Number(clientsStats[0].active),
					newThisMonth: Number(clientsStats[0].newThisMonth),
					averageBalance: Math.round(Number(clientsStats[0].averageBalance))
				},
				transactions: {
					totalToday: Number(txStats[0].totalToday),
					revenueToday: Number(txStats[0].revenueToday),
					totalThisWeek: Number(txStats[0].totalThisWeek),
					revenueThisWeek: Number(txStats[0].revenueThisWeek)
				},
				stores: {
					total: Number(storesStats[0].total),
					active: Number(storesStats[0].active),
					topByRevenue: topStores.map((s) => ({
						storeId: s.storeId,
						storeName: s.storeName,
						transactionCount: Number(s.transactionCount),
						revenue: Number(s.revenue)
					}))
				}
			}
		});
	} catch (error: any) {
		console.error('Error fetching dashboard stats:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/admin/statistics - Sprint 5 Task 4.2
 * Returns stores, transactions, and clients for Statistics page filtering
 */
router.get('/', async (req, res) => {
	try {
		// 1. Get all stores
		const storesData = await db
			.select({
				id: stores.id,
				name: stores.name,
				active: stores.is_active
			})
			.from(stores);

		// 2. Get client count per store (GROUP BY aggregation)
		const storeClientsAgg = await db
			.select({
				storeId: loyaltyUsers.store_id,
				count: sql<number>`COUNT(*)`
			})
			.from(loyaltyUsers)
			.where(sql`${loyaltyUsers.store_id} IS NOT NULL`)
			.groupBy(loyaltyUsers.store_id);

		// 3. Get transaction count per store (GROUP BY aggregation)
		const storeTransactionsAgg = await db
			.select({
				storeId: cashierTransactions.store_id,
				count: sql<number>`COUNT(*)`
			})
			.from(cashierTransactions)
			.where(sql`${cashierTransactions.store_id} IS NOT NULL`)
			.groupBy(cashierTransactions.store_id);

		// 4. Get revenue per store (GROUP BY aggregation)
		const storeRevenueAgg = await db
			.select({
				storeId: cashierTransactions.store_id,
				total: sql<number>`SUM(${cashierTransactions.purchase_amount})`
			})
			.from(cashierTransactions)
			.where(sql`${cashierTransactions.type} = 'earn' AND ${cashierTransactions.store_id} IS NOT NULL`)
			.groupBy(cashierTransactions.store_id);

		// 5. Create lookup maps for O(1) access
		const clientsLookup = new Map(storeClientsAgg.map((s) => [s.storeId, Number(s.count)]));
		const transactionsLookup = new Map(storeTransactionsAgg.map((s) => [s.storeId, Number(s.count)]));
		const revenueLookup = new Map(storeRevenueAgg.map((s) => [s.storeId, Number(s.total || 0)]));

		// 6. Get all loyalty users (clients)
		const clientsData = await db
			.select({
				id: loyaltyUsers.id,
				telegramId: loyaltyUsers.telegram_user_id,
				name: sql<string>`COALESCE(${loyaltyUsers.first_name} || ' ' || ${loyaltyUsers.last_name}, ${loyaltyUsers.first_name})`,
				balance: loyaltyUsers.current_balance,
				registered: loyaltyUsers.registration_date,
				lastPurchase: sql<string>`NULL`, // Will be filled from transactions
				totalPurchases: loyaltyUsers.total_purchases,
				totalSpent: loyaltyUsers.total_saved,
				storeId: loyaltyUsers.store_id,
				active: loyaltyUsers.is_active
			})
			.from(loyaltyUsers);

		// 3. Get recent transactions (last 30 days) with JOIN to get store and client info
		const transactionsData = await db
			.select({
				id: cashierTransactions.id,
				date: cashierTransactions.created_at,
				storeId: cashierTransactions.store_id,
				clientId: cashierTransactions.customer_id,
				type: cashierTransactions.type, // 'earn' or 'spend'
				amount: cashierTransactions.purchase_amount,
				points: cashierTransactions.points_amount,
				description: sql<string>`CASE
					WHEN ${cashierTransactions.type} = 'earn'
					THEN 'Начисление'
					ELSE 'Списание'
				END`
			})
			.from(cashierTransactions)
			.where(gte(cashierTransactions.created_at, sql`datetime('now', '-30 days')`))
			.orderBy(sql`${cashierTransactions.created_at} DESC`)
			.limit(200); // Limit to last 200 transactions

		res.json({
			success: true,
			data: {
				stores: storesData.map(s => ({
					id: s.id,
					name: s.name,
					clients: clientsLookup.get(s.id) || 0,
					transactions: transactionsLookup.get(s.id) || 0,
					revenue: revenueLookup.get(s.id) || 0,
					active: s.active
				})),
				clients: clientsData.map(c => ({
					id: c.id,
					telegramId: String(c.telegramId),
					name: c.name,
					balance: Number(c.balance),
					registered: c.registered,
					lastPurchase: c.lastPurchase,
					totalPurchases: c.totalPurchases,
					totalSpent: Number(c.totalSpent),
					storeId: c.storeId,
					active: c.active
				})),
				transactions: transactionsData.map(t => ({
					id: t.id,
					date: t.date,
					storeId: t.storeId,
					clientId: t.clientId,
					type: t.type,
					amount: Number(t.amount),
					points: Number(t.points),
					description: t.description
				}))
			}
		});
	} catch (error: any) {
		console.error('Error fetching statistics data:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
