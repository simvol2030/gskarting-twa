import { db } from '../client';
import { loyaltySettings } from '../schema';
import { eq } from 'drizzle-orm';
import type { LoyaltySettings, NewLoyaltySettings } from '../schema';

// Default settings (fallback if table is empty)
const DEFAULT_SETTINGS: LoyaltySettings = {
	id: 1,
	earning_percent: 4.0,
	max_discount_percent: 20.0,
	expiry_days: 45,
	welcome_bonus: 500.0,
	birthday_bonus: 0.0,
	min_redemption_amount: 1.0,
	points_name: 'Мурзи-коины',
	support_email: null,
	support_phone: null,
	updated_at: new Date().toISOString()
};

/**
 * Get loyalty settings (always returns id=1 row or default)
 * This function is cached for performance - settings rarely change
 * MEDIUM-2 FIX: Reduced TTL from 60s to 30s for faster propagation
 */
let cachedSettings: LoyaltySettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000; // 30 seconds cache (MEDIUM-2 FIX: was 60s)

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
	const now = Date.now();

	// Return cached settings if still valid
	if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL_MS) {
		return cachedSettings;
	}

	// Fetch from database
	const result = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, 1)).limit(1);

	if (result[0]) {
		cachedSettings = result[0];
		cacheTimestamp = now;
		return result[0];
	}

	// Return defaults if no settings exist
	return DEFAULT_SETTINGS;
}

/**
 * Update loyalty settings
 */
export async function updateLoyaltySettings(data: Partial<NewLoyaltySettings>): Promise<LoyaltySettings | null> {
	const result = await db.update(loyaltySettings)
		.set({
			...data,
			updated_at: new Date().toISOString()
		})
		.where(eq(loyaltySettings.id, 1))
		.returning();

	// Invalidate cache on update
	cachedSettings = null;
	cacheTimestamp = 0;

	return result[0] || null;
}

/**
 * Invalidate settings cache (call when settings are updated externally)
 */
export function invalidateLoyaltySettingsCache(): void {
	cachedSettings = null;
	cacheTimestamp = 0;
}
