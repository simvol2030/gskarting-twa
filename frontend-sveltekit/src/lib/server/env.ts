/**
 * Environment variables loader for production
 *
 * CRITICAL: On production, Node.js doesn't automatically load .env files
 * This module ensures environment variables are loaded before server starts
 *
 * Usage:
 * import { TELEGRAM_BOT_TOKEN, SESSION_SECRET } from '$lib/server/env';
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env file from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');

// Only load .env in production runtime (not during build)
const isBuild = process.env.npm_lifecycle_event === 'build';

if (!isBuild) {
  console.log('[env.ts] Loading environment variables from:', envPath);
  config({ path: envPath });
}

// Telegram Bot Token
const token = process.env.TELEGRAM_BOT_TOKEN;

// Only throw error in production runtime (not during build or dev)
if (!token && !isBuild) {
  console.error('[env.ts] ❌ TELEGRAM_BOT_TOKEN is not set!');
  console.error('[env.ts] Please set TELEGRAM_BOT_TOKEN environment variable or create .env file');
  console.error('[env.ts] Example: TELEGRAM_BOT_TOKEN=your_bot_token_here');

  // In development, continue with warning
  // In production, this will cause runtime error when endpoint is called
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }
}

if (token && !isBuild) {
  console.log('[env.ts] ✅ TELEGRAM_BOT_TOKEN loaded:', token.substring(0, 10) + '...');
}

// Session Secret
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.warn('[env.ts] ⚠️ SESSION_SECRET is not set, using development fallback');
}

// Export validated environment variables
export const TELEGRAM_BOT_TOKEN = token;
export const SESSION_SECRET = sessionSecret || 'development-secret-key';
export const NODE_ENV = process.env.NODE_ENV || 'development';
