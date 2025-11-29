/**
 * Stores API (Real Backend)
 */

import type { Store, StoreFormData } from '$lib/types/admin';
import { API_BASE_URL } from '$lib/config';

export const storesAPI = {
	async list() {
		const response = await fetch(`${API_BASE_URL}/admin/stores`, { credentials: 'include' });
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch stores: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data;
	},

	async create(data: StoreFormData) {
		const response = await fetch(`${API_BASE_URL}/admin/stores`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to create store: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data;
	},

	async update(id: number, data: StoreFormData) {
		const response = await fetch(`${API_BASE_URL}/admin/stores/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to update store: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data;
	},

	async delete(id: number, soft = true) {
		const response = await fetch(`${API_BASE_URL}/admin/stores/${id}?soft=${soft}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to delete store: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
	}
};
