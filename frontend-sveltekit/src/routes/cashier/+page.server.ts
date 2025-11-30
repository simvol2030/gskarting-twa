import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

// Environment-aware backend URL (uses Windows Host IP for WSL)
const BACKEND_URL = env.PUBLIC_BACKEND_URL || 'http://localhost:3000';

// AUDIT FIX (Cycle 2): Extract magic strings to constants
const DEFAULT_LOCATION = 'Разработка';
const DEFAULT_CASHBACK_PERCENT = 4;
const DEFAULT_MAX_DISCOUNT_PERCENT = 20;
const FETCH_TIMEOUT_MS = 5000; // 5 seconds timeout for POS systems

// AUDIT FIX (Cycle 2, Issue #3): Helper function for fetch with timeout
async function fetchWithTimeout(url: string, fetchFn: typeof fetch, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetchFn(url, { signal: controller.signal });
		clearTimeout(timeout);
		return response;
	} catch (err: any) {
		clearTimeout(timeout);
		if (err.name === 'AbortError') {
			throw new Error(`Fetch timeout after ${timeoutMs}ms for ${url}`);
		}
		throw err;
	}
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	// Получаем storeId из URL параметра или fallback на 1
	const storeId = parseInt(url.searchParams.get('storeId') || '1');

	// AUDIT FIX (Cycle 2, Issue #8): Helper to create fallback config
	const createFallbackConfig = (storeName?: string) => ({
		storeName: storeName || `Магазин ${storeId}`,
		location: DEFAULT_LOCATION,
		cashbackPercent: DEFAULT_CASHBACK_PERCENT,
		maxDiscountPercent: DEFAULT_MAX_DISCOUNT_PERCENT
	});

	try {
		// AUDIT FIX (Cycle 2, Issue #3): Use timeout-protected fetches
		const [storeResponse, settingsResponse] = await Promise.all([
			fetchWithTimeout(`${BACKEND_URL}/api/stores/${storeId}/config`, fetch),
			fetchWithTimeout(`${BACKEND_URL}/api/loyalty/settings`, fetch)
		]);

		// AUDIT FIX (Cycle 2, Issue #2): Return valid fallback instead of null
		if (!storeResponse.ok) {
			console.error('[CASHIER SSR] Store API returned status:', storeResponse.status);
			const storeConfig = createFallbackConfig();
			return {
				storeId,
				storeConfig,
				error: `Store API returned status ${storeResponse.status}`
			};
		}

		// AUDIT FIX (Cycle 2, Issue #4): Wrap JSON parsing in try/catch
		let storeConfigData: any;
		try {
			storeConfigData = await storeResponse.json();
		} catch (jsonErr) {
			console.error('[CASHIER SSR] Failed to parse store API response:', jsonErr);
			const storeConfig = createFallbackConfig();
			return {
				storeId,
				storeConfig,
				error: 'Invalid JSON from store API'
			};
		}

		// Handle settings API failure with fallback
		if (!settingsResponse.ok) {
			console.error('[CASHIER SSR] Settings API returned status:', settingsResponse.status);
			const storeConfig = createFallbackConfig(storeConfigData.storeName);
			console.warn('[CASHIER SSR] Using default loyalty settings (API unavailable)');
			return {
				storeId,
				storeConfig,
				error: null // Not critical - we have defaults
			};
		}

		// AUDIT FIX (Cycle 2, Issue #4): Wrap JSON parsing in try/catch
		let settingsData: any;
		try {
			settingsData = await settingsResponse.json();
		} catch (jsonErr) {
			console.error('[CASHIER SSR] Failed to parse settings API response:', jsonErr);
			const storeConfig = createFallbackConfig(storeConfigData.storeName);
			console.warn('[CASHIER SSR] Using default loyalty settings (malformed JSON)');
			return {
				storeId,
				storeConfig,
				error: null
			};
		}

		// AUDIT FIX (Cycle 2, Issue #5): Validate response structure AND field existence
		if (
			!settingsData.success ||
			!settingsData.data ||
			typeof settingsData.data.earningPercent === 'undefined' ||
			typeof settingsData.data.maxDiscountPercent === 'undefined'
		) {
			console.error('[CASHIER SSR] Settings API returned invalid structure:', settingsData);
			const storeConfig = createFallbackConfig(storeConfigData.storeName);
			console.warn('[CASHIER SSR] Using default loyalty settings (invalid structure)');
			return {
				storeId,
				storeConfig,
				error: null
			};
		}

		const settings = settingsData.data;

		// Validate percentage values are in valid range (0-100)
		const earningPercent =
			typeof settings.earningPercent === 'number' &&
			settings.earningPercent >= 0 &&
			settings.earningPercent <= 100
				? settings.earningPercent
				: DEFAULT_CASHBACK_PERCENT; // Fallback

		const maxDiscountPercent =
			typeof settings.maxDiscountPercent === 'number' &&
			settings.maxDiscountPercent >= 0 &&
			settings.maxDiscountPercent <= 100
				? settings.maxDiscountPercent
				: DEFAULT_MAX_DISCOUNT_PERCENT; // Fallback

		if (
			earningPercent !== settings.earningPercent ||
			maxDiscountPercent !== settings.maxDiscountPercent
		) {
			console.warn('[CASHIER SSR] Invalid settings values detected, using fallbacks:', {
				earningPercent: { received: settings.earningPercent, using: earningPercent },
				maxDiscountPercent: { received: settings.maxDiscountPercent, using: maxDiscountPercent }
			});
		}

		// Combine store config with validated dynamic settings
		const storeConfig = {
			storeName: storeConfigData.storeName,
			location: storeConfigData.location || DEFAULT_LOCATION,
			cashbackPercent: earningPercent, // TASK-004 FIX: Dynamic from loyalty_settings.earning_percent via API
			maxDiscountPercent: maxDiscountPercent // TASK-004 FIX: Dynamic from loyalty_settings.max_discount_percent via API
		};

		// AUDIT FIX (Cycle 2, Issue #7): Add success logging
		console.log('[CASHIER SSR] Successfully loaded settings:', {
			storeId,
			storeName: storeConfig.storeName,
			cashbackPercent: earningPercent,
			maxDiscountPercent: maxDiscountPercent,
			source: 'loyalty_settings API'
		});

		return {
			storeId,
			storeConfig,
			error: null
		};
	} catch (err) {
		console.error('[CASHIER SSR] Failed to fetch store/loyalty config:', err);

		// AUDIT FIX (Cycle 2, Issue #1): Always return valid fallback on ANY error
		const storeConfig = createFallbackConfig();
		console.warn('[CASHIER SSR] Using default settings due to error');

		return {
			storeId,
			storeConfig,
			error: 'Backend connection failed'
		};
	}
};
