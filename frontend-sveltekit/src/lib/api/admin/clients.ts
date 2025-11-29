/**
 * Clients API (Real Backend)
 * Connects to backend-expressjs API
 */

import type {
	Client,
	ClientDetail,
	ClientStats,
	ClientsListParams,
	TransactionsListParams,
	BalanceAdjustmentData,
	Pagination
} from '$lib/types/admin';
import { API_BASE_URL } from '$lib/config';

const buildQuery = (params: Record<string, any>): string => {
	const filtered = Object.fromEntries(
		Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
	);
	return new URLSearchParams(filtered as any).toString();
};

export const clientsAPI = {
	async list(params: ClientsListParams = {}) {
		const query = buildQuery(params);
		const response = await fetch(`${API_BASE_URL}/admin/clients?${query}`, { credentials: 'include' });
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch clients: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data as { clients: Client[]; pagination: Pagination };
	},

	async getById(id: number) {
		const response = await fetch(`${API_BASE_URL}/admin/clients/${id}`, { credentials: 'include' });
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch client: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data as { client: ClientDetail; stats: ClientStats } | null;
	},

	async getTransactions(clientId: number, params: TransactionsListParams = {}) {
		const query = buildQuery(params);
		const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/transactions?${query}`, { credentials: 'include' });
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch transactions: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data;
	},

	async adjustBalance(clientId: number, data: BalanceAdjustmentData) {
		const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/balance/adjust`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});
		const json = await response.json();
		if (!json.success) throw new Error(json.error);
		return json.data;
	},

	async toggleActive(clientId: number, data: { isActive: boolean; reason: string }) {
		const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/toggle-active`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});
		const json = await response.json();
		if (!json.success) throw new Error(json.error);
	},

	async getBalanceHistory(clientId: number, params: { page?: number; limit?: number } = {}) {
		const query = buildQuery(params);
		const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/balance-history?${query}`, { credentials: 'include' });
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch balance history: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data;
	},

	async delete(clientId: number, soft = true) {
		const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}?soft=${soft}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to delete client: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error);
	}
};
