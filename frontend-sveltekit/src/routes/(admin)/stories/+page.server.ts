import type { PageServerLoad } from './$types';

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3012';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const sessionCookie = cookies.get('session');

	console.log('[Stories Admin] API_BASE_URL:', API_BASE_URL);

	try {
		// Fetch highlights
		const highlightsURL = `${API_BASE_URL}/api/admin/stories/highlights?includeInactive=true`;
		console.log('[Stories Admin] Fetching highlights from:', highlightsURL);

		const highlightsResponse = await fetch(highlightsURL, {
			headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {}
		});

		console.log('[Stories Admin] Highlights response status:', highlightsResponse.status);

		// Fetch settings
		const settingsResponse = await fetch(`${API_BASE_URL}/api/admin/stories/settings`, {
			headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {}
		});

		// Fetch basic analytics
		const analyticsResponse = await fetch(`${API_BASE_URL}/api/admin/stories/analytics?days=7`, {
			headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {}
		});

		const highlightsData = highlightsResponse.ok ? await highlightsResponse.json() : { success: false };
		const settingsData = settingsResponse.ok ? await settingsResponse.json() : { success: false };
		const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : { success: false };

		return {
			highlights: highlightsData.success ? highlightsData.data.highlights : [],
			pagination: highlightsData.success ? highlightsData.data.pagination : { page: 1, limit: 50, total: 0, totalPages: 0 },
			settings: settingsData.success ? settingsData.data : null,
			analytics: analyticsData.success ? analyticsData.data : null
		};
	} catch (error) {
		console.error('[Stories Admin] Failed to fetch data:', error);
		return {
			highlights: [],
			pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
			settings: null,
			analytics: null
		};
	}
};
