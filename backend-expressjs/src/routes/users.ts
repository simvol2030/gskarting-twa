import { Router } from 'express';
import { queries } from '../db/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { validateEmail, validateName, validateId } from '../utils/validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

// GET /api/users - получить всех пользователей
router.get('/', async (req: AuthRequest, res) => {
	try {
		const users = await queries.getAllUsers();
		res.json({ success: true, data: users });
	} catch (error) {
		console.error('Get users error:', error);
		res.status(500).json({ error: 'Failed to fetch users' });
	}
});

// GET /api/users/:id - получить одного пользователя
router.get('/:id', async (req: AuthRequest, res) => {
	// Validate ID
	const idValidation = validateId(req.params.id);
	if (!idValidation.valid) {
		return res.status(400).json({ error: idValidation.error });
	}

	try {
		const user = await queries.getUserById(parseInt(req.params.id));

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({ success: true, data: user });
	} catch (error) {
		console.error('Get user error:', error);
		res.status(500).json({ error: 'Failed to fetch user' });
	}
});

// POST /api/users - создать пользователя (только super-admin и editor)
router.post('/', requireRole('super-admin', 'editor'), async (req: AuthRequest, res) => {
	const { name, email } = req.body;

	// Validate inputs
	const nameValidation = validateName(name);
	if (!nameValidation.valid) {
		return res.status(400).json({ error: nameValidation.error });
	}

	const emailValidation = validateEmail(email);
	if (!emailValidation.valid) {
		return res.status(400).json({ error: emailValidation.error });
	}

	try {
		const newUser = await queries.createUser({ name, email });
		res.status(201).json({ success: true, data: newUser });
	} catch (error: any) {
		console.error('Create user error:', error);
		if (error.message && error.message.includes('UNIQUE constraint')) {
			return res.status(409).json({ error: 'Email already exists' });
		}
		res.status(500).json({ error: 'Failed to create user' });
	}
});

// PUT /api/users/:id - обновить пользователя (только super-admin и editor)
router.put('/:id', requireRole('super-admin', 'editor'), async (req: AuthRequest, res) => {
	const { name, email } = req.body;

	// Validate ID
	const idValidation = validateId(req.params.id);
	if (!idValidation.valid) {
		return res.status(400).json({ error: idValidation.error });
	}

	// Validate inputs
	const nameValidation = validateName(name);
	if (!nameValidation.valid) {
		return res.status(400).json({ error: nameValidation.error });
	}

	const emailValidation = validateEmail(email);
	if (!emailValidation.valid) {
		return res.status(400).json({ error: emailValidation.error });
	}

	try {
		const updatedUser = await queries.updateUser(parseInt(req.params.id), { name, email });

		if (!updatedUser) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({ success: true, data: updatedUser });
	} catch (error: any) {
		console.error('Update user error:', error);
		if (error.message && error.message.includes('UNIQUE constraint')) {
			return res.status(409).json({ error: 'Email already exists' });
		}
		res.status(500).json({ error: 'Failed to update user' });
	}
});

// DELETE /api/users/:id - удалить пользователя (только super-admin)
router.delete('/:id', requireRole('super-admin'), async (req: AuthRequest, res) => {
	// Validate ID
	const idValidation = validateId(req.params.id);
	if (!idValidation.valid) {
		return res.status(400).json({ error: idValidation.error });
	}

	try {
		await queries.deleteUser(parseInt(req.params.id));
		res.json({ success: true, message: 'User deleted successfully' });
	} catch (error) {
		console.error('Delete user error:', error);
		res.status(500).json({ error: 'Failed to delete user' });
	}
});

export default router;
