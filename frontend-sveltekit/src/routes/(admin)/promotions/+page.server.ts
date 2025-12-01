import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

const buildQuery = (params: Record<string, any>): string => {
	const filtered = Object.fromEntries(
		Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
	);
	return new URLSearchParams(filtered as any).toString();
};

export const load: PageServerLoad = async ({ url, fetch, cookies }) => {
	const search = url.searchParams.get('search') || '';
	const status = (url.searchParams.get('status') || 'active') as 'all' | 'active' | 'inactive';
	const deadlineClass = (url.searchParams.get('deadlineClass') || 'all') as
		| 'all'
		| 'urgent'
		| 'soon'
		| 'normal';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw new Error('Session expired. Please login again.');
	}

	// Build query and fetch, forwarding session cookie
	const query = buildQuery({ search, status, deadlineClass, page, limit });
	const response = await fetch(`${API_BASE_URL}/admin/promotions?${query}`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});
	const json = await response.json();

	if (!json.success) {
		throw new Error(json.error || 'Failed to load promotions');
	}

	const { promotions, pagination } = json.data;

	return {
		promotions,
		pagination,
		filters: {
			search,
			status,
			deadlineClass
		}
	};
};
