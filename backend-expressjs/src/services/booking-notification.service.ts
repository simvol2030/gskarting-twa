/**
 * Booking Notification Service
 * Sends booking-related notifications via Telegram bot webhook
 * 5 notification types: created, confirmed, cancelled, reminder, shifted
 */

import { db } from '../db/client';
import { bookingConfig, bookings } from '../db/schema';
import type { Booking, BookingConfig } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getBookingConfig } from './booking-slot.service';

const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || 'http://localhost:2017';

interface NotificationResult {
	success: boolean;
	telegram_user_id?: string;
	error?: string;
}

/**
 * Send a booking notification to the user via bot webhook
 */
async function sendBotNotification(
	telegramUserId: string,
	text: string,
	buttons?: Array<{ text: string; callback_data: string }>
): Promise<boolean> {
	try {
		const response = await fetch(`${BOT_WEBHOOK_URL}/notify-booking`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				telegramUserId: parseInt(telegramUserId),
				text,
				buttons
			})
		});

		const result = await response.json() as { success: boolean; error?: string };
		if (!result.success) {
			console.error(`[BOOKING-NOTIFY] Bot webhook failed:`, result.error);
			return false;
		}
		return true;
	} catch (error) {
		console.error(`[BOOKING-NOTIFY] Failed to call bot webhook:`, error);
		return false;
	}
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
	const d = new Date(dateStr + 'T12:00:00');
	return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format price
 */
function formatPrice(price: number): string {
	return price.toLocaleString('ru-RU') + ' ₽';
}

/**
 * 1. Notify: Booking Created
 */
export async function notifyBookingCreated(booking: Booking): Promise<NotificationResult> {
	if (!booking.telegram_user_id) {
		return { success: false, error: 'No telegram_user_id' };
	}

	const text = `🏎️ Бронирование создано!\n\n📅 ${formatDate(booking.date)}\n⏰ ${booking.start_time}\n⏱️ ${booking.duration} мин\n👥 ${booking.participant_count} чел.\n💰 ${formatPrice(booking.total_price)}\n\n${booking.status === 'confirmed' ? '✅ Автоматически подтверждено' : '⏳ Ожидает подтверждения'}`;

	const buttons = [
		{ text: '❌ Отменить', callback_data: `booking_cancel:${booking.id}` }
	];

	const sent = await sendBotNotification(booking.telegram_user_id, text, buttons);

	return { success: sent, telegram_user_id: booking.telegram_user_id };
}

/**
 * 2. Notify: Booking Confirmed
 */
export async function notifyBookingConfirmed(booking: Booking): Promise<NotificationResult> {
	if (!booking.telegram_user_id) {
		return { success: false, error: 'No telegram_user_id' };
	}

	const text = `✅ Бронирование подтверждено!\n\n📅 ${formatDate(booking.date)}\n⏰ ${booking.start_time}\n⏱️ ${booking.duration} мин\n👥 ${booking.participant_count} чел.\n💰 ${formatPrice(booking.total_price)}\n\nЖдём вас! 🏎️`;

	const sent = await sendBotNotification(booking.telegram_user_id, text);

	return { success: sent, telegram_user_id: booking.telegram_user_id };
}

/**
 * 3. Notify: Booking Cancelled
 */
export async function notifyBookingCancelled(booking: Booking, reason?: string): Promise<NotificationResult> {
	if (!booking.telegram_user_id) {
		return { success: false, error: 'No telegram_user_id' };
	}

	const reasonText = reason ? `\n📝 Причина: ${reason}` : '';
	const text = `❌ Бронирование отменено\n\n📅 ${formatDate(booking.date)}\n⏰ ${booking.start_time}\n⏱️ ${booking.duration} мин${reasonText}`;

	const sent = await sendBotNotification(booking.telegram_user_id, text);

	return { success: sent, telegram_user_id: booking.telegram_user_id };
}

/**
 * 4. Notify: Booking Reminder
 */
export async function notifyBookingReminder(booking: Booking): Promise<NotificationResult> {
	if (!booking.telegram_user_id) {
		return { success: false, error: 'No telegram_user_id' };
	}

	const config = await getBookingConfig();
	const hoursText = config.reminder_hours_before === 1 ? 'час' :
		config.reminder_hours_before < 5 ? `${config.reminder_hours_before} часа` :
			`${config.reminder_hours_before} часов`;

	const text = `🔔 Напоминание!\n\nВаш заезд через ${hoursText}:\n📅 ${formatDate(booking.date)}\n⏰ ${booking.start_time}\n⏱️ ${booking.duration} мин\n👥 ${booking.participant_count} чел.\n\nДо встречи! 🏎️`;

	const buttons = [
		{ text: '✅ Буду', callback_data: `booking_confirm_reminder:${booking.id}` },
		{ text: '❌ Отменить', callback_data: `booking_cancel:${booking.id}` }
	];

	const sent = await sendBotNotification(booking.telegram_user_id, text, buttons);

	return { success: sent, telegram_user_id: booking.telegram_user_id };
}

/**
 * 5. Notify: Booking Shifted (time changed)
 */
export async function notifyBookingShifted(
	booking: Booking,
	oldStartTime: string,
	newStartTime: string,
	shiftMinutes: number,
	reason: string
): Promise<NotificationResult> {
	if (!booking.telegram_user_id) {
		return { success: false, error: 'No telegram_user_id' };
	}

	const direction = shiftMinutes > 0 ? 'позже' : 'раньше';
	const absMinutes = Math.abs(shiftMinutes);
	const text = `⏩ Время вашего заезда изменено\n\n📅 ${formatDate(booking.date)}\n❌ Было: ${oldStartTime}\n✅ Стало: ${newStartTime}\n⏱️ Сдвиг: ${absMinutes} мин ${direction}\n📝 Причина: ${reason}\n\nОстальные данные без изменений.`;

	const buttons = [
		{ text: '👍 ОК', callback_data: `booking_shift_ok:${booking.id}` },
		{ text: '❌ Отменить', callback_data: `booking_cancel:${booking.id}` }
	];

	const sent = await sendBotNotification(booking.telegram_user_id, text, buttons);

	return { success: sent, telegram_user_id: booking.telegram_user_id };
}
