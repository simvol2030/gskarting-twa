/**
 * Utility functions
 */

/**
 * Safely parse JSON with fallback value
 * Prevents crashes from corrupted JSON data in database
 */
export function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
	if (!str) return fallback;
	try {
		return JSON.parse(str) as T;
	} catch (error) {
		console.error('[safeJsonParse] Failed to parse JSON:', str.substring(0, 100));
		return fallback;
	}
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePagination(
	page: string | undefined,
	limit: string | undefined,
	maxLimit: number = 100
): { page: number; limit: number; offset: number } {
	const pageNum = Math.max(1, parseInt(page || '1') || 1);
	const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit || '20') || 20));
	const offset = (pageNum - 1) * limitNum;

	return { page: pageNum, limit: limitNum, offset };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: {
		maxRetries?: number;
		initialDelay?: number;
		maxDelay?: number;
		shouldRetry?: (error: any) => boolean;
	} = {}
): Promise<T> {
	const {
		maxRetries = 3,
		initialDelay = 1000,
		maxDelay = 10000,
		shouldRetry = () => true
	} = options;

	let lastError: any;
	let delay = initialDelay;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			if (attempt === maxRetries || !shouldRetry(error)) {
				throw error;
			}

			console.log(`[withRetry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
			await sleep(delay);
			delay = Math.min(delay * 2, maxDelay);
		}
	}

	throw lastError;
}

/**
 * Sanitize error message for API response (remove sensitive info)
 */
export function sanitizeErrorMessage(error: any): string {
	const message = error instanceof Error ? error.message : String(error);

	// Remove potentially sensitive paths and details
	return message
		.replace(/\/home\/[^\s]+/g, '[path]')
		.replace(/at\s+[^\n]+/g, '')
		.substring(0, 200);
}
