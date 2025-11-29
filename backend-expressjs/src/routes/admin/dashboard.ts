/**
 * Dashboard API - Sprint 5 Task 4.1
 * Provides real-time statistics from database instead of mock data
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../../db/database.js';
import { loyaltyUsers, transactions, stores } from '../../db/schema.js';
import { eq, and, gte, sql, desc, count, sum, isNotNull } from 'drizzle-orm';
import { authenticateSession } from '../../middleware/session-auth.js';

const router = Router();

// 🔒 SECURITY: All admin routes require session authentication
router.use(authenticateSession);

/**
 * GET /api/admin/dashboard/stats
 * Returns comprehensive dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
	try {
		// Calculate date ranges for growth comparison
		const now = new Date();
		const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
		const previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 30-60 days ago
		const previousPeriodEnd = currentPeriodStart;

		// Format dates for SQL comparison (ISO format)
		const currentPeriodStartStr = currentPeriodStart.toISOString();
		const previousPeriodStartStr = previousPeriodStart.toISOString();
		const previousPeriodEndStr = previousPeriodEnd.toISOString();

		// 1. Total clients
		const totalClientsResult = await db
			.select({ count: count() })
			.from(loyaltyUsers);
		const totalClients = totalClientsResult[0]?.count || 0;

		// 2. Active clients (is_active = true)
		const activeClientsResult = await db
			.select({ count: count() })
			.from(loyaltyUsers)
			.where(eq(loyaltyUsers.is_active, true));
		const activeClients = activeClientsResult[0]?.count || 0;

		// 3. Total transactions
		const totalTransactionsResult = await db
			.select({ count: count() })
			.from(transactions);
		const totalTransactions = totalTransactionsResult[0]?.count || 0;

		// 4. Total revenue (sum of all earn transactions)
		const totalRevenueResult = await db
			.select({ total: sum(transactions.amount) })
			.from(transactions)
			.where(eq(transactions.type, 'earn'));
		const totalRevenue = Number(totalRevenueResult[0]?.total || 0);

		// 5. Current period metrics for growth calculation
		const currentPeriodClientsResult = await db
			.select({ count: count() })
			.from(loyaltyUsers)
			.where(gte(loyaltyUsers.registration_date, currentPeriodStartStr));
		const currentPeriodClients = currentPeriodClientsResult[0]?.count || 0;

		const currentPeriodTransactionsResult = await db
			.select({ count: count() })
			.from(transactions)
			.where(gte(transactions.created_at, currentPeriodStartStr));
		const currentPeriodTransactions = currentPeriodTransactionsResult[0]?.count || 0;

		const currentPeriodRevenueResult = await db
			.select({ total: sum(transactions.amount) })
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'earn'),
					gte(transactions.created_at, currentPeriodStartStr)
				)
			);
		const currentPeriodRevenue = Number(currentPeriodRevenueResult[0]?.total || 0);

		// 6. Previous period metrics for growth calculation
		const previousPeriodClientsResult = await db
			.select({ count: count() })
			.from(loyaltyUsers)
			.where(
				and(
					gte(loyaltyUsers.registration_date, previousPeriodStartStr),
					sql`${loyaltyUsers.registration_date} < ${previousPeriodEndStr}`
				)
			);
		const previousPeriodClients = previousPeriodClientsResult[0]?.count || 0;

		const previousPeriodTransactionsResult = await db
			.select({ count: count() })
			.from(transactions)
			.where(
				and(
					gte(transactions.created_at, previousPeriodStartStr),
					sql`${transactions.created_at} < ${previousPeriodEndStr}`
				)
			);
		const previousPeriodTransactions = previousPeriodTransactionsResult[0]?.count || 0;

		const previousPeriodRevenueResult = await db
			.select({ total: sum(transactions.amount) })
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'earn'),
					gte(transactions.created_at, previousPeriodStartStr),
					sql`${transactions.created_at} < ${previousPeriodEndStr}`
				)
			);
		const previousPeriodRevenue = Number(previousPeriodRevenueResult[0]?.total || 0);

		// 7. Calculate growth percentages
		const calculateGrowth = (current: number, previous: number): number => {
			if (previous === 0) return current > 0 ? 100 : 0;
			return Number((((current - previous) / previous) * 100).toFixed(1));
		};

		const clientsGrowth = calculateGrowth(currentPeriodClients, previousPeriodClients);
		const transactionsGrowth = calculateGrowth(
			currentPeriodTransactions,
			previousPeriodTransactions
		);
		const revenueGrowth = calculateGrowth(currentPeriodRevenue, previousPeriodRevenue);

		// 8. Get stores with their statistics
		const storesData = await db
			.select({
				id: stores.id,
				name: stores.name,
				is_active: stores.is_active
			})
			.from(stores)
			.orderBy(stores.id);

		// Audit Cycle 2 Fix: Use GROUP BY aggregation instead of N+1 queries (18 queries → 3 queries)

		// Get client count per store (1 query for all stores)
		const storeClientsAgg = await db
			.select({
				storeId: loyaltyUsers.store_id,
				count: count()
			})
			.from(loyaltyUsers)
			.where(isNotNull(loyaltyUsers.store_id))
			.groupBy(loyaltyUsers.store_id);

		// Get transaction count per store (1 query)
		const storeTransactionsAgg = await db
			.select({
				storeId: transactions.store_id,
				count: count()
			})
			.from(transactions)
			.where(isNotNull(transactions.store_id))
			.groupBy(transactions.store_id);

		// Get revenue per store (1 query)
		const storeRevenueAgg = await db
			.select({
				storeId: transactions.store_id,
				total: sum(transactions.amount)
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'earn'),
					isNotNull(transactions.store_id)
				)
			)
			.groupBy(transactions.store_id);

		// Convert to Maps for O(1) lookup
		const clientsLookup = new Map(storeClientsAgg.map((s) => [s.storeId, s.count]));
		const transactionsLookup = new Map(storeTransactionsAgg.map((s) => [s.storeId, s.count]));
		const revenueLookup = new Map(
			storeRevenueAgg.map((s) => [s.storeId, Number(s.total || 0)])
		);

		// Map stores to stats (no more async, just lookup)
		const storesWithStats = storesData.map((store) => ({
			id: store.id,
			name: store.name,
			clients: clientsLookup.get(store.id) || 0,
			transactions: transactionsLookup.get(store.id) || 0,
			revenue: revenueLookup.get(store.id) || 0,
			active: store.is_active
		}));

		// Return response
		res.json({
			success: true,
			data: {
				stats: {
					totalClients,
					activeClients,
					totalTransactions,
					totalRevenue,
					clientsGrowth,
					transactionsGrowth,
					revenueGrowth
				},
				stores: storesWithStats
			}
		});
	} catch (error: any) {
		console.error('[Dashboard API] Error fetching stats:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to fetch dashboard statistics',
			message: error.message
		});
	}
});

export default router;
