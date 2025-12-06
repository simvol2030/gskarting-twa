/**
 * Proxy: /api/customization -> Backend
 * Public endpoint for app customization settings
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const response = await fetch(`${API_BASE_URL}/customization`);

		if (!response.ok) {
			return json(
				{ success: false, error: `Backend error: ${response.status}` },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('[PROXY /api/customization] Error:', error);
		return json(
			{ success: false, error: 'Failed to fetch customization settings' },
			{ status: 500 }
		);
	}
};
