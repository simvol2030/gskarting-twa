import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';

const BACKEND_URL = env.PUBLIC_BACKEND_URL || 'http://localhost:3015';

/**
 * Proxy endpoint для получения суммы чека от агента
 *
 * Backend читает из in-memory store (preCheckStore),
 * который заполняется агентами через POST /api/1c/register-amount
 *
 * Возвращает 404 если агент еще не отправил данные
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const storeId = url.searchParams.get('storeId');

	if (!storeId) {
		return json({ error: 'Missing storeId parameter' }, { status: 400 });
	}

	try {
		const backendUrl = `${BACKEND_URL}/api/1c/check-amount?storeId=${storeId}`;
		console.log('[API Proxy] Proxying check-amount to:', backendUrl);

		const response = await fetch(backendUrl);

		if (!response.ok) {
			const errorData = await response.json();
			console.warn('[API Proxy] Backend error:', response.status, errorData);
			return json({
				error: 'No data from agent',
				checkAmount: 0,
				storeId: parseInt(storeId)
			}, { status: response.status });
		}

		const data = await response.json();
		console.log('[API Proxy] Check amount retrieved:', data);
		return json(data);
	} catch (error) {
		console.error('[API Proxy] Error:', error);
		return json({
			error: 'Internal server error',
			checkAmount: 0,
			storeId: parseInt(storeId)
		}, { status: 500 });
	}
};
