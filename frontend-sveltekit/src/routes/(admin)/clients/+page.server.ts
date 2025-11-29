import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

const buildQuery = (params: Record<string, any>): string => {
	const filtered = Object.fromEntries(
		Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
	);
	return new URLSearchParams(filtered as any).toString();
};

export const load: PageServerLoad = async ({ url, fetch, cookies }) => {
	// Get query params
	const search = url.searchParams.get('search') || '';
	const status = (url.searchParams.get('status') || 'all') as 'all' | 'active' | 'inactive';
	const storeId = url.searchParams.get('storeId');
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw new Error('Session expired. Please login again.');
	}

	// Build query for clients API
	const clientsQuery = buildQuery({ search, status, storeId, page, limit });

	// Load clients from real API, forwarding session cookie
	const clientsResponse = await fetch(`${API_BASE_URL}/admin/clients?${clientsQuery}`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});
	const clientsJson = await clientsResponse.json();

	if (!clientsJson.success) {
		throw new Error(clientsJson.error || 'Failed to load clients');
	}

	// Load stores from real API for filter dropdown
	const storesResponse = await fetch(`${API_BASE_URL}/admin/stores`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});
	const storesJson = await storesResponse.json();

	const stores = storesJson.data?.stores || [];
	const { clients, pagination } = clientsJson.data;

	return {
		clients,
		pagination,
		stores,
		// Pass filters back to page for form state
		filters: {
			search,
			status,
			storeId: storeId ? parseInt(storeId) : 'all'
		}
	};
};
