/**
 * Centralized retention period utilities (DYNAMIC from loyalty_settings)
 *
 * Ensures consistent cutoff date calculation across:
 * - Transaction history display
 * - Profile statistics calculation
 */

import { db } from '$lib/server/db/client';
import { loyaltySettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
