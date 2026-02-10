/**
 * Booking Scheduler Service
 * Cron job logic for booking reminders and auto-completion
 * Runs every 15 minutes
 */

import { db } from '../db/client';
import { bookings, bookingConfig } from '../db/schema';
import { eq, and, lte, inArray } from 'drizzle-orm';
import { getBookingConfig } from './booking-slot.service';
import { notifyBookingReminder } from './booking-notification.service';

interface SchedulerResult {
	reminders_sent: number;
	bookings_completed: number;
	errors: string[];
}

/**
 * Process booking reminders
 * Finds bookings that need reminders (X hours before start) and sends them
 */
export async function processBookingReminders(dryRun: boolean = false): Promise<SchedulerResult> {
	const result: SchedulerResult = {
		reminders_sent: 0,
		bookings_completed: 0,
		errors: []
	};

	try {
		const config = await getBookingConfig();

		if (!config.reminder_enabled) {
			return result;
		}

		const now = new Date();
		const reminderThreshold = new Date(now.getTime() + config.reminder_hours_before * 60 * 60 * 1000);

		// Get today's and tomorrow's date strings
		const todayStr = now.toISOString().split('T')[0];
		const tomorrowDate = new Date(now);
		tomorrowDate.setDate(tomorrowDate.getDate() + 1);
		const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

		// Find confirmed bookings that haven't been reminded yet
		const pendingReminders = await db
			.select()
			.from(bookings)
			.where(
				and(
					eq(bookings.status, 'confirmed'),
					eq(bookings.reminder_sent, false),
					inArray(bookings.date, [todayStr, tomorrowStr])
				)
			);

		for (const booking of pendingReminders) {
			// Calculate booking datetime
			const [hours, minutes] = booking.start_time.split(':').map(Number);
			const bookingDate = new Date(booking.date + 'T00:00:00');
			bookingDate.setHours(hours, minutes, 0, 0);

			// Check if within reminder window
			if (bookingDate <= reminderThreshold && bookingDate > now) {
				if (dryRun) {
					console.log(`[BOOKING-SCHEDULER] DRY-RUN: Would send reminder for booking #${booking.id}`);
					result.reminders_sent++;
					continue;
				}

				try {
					const notifResult = await notifyBookingReminder(booking);

					if (notifResult.success) {
						// Mark as reminded
						await db
							.update(bookings)
							.set({ reminder_sent: true, updated_at: new Date().toISOString() })
							.where(eq(bookings.id, booking.id));

						result.reminders_sent++;
					} else {
						// Even if notification failed (no telegram), mark as sent to avoid retries
						if (notifResult.error === 'No telegram_user_id') {
							await db
								.update(bookings)
								.set({ reminder_sent: true, updated_at: new Date().toISOString() })
								.where(eq(bookings.id, booking.id));
						}
						result.errors.push(`Booking #${booking.id}: ${notifResult.error}`);
					}
				} catch (e: any) {
					result.errors.push(`Booking #${booking.id}: ${e.message}`);
				}
			}
		}

		// Auto-complete past bookings (confirmed bookings whose time has passed)
		const pastBookings = await db
			.select()
			.from(bookings)
			.where(
				and(
					eq(bookings.status, 'confirmed'),
					eq(bookings.date, todayStr)
				)
			);

		for (const booking of pastBookings) {
			const [hours, minutes] = booking.start_time.split(':').map(Number);
			const endTime = hours * 60 + minutes + booking.duration;
			const nowMinutes = now.getHours() * 60 + now.getMinutes();

			// If booking end time has passed by at least 30 minutes
			if (nowMinutes > endTime + 30) {
				if (dryRun) {
					console.log(`[BOOKING-SCHEDULER] DRY-RUN: Would complete booking #${booking.id}`);
					result.bookings_completed++;
					continue;
				}

				await db
					.update(bookings)
					.set({
						status: 'completed',
						updated_at: new Date().toISOString()
					})
					.where(eq(bookings.id, booking.id));

				result.bookings_completed++;
			}
		}
	} catch (e: any) {
		result.errors.push(`Scheduler error: ${e.message}`);
	}

	return result;
}
