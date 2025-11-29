import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

/**
 * CRITICAL FIX: Replaced mock data with real API call
 * Issue: Frontend Audit CRITICAL #1
 * FIX #2: Forward session cookie to backend
 */
export const load: PageServerLoad = async ({ fetch, cookies }) => {
	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		console.error('[Store List] No session cookie found');
		return { stores: [] };
	}

	try {
		const response = await fetch(`${API_BASE_URL}/admin/stores`, {
			headers: {
				Cookie: `session=${sessionCookie}`
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Store List] Failed to fetch stores: ${response.status} ${errorText}`);
			throw new Error(`Failed to fetch stores: ${response.status}`);
		}

		const json = await response.json();

		if (!json.success) {
			console.error('[Store List] API returned error:', json.error);
			throw new Error(json.error || 'Unknown error');
		}

		return {
			stores: json.data.stores
		};
	} catch (error: any) {
		console.error('[Store List] Error loading stores:', error);
		// Return empty data on error to prevent page crash
		return {
			stores: []
		};
	}
};
