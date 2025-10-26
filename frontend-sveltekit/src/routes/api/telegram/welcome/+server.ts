import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TELEGRAM_BOT_TOKEN } from '$lib/server/env';

/**
 * API Endpoint: POST /api/telegram/welcome
 *
 * Sends welcome message to user via Telegram Bot API
 * Called automatically when new user is initialized
 *
 * Telegram Bot API Documentation: https://core.telegram.org/bots/api#sendmessage
 *
 * IMPORTANT: Requires TELEGRAM_BOT_TOKEN in .env file
 * Create .env file with: TELEGRAM_BOT_TOKEN=your_token_here
 *
 * PRODUCTION NOTE:
 * Token is loaded from $lib/server/env.ts which automatically loads .env file
 * This ensures it works both in development (Vite) and production (Node.js)
 *
 * MIGRATION NOTES:
 * When switching to database:
 * 1. Query user data from database instead of request body
 * 2. Log message delivery status to database
 * 3. Add retry logic for failed messages
 * 4. Consider using queue (Bull/BullMQ) for bulk messaging campaigns
 *
 * Example with Prisma:
 * await prisma.botMessage.create({
 *   data: {
 *     user_id: user.id,
 *     chat_id,
 *     message_type: 'welcome',
 *     status: 'sent',
 *     sent_at: new Date()
 *   }
 * });
 */

interface WelcomeMessageRequest {
  chat_id: number;
  first_name: string;
  bonus_amount: number;
}

export const POST: RequestHandler = async ({ request }) => {
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  try {
    const { chat_id, first_name, bonus_amount }: WelcomeMessageRequest = await request.json();

    // Validate required fields
    if (!chat_id || !first_name || !bonus_amount) {
      return json(
        {
          success: false,
          message: 'Missing required fields: chat_id, first_name, bonus_amount'
        },
        { status: 400 }
      );
    }

    // Compose welcome message
    const message = `Здравствуйте, ${first_name}!

Вам начислено ${bonus_amount} бонусных мурзикойнов! 🎉

Вы можете потратить их при покупках в нашей сети магазинов.

Спасибо, что выбрали нас! 🐾`;

    // Send message via Telegram Bot API
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error:', errorData);

      return json(
        {
          success: false,
          message: 'Failed to send message via Telegram',
          error: errorData
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return json({
      success: true,
      message: 'Welcome message sent successfully',
      telegram_response: result
    });
  } catch (error) {
    console.error('Error in /api/telegram/welcome:', error);
    return json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

/**
 * GET endpoint for testing bot connectivity
 * Usage: GET /api/telegram/welcome
 * Returns bot info if token is valid
 */
export const GET: RequestHandler = async () => {
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);

    if (!response.ok) {
      const errorData = await response.json();
      return json(
        {
          success: false,
          message: 'Invalid bot token or API error',
          error: errorData
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return json({
      success: true,
      message: 'Bot connection successful',
      bot_info: result.result
    });
  } catch (error) {
    console.error('Error testing bot connection:', error);
    return json(
      {
        success: false,
        message: 'Failed to connect to Telegram API',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
