import { Router } from 'express';
import { queries } from '../db/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { validateId, validateTitle, validateContent } from '../utils/validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

// GET /api/posts - получить все посты с информацией об авторах
router.get('/', async (req: AuthRequest, res) => {
	try {
		const posts = await queries.getAllPosts();
		res.json({ success: true, data: posts });
	} catch (error) {
		console.error('Get posts error:', error);
		res.status(500).json({ error: 'Failed to fetch posts' });
	}
});

// GET /api/posts/:id - получить один пост с информацией об авторе
router.get('/:id', async (req: AuthRequest, res) => {
	// Validate ID
	const idValidation = validateId(req.params.id);
	if (!idValidation.valid) {
		return res.status(400).json({ error: idValidation.error });
	}

	try {
		const post = await queries.getPostById(parseInt(req.params.id));

		if (!post) {
			return res.status(404).json({ error: 'Post not found' });
		}

		res.json({ success: true, data: post });
	} catch (error) {
		console.error('Get post error:', error);
		res.status(500).json({ error: 'Failed to fetch post' });
	}
});

// POST /api/posts - создать пост (только super-admin и editor)
router.post('/', requireRole('super-admin', 'editor'), async (req: AuthRequest, res) => {
	const { user_id, title, content, published } = req.body;

	// Validate user_id
	const userIdValidation = validateId(user_id?.toString());
	if (!userIdValidation.valid) {
		return res.status(400).json({ error: 'Invalid user_id: ' + userIdValidation.error });
	}

	// Validate title
	const titleValidation = validateTitle(title);
	if (!titleValidation.valid) {
		return res.status(400).json({ error: titleValidation.error });
	}

	// Validate content if provided
	if (content) {
		const contentValidation = validateContent(content);
		if (!contentValidation.valid) {
			return res.status(400).json({ error: contentValidation.error });
		}
	}

	try {
		const newPost = await queries.createPost({
			user_id: parseInt(user_id),
			title,
			content: content || null,
			published: published ? true : false
		});

		res.status(201).json({ success: true, data: newPost });
	} catch (error: any) {
		console.error('Create post error:', error);
		if (error.message && error.message.includes('FOREIGN KEY constraint')) {
			return res.status(400).json({ error: 'Invalid user_id' });
		}
		res.status(500).json({ error: 'Failed to create post' });
	}
});

// PUT /api/posts/:id - обновить пост (только super-admin и editor)
router.put('/:id', requireRole('super-admin', 'editor'), async (req: AuthRequest, res) => {
	const { user_id, title, content, published } = req.body;

	// Validate post ID
	const postIdValidation = validateId(req.params.id);
	if (!postIdValidation.valid) {
		return res.status(400).json({ error: 'Invalid post ID: ' + postIdValidation.error });
	}

	// Validate user_id
	const userIdValidation = validateId(user_id?.toString());
	if (!userIdValidation.valid) {
		return res.status(400).json({ error: 'Invalid user_id: ' + userIdValidation.error });
	}

	// Validate title
	const titleValidation = validateTitle(title);
	if (!titleValidation.valid) {
		return res.status(400).json({ error: titleValidation.error });
	}

	// Validate content if provided
	if (content) {
		const contentValidation = validateContent(content);
		if (!contentValidation.valid) {
			return res.status(400).json({ error: contentValidation.error });
		}
	}

	try {
		const updatedPost = await queries.updatePost(parseInt(req.params.id), {
			user_id: parseInt(user_id),
			title,
			content: content || null,
			published: published ? true : false
		});

		if (!updatedPost) {
			return res.status(404).json({ error: 'Post not found' });
		}

		res.json({ success: true, data: updatedPost });
	} catch (error: any) {
		console.error('Update post error:', error);
		if (error.message && error.message.includes('FOREIGN KEY constraint')) {
			return res.status(400).json({ error: 'Invalid user_id' });
		}
		res.status(500).json({ error: 'Failed to update post' });
	}
});

// DELETE /api/posts/:id - удалить пост (только super-admin)
router.delete('/:id', requireRole('super-admin'), async (req: AuthRequest, res) => {
	// Validate ID
	const idValidation = validateId(req.params.id);
	if (!idValidation.valid) {
		return res.status(400).json({ error: idValidation.error });
	}

	try {
		await queries.deletePost(parseInt(req.params.id));
		res.json({ success: true, message: 'Post deleted successfully' });
	} catch (error) {
		console.error('Delete post error:', error);
		res.status(500).json({ error: 'Failed to delete post' });
	}
});

export default router;
