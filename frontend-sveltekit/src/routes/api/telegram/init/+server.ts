import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * API Endpoint: POST /api/telegram/init
 *
 * Initializes Telegram user on first app launch:
 * 1. Checks if user exists in users_state.json
 * 2. If new user: awards 500 Murzikoyns welcome bonus
 * 3. Tracks which store user registered from (CRITICAL for analytics)
 * 4. Triggers welcome message via /api/telegram/welcome
 *
 * MIGRATION NOTES:
 * When switching to database:
 * 1. Replace JSON file operations with Prisma/ORM queries
 * 2. Use database transaction for user creation + bonus award
 * 3. Add trigger to update users.current_balance on transaction insert
 * 4. Keep store_id foreign key relationship
 *
 * Example with Prisma:
 * const user = await prisma.user.upsert({
 *   where: { telegram_user_id: telegram_user_id },
 *   update: { last_activity: new Date() },
 *   create: {
 *     telegram_user_id,
 *     first_name,
 *     last_name,
 *     username,
 *     language_code,
 *     current_balance: 500.00,
 *     store_id,
 *     first_login_bonus_claimed: true,
 *     registration_date: new Date(),
 *     chat_id
 *   }
 * });
 *
 * await prisma.transaction.create({
 *   data: {
 *     user_id: user.id,
 *     title: 'Приветственный бонус',
 *     amount: 500.00,
 *     type: 'earn',
 *     store_id
 *   }
 * });
 */

interface TelegramUserData {
  telegram_user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  chat_id: number;
  store_id?: number;
}

interface UserState {
  telegram_user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  current_balance: number;
  store_id?: number;
  first_login_bonus_claimed: boolean;
  registration_date: string;
  last_activity: string;
  chat_id: number;
}

interface UsersStateFile {
  users: UserState[];
  _metadata?: object;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const userData: TelegramUserData = await request.json();

    // Validate required fields
    if (!userData.telegram_user_id || !userData.first_name || !userData.chat_id) {
      return json(
        {
          success: false,
          message: 'Missing required fields: telegram_user_id, first_name, chat_id'
        },
        { status: 400 }
      );
    }

    // Read existing users from JSON file
    const usersStatePath = join(process.cwd(), 'src/lib/data/loyalty/users_state.json');
    let usersData: UsersStateFile;

    try {
      const fileContent = readFileSync(usersStatePath, 'utf-8');
      usersData = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist or is invalid, create new structure
      usersData = { users: [] };
    }

    // Check if user already exists
    const existingUser = usersData.users.find(
      (u) => u.telegram_user_id === userData.telegram_user_id
    );

    if (existingUser) {
      // Existing user - update last_activity
      existingUser.last_activity = new Date().toISOString();

      // Write back to file
      writeFileSync(usersStatePath, JSON.stringify(usersData, null, 2), 'utf-8');

      return json({
        success: true,
        isNewUser: false,
        user: {
          telegram_user_id: existingUser.telegram_user_id,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          username: existingUser.username,
          current_balance: existingUser.current_balance,
          store_id: existingUser.store_id,
          first_login_bonus_claimed: existingUser.first_login_bonus_claimed
        },
        message: 'Welcome back!'
      });
    } else {
      // New user - award 500 Murzikoyns welcome bonus
      const newUser: UserState = {
        telegram_user_id: userData.telegram_user_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        language_code: userData.language_code || 'ru',
        current_balance: 500.0, // Welcome bonus
        store_id: userData.store_id,
        first_login_bonus_claimed: true,
        registration_date: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        chat_id: userData.chat_id
      };

      usersData.users.push(newUser);

      // Write back to file
      writeFileSync(usersStatePath, JSON.stringify(usersData, null, 2), 'utf-8');

      // Send welcome message via Telegram Bot API
      try {
        await fetch('/api/telegram/welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: userData.chat_id,
            first_name: userData.first_name,
            bonus_amount: 500
          })
        });
      } catch (error) {
        console.error('Failed to send welcome message:', error);
        // Don't fail the entire request if welcome message fails
      }

      return json({
        success: true,
        isNewUser: true,
        user: {
          telegram_user_id: newUser.telegram_user_id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          username: newUser.username,
          current_balance: newUser.current_balance,
          store_id: newUser.store_id,
          first_login_bonus_claimed: newUser.first_login_bonus_claimed
        },
        message: 'Welcome! 500 Murzikoyns awarded'
      });
    }
  } catch (error) {
    console.error('Error in /api/telegram/init:', error);
    return json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
};
