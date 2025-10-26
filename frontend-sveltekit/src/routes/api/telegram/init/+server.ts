import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { loyaltyUsers, transactions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/**
 * API Endpoint: POST /api/telegram/init
 *
 * DATABASE VERSION:
 * Initializes Telegram user on first app launch:
 * 1. Checks if user exists in loyalty_users table
 * 2. If new user: awards 500 Murzikoyns welcome bonus
 * 3. Tracks which store user registered from (CRITICAL for analytics)
 * 4. Creates transaction record for welcome bonus
 * 5. Triggers welcome message via /api/telegram/welcome
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

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
  console.log('[API /telegram/init] 📥 Request received');

  try {
    const userData: TelegramUserData = await request.json();
    console.log('[API /telegram/init] 📦 Received userData:', {
      telegram_user_id: userData.telegram_user_id,
      first_name: userData.first_name,
      chat_id: userData.chat_id,
      store_id: userData.store_id
    });

    // Validate required fields
    if (!userData.telegram_user_id || !userData.first_name || !userData.chat_id) {
      console.error('[API /telegram/init] ❌ VALIDATION FAILED:', {
        has_telegram_user_id: !!userData.telegram_user_id,
        has_first_name: !!userData.first_name,
        has_chat_id: !!userData.chat_id
      });
      return json(
        {
          success: false,
          message: 'Missing required fields: telegram_user_id, first_name, chat_id'
        },
        { status: 400 }
      );
    }

    // Check if user already exists in database
    const existingUser = await db
      .select()
      .from(loyaltyUsers)
      .where(eq(loyaltyUsers.telegram_user_id, userData.telegram_user_id))
      .get();

    if (existingUser) {
      // Check if user hasn't claimed welcome bonus yet (legacy users or incomplete signup)
      if (!existingUser.first_login_bonus_claimed) {
        console.log('[API] 🎯 LEGACY USER DETECTED! Awarding 500 Murzikoyns:', existingUser.telegram_user_id);

        // Award bonus
        const updatedUser = await db
          .update(loyaltyUsers)
          .set({
            current_balance: existingUser.current_balance + 500.0,
            first_login_bonus_claimed: true,
            last_activity: new Date().toISOString()
          })
          .where(eq(loyaltyUsers.id, existingUser.id))
          .returning()
          .get();

        console.log('[API] ✅ Balance updated:', existingUser.current_balance, '→', updatedUser.current_balance);

        // Create transaction record
        // FIX #6: Add explicit created_at
        await db.insert(transactions).values({
          loyalty_user_id: existingUser.id,
          title: 'Приветственный бонус',
          amount: 500.0,
          type: 'earn',
          store_id: existingUser.store_id,
          store_name: null,
          spent: null,
          created_at: new Date().toISOString()
        });

        console.log('[API] 📝 Transaction created for legacy user bonus');

        // Send welcome message
        try {
          console.log('[API] 📨 Sending welcome message to chat_id:', userData.chat_id);
          const welcomeResponse = await fetch('/api/telegram/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: userData.chat_id,
              first_name: updatedUser.first_name, // Use UPDATED user data
              bonus_amount: 500
            })
          });

          if (welcomeResponse.ok) {
            const welcomeResult = await welcomeResponse.json();
            console.log('[API] ✅ Welcome message sent successfully:', welcomeResult);
          } else {
            const errorText = await welcomeResponse.text();
            console.error('[API] ❌ Welcome message failed:', welcomeResponse.status, errorText);
          }
        } catch (error) {
          console.error('[API] ❌ Failed to send welcome message:', error);
        }

        // FIX #3: Set cookie on server (prevents race condition)
        cookies.set('telegram_user_id', updatedUser.telegram_user_id.toString(), {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: 'strict',
          httpOnly: false // Needed for client-side access
        });
        console.log('[API] 🍪 Cookie set: telegram_user_id=', updatedUser.telegram_user_id);

        return json({
          success: true,
          isNewUser: true, // Treat as new user (first bonus)
          user: {
            telegram_user_id: updatedUser.telegram_user_id,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            username: updatedUser.username,
            current_balance: updatedUser.current_balance,
            store_id: updatedUser.store_id,
            first_login_bonus_claimed: updatedUser.first_login_bonus_claimed
          },
          message: 'Welcome bonus awarded!'
        });
      }

      // Existing user with bonus already claimed - just update activity
      await db
        .update(loyaltyUsers)
        .set({ last_activity: new Date().toISOString() })
        .where(eq(loyaltyUsers.telegram_user_id, userData.telegram_user_id))
        .run();

      // FIX #3: Set cookie for existing user too
      cookies.set('telegram_user_id', existingUser.telegram_user_id.toString(), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'strict',
        httpOnly: false
      });

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
      console.log('[API] 🆕 NEW USER DETECTED! Creating account for:', userData.telegram_user_id);

      const newUser = await db
        .insert(loyaltyUsers)
        .values({
          telegram_user_id: userData.telegram_user_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          language_code: userData.language_code || 'ru',
          current_balance: 500.0, // Welcome bonus
          store_id: userData.store_id,
          first_login_bonus_claimed: true,
          chat_id: userData.chat_id
        })
        .returning()
        .get();

      console.log('[API] ✅ New user created with 500 Murzikoyns');

      // Create transaction record for welcome bonus
      // FIX #6: Add explicit created_at
      await db.insert(transactions).values({
        loyalty_user_id: newUser.id,
        title: 'Приветственный бонус',
        amount: 500.0,
        type: 'earn',
        store_id: userData.store_id,
        store_name: null,
        spent: null,
        created_at: new Date().toISOString()
      });

      console.log('[API] 📝 Transaction created for new user bonus');

      // Send welcome message via Telegram Bot API
      try {
        console.log('[API] 📨 Sending welcome message to chat_id:', userData.chat_id);
        const welcomeResponse = await fetch('/api/telegram/welcome', {
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

        if (welcomeResponse.ok) {
          const welcomeResult = await welcomeResponse.json();
          console.log('[API] ✅ Welcome message sent successfully:', welcomeResult);
        } else {
          const errorText = await welcomeResponse.text();
          console.error('[API] ❌ Welcome message failed:', welcomeResponse.status, errorText);
        }
      } catch (error) {
        console.error('[API] ❌ Failed to send welcome message:', error);
        // Don't fail the entire request if welcome message fails
      }

      // FIX #3: Set cookie for new user
      cookies.set('telegram_user_id', newUser.telegram_user_id.toString(), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'strict',
        httpOnly: false
      });
      console.log('[API] 🍪 Cookie set for new user:', newUser.telegram_user_id);

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
