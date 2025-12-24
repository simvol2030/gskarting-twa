/**
 * Retry utility for API calls
 * MEDIUM-1 FIX: Добавляет надёжность при нестабильной сети
 */

export interface RetryOptions {
	maxRetries?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxRetries: 3,
	baseDelayMs: 1000,
	maxDelayMs: 10000,
	shouldRetry: (error) => {
		// Retry on network errors and 5xx server errors
		if (error instanceof TypeError) {
			// Network error (fetch failed)
			return true;
		}
		if (error instanceof Response) {
			return error.status >= 500;
		}
		return false;
	}
};

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	let lastError: unknown;

	for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Don't retry on last attempt or if error is not retryable
			if (attempt >= opts.maxRetries || !opts.shouldRetry(error)) {
				throw error;
			}

			// Calculate delay with exponential backoff + jitter
			const delay = Math.min(
				opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
				opts.maxDelayMs
			);

			console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
			await sleep(delay);
		}
	}

	throw lastError;
}

/**
 * Fetch with automatic retry
 */
export async function fetchWithRetry(
	url: string,
	init?: RequestInit,
	options: RetryOptions = {}
): Promise<Response> {
	return withRetry(async () => {
		const response = await fetch(url, init);

		// Throw response for shouldRetry to check status
		if (!response.ok && response.status >= 500) {
			throw response;
		}

		return response;
	}, {
		...options,
		shouldRetry: (error) => {
			// Network errors
			if (error instanceof TypeError) {
				return true;
			}
			// 5xx errors
			if (error instanceof Response) {
				return error.status >= 500 && error.status < 600;
			}
			return false;
		}
	});
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
