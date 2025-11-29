/**
 * Products API (Real Backend)
 */

import type { Product, ProductFormData, ProductsListParams, ProductCategory, Pagination } from '$lib/types/admin';
import { API_BASE_URL } from '$lib/config';

const buildQuery = (params: Record<string, any>): string => {
	const filtered = Object.fromEntries(
		Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
	);
	return new URLSearchParams(filtered as any).toString();
};

export const productsAPI = {
	async list(params: ProductsListParams = {}) {
		const query = buildQuery(params);
		const response = await fetch(`${API_BASE_URL}/admin/products?${query}`, { credentials: 'include' });
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch products: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data as { products: Product[]; pagination: Pagination };
	},

	async getCategories() {
		const response = await fetch(`${API_BASE_URL}/admin/products/categories`, { credentials: 'include' });
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch categories: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data.categories as ProductCategory[];
	},

	async create(data: ProductFormData) {
		const response = await fetch(`${API_BASE_URL}/admin/products`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to create product: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data as Product;
	},

	async update(id: number, data: ProductFormData) {
		const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to update product: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data as Product;
	},

	async delete(id: number, soft = true) {
		const response = await fetch(`${API_BASE_URL}/admin/products/${id}?soft=${soft}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to delete product: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
	},

	async toggleActive(id: number, isActive: boolean) {
		const response = await fetch(`${API_BASE_URL}/admin/products/${id}/toggle-active`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isActive }),
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to toggle product active status: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
	}
};
