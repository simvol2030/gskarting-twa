/**
 * Admin API: Booking Management
 * 10 endpoints for managing bookings, slots, schedule overrides, and config
 */

import { Router } from 'express';
import { db, nativeClient } from '../../db/client';
import {
	bookingConfig,
	bookingSlots,
	bookings,
	bookingScheduleOverrides,
	bookingActionLog
} from '../../db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { authenticateSession, requireRole } from '../../middleware/session-auth';
import { getBookingConfig, getSlotsForDate } from '../../services/booking-slot.service';
import { createBooking, calculatePrice } from '../../services/booking.service';
import { shiftSlot, bulkShiftSlots, previewShift, getShiftHistory } from '../../services/booking-shift.service';
import { bookingShiftLog } from '../../db/schema';

const router = Router();

// All admin booking routes require authentication
router.use(authenticateSession);

/**
 * GET /api/admin/booking/dashboard - Dashboard statistics + slots for a date
 */
router.get('/dashboard', async (req, res) => {
	try {
		const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

		// Validate date format
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
		}

		// Get slots for the date (generates if needed)
		const slots = await getSlotsForDate(date);

		// Get bookings for the date
		const dayBookings = await db
			.select()
			.from(bookings)
			.where(eq(bookings.date, date))
			.orderBy(bookings.start_time);

		// Calculate statistics
		let totalBookings = 0;
		let totalParticipants = 0;
		let totalRevenue = 0;

		for (const b of dayBookings) {
			if (b.status !== 'cancelled') {
				totalBookings++;
				totalParticipants += b.participant_count;
				totalRevenue += b.total_price;
			}
		}

		const totalMaxParticipants = slots.reduce((sum, s) => sum + s.max_participants, 0);
		const totalBookedParticipants = slots.reduce((sum, s) => sum + s.booked_participants, 0);
		const occupancyPercent = totalMaxParticipants > 0
			? Math.round((totalBookedParticipants / totalMaxParticipants) * 100)
			: 0;

		// Enrich slots with their bookings
		const slotsWithBookings = slots.map(slot => {
			const slotBookings = dayBookings.filter(b => b.slot_id === slot.id);
			return {
				...slot,
				bookings: slotBookings
			};
		});

		res.json({
			success: true,
			data: {
				date,
				stats: {
					totalBookings,
					totalParticipants,
					totalRevenue,
					occupancyPercent
				},
				slots: slotsWithBookings
			}
		});
	} catch (error: any) {
		console.error('Error fetching booking dashboard:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/admin/booking/bookings - List bookings with filters and pagination
 */
router.get('/bookings', async (req, res) => {
	try {
		const {
			date,
			status,
			participant_type,
			search,
			page = '1',
			limit = '20'
		} = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const offset = (pageNum - 1) * limitNum;

		// Build where conditions
		const conditions = [];

		if (date) {
			conditions.push(eq(bookings.date, date as string));
		}

		if (status && status !== 'all') {
			conditions.push(eq(bookings.status, status as 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'));
		}

		if (participant_type) {
			conditions.push(eq(bookings.participant_type, participant_type as 'adult' | 'child'));
		}

		let bookingsList;
		if (search) {
			const searchPattern = `%${search}%`;
			bookingsList = await db
				.select()
				.from(bookings)
				.where(
					and(
						...conditions,
						or(
							like(bookings.contact_name, searchPattern),
							like(bookings.contact_phone, searchPattern)
						)
					)
				)
				.orderBy(desc(bookings.created_at))
				.limit(limitNum)
				.offset(offset);
		} else {
			bookingsList = await db
				.select()
				.from(bookings)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(bookings.created_at))
				.limit(limitNum)
				.offset(offset);
		}

		// Total count
		let totalConditions;
		if (search) {
			const searchPattern = `%${search}%`;
			totalConditions = and(
				...conditions,
				or(
					like(bookings.contact_name, searchPattern),
					like(bookings.contact_phone, searchPattern)
				)
			);
		} else {
			totalConditions = conditions.length > 0 ? and(...conditions) : undefined;
		}

		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(bookings)
			.where(totalConditions);

		const total = Number(countResult?.count || 0);

		res.json({
			success: true,
			data: {
				bookings: bookingsList,
				total,
				page: pageNum,
				limit: limitNum
			}
		});
	} catch (error: any) {
		console.error('Error fetching bookings list:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/admin/booking/bookings - Create booking manually (source=admin)
 */
router.post('/bookings', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const {
			slot_id,
			duration,
			participant_count,
			contact_name,
			contact_phone,
			contact_email,
			notes
		} = req.body;

		// Validate required fields
		if (!slot_id || !duration || !participant_count || !contact_name || !contact_phone) {
			return res.status(400).json({
				success: false,
				error: 'Required fields: slot_id, duration, participant_count, contact_name, contact_phone'
			});
		}

		const adminId = (req as any).user?.id || 0;

		const booking = await createBooking({
			slot_id,
			duration,
			participant_count,
			contact_name,
			contact_phone,
			contact_email: contact_email || undefined,
			notes: notes || undefined,
			source: 'admin',
			created_by_admin_id: adminId
		});

		res.json({
			success: true,
			data: booking,
			message: 'Booking created successfully'
		});
	} catch (error: any) {
		console.error('Error creating booking:', error);

		if (error.message.includes('не найден') || error.message.includes('заблокирован') || error.message.includes('мест') || error.message.includes('длительность')) {
			return res.status(400).json({ success: false, error: error.message });
		}

		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PATCH /api/admin/booking/bookings/:id - Update booking status/details
 */
router.patch('/bookings/:id', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const bookingId = parseInt(req.params.id);
		const { status, admin_notes, contact_name, contact_phone, contact_email, notes, participant_count } = req.body;
		const adminId = (req as any).user?.id || 0;

		// Get current booking
		const [booking] = await db
			.select()
			.from(bookings)
			.where(eq(bookings.id, bookingId))
			.limit(1);

		if (!booking) {
			return res.status(404).json({ success: false, error: 'Booking not found' });
		}

		// Status transition validation
		if (status && status !== booking.status) {
			const allowedTransitions: Record<string, string[]> = {
				pending: ['confirmed', 'cancelled'],
				confirmed: ['cancelled', 'completed', 'no_show'],
				cancelled: [],
				completed: [],
				no_show: []
			};

			const allowed = allowedTransitions[booking.status] || [];
			if (!allowed.includes(status)) {
				return res.status(400).json({
					success: false,
					error: `Cannot transition from '${booking.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`
				});
			}
		}

		// Build update object
		const updateData: any = {
			updated_at: new Date().toISOString()
		};

		if (status) updateData.status = status;
		if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
		if (contact_name !== undefined) updateData.contact_name = contact_name;
		if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
		if (contact_email !== undefined) updateData.contact_email = contact_email;
		if (notes !== undefined) updateData.notes = notes;

		// Handle status-specific fields
		if (status === 'confirmed') {
			updateData.confirmed_at = new Date().toISOString();
		} else if (status === 'cancelled') {
			updateData.cancelled_at = new Date().toISOString();
			if (req.body.cancel_reason) {
				updateData.cancel_reason = req.body.cancel_reason;
			}
		}

		// If cancelling, restore slot capacity
		if (status === 'cancelled' && booking.status !== 'cancelled') {
			if (nativeClient) {
				const slot = nativeClient.prepare(
					'SELECT * FROM booking_slots WHERE id = ?'
				).get(booking.slot_id) as any;

				if (slot) {
					const newBooked = Math.max(0, slot.booked_participants - booking.participant_count);
					let newStatus: string;
					if (newBooked >= slot.max_participants) {
						newStatus = 'booked';
					} else if (((slot.max_participants - newBooked) / slot.max_participants) * 100 <= 50) {
						newStatus = 'limited';
					} else {
						newStatus = slot.is_blocked ? 'blocked' : 'available';
					}

					nativeClient.prepare(
						'UPDATE booking_slots SET booked_participants = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
					).run(newBooked, newStatus, booking.slot_id);
				}
			}
		}

		// Update booking
		await db
			.update(bookings)
			.set(updateData)
			.where(eq(bookings.id, bookingId));

		// Log action
		let action = 'edited';
		if (status === 'confirmed') action = 'confirmed';
		else if (status === 'cancelled') action = 'cancelled';

		await db.insert(bookingActionLog).values({
			booking_id: bookingId,
			action: action as 'created' | 'confirmed' | 'cancelled' | 'shifted' | 'edited',
			admin_id: adminId,
			details: JSON.stringify({
				changes: req.body,
				previous_status: booking.status
			})
		});

		// Get updated booking
		const [updated] = await db
			.select()
			.from(bookings)
			.where(eq(bookings.id, bookingId))
			.limit(1);

		res.json({
			success: true,
			data: updated,
			message: 'Booking updated successfully'
		});
	} catch (error: any) {
		console.error('Error updating booking:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/admin/booking/slots - Get slots for a date (admin view with details)
 */
router.get('/slots', async (req, res) => {
	try {
		const date = req.query.date as string;

		if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return res.status(400).json({ success: false, error: 'Invalid or missing date parameter. Use YYYY-MM-DD' });
		}

		// Get slots for the date
		const slots = await getSlotsForDate(date);

		// Get bookings for each slot
		const slotIds = slots.map(s => s.id);
		let slotBookings: any[] = [];
		if (slotIds.length > 0) {
			slotBookings = await db
				.select()
				.from(bookings)
				.where(eq(bookings.date, date));
		}

		// Enrich slots with bookings
		const enrichedSlots = slots.map(slot => ({
			...slot,
			bookings: slotBookings.filter(b => b.slot_id === slot.id)
		}));

		res.json({
			success: true,
			data: {
				date,
				slots: enrichedSlots
			}
		});
	} catch (error: any) {
		console.error('Error fetching admin slots:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/admin/booking/slots/:id/block - Block a slot
 */
router.post('/slots/:id/block', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const slotId = parseInt(req.params.id);
		const { reason } = req.body;
		const adminId = (req as any).user?.id || 0;

		// Get current slot
		const [slot] = await db
			.select()
			.from(bookingSlots)
			.where(eq(bookingSlots.id, slotId))
			.limit(1);

		if (!slot) {
			return res.status(404).json({ success: false, error: 'Slot not found' });
		}

		if (slot.is_blocked) {
			return res.status(400).json({ success: false, error: 'Slot is already blocked' });
		}

		// Block the slot
		await db
			.update(bookingSlots)
			.set({
				is_blocked: true,
				blocked_by_admin_id: adminId,
				blocked_reason: reason || null,
				status: 'blocked',
				updated_at: new Date().toISOString()
			})
			.where(eq(bookingSlots.id, slotId));

		// Log action
		await db.insert(bookingActionLog).values({
			booking_id: null,
			action: 'edited',
			admin_id: adminId,
			details: JSON.stringify({
				type: 'slot_blocked',
				slot_id: slotId,
				reason: reason || null
			})
		});

		const [updated] = await db
			.select()
			.from(bookingSlots)
			.where(eq(bookingSlots.id, slotId))
			.limit(1);

		res.json({
			success: true,
			data: updated,
			message: 'Slot blocked successfully'
		});
	} catch (error: any) {
		console.error('Error blocking slot:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/admin/booking/slots/:id/unblock - Unblock a slot
 */
router.post('/slots/:id/unblock', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const slotId = parseInt(req.params.id);
		const adminId = (req as any).user?.id || 0;

		// Get current slot
		const [slot] = await db
			.select()
			.from(bookingSlots)
			.where(eq(bookingSlots.id, slotId))
			.limit(1);

		if (!slot) {
			return res.status(404).json({ success: false, error: 'Slot not found' });
		}

		if (!slot.is_blocked) {
			return res.status(400).json({ success: false, error: 'Slot is not blocked' });
		}

		// Recalculate status based on occupancy
		let newStatus: 'available' | 'limited' | 'booked';
		if (slot.booked_participants >= slot.max_participants) {
			newStatus = 'booked';
		} else if (((slot.max_participants - slot.booked_participants) / slot.max_participants) * 100 <= 50) {
			newStatus = 'limited';
		} else {
			newStatus = 'available';
		}

		// Unblock the slot
		await db
			.update(bookingSlots)
			.set({
				is_blocked: false,
				blocked_by_admin_id: null,
				blocked_reason: null,
				status: newStatus,
				updated_at: new Date().toISOString()
			})
			.where(eq(bookingSlots.id, slotId));

		// Log action
		await db.insert(bookingActionLog).values({
			booking_id: null,
			action: 'edited',
			admin_id: adminId,
			details: JSON.stringify({
				type: 'slot_unblocked',
				slot_id: slotId
			})
		});

		const [updated] = await db
			.select()
			.from(bookingSlots)
			.where(eq(bookingSlots.id, slotId))
			.limit(1);

		res.json({
			success: true,
			data: updated,
			message: 'Slot unblocked successfully'
		});
	} catch (error: any) {
		console.error('Error unblocking slot:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/admin/booking/schedule/override - Create schedule override for a date
 */
router.post('/schedule/override', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const { date, is_closed, custom_open, custom_close, reason } = req.body;
		const adminId = (req as any).user?.id || 0;

		if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return res.status(400).json({ success: false, error: 'Invalid or missing date. Use YYYY-MM-DD' });
		}

		// Check if override already exists for this date
		const [existing] = await db
			.select()
			.from(bookingScheduleOverrides)
			.where(eq(bookingScheduleOverrides.date, date))
			.limit(1);

		if (existing) {
			// Update existing override
			await db
				.update(bookingScheduleOverrides)
				.set({
					is_closed: is_closed ?? false,
					custom_open: custom_open || null,
					custom_close: custom_close || null,
					reason: reason || null,
					created_by_admin_id: adminId
				})
				.where(eq(bookingScheduleOverrides.id, existing.id));

			const [updated] = await db
				.select()
				.from(bookingScheduleOverrides)
				.where(eq(bookingScheduleOverrides.id, existing.id))
				.limit(1);

			// If closing the day, delete existing generated slots (only if no bookings)
			if (is_closed) {
				const existingBookings = await db
					.select({ count: sql<number>`count(*)` })
					.from(bookings)
					.where(and(eq(bookings.date, date), sql`${bookings.status} NOT IN ('cancelled')`));

				if (Number(existingBookings[0]?.count || 0) === 0) {
					await db.delete(bookingSlots).where(eq(bookingSlots.date, date));
				}
			}

			return res.json({
				success: true,
				data: updated,
				message: 'Schedule override updated'
			});
		}

		// Create new override
		const [created] = await db
			.insert(bookingScheduleOverrides)
			.values({
				date,
				is_closed: is_closed ?? false,
				custom_open: custom_open || null,
				custom_close: custom_close || null,
				reason: reason || null,
				created_by_admin_id: adminId
			})
			.returning();

		// If closing the day, delete existing generated slots (only if no bookings)
		if (is_closed) {
			const existingBookings = await db
				.select({ count: sql<number>`count(*)` })
				.from(bookings)
				.where(and(eq(bookings.date, date), sql`${bookings.status} NOT IN ('cancelled')`));

			if (Number(existingBookings[0]?.count || 0) === 0) {
				await db.delete(bookingSlots).where(eq(bookingSlots.date, date));
			}
		}

		// Log action
		await db.insert(bookingActionLog).values({
			booking_id: null,
			action: 'edited',
			admin_id: adminId,
			details: JSON.stringify({
				type: 'schedule_override',
				date,
				is_closed,
				custom_open,
				custom_close,
				reason
			})
		});

		res.json({
			success: true,
			data: created,
			message: 'Schedule override created'
		});
	} catch (error: any) {
		console.error('Error creating schedule override:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/admin/booking/config - Get booking configuration
 */
router.get('/config', async (req, res) => {
	try {
		const config = await getBookingConfig();

		res.json({
			success: true,
			data: config
		});
	} catch (error: any) {
		console.error('Error fetching booking config:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PATCH /api/admin/booking/config - Update booking configuration (partial)
 */
router.patch('/config', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const adminId = (req as any).user?.id || 0;
		const updateData: any = {
			updated_at: new Date().toISOString()
		};

		// Allowed fields for update
		const allowedFields = [
			'working_hours', 'slot_interval_minutes', 'buffer_minutes',
			'slot_durations', 'default_duration', 'max_participants',
			'pricing_adult', 'pricing_child', 'currency',
			'group_discount_min', 'group_discount_percent',
			'adult_min_age', 'child_min_age', 'child_max_age',
			'booking_horizon_days', 'auto_confirm',
			'reminder_enabled', 'reminder_hours_before',
			'shift_notification_threshold'
		];

		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				// JSON fields need to be stringified
				if (['working_hours', 'slot_durations', 'pricing_adult', 'pricing_child'].includes(field)) {
					updateData[field] = typeof req.body[field] === 'string'
						? req.body[field]
						: JSON.stringify(req.body[field]);
				} else {
					updateData[field] = req.body[field];
				}
			}
		}

		// Update config (singleton, id=1)
		await db
			.update(bookingConfig)
			.set(updateData)
			.where(eq(bookingConfig.id, 1));

		// Log action
		await db.insert(bookingActionLog).values({
			booking_id: null,
			action: 'edited',
			admin_id: adminId,
			details: JSON.stringify({
				type: 'config_updated',
				changes: req.body
			})
		});

		// Return updated config
		const config = await getBookingConfig();

		res.json({
			success: true,
			data: config,
			message: 'Booking configuration updated'
		});
	} catch (error: any) {
		console.error('Error updating booking config:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

// ============================================================
// Session 3: Shift & Action Log endpoints
// ============================================================

/**
 * POST /slots/:id/shift — Shift a single slot (with optional cascade)
 */
router.post('/slots/:id/shift', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const slotId = parseInt(req.params.id);
		const { shift_minutes, reason, cascade } = req.body;
		const adminId = (req as any).user?.id;

		if (!shift_minutes || typeof shift_minutes !== 'number') {
			return res.status(400).json({ success: false, error: 'shift_minutes is required (number)' });
		}
		if (!reason || typeof reason !== 'string') {
			return res.status(400).json({ success: false, error: 'reason is required' });
		}

		const result = await shiftSlot(slotId, shift_minutes, reason, !!cascade, adminId);

		res.json({ success: true, data: result });
	} catch (error: any) {
		console.error('Error shifting slot:', error);
		res.status(error.message === 'Slot not found' ? 404 : 500).json({
			success: false, error: error.message || 'Internal server error'
		});
	}
});

/**
 * POST /slots/bulk-shift — Shift multiple specific slots
 */
router.post('/slots/bulk-shift', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const { slot_ids, shift_minutes, reason } = req.body;
		const adminId = (req as any).user?.id;

		if (!Array.isArray(slot_ids) || slot_ids.length === 0) {
			return res.status(400).json({ success: false, error: 'slot_ids is required (non-empty array)' });
		}
		if (!shift_minutes || typeof shift_minutes !== 'number') {
			return res.status(400).json({ success: false, error: 'shift_minutes is required (number)' });
		}
		if (!reason || typeof reason !== 'string') {
			return res.status(400).json({ success: false, error: 'reason is required' });
		}

		const result = await bulkShiftSlots(slot_ids, shift_minutes, reason, adminId);

		res.json({ success: true, data: result });
	} catch (error: any) {
		console.error('Error bulk shifting slots:', error);
		res.status(500).json({ success: false, error: error.message || 'Internal server error' });
	}
});

/**
 * POST /slots/:id/shift-preview — Preview shift impact (no DB changes)
 */
router.post('/slots/:id/shift-preview', authenticateSession, async (req, res) => {
	try {
		const slotId = parseInt(req.params.id);
		const { shift_minutes, cascade } = req.body;

		if (!shift_minutes || typeof shift_minutes !== 'number') {
			return res.status(400).json({ success: false, error: 'shift_minutes is required (number)' });
		}

		const preview = await previewShift(slotId, shift_minutes, !!cascade);

		res.json({ success: true, data: preview });
	} catch (error: any) {
		console.error('Error previewing shift:', error);
		res.status(error.message === 'Slot not found' ? 404 : 500).json({
			success: false, error: error.message || 'Internal server error'
		});
	}
});

/**
 * GET /shift-log?date=YYYY-MM-DD — Get shift history for a date
 */
router.get('/shift-log', authenticateSession, async (req, res) => {
	try {
		const { date } = req.query;
		if (!date || typeof date !== 'string') {
			return res.status(400).json({ success: false, error: 'date query parameter is required' });
		}

		const history = await getShiftHistory(date);

		res.json({ success: true, data: history });
	} catch (error: any) {
		console.error('Error getting shift log:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /action-log?page=1&limit=50&action=shifted&date=YYYY-MM-DD — Action log with filters
 */
router.get('/action-log', authenticateSession, async (req, res) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
		const offset = (page - 1) * limit;
		const { action, date } = req.query;

		// Build conditions
		const conditions: any[] = [];
		if (action && typeof action === 'string') {
			conditions.push(eq(bookingActionLog.action, action as any));
		}

		// Get total count
		let countQuery;
		if (conditions.length > 0) {
			countQuery = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(bookingActionLog)
				.where(and(...conditions));
		} else {
			countQuery = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(bookingActionLog);
		}
		const total = countQuery[0]?.count || 0;

		// Get logs
		let logsQuery;
		if (conditions.length > 0) {
			logsQuery = await db
				.select()
				.from(bookingActionLog)
				.where(and(...conditions))
				.orderBy(desc(bookingActionLog.created_at))
				.limit(limit)
				.offset(offset);
		} else {
			logsQuery = await db
				.select()
				.from(bookingActionLog)
				.orderBy(desc(bookingActionLog.created_at))
				.limit(limit)
				.offset(offset);
		}

		// Enrich with booking info if available
		const enrichedLogs = [];
		for (const log of logsQuery) {
			let booking = null;
			if (log.booking_id) {
				const [b] = await db.select().from(bookings).where(eq(bookings.id, log.booking_id)).limit(1);
				if (b) {
					booking = {
						id: b.id,
						contact_name: b.contact_name,
						date: b.date,
						start_time: b.start_time,
						status: b.status
					};
				}
			}
			enrichedLogs.push({ ...log, booking });
		}

		res.json({
			success: true,
			data: {
				logs: enrichedLogs,
				total,
				page,
				limit
			}
		});
	} catch (error: any) {
		console.error('Error getting action log:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
