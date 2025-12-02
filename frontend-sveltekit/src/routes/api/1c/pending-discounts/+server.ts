import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Server-side proxy должен использовать ВНУТРЕННИЙ backend URL (не PUBLIC_BACKEND_URL!)
const BACKEND_URL = 'http://localhost:3015';

/**
 * Proxy endpoint для получения ожидающих скидок
 *
 * 1C периодически опрашивает этот endpoint чтобы получить
 * список скидок от кассиров, которые нужно применить
 *
 * Query params:
 * - storeId: ID магазина (обязательно)
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const storeIdParam = url.searchParams.get('storeId');

	if (!storeIdParam) {
		return json({ error: 'Missing storeId parameter' }, { status: 400 });
	}

	// CRITICAL SECURITY: Validate storeId is a valid number
	const storeId = parseInt(storeIdParam, 10);
	if (isNaN(storeId) || storeId < 1 || storeId > 10) {
		return json({ error: 'Invalid storeId: must be a number between 1 and 10' }, { status: 400 });
	}

	try {
		const backendUrl = `${BACKEND_URL}/api/1c/pending-discounts?storeId=${storeId}`;
		console.log('[API Proxy] Proxying pending-discounts to:', backendUrl);

		const response = await fetch(backendUrl);

		if (!response.ok) {
			const errorData = await response.json();
			console.warn('[API Proxy] Backend error:', response.status, errorData);
			return json(errorData, { status: response.status });
		}

		const data = await response.json();
		console.log('[API Proxy] Pending discounts retrieved successfully');
		return json(data);
	} catch (error) {
		console.error('[API Proxy] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
