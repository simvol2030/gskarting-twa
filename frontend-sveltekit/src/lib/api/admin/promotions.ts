/**
 * Promotions API (Real Backend) - Sprint 2 with Error Handling
 */

import type { Promotion, PromotionFormData, PromotionsListParams, Pagination } from '$lib/types/admin';
import { API_BASE_URL } from '$lib/config';

const buildQuery = (params: Record<string, any>): string => {
	const filtered = Object.fromEntries(
		Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
	);
	return new URLSearchParams(filtered as any).toString();
};

export const promotionsAPI = {
	async list(params: PromotionsListParams = {}) {
		const query = buildQuery(params);
		const response = await fetch(`${API_BASE_URL}/admin/promotions?${query}`, { credentials: 'include' });

		// CRITICAL FIX #4: Check response.ok before parsing
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch promotions: ${response.status} ${errorText}`);
		}

		const json = await response.json();

		if (!json.success) {
			throw new Error(json.error || 'Unknown error fetching promotions');
		}

		return json.data as { promotions: Promotion[]; pagination: Pagination };
	},

	async getById(id: number) {
		const response = await fetch(`${API_BASE_URL}/admin/promotions/${id}`, { credentials: 'include' });

		// CRITICAL FIX #4: Check response.ok
		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			const errorText = await response.text();
			throw new Error(`Failed to fetch promotion: ${response.status} ${errorText}`);
		}

		const json = await response.json();

		if (!json.success) {
			throw new Error(json.error || 'Unknown error fetching promotion');
		}

		return json.data as Promotion | null;
	},

	async create(data: PromotionFormData) {
		const response = await fetch(`${API_BASE_URL}/admin/promotions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});

		// CRITICAL FIX #4: Check response.ok first
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to create promotion: ${response.status} ${errorText}`);
		}

		const json = await response.json();

		if (!json.success) {
			throw new Error(json.error || 'Unknown error creating promotion');
		}

		return json.data as Promotion;
	},

	async update(id: number, data: PromotionFormData) {
		const response = await fetch(`${API_BASE_URL}/admin/promotions/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});

		// CRITICAL FIX #4: Check response.ok
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to update promotion: ${response.status} ${errorText}`);
		}

		const json = await response.json();

		if (!json.success) {
			throw new Error(json.error || 'Unknown error updating promotion');
		}

		return json.data as Promotion;
	},

	async delete(id: number, soft = true) {
		const response = await fetch(`${API_BASE_URL}/admin/promotions/${id}?soft=${soft}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		// CRITICAL FIX #4: Check response.ok
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to delete promotion: ${response.status} ${errorText}`);
		}

		const json = await response.json();

		if (!json.success) {
			throw new Error(json.error || 'Unknown error deleting promotion');
		}
	},

	async toggleActive(id: number, isActive: boolean) {
		const response = await fetch(`${API_BASE_URL}/admin/promotions/${id}/toggle-active`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isActive }),
			credentials: 'include'
		});

		// CRITICAL FIX #4: Check response.ok
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to toggle promotion: ${response.status} ${errorText}`);
		}

		const json = await response.json();

		if (!json.success) {
			throw new Error(json.error || 'Unknown error toggling promotion');
		}
	}
};
