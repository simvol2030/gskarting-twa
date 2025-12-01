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
	const category = url.searchParams.get('category') || 'all';
	const page = parseInt(url.searchParams.get('page') || '1');

	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw new Error('Session expired. Please login again.');
	}

	// Fetch products, forwarding session cookie
	const productsQuery = buildQuery({ search, status, category, page, limit: 20 });
	const productsResponse = await fetch(`${API_BASE_URL}/admin/products?${productsQuery}`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});
	const productsJson = await productsResponse.json();

	if (!productsJson.success) {
		throw new Error(productsJson.error || 'Failed to load products');
	}

	// Fetch categories, forwarding session cookie
	const categoriesResponse = await fetch(`${API_BASE_URL}/admin/products/categories`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});
	const categoriesJson = await categoriesResponse.json();

	const { products, pagination } = productsJson.data;
	const categories = categoriesJson.data?.categories || [];

	return { products, pagination, categories, filters: { search, status, category } };
};
