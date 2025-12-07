import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	// Get session cookie to forward to backend
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw new Error('Session expired. Please login again.');
	}

	const response = await fetch(`${API_BASE_URL}/admin/welcome-messages`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});

	const json = await response.json();

	if (!json.success) {
		throw new Error(json.error || 'Failed to load welcome messages');
	}

	return {
		messages: json.data
	};
};
