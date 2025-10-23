import { json } from '@sveltejs/kit';
import { queries } from '$lib/server/db/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const users = await queries.getAllUsers();
		return json(users);
	} catch (error) {
		console.error('Error fetching users:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}
};
