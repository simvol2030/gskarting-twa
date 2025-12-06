import cron from 'node-cron';
import { cleanupOldTransactions } from './cleanupTransactions';
import { expireOldPoints } from './expirePoints';
import { cleanupPendingDiscounts } from './cleanupPendingDiscounts';

/**
 * Initialize all scheduled jobs
 *
 * This function sets up cron jobs for:
 * - Points expiration (daily at 2:00 AM)
 * - Transaction cleanup (daily at 3:00 AM)
 * - Pending discounts cleanup (hourly) - MEDIUM-4 FIX
 *
 * In development mode, jobs run in dry-run mode (no actual changes)
 */
export function initScheduledJobs() {
	const isDevelopment = process.env.NODE_ENV === 'development';

	console.log('[CRON] Initializing scheduled jobs...');
	console.log(`[CRON] Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
	console.log(`[CRON] Dry-run mode: ${isDevelopment ? 'ENABLED' : 'DISABLED'}`);

	// NEW: Expire old points daily at 2:00 AM UTC
	// Runs BEFORE transaction cleanup to ensure consistency
	cron.schedule('0 2 * * *', async () => {
		console.log('[CRON] Starting points expiration job...');
		console.log(`[CRON] Current time: ${new Date().toISOString()}`);

		try {
			const result = await expireOldPoints(isDevelopment);

			if (isDevelopment) {
				console.log(
					`[CRON] Points expiration completed (DRY-RUN). Would expire: ${result.totalPointsExpired} points from ${result.affectedCustomers} customers`
				);
			} else {
				console.log(
					`[CRON] Points expiration completed. Expired: ${result.totalPointsExpired} points from ${result.affectedCustomers} customers`
				);
			}
		} catch (error) {
			console.error('[CRON] Points expiration failed:', error);
			// Don't throw - let cron continue running
		}
	}, {
		timezone: 'UTC'
	});

	// Run daily at 3:00 AM UTC
	// Cron format: minute hour day month weekday
	// 0 3 * * * = At 3:00 AM every day
	cron.schedule('0 3 * * *', async () => {
		console.log('[CRON] Starting transaction cleanup job...');
		console.log(`[CRON] Current time: ${new Date().toISOString()}`);

		try {
			const deletedCount = await cleanupOldTransactions(isDevelopment);

			if (isDevelopment) {
				console.log(`[CRON] Transaction cleanup completed (DRY-RUN). Would delete: ${deletedCount}`);
			} else {
				console.log(`[CRON] Transaction cleanup completed. Deleted: ${deletedCount}`);
			}
		} catch (error) {
			console.error('[CRON] Transaction cleanup failed:', error);
			// Don't throw - let cron continue running
		}
	}, {
		timezone: 'UTC'
	});

	// MEDIUM-4 FIX: Cleanup pending discounts hourly
	// Runs every hour at minute 15
	cron.schedule('15 * * * *', async () => {
		console.log('[CRON] Starting pending discounts cleanup job...');
		console.log(`[CRON] Current time: ${new Date().toISOString()}`);

		try {
			const result = await cleanupPendingDiscounts(isDevelopment);
			const total = result.expiredDeleted + result.appliedDeleted + result.failedDeleted + result.activeChecksDeleted;

			if (isDevelopment) {
				console.log(`[CRON] Pending discounts cleanup completed (DRY-RUN). Would delete: ${total} records`);
			} else {
				console.log(`[CRON] Pending discounts cleanup completed. Deleted: expired=${result.expiredDeleted}, applied=${result.appliedDeleted}, failed=${result.failedDeleted}, activeChecks=${result.activeChecksDeleted}`);
			}
		} catch (error) {
			console.error('[CRON] Pending discounts cleanup failed:', error);
			// Don't throw - let cron continue running
		}
	}, {
		timezone: 'UTC'
	});

	console.log('[CRON] Scheduled jobs initialized');
	console.log('[CRON] Points expiration: Daily at 2:00 AM UTC');
	console.log('[CRON] Transaction cleanup: Daily at 3:00 AM UTC');
	console.log('[CRON] Pending discounts cleanup: Hourly at :15');
}
