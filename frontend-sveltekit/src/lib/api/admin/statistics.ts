/**
 * Statistics API (Real Backend)
 */

import type { DashboardStats } from '$lib/types/admin';
import { API_BASE_URL } from '$lib/config';

export const statisticsAPI = {
	async getDashboard(): Promise<DashboardStats> {
		const response = await fetch(`${API_BASE_URL}/admin/statistics/dashboard`, { credentials: 'include' });
		const json = await response.json();
		return json.data;
	}
};
