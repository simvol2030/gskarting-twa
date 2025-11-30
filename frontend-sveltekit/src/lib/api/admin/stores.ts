/**
 * Stores API (Real Backend)
 */

import type { Store, StoreFormData, StoreImage } from '$lib/types/admin';
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
	},

	// Image methods
	async getImages(storeId: number): Promise<StoreImage[]> {
		const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/images`, {
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch images: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data.images;
	},

	async uploadImages(storeId: number, files: File[]): Promise<StoreImage[]> {
		const formData = new FormData();
		files.forEach(file => formData.append('images', file));

		const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/images`, {
			method: 'POST',
			body: formData,
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to upload images: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data.images;
	},

	async reorderImages(storeId: number, imageIds: number[]): Promise<StoreImage[]> {
		const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/images/reorder`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ imageIds }),
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to reorder images: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
		return json.data.images;
	},

	async deleteImage(storeId: number, imageId: number): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/images/${imageId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to delete image: ${response.status} ${errorText}`);
		}
		const json = await response.json();
		if (!json.success) throw new Error(json.error || 'Unknown error');
	}
};
