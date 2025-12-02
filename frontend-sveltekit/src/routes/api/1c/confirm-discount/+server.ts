import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Server-side proxy должен использовать ВНУТРЕННИЙ backend URL (не PUBLIC_BACKEND_URL!)
const BACKEND_URL = 'http://localhost:3015';

/**
 * Proxy endpoint для подтверждения применения скидки
 *
 * 1C отправляет POST запрос после того как скидка
 * была успешно применена в чеке
 *
 * Body:
 * - discountId: UUID скидки из pending-discounts
 * - storeId: ID магазина
 * - success: true/false (применена ли скидка)
 * - errorMessage?: Сообщение об ошибке если failed
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json();

		// CRITICAL SECURITY: Validate request body structure
		if (!body.discountId || typeof body.discountId !== 'string') {
			return json({ error: 'Invalid discountId: must be a string' }, { status: 400 });
		}
		if (!body.storeId || typeof body.storeId !== 'number') {
			return json({ error: 'Invalid storeId: must be a number' }, { status: 400 });
		}
		if (typeof body.success !== 'boolean') {
			return json({ error: 'Invalid success: must be a boolean' }, { status: 400 });
		}
		// errorMessage is optional, but if present must be string
		if (body.errorMessage !== undefined && typeof body.errorMessage !== 'string') {
			return json({ error: 'Invalid errorMessage: must be a string' }, { status: 400 });
		}

		const backendUrl = `${BACKEND_URL}/api/1c/confirm-discount`;
		console.log('[API Proxy] Proxying confirm-discount to:', backendUrl, 'discountId:', body.discountId, 'success:', body.success);

		const response = await fetch(backendUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.warn('[API Proxy] Backend error:', response.status, errorData);
			return json(errorData, { status: response.status });
		}

		const data = await response.json();
		console.log('[API Proxy] Discount confirmed successfully');
		return json(data);
	} catch (error) {
		console.error('[API Proxy] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
