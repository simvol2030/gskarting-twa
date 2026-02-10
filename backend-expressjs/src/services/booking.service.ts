/**
 * Booking Service
 * CRUD операции для бронирований + атомарная проверка мест + расчёт цен
 */

import { db, nativeClient } from '../db/client';
import { bookingConfig, bookingSlots, bookings, bookingActionLog } from '../db/schema';
import type { Booking, BookingConfig } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getBookingConfig } from './booking-slot.service';

interface CreateBookingData {
	slot_id: number;
	duration: number;
	participant_count: number;
	contact_name: string;
	contact_phone: string;
	contact_email?: string;
	notes?: string;
	telegram_user_id?: string;
	source: 'twa' | 'widget' | 'admin';
	created_by_admin_id?: number;
}

interface PriceCalculation {
	price_per_person: number;
	subtotal: number;
	group_discount_applied: boolean;
	discount_percent: number;
	discount_amount: number;
	total: number;
	currency: string;
}

/**
 * Расчёт стоимости бронирования
 */
export async function calculatePrice(
	participantType: 'adult' | 'child',
	duration: number,
	participantCount: number
): Promise<PriceCalculation> {
	const config = await getBookingConfig();

	const pricing = participantType === 'adult'
		? JSON.parse(config.pricing_adult) as Record<string, number>
		: JSON.parse(config.pricing_child) as Record<string, number>;

	const pricePerPerson = pricing[String(duration)];
	if (!pricePerPerson) {
		throw new Error(`Цена не найдена для длительности ${duration} мин`);
	}

	const subtotal = pricePerPerson * participantCount;
	let discountPercent = 0;
	let discountAmount = 0;
	let groupDiscountApplied = false;

	if (participantCount >= config.group_discount_min) {
		discountPercent = config.group_discount_percent;
		discountAmount = Math.floor(subtotal * discountPercent / 100);
		groupDiscountApplied = true;
	}

	const total = subtotal - discountAmount;

	return {
		price_per_person: pricePerPerson,
		subtotal,
		group_discount_applied: groupDiscountApplied,
		discount_percent: discountPercent,
		discount_amount: discountAmount,
		total,
		currency: config.currency
	};
}

/**
 * Обновить статус слота на основе заполненности
 */
function computeSlotStatus(bookedParticipants: number, maxParticipants: number): 'available' | 'limited' | 'booked' {
	if (bookedParticipants >= maxParticipants) {
		return 'booked';
	}
	const availablePercent = ((maxParticipants - bookedParticipants) / maxParticipants) * 100;
	if (availablePercent <= 50) {
		return 'limited';
	}
	return 'available';
}

/**
 * Создание бронирования с атомарной проверкой мест
 * Использует BEGIN IMMEDIATE для предотвращения race conditions в SQLite
 */
export async function createBooking(data: CreateBookingData): Promise<Booking> {
	const config = await getBookingConfig();

	// Валидация durations
	const allowedDurations: number[] = JSON.parse(config.slot_durations);
	if (!allowedDurations.includes(data.duration)) {
		throw new Error(`Недопустимая длительность. Допустимо: ${allowedDurations.join(', ')} мин`);
	}

	if (!nativeClient) {
		throw new Error('Native SQLite client not available');
	}

	// Атомарная транзакция через nativeClient (BEGIN IMMEDIATE для SQLite)
	const txn = nativeClient.transaction(() => {
		// 1. Получить текущий слот
		const slotRow = nativeClient!.prepare(
			'SELECT * FROM booking_slots WHERE id = ?'
		).get(data.slot_id) as any;

		if (!slotRow) {
			throw new Error('Слот не найден');
		}

		if (slotRow.is_blocked) {
			throw new Error('Слот заблокирован');
		}

		// 2. Проверить доступные места
		const availableSpots = slotRow.max_participants - slotRow.booked_participants;
		if (availableSpots < data.participant_count) {
			throw new Error(`Недостаточно мест. Доступно: ${availableSpots}`);
		}

		// 3. Обновить booked_participants
		const newBooked = slotRow.booked_participants + data.participant_count;
		const newStatus = computeSlotStatus(newBooked, slotRow.max_participants);

		nativeClient!.prepare(
			'UPDATE booking_slots SET booked_participants = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
		).run(newBooked, newStatus, data.slot_id);

		// 4. Расчёт стоимости
		const pricing = slotRow.participant_type === 'adult'
			? JSON.parse(config.pricing_adult) as Record<string, number>
			: JSON.parse(config.pricing_child) as Record<string, number>;

		const pricePerPerson = pricing[String(data.duration)] || 0;
		let subtotal = pricePerPerson * data.participant_count;
		let total = subtotal;

		if (data.participant_count >= config.group_discount_min) {
			const discount = Math.floor(subtotal * config.group_discount_percent / 100);
			total = subtotal - discount;
		}

		// 5. Определить статус
		const bookingStatus = config.auto_confirm ? 'confirmed' : 'pending';
		const confirmedAt = config.auto_confirm ? new Date().toISOString() : null;

		// 6. Вставить бронирование
		const result = nativeClient!.prepare(`
			INSERT INTO bookings (
				slot_id, date, start_time, duration, participant_type, participant_count,
				contact_name, contact_phone, contact_email, telegram_user_id,
				source, created_by_admin_id, status, total_price, notes,
				confirmed_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).run(
			data.slot_id,
			slotRow.date,
			slotRow.start_time,
			data.duration,
			slotRow.participant_type,
			data.participant_count,
			data.contact_name,
			data.contact_phone,
			data.contact_email || null,
			data.telegram_user_id || null,
			data.source,
			data.created_by_admin_id || null,
			bookingStatus,
			total,
			data.notes || null,
			confirmedAt
		);

		const bookingId = result.lastInsertRowid;

		// 7. Лог действия
		nativeClient!.prepare(`
			INSERT INTO booking_action_log (booking_id, action, admin_id, details)
			VALUES (?, 'created', ?, ?)
		`).run(
			bookingId,
			data.created_by_admin_id || null,
			JSON.stringify({ source: data.source, participant_count: data.participant_count })
		);

		// 8. Получить созданную бронь
		const booking = nativeClient!.prepare(
			'SELECT * FROM bookings WHERE id = ?'
		).get(bookingId) as any;

		return booking;
	});

	// Выполнить транзакцию (BEGIN IMMEDIATE автоматически)
	const rawBooking = txn.immediate();

	// Преобразовать в типизированный объект
	return rawBooking as Booking;
}

/**
 * Получить бронирование по ID
 */
export async function getBookingById(id: number): Promise<Booking | null> {
	const [booking] = await db
		.select()
		.from(bookings)
		.where(eq(bookings.id, id))
		.limit(1);

	return booking || null;
}

/**
 * Отмена бронирования
 */
export async function cancelBooking(id: number, reason?: string): Promise<Booking> {
	if (!nativeClient) {
		throw new Error('Native SQLite client not available');
	}

	const txn = nativeClient.transaction(() => {
		// 1. Получить бронирование
		const booking = nativeClient!.prepare(
			'SELECT * FROM bookings WHERE id = ?'
		).get(id) as any;

		if (!booking) {
			throw new Error('Бронирование не найдено');
		}

		if (booking.status === 'cancelled') {
			throw new Error('Бронирование уже отменено');
		}

		if (booking.status === 'completed') {
			throw new Error('Нельзя отменить завершённое бронирование');
		}

		// 2. Обновить статус бронирования
		nativeClient!.prepare(`
			UPDATE bookings
			SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`).run(reason || null, id);

		// 3. Уменьшить booked_participants в слоте
		const slot = nativeClient!.prepare(
			'SELECT * FROM booking_slots WHERE id = ?'
		).get(booking.slot_id) as any;

		if (slot) {
			const newBooked = Math.max(0, slot.booked_participants - booking.participant_count);
			const newStatus = computeSlotStatus(newBooked, slot.max_participants);

			nativeClient!.prepare(
				'UPDATE booking_slots SET booked_participants = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
			).run(newBooked, newStatus, booking.slot_id);
		}

		// 4. Лог действия
		nativeClient!.prepare(`
			INSERT INTO booking_action_log (booking_id, action, details)
			VALUES (?, 'cancelled', ?)
		`).run(id, JSON.stringify({ reason: reason || 'Client cancellation' }));

		// 5. Вернуть обновлённую бронь
		return nativeClient!.prepare(
			'SELECT * FROM bookings WHERE id = ?'
		).get(id) as any;
	});

	const rawBooking = txn.immediate();
	return rawBooking as Booking;
}
