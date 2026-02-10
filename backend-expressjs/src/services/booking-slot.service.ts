/**
 * Booking Slot Generation Service
 * Генерирует слоты для бронирования на конкретную дату
 * Слоты создаются лениво — при первом запросе на дату
 */

import { db, nativeClient } from '../db/client';
import { bookingConfig, bookingSlots, bookingScheduleOverrides } from '../db/schema';
import type { BookingSlot, BookingConfig } from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface WorkingHours {
	open: string; // HH:MM
	close: string; // HH:MM
}

interface WorkingHoursMap {
	[dayOfWeek: string]: WorkingHours;
}

/**
 * Получить конфигурацию бронирования (singleton)
 */
export async function getBookingConfig(): Promise<BookingConfig> {
	const [config] = await db.select().from(bookingConfig).where(eq(bookingConfig.id, 1)).limit(1);

	if (!config) {
		throw new Error('Booking config not found. Run seed first.');
	}

	return config;
}

/**
 * Добавить минуты к строке времени HH:MM
 */
function addMinutes(time: string, minutes: number): string {
	const [h, m] = time.split(':').map(Number);
	const totalMinutes = h * 60 + m + minutes;
	const newH = Math.floor(totalMinutes / 60);
	const newM = totalMinutes % 60;
	return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Сравнить два времени HH:MM. Возвращает true если a < b
 */
function timeBefore(a: string, b: string): boolean {
	const [ah, am] = a.split(':').map(Number);
	const [bh, bm] = b.split(':').map(Number);
	return ah * 60 + am < bh * 60 + bm;
}

/**
 * Сравнить два времени HH:MM. Возвращает true если a <= b
 */
function timeBeforeOrEqual(a: string, b: string): boolean {
	const [ah, am] = a.split(':').map(Number);
	const [bh, bm] = b.split(':').map(Number);
	return ah * 60 + am <= bh * 60 + bm;
}

/**
 * Проверить, что дата в пределах горизонта бронирования
 */
function isWithinHorizon(dateStr: string, horizonDays: number): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const target = new Date(dateStr + 'T00:00:00');
	const maxDate = new Date(today);
	maxDate.setDate(maxDate.getDate() + horizonDays);

	return target >= today && target <= maxDate;
}

/**
 * Получить день недели (0=Вс, 1=Пн, ..., 6=Сб) для даты YYYY-MM-DD
 */
function getDayOfWeek(dateStr: string): number {
	return new Date(dateStr + 'T12:00:00').getDay();
}

/**
 * Генерация слотов на конкретную дату
 * Если слоты уже существуют — возвращает их
 */
export async function getSlotsForDate(dateStr: string): Promise<BookingSlot[]> {
	const config = await getBookingConfig();

	// Проверка горизонта
	if (!isWithinHorizon(dateStr, config.booking_horizon_days)) {
		return [];
	}

	// Проверить: слоты на эту дату уже есть?
	const existingSlots = await db
		.select()
		.from(bookingSlots)
		.where(eq(bookingSlots.date, dateStr))
		.orderBy(bookingSlots.start_time);

	if (existingSlots.length > 0) {
		return existingSlots;
	}

	// Генерировать новые слоты
	return await generateSlotsForDate(dateStr, config);
}

/**
 * Генерация слотов для даты (внутренняя функция)
 */
async function generateSlotsForDate(dateStr: string, config: BookingConfig): Promise<BookingSlot[]> {
	// Проверить schedule_overrides
	const [override] = await db
		.select()
		.from(bookingScheduleOverrides)
		.where(eq(bookingScheduleOverrides.date, dateStr))
		.limit(1);

	// Если день закрыт — пустой массив
	if (override?.is_closed) {
		return [];
	}

	// Определить рабочие часы
	const dayOfWeek = getDayOfWeek(dateStr);
	const workingHours: WorkingHoursMap = JSON.parse(config.working_hours);
	const dayHours = workingHours[String(dayOfWeek)];

	if (!dayHours) {
		return []; // Нет рабочих часов для этого дня
	}

	const openTime = override?.custom_open || dayHours.open;
	const closeTime = override?.custom_close || dayHours.close;

	// Генерация слотов
	const slotsToInsert: Array<{
		date: string;
		start_time: string;
		end_time: string;
		participant_type: 'adult' | 'child';
		max_participants: number;
		status: 'available' | 'limited' | 'booked' | 'blocked';
	}> = [];

	let currentTime = openTime;

	while (timeBefore(currentTime, closeTime)) {
		const endTime = addMinutes(currentTime, config.default_duration);

		// Слот не должен выходить за закрытие
		if (!timeBeforeOrEqual(endTime, closeTime)) {
			break;
		}

		slotsToInsert.push({
			date: dateStr,
			start_time: currentTime,
			end_time: endTime,
			participant_type: 'adult',
			max_participants: config.max_participants,
			status: 'available'
		});

		currentTime = addMinutes(currentTime, config.slot_interval_minutes);
	}

	if (slotsToInsert.length === 0) {
		return [];
	}

	// Batch insert
	const inserted = await db.insert(bookingSlots).values(slotsToInsert).returning();

	return inserted;
}

/**
 * Получить загруженность дат в диапазоне (для календаря)
 */
export async function getScheduleRange(
	fromDate: string,
	toDate: string
): Promise<Record<string, { status: string; total_spots: number; booked_spots: number }>> {
	const config = await getBookingConfig();
	const result: Record<string, { status: string; total_spots: number; booked_spots: number }> = {};

	// Перебираем даты в диапазоне
	const current = new Date(fromDate + 'T00:00:00');
	const end = new Date(toDate + 'T00:00:00');

	while (current <= end) {
		const dateStr = current.toISOString().split('T')[0];

		if (!isWithinHorizon(dateStr, config.booking_horizon_days)) {
			current.setDate(current.getDate() + 1);
			continue;
		}

		// Проверить override
		const [override] = await db
			.select()
			.from(bookingScheduleOverrides)
			.where(eq(bookingScheduleOverrides.date, dateStr))
			.limit(1);

		if (override?.is_closed) {
			result[dateStr] = { status: 'closed', total_spots: 0, booked_spots: 0 };
			current.setDate(current.getDate() + 1);
			continue;
		}

		// Проверить рабочий день
		const dayOfWeek = getDayOfWeek(dateStr);
		const workingHours: WorkingHoursMap = JSON.parse(config.working_hours);
		const dayHours = workingHours[String(dayOfWeek)];

		if (!dayHours) {
			result[dateStr] = { status: 'closed', total_spots: 0, booked_spots: 0 };
			current.setDate(current.getDate() + 1);
			continue;
		}

		// Получить или сгенерировать слоты
		const slots = await getSlotsForDate(dateStr);

		if (slots.length === 0) {
			result[dateStr] = { status: 'closed', total_spots: 0, booked_spots: 0 };
		} else {
			const totalSpots = slots.reduce((sum, s) => sum + s.max_participants, 0);
			const bookedSpots = slots.reduce((sum, s) => sum + s.booked_participants, 0);
			const availablePercent = totalSpots > 0 ? ((totalSpots - bookedSpots) / totalSpots) * 100 : 0;

			let status = 'available';
			if (bookedSpots >= totalSpots) {
				status = 'booked';
			} else if (availablePercent <= 50) {
				status = 'limited';
			}

			result[dateStr] = { status, total_spots: totalSpots, booked_spots: bookedSpots };
		}

		current.setDate(current.getDate() + 1);
	}

	return result;
}
