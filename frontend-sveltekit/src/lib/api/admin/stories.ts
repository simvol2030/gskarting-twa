/**
 * Stories Admin API Client
 * Клиент для управления Web Stories в админке
 */

import type {
	StoriesHighlight,
	StoriesHighlightFormData,
	StoriesHighlightWithItems,
	StoryItem,
	StoryItemFormData,
	StoriesSettings,
	StoriesAnalytics,
	HighlightAnalytics,
	StoriesListResponse,
	UploadMediaResponse,
	BulkStatusUpdate,
	ReorderItem
} from '$lib/types/stories';

// Use relative URL for client-side requests (proxied via SvelteKit)
const API_BASE_URL = '';

// =====================================================
// HELPERS
// =====================================================

async function handleResponse<T>(response: Response): Promise<T> {
	const json = await response.json();

	if (!response.ok || !json.success) {
		throw new Error(json.error || `HTTP error: ${response.status}`);
	}

	return json.data;
}

// =====================================================
// HIGHLIGHTS API
// =====================================================

export const highlightsAPI = {
	/**
	 * Get list of highlights
	 */
	async list(params: { page?: number; limit?: number; includeInactive?: boolean } = {}): Promise<StoriesListResponse> {
		const query = new URLSearchParams();
		if (params.page) query.set('page', params.page.toString());
		if (params.limit) query.set('limit', params.limit.toString());
		if (params.includeInactive) query.set('includeInactive', 'true');

		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights?${query}`, {
			credentials: 'include'
		});

		return handleResponse(response);
	},

	/**
	 * Get single highlight with items
	 */
	async getById(id: number): Promise<StoriesHighlightWithItems> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights/${id}`, {
			credentials: 'include'
		});

		return handleResponse(response);
	},

	/**
	 * Create new highlight
	 */
	async create(data: StoriesHighlightFormData): Promise<StoriesHighlight> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		return handleResponse(response);
	},

	/**
	 * Update highlight
	 */
	async update(id: number, data: Partial<StoriesHighlightFormData>): Promise<StoriesHighlight> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		return handleResponse(response);
	},

	/**
	 * Delete highlight
	 */
	async delete(id: number): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		await handleResponse(response);
	},

	/**
	 * Duplicate highlight with all items
	 */
	async duplicate(id: number): Promise<StoriesHighlight> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights/${id}/duplicate`, {
			method: 'POST',
			credentials: 'include'
		});

		return handleResponse(response);
	},

	/**
	 * Reorder highlights
	 */
	async reorder(items: ReorderItem[]): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights/reorder`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ items })
		});

		await handleResponse(response);
	},

	/**
	 * Bulk enable/disable highlights
	 */
	async bulkStatus(data: BulkStatusUpdate): Promise<{ updated: number }> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights/bulk-status`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		return handleResponse(response);
	}
};

// =====================================================
// STORY ITEMS API
// =====================================================

export const itemsAPI = {
	/**
	 * Get items for highlight
	 */
	async listByHighlight(highlightId: number): Promise<StoryItem[]> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/highlights/${highlightId}/items`, {
			credentials: 'include'
		});

		return handleResponse(response);
	},

	/**
	 * Create new item
	 */
	async create(data: StoryItemFormData): Promise<StoryItem> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/items`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		return handleResponse(response);
	},

	/**
	 * Update item
	 */
	async update(id: number, data: Partial<StoryItemFormData>): Promise<StoryItem> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/items/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		return handleResponse(response);
	},

	/**
	 * Delete item
	 */
	async delete(id: number): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/items/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		await handleResponse(response);
	},

	/**
	 * Reorder items within highlight
	 */
	async reorder(items: ReorderItem[]): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/items/reorder`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ items })
		});

		await handleResponse(response);
	}
};

// =====================================================
// MEDIA UPLOAD API
// =====================================================

export const uploadAPI = {
	/**
	 * Upload media file (image or video)
	 */
	async uploadMedia(file: File, onProgress?: (percent: number) => void): Promise<UploadMediaResponse> {
		const formData = new FormData();
		formData.append('file', file);

		// For progress tracking, we'd need XMLHttpRequest
		// For simplicity, using fetch without progress
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/upload`, {
			method: 'POST',
			credentials: 'include',
			body: formData
		});

		return handleResponse(response);
	},

	/**
	 * Validate video file before upload
	 */
	validateVideo(file: File, maxDuration: number, maxSizeMb: number): Promise<{ valid: boolean; error?: string; duration?: number }> {
		return new Promise((resolve) => {
			// Check file size
			const sizeMb = file.size / (1024 * 1024);
			if (sizeMb > maxSizeMb) {
				resolve({ valid: false, error: `Файл слишком большой. Максимум: ${maxSizeMb} MB` });
				return;
			}

			// Check duration using video element
			const video = document.createElement('video');
			video.preload = 'metadata';

			video.onloadedmetadata = () => {
				URL.revokeObjectURL(video.src);
				if (video.duration > maxDuration) {
					resolve({
						valid: false,
						error: `Видео слишком длинное. Максимум: ${maxDuration} секунд`,
						duration: video.duration
					});
				} else {
					resolve({ valid: true, duration: video.duration });
				}
			};

			video.onerror = () => {
				URL.revokeObjectURL(video.src);
				resolve({ valid: false, error: 'Не удалось прочитать видео файл' });
			};

			video.src = URL.createObjectURL(file);
		});
	}
};

// =====================================================
// SETTINGS API
// =====================================================

export const settingsAPI = {
	/**
	 * Get stories settings
	 */
	async get(): Promise<StoriesSettings> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/settings`, {
			credentials: 'include'
		});

		return handleResponse(response);
	},

	/**
	 * Update stories settings
	 */
	async update(data: Partial<StoriesSettings>): Promise<StoriesSettings> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/settings`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		return handleResponse(response);
	}
};

// =====================================================
// ANALYTICS API
// =====================================================

export const analyticsAPI = {
	/**
	 * Get overall analytics
	 */
	async getOverall(days: number = 30): Promise<StoriesAnalytics> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/analytics?days=${days}`, {
			credentials: 'include'
		});

		return handleResponse(response);
	},

	/**
	 * Get analytics for specific highlight
	 */
	async getByHighlight(highlightId: number, days: number = 30): Promise<HighlightAnalytics> {
		const response = await fetch(`${API_BASE_URL}/api/admin/stories/analytics/${highlightId}?days=${days}`, {
			credentials: 'include'
		});

		return handleResponse(response);
	}
};

// =====================================================
// COMBINED EXPORT
// =====================================================

export const storiesAPI = {
	highlights: highlightsAPI,
	items: itemsAPI,
	upload: uploadAPI,
	settings: settingsAPI,
	analytics: analyticsAPI
};

export default storiesAPI;
