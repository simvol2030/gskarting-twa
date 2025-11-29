/**
 * Settings API (Real Backend)
 */

import type { Admin, AdminFormData } from '$lib/types/admin';
import { API_BASE_URL } from '$lib/config';

export const settingsAPI = {
	async listAdmins() {
		const response = await fetch(`${API_BASE_URL}/admin/settings/admins`, { credentials: 'include' });
		const json = await response.json();
		return json.data.admins as Admin[];
	},

	async createAdmin(data: AdminFormData) {
		const response = await fetch(`${API_BASE_URL}/admin/settings/admins`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		});
		const json = await response.json();
		if (!json.success) throw new Error(json.error);
		return json.data;
	},

	async deleteAdmin(id: number) {
		const response = await fetch(`${API_BASE_URL}/admin/settings/admins/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		const json = await response.json();
		if (!json.success) throw new Error(json.error);
	}
};
