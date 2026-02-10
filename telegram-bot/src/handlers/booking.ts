/**
 * Booking Handlers for Telegram Bot
 * Handles:
 * - Incoming webhook from backend: POST /notify-booking
 * - Callback queries: booking_cancel, booking_confirm_reminder, booking_shift_ok
 */

import { Bot, InlineKeyboard } from 'grammy';
import type { Express } from 'express';

const API_BASE_URL = process.env.API_BASE_URL ||
	(process.env.NODE_ENV === 'production'
		? 'https://sl.bot-3.ru/api'
		: 'http://localhost:3000/api');

interface BookingNotification {
	telegramUserId: number;
	text: string;
	buttons?: Array<{ text: string; callback_data: string }>;
}

/**
 * Register booking webhook routes on the Express app
 */
export function registerBookingWebhooks(app: Express, bot: Bot) {
	// Receive notification from backend and send to user
	app.post('/notify-booking', async (req, res) => {
		try {
			const notification: BookingNotification = req.body;

			if (!notification.telegramUserId || !notification.text) {
				return res.status(400).json({ success: false, error: 'Missing telegramUserId or text' });
			}

			let keyboard: InlineKeyboard | undefined;
			if (notification.buttons && notification.buttons.length > 0) {
				keyboard = new InlineKeyboard();
				for (const btn of notification.buttons) {
					keyboard.text(btn.text, btn.callback_data);
				}
			}

			await bot.api.sendMessage(notification.telegramUserId, notification.text, {
				reply_markup: keyboard
			});

			res.json({ success: true });
		} catch (error: any) {
			console.error('[BOT-BOOKING] Notification send error:', error);

			if (error?.error_code === 403) {
				return res.status(200).json({ success: false, error: 'User blocked bot' });
			}

			res.status(500).json({
				success: false,
				error: error?.message || 'Unknown error'
			});
		}
	});
}

/**
 * Register booking callback query handlers on the bot
 */
export function registerBookingCallbacks(bot: Bot) {
	// Handle booking_cancel:<id>
	bot.callbackQuery(/^booking_cancel:(\d+)$/, async (ctx) => {
		try {
			const bookingId = ctx.match[1];
			const telegramUserId = ctx.from.id;

			// Call backend to cancel
			const response = await fetch(`${API_BASE_URL}/bot/booking/cancel`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					booking_id: parseInt(bookingId),
					telegram_user_id: telegramUserId
				})
			});

			const result = await response.json() as { success: boolean; data?: any; error?: string };

			if (result.success) {
				if (result.data?.already_cancelled) {
					await ctx.answerCallbackQuery('Бронирование уже отменено');
				} else {
					await ctx.answerCallbackQuery('Бронирование отменено');
					// Update message
					const originalText = ctx.callbackQuery.message?.text || '';
					await ctx.editMessageText(
						`${originalText}\n\n❌ Отменено пользователем\n⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
					);
				}
			} else {
				await ctx.answerCallbackQuery(`Ошибка: ${result.error || 'Unknown'}`);
			}
		} catch (error) {
			console.error('[BOT-BOOKING] Cancel callback error:', error);
			await ctx.answerCallbackQuery('Произошла ошибка');
		}
	});

	// Handle booking_confirm_reminder:<id>
	bot.callbackQuery(/^booking_confirm_reminder:(\d+)$/, async (ctx) => {
		try {
			const bookingId = ctx.match[1];
			const telegramUserId = ctx.from.id;

			const response = await fetch(`${API_BASE_URL}/bot/booking/confirm-reminder`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					booking_id: parseInt(bookingId),
					telegram_user_id: telegramUserId
				})
			});

			const result = await response.json() as { success: boolean };

			if (result.success) {
				await ctx.answerCallbackQuery('Отлично! Ждём вас!');
				const originalText = ctx.callbackQuery.message?.text || '';
				await ctx.editMessageText(
					`${originalText}\n\n✅ Подтверждено пользователем`
				);
			} else {
				await ctx.answerCallbackQuery('Ошибка подтверждения');
			}
		} catch (error) {
			console.error('[BOT-BOOKING] Confirm reminder callback error:', error);
			await ctx.answerCallbackQuery('Произошла ошибка');
		}
	});

	// Handle booking_shift_ok:<id> (acknowledgment of shift)
	bot.callbackQuery(/^booking_shift_ok:(\d+)$/, async (ctx) => {
		try {
			await ctx.answerCallbackQuery('Принято!');
			const originalText = ctx.callbackQuery.message?.text || '';
			await ctx.editMessageText(
				`${originalText}\n\n👍 Принято пользователем`
			);
		} catch (error) {
			console.error('[BOT-BOOKING] Shift OK callback error:', error);
			await ctx.answerCallbackQuery('Произошла ошибка');
		}
	});
}
