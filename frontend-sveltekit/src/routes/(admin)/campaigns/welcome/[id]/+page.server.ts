import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, cookies }) => {
	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw error(401, 'Session expired. Please login again.');
	}

	const response = await fetch(`${API_BASE_URL}/admin/welcome-messages/${params.id}`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});

	if (!response.ok) {
		throw error(response.status, 'Failed to load message');
	}

	const json = await response.json();

	if (!json.success) {
		throw error(404, json.error || 'Message not found');
	}

	return {
		message: json.data
	};
};
