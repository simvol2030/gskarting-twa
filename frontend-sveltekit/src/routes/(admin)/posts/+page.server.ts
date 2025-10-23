import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { queries } from '$lib/server/db/database';
import { requireRole } from '$lib/server/auth/session';
import { validateId, validateTitle, validateContent } from '$lib/server/validation';

export const load: PageServerLoad = async () => {
	const posts = await queries.getAllPosts();
	const users = await queries.getAllUsers();
	return { posts, users };
};

export const actions: Actions = {
	create: async (event) => {
		try {
			requireRole(event, ['super-admin', 'editor']);
		} catch {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const formData = await event.request.formData();
		const user_id = formData.get('user_id')?.toString();
		const title = formData.get('title')?.toString();
		const content = formData.get('content')?.toString();
		const published = formData.get('published') === 'on';

		// Validate inputs
		const userIdValidation = validateId(user_id);
		if (!userIdValidation.valid) {
			return fail(400, { error: 'Invalid user ID: ' + userIdValidation.error });
		}

		const titleValidation = validateTitle(title);
		if (!titleValidation.valid) {
			return fail(400, { error: titleValidation.error });
		}

		if (content) {
			const contentValidation = validateContent(content);
			if (!contentValidation.valid) {
				return fail(400, { error: contentValidation.error });
			}
		}

		try {
			await queries.createPost({
				user_id: parseInt(user_id!),
				title: title!,
				content: content || null,
				published
			});
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to create post' });
		}
	},

	update: async (event) => {
		try {
			requireRole(event, ['super-admin', 'editor']);
		} catch {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();
		const user_id = formData.get('user_id')?.toString();
		const title = formData.get('title')?.toString();
		const content = formData.get('content')?.toString();
		const published = formData.get('published') === 'on';

		// Validate inputs
		const idValidation = validateId(id);
		if (!idValidation.valid) {
			return fail(400, { error: 'Invalid post ID: ' + idValidation.error });
		}

		const userIdValidation = validateId(user_id);
		if (!userIdValidation.valid) {
			return fail(400, { error: 'Invalid user ID: ' + userIdValidation.error });
		}

		const titleValidation = validateTitle(title);
		if (!titleValidation.valid) {
			return fail(400, { error: titleValidation.error });
		}

		if (content) {
			const contentValidation = validateContent(content);
			if (!contentValidation.valid) {
				return fail(400, { error: contentValidation.error });
			}
		}

		try {
			const result = await queries.updatePost(parseInt(id!), {
				user_id: parseInt(user_id!),
				title: title!,
				content: content || null,
				published
			});

			if (!result) {
				return fail(404, { error: 'Post not found' });
			}
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to update post' });
		}
	},

	delete: async (event) => {
		try {
			requireRole(event, ['super-admin']);
		} catch {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();

		// Validate ID
		const idValidation = validateId(id);
		if (!idValidation.valid) {
			return fail(400, { error: idValidation.error });
		}

		try {
			await queries.deletePost(parseInt(id!));
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to delete post' });
		}
	}
};
