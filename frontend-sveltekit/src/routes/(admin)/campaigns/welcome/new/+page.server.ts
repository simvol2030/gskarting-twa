import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	// Get session cookie to verify auth
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw new Error('Session expired. Please login again.');
	}

	// Fetch existing messages to determine next order_number
	const response = await fetch(`${API_BASE_URL}/admin/welcome-messages`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});

	const json = await response.json();
	const messages = json.success ? json.data : [];

	// Calculate next order number
	const maxOrder = messages.length > 0 ? Math.max(...messages.map((m: any) => m.order_number)) : 0;
	const nextOrder = maxOrder + 1;

	return {
		nextOrder
	};
};
