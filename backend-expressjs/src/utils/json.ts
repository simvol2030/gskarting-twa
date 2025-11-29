/**
 * Safe JSON utilities
 */

/**
 * Safely parse JSON with fallback
 * @param json JSON string to parse
 * @param fallback Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
	if (!json) return fallback;

	try {
		return JSON.parse(json) as T;
	} catch (err) {
		console.error('JSON parse error:', err);
		return fallback;
	}
}
