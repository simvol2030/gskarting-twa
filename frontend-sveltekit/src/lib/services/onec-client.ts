/**
 * 1C OData Integration Client
 *
 * Handles communication with 1C:Управление Торговлей via OData protocol.
 * Implements graceful error handling with automatic fallback to manual input.
 *
 * Security:
 * - Uses HTTP Basic Auth
 * - All credentials from environment variables
 * - Mock mode for development/testing
 *
 * Error Strategy:
 * - Returns null on any failure (network, timeout, invalid response)
 * - Logs errors for debugging (server-side only)
 * - Never throws exceptions to UI layer
 */

import { dev } from '$app/environment';

export interface OneCConfig {
	baseUrl: string;
	username: string;
	password: string;
	timeout: number;
}

export interface OneCTransaction {
	Ref_Key: string; // 1C GUID
	Amount: number; // Purchase amount in rubles
	StoreId: number; // Store identifier
	Status: 'Active' | 'Completed' | 'Cancelled';
	CreatedAt: string; // ISO 8601 timestamp
}

interface OneCResponse {
	value: OneCTransaction[];
}

/**
 * Mock mode flag from environment
 */
const MOCK_MODE =
	typeof process !== 'undefined' &&
	process.env &&
	process.env.ONEC_MOCK === 'true';

/**
 * Default configuration from environment variables
 */
function getDefaultConfig(): OneCConfig {
	return {
		baseUrl:
			(typeof process !== 'undefined' && process.env && process.env.ONEC_BASE_URL) ||
			'http://localhost:8080',
		username:
			(typeof process !== 'undefined' && process.env && process.env.ONEC_USERNAME) ||
			'cashier_api',
		password:
			(typeof process !== 'undefined' && process.env && process.env.ONEC_PASSWORD) ||
			'password',
		timeout: parseInt(
			(typeof process !== 'undefined' && process.env && process.env.ONEC_TIMEOUT) || '3000'
		)
	};
}

/**
 * Create Basic Auth header value
 */
function createAuthHeader(username: string, password: string): string {
	const credentials = `${username}:${password}`;
	const encoded =
		typeof Buffer !== 'undefined'
			? Buffer.from(credentials).toString('base64')
			: btoa(credentials);
	return `Basic ${encoded}`;
}

/**
 * Generate mock transaction data for development
 */
async function getMockTransaction(): Promise<number> {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Random amount between 500 and 5000 rubles
	const amount = Math.floor(Math.random() * 4500) + 500;

	if (dev) {
		console.log('[1C Mock] Generated transaction amount:', amount);
	}

	return amount;
}

/**
 * Fetch current active transaction amount from 1C terminal
 *
 * @param storeId - Store identifier (1-6)
 * @param config - Optional 1C configuration override
 * @returns Transaction amount in rubles, or null if unavailable
 *
 * @example
 * const amount = await getCurrentTransactionAmount(1);
 * if (amount !== null) {
 *   console.log(`Current transaction: ${amount} ₽`);
 * } else {
 *   // Fall back to manual input
 * }
 */
export async function getCurrentTransactionAmount(
	storeId: number,
	config?: Partial<OneCConfig>
): Promise<number | null> {
	// Mock mode for development
	if (MOCK_MODE) {
		if (dev) {
			console.log('[1C] Mock mode enabled, generating fake transaction');
		}
		return await getMockTransaction();
	}

	const finalConfig: OneCConfig = {
		...getDefaultConfig(),
		...config
	};

	// Check for store-specific URL override
	const storeUrlKey = `STORE_${storeId}_ONEC_URL`;
	if (
		typeof process !== 'undefined' &&
		process.env &&
		process.env[storeUrlKey]
	) {
		finalConfig.baseUrl = process.env[storeUrlKey];
	}

	try {
		// Build OData query URL
		const endpoint = '/odata/standard.odata/Catalog_Transactions';
		const filter = `StoreId eq ${storeId} and Status eq 'Active'`;
		const orderBy = 'CreatedAt desc';
		const top = '1';

		const queryParams = new URLSearchParams({
			$filter: filter,
			$orderby: orderBy,
			$top: top
		});

		const url = `${finalConfig.baseUrl}${endpoint}?${queryParams.toString()}`;

		if (dev) {
			console.log('[1C] Fetching transaction:', url);
		}

		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Authorization': createAuthHeader(finalConfig.username, finalConfig.password),
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				console.error('[1C] HTTP error:', response.status, response.statusText);
				return null;
			}

			const data: OneCResponse = await response.json();

			if (!data.value || data.value.length === 0) {
				if (dev) {
					console.log('[1C] No active transactions found for store', storeId);
				}
				return null;
			}

			const transaction = data.value[0];
			const amount = transaction.Amount;

			if (typeof amount !== 'number' || amount <= 0) {
				console.error('[1C] Invalid amount:', amount);
				return null;
			}

			if (dev) {
				console.log('[1C] Transaction found:', {
					id: transaction.Ref_Key,
					amount: amount,
					status: transaction.Status
				});
			}

			return amount;
		} finally {
			clearTimeout(timeoutId);
		}
	} catch (error) {
		// Handle all errors gracefully
		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				console.error('[1C] Request timeout after', finalConfig.timeout, 'ms');
			} else {
				console.error('[1C] Fetch error:', error.message);
			}
		} else {
			console.error('[1C] Unknown error:', error);
		}

		// Always return null on error (graceful degradation)
		return null;
	}
}

/**
 * Test 1C connection
 *
 * @param storeId - Store identifier to test
 * @param config - Optional 1C configuration override
 * @returns true if connection successful, false otherwise
 */
export async function testOneCConnection(
	storeId: number,
	config?: Partial<OneCConfig>
): Promise<boolean> {
	const amount = await getCurrentTransactionAmount(storeId, config);
	return amount !== null;
}

/**
 * Get 1C connection status for debugging
 */
export function getOneCStatus(): {
	mockMode: boolean;
	config: OneCConfig;
} {
	return {
		mockMode: MOCK_MODE,
		config: getDefaultConfig()
	};
}
