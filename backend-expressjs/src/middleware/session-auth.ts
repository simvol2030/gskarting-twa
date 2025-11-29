import { Request, Response, NextFunction } from 'express';
import { decrypt } from '../utils/crypto';
import { createHash } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || '';

if (!SESSION_SECRET) {
	console.warn('⚠️  SESSION_SECRET not set in environment. Session authentication will fail!');
} else {
	// Debug: log secret hash for comparison with frontend
	const secretHash = createHash('md5').update(SESSION_SECRET).digest('hex').substring(0, 8);
	console.log(`[SESSION-AUTH] SECRET loaded, length: ${SESSION_SECRET.length}, hash: ${secretHash}...`);
}

export interface SessionUser {
	id: number;
	email: string;
	role: 'super-admin' | 'editor' | 'viewer';
	name: string;
	createdAt: number;
}

export interface AuthRequest extends Request {
	user?: SessionUser;
}

/**
 * Middleware для проверки session cookie (совместимость с SvelteKit frontend)
 * Читает encrypted session cookie и декодирует пользователя
 */
export function authenticateSession(req: AuthRequest, res: Response, next: NextFunction) {
	// Читаем session cookie
	const sessionCookie = req.cookies?.session;

	console.log('[SESSION-AUTH] Cookie received:', sessionCookie ? `${sessionCookie.substring(0, 50)}...` : 'NONE');
	console.log('[SESSION-AUTH] Cookie length:', sessionCookie?.length || 0);

	if (!sessionCookie) {
		return res.status(401).json({
			success: false,
			error: 'Session required. Please login.'
		});
	}

	try {
		// Декодируем encrypted session
		console.log('[SESSION-AUTH] Attempting decrypt with SECRET:', SESSION_SECRET ? 'YES' : 'NO');
		const sessionData = decrypt(sessionCookie, SESSION_SECRET);
		console.log('[SESSION-AUTH] Decrypt result:', sessionData ? 'SUCCESS' : 'FAILED');

		if (!sessionData) {
			return res.status(401).json({
				success: false,
				error: 'Invalid or expired session'
			});
		}

		// Validate session age (reject sessions older than 7 days)
		const maxAgeMs = 60 * 60 * 24 * 7 * 1000; // 7 days in ms
		if (sessionData.createdAt && Date.now() - sessionData.createdAt > maxAgeMs) {
			return res.status(401).json({
				success: false,
				error: 'Session expired. Please login again.'
			});
		}

		// Attach user to request
		req.user = sessionData as SessionUser;
		next();
	} catch (error) {
		console.error('Session authentication error:', error);
		return res.status(403).json({
			success: false,
			error: 'Invalid session format'
		});
	}
}

/**
 * Middleware для проверки роли (работает после authenticateSession)
 */
export function requireRole(...roles: string[]) {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				error: 'Not authenticated'
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				error: `Insufficient permissions. Required roles: ${roles.join(', ')}`
			});
		}

		next();
	};
}
