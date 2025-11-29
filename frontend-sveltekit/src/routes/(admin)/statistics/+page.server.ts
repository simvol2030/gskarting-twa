import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

/**
 * Sprint 5 Task 4.2: Statistics API Integration
 * Replaced mock data with real API call to /api/admin/statistics
 * FIX: Forward session cookie to backend
 */
export const load: PageServerLoad = async ({ fetch, cookies }) => {
	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		console.error('[Statistics] No session cookie found');
		return { stores: [], transactions: [], clients: [] };
	}

	try {
		const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
			headers: {
				Cookie: `session=${sessionCookie}`
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Statistics] Failed to fetch data: ${response.status} ${errorText}`);
			throw new Error(`Failed to fetch statistics data: ${response.status}`);
		}

		const json = await response.json();

		if (!json.success) {
			console.error('[Statistics] API returned error:', json.error);
			throw new Error(json.error || 'Unknown error');
		}

		return {
			stores: json.data.stores,
			transactions: json.data.transactions,
			clients: json.data.clients
		};
	} catch (error: any) {
		console.error('[Statistics] Error loading data:', error);
		// Return empty data on error to prevent page crash
		return {
			stores: [],
			transactions: [],
			clients: []
		};
	}
};
