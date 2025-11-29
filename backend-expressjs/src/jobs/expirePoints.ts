import { db } from '../db/client';
import { transactions, loyaltyUsers } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { getPointsExpirationCutoffDate } from '../utils/retention';

/**
 * Expire points based on user inactivity (45 days)
 *
 * NEW LOGIC (Start-5 Task-001):
 * - If user's last_activity is older than 45 days → ALL points expire
 * - If user had any activity within 45 days → NO points expire
 * - Activity = any transaction (earn or spend)
 *
 * Business Rule:
 * "If a customer doesn't use the loyalty system for 45 days, their entire balance expires.
 * If they make even one transaction within 45 days, all their points remain valid."
 *
 * @param dryRun - If true, only calculate without updating balances
 * @returns Object with stats about expired points
 */
export async function expireOldPoints(dryRun: boolean = false): Promise<{
	affectedCustomers: number;
	totalPointsExpired: number;
}> {
	try {
		// Calculate cutoff date (dynamic from loyalty_settings.expiry_days)
		const cutoffIso = await getPointsExpirationCutoffDate();

		console.log(`[EXPIRE POINTS] Cutoff date: ${cutoffIso} (dry-run: ${dryRun})`);

		// NEW: Find USERS who are inactive for 45+ days AND have balance > 0
		// Note: Treat NULL last_activity as "very old" (should expire)
		const inactiveUsers = await db
			.select({
				id: loyaltyUsers.id,
				current_balance: loyaltyUsers.current_balance,
				last_activity: loyaltyUsers.last_activity
			})
			.from(loyaltyUsers)
			.where(
				sql`(${loyaltyUsers.last_activity} IS NULL OR ${loyaltyUsers.last_activity} < ${cutoffIso})
					AND ${loyaltyUsers.current_balance} > 0
					AND ${loyaltyUsers.is_active} = 1`
			);

		if (inactiveUsers.length === 0) {
			console.log('[EXPIRE POINTS] No inactive users with balance');
			return { affectedCustomers: 0, totalPointsExpired: 0 };
		}

		console.log(`[EXPIRE POINTS] Found ${inactiveUsers.length} inactive users`);

		if (dryRun) {
			const total = inactiveUsers.reduce((sum, u) => sum + u.current_balance, 0);
			for (const user of inactiveUsers) {
				console.log(
					`[DRY-RUN] User ${user.id}: would expire ${user.current_balance} points (last active: ${user.last_activity})`
				);
			}
			return { affectedCustomers: inactiveUsers.length, totalPointsExpired: total };
		}

		// ACTUAL EXPIRATION
		let totalExpired = 0;

		await db.transaction(async (tx) => {
			for (const user of inactiveUsers) {
				const expiredAmount = user.current_balance;

				// 1. Create expiry transaction record
				await tx.insert(transactions).values({
					loyalty_user_id: user.id,
					title: 'Points expired (45 days inactivity)',
					amount: expiredAmount,
					type: 'spend',
					spent: 'expired',
					store_name: null,
					store_id: null
				});

				// 2. Zero the balance
				await tx
					.update(loyaltyUsers)
					.set({ current_balance: 0 })
					.where(eq(loyaltyUsers.id, user.id));

				totalExpired += expiredAmount;

				console.log(`[EXPIRE POINTS] User ${user.id}: ${expiredAmount} points expired`);
			}
		});

		console.log(`[EXPIRE POINTS] Total: ${totalExpired} points from ${inactiveUsers.length} users`);

		return {
			affectedCustomers: inactiveUsers.length,
			totalPointsExpired: totalExpired
		};
	} catch (error) {
		console.error('[EXPIRE POINTS ERROR]', error);
		throw error;
	}
}
