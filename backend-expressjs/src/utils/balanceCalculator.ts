import { db } from '../db/client';
import { loyaltyUsers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getPointsExpirationCutoffDate, getRetentionDays } from './retention';

/**
 * Calculate available (non-expired) balance for a customer
 *
 * NEW LOGIC (Start-5 Task-001):
 * - Check user's last_activity against cutoff date (45 days)
 * - If last_activity < cutoff → ALL points expired (return 0)
 * - If last_activity >= cutoff → ALL points valid (return currentBalance)
 *
 * This provides real-time expiration checking even if the scheduled job hasn't run yet.
 *
 * @param customerId - Loyalty user ID
 * @param currentBalance - Customer's current balance from database
 * @returns Available balance (0 if inactive, currentBalance if active)
 */
export async function calculateAvailableBalance(
	customerId: number,
	currentBalance: number
): Promise<{
	availableBalance: number;
	expiredPoints: number;
	needsSync: boolean;
}> {
	try {
		const cutoffIso = await getPointsExpirationCutoffDate();

		// Get user's last activity
		const user = await db.query.loyaltyUsers.findFirst({
			where: eq(loyaltyUsers.id, customerId),
			columns: { last_activity: true }
		});

		if (!user || !user.last_activity) {
			// No activity record - return current balance
			return { availableBalance: currentBalance, expiredPoints: 0, needsSync: false };
		}

		// Check if user is inactive (last_activity < cutoff)
		const lastActivityDate = new Date(user.last_activity);
		const cutoffDate = new Date(cutoffIso);

		if (lastActivityDate < cutoffDate) {
			// User is inactive - all points should expire
			console.log(
				`[BALANCE CALC] User ${customerId} inactive since ${user.last_activity}, balance will expire`
			);
			return {
				availableBalance: 0,
				expiredPoints: currentBalance,
				needsSync: true
			};
		}

		// User is active - all points are valid
		return {
			availableBalance: currentBalance,
			expiredPoints: 0,
			needsSync: false
		};
	} catch (error) {
		console.error('[BALANCE CALC ERROR]', error);
		return { availableBalance: currentBalance, expiredPoints: 0, needsSync: false };
	}
}

/**
 * Calculate points approaching expiration for a customer
 *
 * NEW LOGIC (Start-5 Task-001):
 * - Points don't expire per transaction anymore
 * - Instead, check if user is approaching inactivity threshold
 * - Returns warning levels based on days since last activity
 *
 * @param customerId - Loyalty user ID
 * @returns Warning levels for approaching expiration
 */
export async function getExpiringPointsSummary(customerId: number): Promise<{
	expiringIn7Days: number;
	expiringIn14Days: number;
	expiringIn30Days: number;
	expiredNow: number;
}> {
	try {
		// Get dynamic expiry days from settings
		const expiryDays = await getRetentionDays();

		const user = await db.query.loyaltyUsers.findFirst({
			where: eq(loyaltyUsers.id, customerId),
			columns: { last_activity: true, current_balance: true }
		});

		if (!user || !user.last_activity) {
			return { expiringIn7Days: 0, expiringIn14Days: 0, expiringIn30Days: 0, expiredNow: 0 };
		}

		const now = new Date();
		const lastActivity = new Date(user.last_activity);
		const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

		// If already expired (> expiry_days)
		if (daysSinceActivity >= expiryDays) {
			return { expiringIn7Days: 0, expiringIn14Days: 0, expiringIn30Days: 0, expiredNow: user.current_balance };
		}

		// If approaching expiration
		const balance = user.current_balance;

		if (daysSinceActivity >= (expiryDays - 7)) {
			return { expiringIn7Days: balance, expiringIn14Days: 0, expiringIn30Days: 0, expiredNow: 0 };
		}

		if (daysSinceActivity >= (expiryDays - 14)) {
			return { expiringIn7Days: 0, expiringIn14Days: balance, expiringIn30Days: 0, expiredNow: 0 };
		}

		if (daysSinceActivity >= (expiryDays - 30)) {
			return { expiringIn7Days: 0, expiringIn14Days: 0, expiringIn30Days: balance, expiredNow: 0 };
		}

		// Not approaching expiration yet
		return { expiringIn7Days: 0, expiringIn14Days: 0, expiringIn30Days: 0, expiredNow: 0 };
	} catch (error) {
		console.error('[EXPIRING SUMMARY ERROR]', error);
		return { expiringIn7Days: 0, expiringIn14Days: 0, expiringIn30Days: 0, expiredNow: 0 };
	}
}
