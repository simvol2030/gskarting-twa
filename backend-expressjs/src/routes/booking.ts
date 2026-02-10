/**
 * Booking API Routes — Public endpoints для системы бронирования
 *
 * GET  /api/booking/config               — публичная конфигурация
 * GET  /api/booking/schedule/:date       — слоты на день
 * GET  /api/booking/schedule/range       — загруженность дат
 * POST /api/booking/bookings             — создание брони
 * GET  /api/booking/bookings/:id         — получение брони
 * POST /api/booking/bookings/:id/cancel  — отмена брони
 * POST /api/booking/calculate-price      — расчёт стоимости
 */

import { Router } from 'express';
import { getBookingConfig, getSlotsForDate, getScheduleRange } from '../services/booking-slot.service';
import { createBooking, getBookingById, cancelBooking, calculatePrice } from '../services/booking.service';
import { checkRateLimit, getClientIP } from '../utils/rate-limit';
import type { RateLimitConfig } from '../utils/rate-limit';

const router = Router();

// Rate limit config for booking creation
const BOOKING_RATE_LIMIT: RateLimitConfig = {
	maxAttempts: 5,
	windowMs: 60 * 1000,        // 1 минута
	blockDurationMs: 60 * 1000  // 1 минута блокировки
};

/**
 * GET /api/booking/config
 * Публичная конфигурация для виджета бронирования
 */
router.get('/config', async (req, res) => {
	try {
		const config = await getBookingConfig();

		res.json({
			success: true,
			data: {
				slot_durations: JSON.parse(config.slot_durations),
				default_duration: config.default_duration,
				max_participants: config.max_participants,
				pricing_adult: JSON.parse(config.pricing_adult),
				pricing_child: JSON.parse(config.pricing_child),
				currency: config.currency,
				group_discount_min: config.group_discount_min,
				group_discount_percent: config.group_discount_percent,
				adult_min_age: config.adult_min_age,
				child_min_age: config.child_min_age,
				child_max_age: config.child_max_age,
				booking_horizon_days: config.booking_horizon_days,
				working_hours: JSON.parse(config.working_hours)
			}
		});
	} catch (error: any) {
		console.error('Error fetching booking config:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/booking/schedule/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Загруженность дат для календаря
 * IMPORTANT: This route must be registered BEFORE /schedule/:date
 */
router.get('/schedule/range', async (req, res) => {
	try {
		const { from, to } = req.query;

		if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
			return res.status(400).json({ success: false, error: 'Параметры from и to обязательны (YYYY-MM-DD)' });
		}

		// Валидация формата дат
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(from) || !dateRegex.test(to)) {
			return res.status(400).json({ success: false, error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
		}

		const dates = await getScheduleRange(from, to);

		res.json({
			success: true,
			data: { dates }
		});
	} catch (error: any) {
		console.error('Error fetching schedule range:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/booking/schedule/:date
 * Слоты на конкретный день
 */
router.get('/schedule/:date', async (req, res) => {
	try {
		const { date } = req.params;

		// Валидация формата даты
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(date)) {
			return res.status(400).json({ success: false, error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
		}

		const slots = await getSlotsForDate(date);

		// Проверить, закрыт ли день
		const isClosed = slots.length === 0;

		// Добавить available_spots к каждому слоту
		const slotsWithAvailability = slots.map(slot => ({
			id: slot.id,
			start_time: slot.start_time,
			end_time: slot.end_time,
			participant_type: slot.participant_type,
			max_participants: slot.max_participants,
			booked_participants: slot.booked_participants,
			available_spots: slot.max_participants - slot.booked_participants,
			status: slot.status,
			shift_minutes: slot.shift_minutes
		}));

		res.json({
			success: true,
			data: {
				date,
				is_closed: isClosed,
				slots: slotsWithAvailability
			}
		});
	} catch (error: any) {
		console.error('Error fetching schedule:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/booking/bookings
 * Создание бронирования
 */
router.post('/bookings', async (req, res) => {
	try {
		// Rate limiting
		const clientIP = getClientIP(req);
		const rateLimitResult = checkRateLimit(`booking_create_${clientIP}`, BOOKING_RATE_LIMIT);

		if (!rateLimitResult.allowed) {
			return res.status(429).json({
				success: false,
				error: rateLimitResult.message,
				retryAfter: rateLimitResult.retryAfterMs
			});
		}

		const {
			slot_id,
			duration,
			participant_count,
			contact_name,
			contact_phone,
			contact_email,
			notes,
			telegram_user_id,
			telegram_init_data
		} = req.body;

		// Валидация обязательных полей
		if (!slot_id || typeof slot_id !== 'number') {
			return res.status(400).json({ success: false, error: 'slot_id обязателен' });
		}
		if (!duration || typeof duration !== 'number') {
			return res.status(400).json({ success: false, error: 'duration обязателен' });
		}
		if (!participant_count || typeof participant_count !== 'number' || participant_count < 1) {
			return res.status(400).json({ success: false, error: 'participant_count должен быть >= 1' });
		}
		if (!contact_name || typeof contact_name !== 'string' || contact_name.trim().length === 0) {
			return res.status(400).json({ success: false, error: 'contact_name обязателен' });
		}
		if (!contact_phone || typeof contact_phone !== 'string' || contact_phone.trim().length === 0) {
			return res.status(400).json({ success: false, error: 'contact_phone обязателен' });
		}

		// Определить source
		let source: 'twa' | 'widget' | 'admin' = 'widget';
		let validatedTelegramUserId: string | undefined;

		if (telegram_user_id || telegram_init_data) {
			// Если есть telegram_init_data — валидировать (optional, для production)
			// В dev mode принимаем telegram_user_id напрямую
			source = 'twa';
			validatedTelegramUserId = telegram_user_id ? String(telegram_user_id) : undefined;
		}

		const booking = await createBooking({
			slot_id,
			duration,
			participant_count,
			contact_name: contact_name.trim(),
			contact_phone: contact_phone.trim(),
			contact_email: contact_email?.trim() || undefined,
			notes: notes?.trim() || undefined,
			telegram_user_id: validatedTelegramUserId,
			source
		});

		res.status(201).json({
			success: true,
			data: booking
		});
	} catch (error: any) {
		console.error('Error creating booking:', error);

		// Специфические бизнес-ошибки
		if (error.message?.includes('Недостаточно мест') || error.message?.includes('Слот')) {
			return res.status(409).json({ success: false, error: error.message });
		}
		if (error.message?.includes('Недопустимая длительность')) {
			return res.status(400).json({ success: false, error: error.message });
		}

		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * GET /api/booking/bookings/:id
 * Получение бронирования по ID
 */
router.get('/bookings/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ success: false, error: 'Неверный ID' });
		}

		const booking = await getBookingById(id);

		if (!booking) {
			return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
		}

		res.json({
			success: true,
			data: booking
		});
	} catch (error: any) {
		console.error('Error fetching booking:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/booking/bookings/:id/cancel
 * Отмена бронирования
 */
router.post('/bookings/:id/cancel', async (req, res) => {
	try {
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ success: false, error: 'Неверный ID' });
		}

		const { reason } = req.body;

		const booking = await cancelBooking(id, reason);

		res.json({
			success: true,
			data: booking
		});
	} catch (error: any) {
		console.error('Error cancelling booking:', error);

		if (error.message?.includes('не найдено') || error.message?.includes('уже отменено') || error.message?.includes('Нельзя отменить')) {
			return res.status(400).json({ success: false, error: error.message });
		}

		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * POST /api/booking/calculate-price
 * Расчёт стоимости (без создания бронирования)
 */
router.post('/calculate-price', async (req, res) => {
	try {
		const { participant_type, duration, participant_count } = req.body;

		if (!participant_type || !['adult', 'child'].includes(participant_type)) {
			return res.status(400).json({ success: false, error: 'participant_type должен быть adult или child' });
		}
		if (!duration || typeof duration !== 'number') {
			return res.status(400).json({ success: false, error: 'duration обязателен' });
		}
		if (!participant_count || typeof participant_count !== 'number' || participant_count < 1) {
			return res.status(400).json({ success: false, error: 'participant_count должен быть >= 1' });
		}

		const price = await calculatePrice(participant_type, duration, participant_count);

		res.json({
			success: true,
			data: price
		});
	} catch (error: any) {
		console.error('Error calculating price:', error);

		if (error.message?.includes('Цена не найдена')) {
			return res.status(400).json({ success: false, error: error.message });
		}

		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
