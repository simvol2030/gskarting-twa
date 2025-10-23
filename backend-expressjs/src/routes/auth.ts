import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { queries } from '../db/database';
import { validateEmail, validatePassword } from '../utils/validation';
import { checkRateLimit, resetRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '../utils/rate-limit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// POST /api/auth/login - вход в систему
router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	// Validate inputs
	const emailValidation = validateEmail(email);
	if (!emailValidation.valid) {
		return res.status(400).json({ error: emailValidation.error });
	}

	const passwordValidation = validatePassword(password);
	if (!passwordValidation.valid) {
		return res.status(400).json({ error: passwordValidation.error });
	}

	// Rate limiting check
	const clientIP = getClientIP(req);
	const rateLimitResult = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.LOGIN);

	if (!rateLimitResult.allowed) {
		return res.status(429).json({
			error: rateLimitResult.message,
			retryAfter: rateLimitResult.retryAfterMs
		});
	}

	try {
		// Ищем админа в базе (используем Drizzle queries)
		const admin = await queries.getAdminByEmail(email);

		// Timing-safe password comparison to prevent timing attacks
		if (!admin) {
			// Use dummy bcrypt comparison to prevent timing attacks
			await bcrypt.compare(password, '$2b$10$dummyhashtopreventtimingattacks12345678901234567890');
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Verify password with bcrypt
		const isValid = await bcrypt.compare(password, admin.password);

		if (!isValid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Reset rate limit on successful login
		resetRateLimit(clientIP);

		// Генерируем JWT токен
		const token = jwt.sign(
			{
				id: admin.id,
				email: admin.email,
				role: admin.role,
				name: admin.name
			},
			JWT_SECRET,
			{ expiresIn: '7d' }
		);

		res.json({
			success: true,
			token,
			user: {
				id: admin.id,
				email: admin.email,
				role: admin.role,
				name: admin.name
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// GET /api/auth/me - получить текущего пользователя
router.get('/me', (req, res) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ error: 'Access token required' });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		res.json({ user: decoded });
	} catch (error) {
		res.status(403).json({ error: 'Invalid or expired token' });
	}
});

export default router;
