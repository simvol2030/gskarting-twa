/**
 * Centralized retention period utilities (DYNAMIC from loyalty_settings)
 *
 * Ensures consistent cutoff date calculation across:
 * - Transaction history display
 * - Profile statistics calculation
 * - Cleanup job (with grace period)
 * - Points expiration logic
 */

import { db } from '../db/client';
import { loyaltySettings } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Grace period for cleanup job (extra day to avoid race conditions)
 */
export const CLEANUP_GRACE_PERIOD = 1;

// Cache for settings (1 minute TTL - prevents excessive DB queries)
let cachedExpiryDays: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Get expiry days from settings (with caching)
 * @returns Promise<number> - Expiry days from DB or default 45
 */
async function getExpiryDays(): Promise<number> {
	const now = Date.now();

	// Return cached value if still valid
	if (cachedExpiryDays !== null && now - cacheTimestamp < CACHE_TTL_MS) {
		return cachedExpiryDays;
	}

	// Fetch from database
	const [settings] = await db
		.select({ expiry_days: loyaltySettings.expiry_days })
		.from(loyaltySettings)
		.where(eq(loyaltySettings.id, 1))
		.limit(1);

	// Update cache
	cachedExpiryDays = settings?.expiry_days ?? 45;
	cacheTimestamp = now;

	return cachedExpiryDays;
}

/**
 * Get retention cutoff date (dynamic from settings, UTC midnight)
 *
 * Used for:
 * - Displaying transaction history
 * - Calculating profile statistics
 *
 * @returns Promise<string> - ISO string representing expiry_days ago at 00:00:00 UTC
 */
export async function getRetentionCutoffDate(): Promise<string> {
	const expiryDays = await getExpiryDays();

	const cutoff = new Date();
	cutoff.setUTCDate(cutoff.getUTCDate() - expiryDays);
	cutoff.setUTCHours(0, 0, 0, 0); // Start of day UTC
	return cutoff.toISOString();
}

/**
 * Get points expiration cutoff date (dynamic from settings)
 *
 * Used for expiring loyalty points (FIFO - First In First Out).
 * Points earned more than expiry_days FULL days ago are no longer valid.
 *
 * Business Rule: Points expire after exactly expiry_days FULL days
 * Example (with 45 days): Points earned on Dec 7, 2024 expire on Jan 21, 2025 at 00:00:00 UTC
 *          (exactly 45 full days later)
 *
 * Math Verification:
 * - Today: Jan 21, 2025
 * - Calculation: setUTCDate(21 - 45) = Dec 7, 2024 00:00:00 UTC
 * - Points earned Dec 7 00:00:00 or later are still valid (< 45 days old)
 * - Points earned Dec 6 23:59:59 or earlier have expired (>= 45 days old)
 *
 * @returns Promise<string> - ISO string representing midnight UTC exactly expiry_days ago
 */
export async function getPointsExpirationCutoffDate(): Promise<string> {
	const expiryDays = await getExpiryDays();

	const cutoff = new Date();
	// Calculate exactly expiry_days ago
	cutoff.setUTCDate(cutoff.getUTCDate() - expiryDays);
	cutoff.setUTCHours(0, 0, 0, 0); // Midnight UTC
	return cutoff.toISOString();
}

/**
 * Get cleanup cutoff date (expiry_days + grace period, UTC midnight)
 *
 * Used by cleanup job to delete old transactions.
 * Grace period prevents race condition with statistics calculation.
 *
 * @returns Promise<string> - ISO string representing (expiry_days + 1) days ago at 00:00:00 UTC
 */
export async function getCleanupCutoffDate(): Promise<string> {
	const expiryDays = await getExpiryDays();

	const cutoff = new Date();
	cutoff.setUTCDate(cutoff.getUTCDate() - (expiryDays + CLEANUP_GRACE_PERIOD));
	cutoff.setUTCHours(0, 0, 0, 0); // Start of day UTC
	return cutoff.toISOString();
}

/**
 * Get current retention/expiry days setting
 * @returns Promise<number> - Current expiry_days value from settings
 */
export async function getRetentionDays(): Promise<number> {
	return getExpiryDays();
}

/**
 * Invalidate cache (call when settings are updated)
 * Forces next query to fetch fresh data from database
 */
export function invalidateRetentionCache(): void {
	cachedExpiryDays = null;
	cacheTimestamp = 0;
}

/**
 * @deprecated Use getRetentionDays() instead
 * Kept for backwards compatibility during migration
 */
export const RETENTION_DAYS = 45;
