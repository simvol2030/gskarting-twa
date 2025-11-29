/**
 * Security headers middleware for Express.js
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Apply security headers to all responses
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
	// Content Security Policy
	// 🔒 FIX: Allow connect-src to localhost:5173 for admin panel CORS
	const connectSrc = process.env.NODE_ENV === 'production'
		? "'self' https://murzicoin.murzico.ru"
		: "'self' http://localhost:5173 http://localhost:3015";

	res.setHeader(
		'Content-Security-Policy',
		"default-src 'self'; " +
			"script-src 'self' 'unsafe-inline'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"font-src 'self' data:; " +
			`connect-src ${connectSrc}; ` +
			"frame-ancestors 'none';"
	);

	// Prevent clickjacking
	res.setHeader('X-Frame-Options', 'DENY');

	// Prevent MIME type sniffing
	res.setHeader('X-Content-Type-Options', 'nosniff');

	// Enable XSS filter in browsers
	res.setHeader('X-XSS-Protection', '1; mode=block');

	// Referrer Policy
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

	// Permissions Policy (formerly Feature Policy)
	res.setHeader(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()'
	);

	// Strict Transport Security (HTTPS only, enable in production)
	if (process.env.NODE_ENV === 'production') {
		res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	}

	next();
}
