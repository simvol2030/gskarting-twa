import { readFileSync } from 'fs';
import { join } from 'path';
import type { LayoutServerLoad } from './$types';

/**
 * Root layout data loader
 *
 * TELEGRAM WEB APP INTEGRATION:
 * This loader now supports both:
 * 1. Demo mode: user.json (default fallback)
 * 2. Telegram mode: users_state.json (when telegram_user_id provided)
 *
 * The frontend will call initializeUser() on mount to:
 * - Check if user exists in users_state.json
 * - Award 500 Murzikoyns if new user
 * - Send welcome message via Telegram Bot
 * - Return real user balance
 *
 * MIGRATION NOTES:
 * When switching to database:
 * 1. Accept telegram_user_id from request headers or cookies
 * 2. Query real user from database: await prisma.user.findUnique({ where: { telegram_user_id }})
 * 3. Remove JSON file operations
 * 4. Keep fallback to demo user if telegram_user_id not provided (for testing)
 *
 * Example with Prisma:
 * const telegramUserId = event.request.headers.get('X-Telegram-User-Id');
 * let user;
 * if (telegramUserId) {
 *   user = await prisma.user.findUnique({
 *     where: { telegram_user_id: parseInt(telegramUserId) }
 *   });
 * }
 * if (!user) {
 *   user = demoUser; // Fallback
 * }
 */
export const load: LayoutServerLoad = () => {
  const loyaltyRulesPath = join(process.cwd(), 'src/lib/data/loyalty/loyalty-rules.json');
  const loyaltyRules = JSON.parse(readFileSync(loyaltyRulesPath, 'utf-8'));

  // Load demo user as fallback
  // Real user data will be fetched client-side via initializeUser()
  // and merged in ProfileCard component
  const userPath = join(process.cwd(), 'src/lib/data/loyalty/user.json');
  const demoUser = JSON.parse(readFileSync(userPath, 'utf-8'));

  return {
    user: demoUser,
    loyaltyRules,
    // Flag to indicate this is demo mode
    // Frontend will override with real Telegram user data
    isDemoMode: true
  };
};
