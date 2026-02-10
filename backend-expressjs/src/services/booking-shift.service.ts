/**
 * Booking Shift Service
 * Cascade slot shifting — single shift, bulk shift, preview
 * Uses nativeClient transactions for atomicity
 */

import { db, nativeClient } from '../db/client';
import { bookingSlots, bookingShiftLog, bookingActionLog, bookings } from '../db/schema';
import type { BookingSlot } from '../db/schema';
import { eq, and, gte, asc } from 'drizzle-orm';

/**
 * Add minutes to HH:MM string
 */
function addMinutes(time: string, minutes: number): string {
	const [h, m] = time.split(':').map(Number);
	const total = h * 60 + m + minutes;
	const newH = Math.floor(total / 60);
	const newM = total % 60;
	return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Convert HH:MM to minutes since midnight
 */
function timeToMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

interface ShiftPreviewResult {
	trigger_slot: { id: number; start_time: string; new_start_time: string };
	affected_slots: Array<{
		id: number;
		start_time: string;
		new_start_time: string;
		has_bookings: boolean;
		booking_count: number;
	}>;
	total_affected: number;
	bookings_affected: number;
}

interface ShiftResult {
	shift_log_id: number;
	affected_slots_count: number;
	shifted_slots: Array<{ id: number; old_start: string; new_start: string }>;
}

/**
 * Preview what a shift would affect (no DB changes)
 */
export async function previewShift(
	slotId: number,
	shiftMinutes: number,
	cascade: boolean
): Promise<ShiftPreviewResult> {
	// Get the trigger slot
	const [triggerSlot] = await db
		.select()
		.from(bookingSlots)
		.where(eq(bookingSlots.id, slotId))
		.limit(1);

	if (!triggerSlot) {
		throw new Error('Slot not found');
	}

	const newTriggerStart = addMinutes(triggerSlot.start_time, shiftMinutes);

	const result: ShiftPreviewResult = {
		trigger_slot: {
			id: triggerSlot.id,
			start_time: triggerSlot.start_time,
			new_start_time: newTriggerStart
		},
		affected_slots: [],
		total_affected: 0,
		bookings_affected: 0
	};

	if (cascade) {
		// Get all subsequent slots on the same date (after trigger slot's start_time)
		const subsequentSlots = await db
			.select()
			.from(bookingSlots)
			.where(
				and(
					eq(bookingSlots.date, triggerSlot.date),
					gte(bookingSlots.start_time, triggerSlot.start_time)
				)
			)
			.orderBy(asc(bookingSlots.start_time));

		for (const slot of subsequentSlots) {
			if (slot.id === triggerSlot.id) continue;

			const newStart = addMinutes(slot.start_time, shiftMinutes);

			// Count bookings for this slot
			const slotBookings = await db
				.select()
				.from(bookings)
				.where(
					and(
						eq(bookings.slot_id, slot.id),
						eq(bookings.status, 'confirmed')
					)
				);

			result.affected_slots.push({
				id: slot.id,
				start_time: slot.start_time,
				new_start_time: newStart,
				has_bookings: slotBookings.length > 0,
				booking_count: slotBookings.length
			});

			if (slotBookings.length > 0) {
				result.bookings_affected += slotBookings.length;
			}
		}
	}

	// Count trigger slot bookings too
	const triggerBookings = await db
		.select()
		.from(bookings)
		.where(
			and(
				eq(bookings.slot_id, triggerSlot.id),
				eq(bookings.status, 'confirmed')
			)
		);

	if (triggerBookings.length > 0) {
		result.bookings_affected += triggerBookings.length;
	}

	result.total_affected = result.affected_slots.length + 1; // +1 for trigger

	return result;
}

/**
 * Shift a single slot (with optional cascade to subsequent slots)
 * Uses atomic transaction
 */
export async function shiftSlot(
	slotId: number,
	shiftMinutes: number,
	reason: string,
	cascade: boolean,
	adminId: number
): Promise<ShiftResult> {
	if (!nativeClient) {
		throw new Error('Native SQLite client not available');
	}

	const txn = nativeClient.transaction(() => {
		// 1. Get trigger slot
		const triggerSlot = nativeClient!.prepare(
			'SELECT * FROM booking_slots WHERE id = ?'
		).get(slotId) as any;

		if (!triggerSlot) {
			throw new Error('Slot not found');
		}

		const shiftedSlots: Array<{ id: number; old_start: string; new_start: string }> = [];

		// 2. Determine which slots to shift
		let slotsToShift: any[];
		if (cascade) {
			// All slots on same date with start_time >= trigger slot's start_time
			slotsToShift = nativeClient!.prepare(
				'SELECT * FROM booking_slots WHERE date = ? AND start_time >= ? ORDER BY start_time ASC'
			).all(triggerSlot.date, triggerSlot.start_time) as any[];
		} else {
			slotsToShift = [triggerSlot];
		}

		// 3. Shift each slot
		for (const slot of slotsToShift) {
			const oldStart = slot.start_time;
			const oldEnd = slot.end_time;
			const duration = timeToMinutes(oldEnd) - timeToMinutes(oldStart);
			const newStart = addMinutes(oldStart, shiftMinutes);
			const newEnd = addMinutes(newStart, duration);

			// Save original_start_time if not already shifted
			const originalStart = slot.original_start_time || oldStart;
			const totalShift = (slot.shift_minutes || 0) + shiftMinutes;

			nativeClient!.prepare(`
				UPDATE booking_slots
				SET start_time = ?, end_time = ?, original_start_time = ?,
					shift_minutes = ?, shift_reason = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).run(newStart, newEnd, originalStart, totalShift, reason, slot.id);

			// Update bookings that reference this slot
			nativeClient!.prepare(`
				UPDATE bookings SET start_time = ?, updated_at = CURRENT_TIMESTAMP
				WHERE slot_id = ? AND status IN ('pending', 'confirmed')
			`).run(newStart, slot.id);

			shiftedSlots.push({ id: slot.id, old_start: oldStart, new_start: newStart });

			// Log action for each affected booking
			const affectedBookings = nativeClient!.prepare(
				"SELECT id FROM bookings WHERE slot_id = ? AND status IN ('pending', 'confirmed')"
			).all(slot.id) as any[];

			for (const booking of affectedBookings) {
				nativeClient!.prepare(`
					INSERT INTO booking_action_log (booking_id, action, admin_id, details)
					VALUES (?, 'shifted', ?, ?)
				`).run(
					booking.id,
					adminId,
					JSON.stringify({
						old_start_time: oldStart,
						new_start_time: newStart,
						shift_minutes: shiftMinutes,
						reason
					})
				);
			}
		}

		// 4. Create shift log entry
		const logResult = nativeClient!.prepare(`
			INSERT INTO booking_shift_log (date, trigger_slot_id, shift_minutes, reason, cascade, affected_slots_count, notifications_sent, admin_id)
			VALUES (?, ?, ?, ?, ?, ?, 0, ?)
		`).run(
			triggerSlot.date,
			slotId,
			shiftMinutes,
			reason,
			cascade ? 1 : 0,
			shiftedSlots.length,
			adminId
		);

		return {
			shift_log_id: Number(logResult.lastInsertRowid),
			affected_slots_count: shiftedSlots.length,
			shifted_slots: shiftedSlots
		};
	});

	return txn.immediate();
}

/**
 * Bulk shift multiple specific slots
 */
export async function bulkShiftSlots(
	slotIds: number[],
	shiftMinutes: number,
	reason: string,
	adminId: number
): Promise<ShiftResult> {
	if (!nativeClient) {
		throw new Error('Native SQLite client not available');
	}

	if (slotIds.length === 0) {
		throw new Error('No slots specified');
	}

	const txn = nativeClient.transaction(() => {
		const shiftedSlots: Array<{ id: number; old_start: string; new_start: string }> = [];
		let triggerSlotDate = '';
		let triggerSlotId = slotIds[0];

		for (const slotId of slotIds) {
			const slot = nativeClient!.prepare(
				'SELECT * FROM booking_slots WHERE id = ?'
			).get(slotId) as any;

			if (!slot) continue;

			if (!triggerSlotDate) triggerSlotDate = slot.date;

			const oldStart = slot.start_time;
			const oldEnd = slot.end_time;
			const duration = timeToMinutes(oldEnd) - timeToMinutes(oldStart);
			const newStart = addMinutes(oldStart, shiftMinutes);
			const newEnd = addMinutes(newStart, duration);

			const originalStart = slot.original_start_time || oldStart;
			const totalShift = (slot.shift_minutes || 0) + shiftMinutes;

			nativeClient!.prepare(`
				UPDATE booking_slots
				SET start_time = ?, end_time = ?, original_start_time = ?,
					shift_minutes = ?, shift_reason = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).run(newStart, newEnd, originalStart, totalShift, reason, slotId);

			// Update bookings
			nativeClient!.prepare(`
				UPDATE bookings SET start_time = ?, updated_at = CURRENT_TIMESTAMP
				WHERE slot_id = ? AND status IN ('pending', 'confirmed')
			`).run(newStart, slotId);

			shiftedSlots.push({ id: slotId, old_start: oldStart, new_start: newStart });

			// Log action for affected bookings
			const affectedBookings = nativeClient!.prepare(
				"SELECT id FROM bookings WHERE slot_id = ? AND status IN ('pending', 'confirmed')"
			).all(slotId) as any[];

			for (const booking of affectedBookings) {
				nativeClient!.prepare(`
					INSERT INTO booking_action_log (booking_id, action, admin_id, details)
					VALUES (?, 'shifted', ?, ?)
				`).run(
					booking.id,
					adminId,
					JSON.stringify({
						old_start_time: oldStart,
						new_start_time: newStart,
						shift_minutes: shiftMinutes,
						reason
					})
				);
			}
		}

		// Create shift log
		const logResult = nativeClient!.prepare(`
			INSERT INTO booking_shift_log (date, trigger_slot_id, shift_minutes, reason, cascade, affected_slots_count, notifications_sent, admin_id)
			VALUES (?, ?, ?, ?, 0, ?, 0, ?)
		`).run(
			triggerSlotDate,
			triggerSlotId,
			shiftMinutes,
			reason,
			shiftedSlots.length,
			adminId
		);

		return {
			shift_log_id: Number(logResult.lastInsertRowid),
			affected_slots_count: shiftedSlots.length,
			shifted_slots: shiftedSlots
		};
	});

	return txn.immediate();
}

/**
 * Get shift history for a date
 */
export async function getShiftHistory(date: string) {
	return await db
		.select()
		.from(bookingShiftLog)
		.where(eq(bookingShiftLog.date, date))
		.orderBy(bookingShiftLog.created_at);
}
