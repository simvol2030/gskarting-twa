/**
 * Store Configuration for 1C Integration
 *
 * Defines 1C OData endpoints and terminal IDs for each physical store.
 * Each store has its own 1C terminal for processing transactions.
 *
 * Configuration priority:
 * 1. Environment variable override (STORE_N_ONEC_URL)
 * 2. Store-specific configuration below
 * 3. Global ONEC_BASE_URL environment variable
 */

export interface StoreOneCConfig {
	id: number;
	name: string;
	address: string;
	onecEndpoint?: string; // Optional store-specific 1C URL
	terminalId?: string; // 1C terminal identifier
}

/**
 * Store configurations
 *
 * These match the stores in src/lib/data/loyalty/stores.json
 * Each store can have its own 1C server endpoint if needed.
 */
export const STORE_CONFIGS: StoreOneCConfig[] = [
	{
		id: 1,
		name: 'Алмаз',
		address: 'ул. Советская, 15',
		// onecEndpoint: 'http://1c-almas.local:8080', // Uncomment if store has dedicated server
		terminalId: 'TERM_ALMAS_001'
	},
	{
		id: 2,
		name: 'Изумруд',
		address: 'пр. Ленина, 42',
		// onecEndpoint: 'http://1c-izumrud.local:8080',
		terminalId: 'TERM_IZUMRUD_002'
	},
	{
		id: 3,
		name: 'Сапфир',
		address: 'ул. Мира, 7',
		// onecEndpoint: 'http://1c-sapfir.local:8080',
		terminalId: 'TERM_SAPFIR_003'
	},
	{
		id: 4,
		name: 'Рубин',
		address: 'ул. Гагарина, 23',
		// onecEndpoint: 'http://1c-rubin.local:8080',
		terminalId: 'TERM_RUBIN_004'
	},
	{
		id: 5,
		name: 'Топаз',
		address: 'ул. Победы, 56',
		// onecEndpoint: 'http://1c-topaz.local:8080',
		terminalId: 'TERM_TOPAZ_005'
	},
	{
		id: 6,
		name: 'Янтарь',
		address: 'ул. Садовая, 89',
		// onecEndpoint: 'http://1c-yantar.local:8080',
		terminalId: 'TERM_YANTAR_006'
	}
];

/**
 * Get store configuration by ID
 */
export function getStoreConfig(storeId: number): StoreOneCConfig | null {
	return STORE_CONFIGS.find((store) => store.id === storeId) || null;
}

/**
 * Get 1C endpoint for a specific store
 *
 * Priority:
 * 1. Environment variable: STORE_{ID}_ONEC_URL
 * 2. Store-specific onecEndpoint
 * 3. Global ONEC_BASE_URL environment variable
 * 4. Default localhost
 */
export function getStoreOneCEndpoint(storeId: number): string {
	// Check environment variable override
	if (typeof process !== 'undefined' && process.env) {
		const envKey = `STORE_${storeId}_ONEC_URL`;
		if (process.env[envKey]) {
			return process.env[envKey];
		}
	}

	// Check store-specific configuration
	const store = getStoreConfig(storeId);
	if (store?.onecEndpoint) {
		return store.onecEndpoint;
	}

	// Fall back to global configuration
	if (
		typeof process !== 'undefined' &&
		process.env &&
		process.env.ONEC_BASE_URL
	) {
		return process.env.ONEC_BASE_URL;
	}

	// Default fallback
	return 'http://localhost:8080';
}

/**
 * Get all store IDs
 */
export function getAllStoreIds(): number[] {
	return STORE_CONFIGS.map((store) => store.id);
}

/**
 * Validate store ID
 */
export function isValidStoreId(storeId: number): boolean {
	return STORE_CONFIGS.some((store) => store.id === storeId);
}
