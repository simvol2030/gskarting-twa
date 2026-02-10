/**
 * Bot Booking Routes
 * Express webhook routes that the bot calls for booking actions
 * (callback query results from inline buttons)
 */

import { Router } from 'express';
import { db, nativeClient } from '../../db/client';
import { bookings, bookingSlots, bookingActionLog } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /cancel — Cancel a booking (from bot inline button)
 */
router.post('/cancel', async (req, res) => {
	try {
		const { booking_id, telegram_user_id } = req.body;

		if (!booking_id) {
			return res.status(400).json({ success: false, error: 'booking_id required' });
		}

		const [booking] = await db.select().from(bookings).where(eq(bookings.id, booking_id)).limit(1);

		if (!booking) {
			return res.status(404).json({ success: false, error: 'Booking not found' });
		}

		// Verify telegram user owns this booking
		if (telegram_user_id && booking.telegram_user_id !== String(telegram_user_id)) {
			return res.status(403).json({ success: false, error: 'Not authorized' });
		}

		if (booking.status === 'cancelled') {
			return res.json({ success: true, data: { already_cancelled: true } });
		}

		if (booking.status === 'completed') {
			return res.status(400).json({ success: false, error: 'Cannot cancel completed booking' });
		}

		if (!nativeClient) {
			return res.status(500).json({ success: false, error: 'DB not available' });
		}

		// Atomic cancel + slot update
		const txn = nativeClient.transaction(() => {
			nativeClient!.prepare(`
				UPDATE bookings
				SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancel_reason = 'Отменено пользователем через бота', updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).run(booking_id);

			const slot = nativeClient!.prepare('SELECT * FROM booking_slots WHERE id = ?').get(booking.slot_id) as any;
			if (slot) {
				const newBooked = Math.max(0, slot.booked_participants - booking.participant_count);
				let newStatus = 'available';
				if (newBooked >= slot.max_participants) newStatus = 'booked';
				else if (newBooked > slot.max_participants * 0.5) newStatus = 'limited';

				nativeClient!.prepare(
					'UPDATE booking_slots SET booked_participants = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
				).run(newBooked, newStatus, booking.slot_id);
			}

			nativeClient!.prepare(`
				INSERT INTO booking_action_log (booking_id, action, details)
				VALUES (?, 'cancelled', ?)
			`).run(booking_id, JSON.stringify({ reason: 'Cancelled by user via bot', telegram_user_id }));
		});

		txn.immediate();

		res.json({ success: true, data: { booking_id, status: 'cancelled' } });
	} catch (error: any) {
		console.error('[BOT-BOOKING] Cancel error:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /confirm-reminder — User confirms they will attend
 */
router.post('/confirm-reminder', async (req, res) => {
	try {
		const { booking_id, telegram_user_id } = req.body;

		if (!booking_id) {
			return res.status(400).json({ success: false, error: 'booking_id required' });
		}

		const [booking] = await db.select().from(bookings).where(eq(bookings.id, booking_id)).limit(1);

		if (!booking) {
			return res.status(404).json({ success: false, error: 'Booking not found' });
		}

		// Update reminder_confirmed
		await db
			.update(bookings)
			.set({
				reminder_confirmed: true,
				updated_at: new Date().toISOString()
			})
			.where(eq(bookings.id, booking_id));

		res.json({ success: true, data: { booking_id, reminder_confirmed: true } });
	} catch (error: any) {
		console.error('[BOT-BOOKING] Confirm reminder error:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
