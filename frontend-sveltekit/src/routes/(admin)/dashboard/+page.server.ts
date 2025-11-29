import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

/**
 * Sprint 5 Task 4.1: Dashboard API Integration
 * Replaced mock data with real API call to /api/admin/dashboard/stats
 * FIX: Forward session cookie to backend
 */
export const load: PageServerLoad = async ({ fetch, cookies }) => {
	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		console.error('[Dashboard] No session cookie found');
		return {
			stats: { totalClients: 0, activeClients: 0, totalTransactions: 0, totalRevenue: 0, clientsGrowth: 0, transactionsGrowth: 0, revenueGrowth: 0 },
			stores: []
		};
	}

	try {
		const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
			headers: {
				Cookie: `session=${sessionCookie}`
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Dashboard] Failed to fetch stats: ${response.status} ${errorText}`);
			throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
		}

		const json = await response.json();

		if (!json.success) {
			console.error('[Dashboard] API returned error:', json.error);
			throw new Error(json.error || 'Unknown error');
		}

		return {
			stats: json.data.stats,
			stores: json.data.stores
		};
	} catch (error: any) {
		console.error('[Dashboard] Error loading data:', error);
		// Return empty data on error to prevent page crash
		return {
			stats: {
				totalClients: 0,
				activeClients: 0,
				totalTransactions: 0,
				totalRevenue: 0,
				clientsGrowth: 0,
				transactionsGrowth: 0,
				revenueGrowth: 0
			},
			stores: []
		};
	}
};
