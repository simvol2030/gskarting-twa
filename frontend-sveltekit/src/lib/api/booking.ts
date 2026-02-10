/**
 * Booking API Client
 * Public endpoints для системы бронирования
 */

import { API_BASE_URL } from '$lib/config';

// =====================================================
// TYPES
// =====================================================

export interface BookingConfig {
	slot_durations: number[];
	default_duration: number;
	max_participants: number;
	pricing_adult: Record<string, number>;
	pricing_child: Record<string, number>;
	currency: string;
	group_discount_min: number;
	group_discount_percent: number;
	adult_min_age: number;
	child_min_age: number;
	child_max_age: number;
	booking_horizon_days: number;
	working_hours: Record<string, { open: string; close: string }>;
}

export interface TimeSlot {
	id: number;
	start_time: string;
	end_time: string;
	participant_type: 'adult' | 'child';
	max_participants: number;
	booked_participants: number;
	available_spots: number;
	status: 'available' | 'limited' | 'booked' | 'blocked';
	shift_minutes: number;
}

export interface DaySchedule {
	date: string;
	is_closed: boolean;
	slots: TimeSlot[];
}

export interface DateStatus {
	status: 'available' | 'limited' | 'booked' | 'closed';
	total_spots: number;
	booked_spots: number;
}

export interface ScheduleRange {
	dates: Record<string, DateStatus>;
}

export interface Booking {
	id: number;
	slot_id: number;
	date: string;
	start_time: string;
	duration: number;
	participant_type: 'adult' | 'child';
	participant_count: number;
	contact_name: string;
	contact_phone: string;
	contact_email: string | null;
	telegram_user_id: string | null;
	source: 'twa' | 'widget' | 'admin';
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
	total_price: number;
	notes: string | null;
	created_at: string;
	confirmed_at: string | null;
}

export interface CreateBookingRequest {
	slot_id: number;
	duration: number;
	participant_count: number;
	contact_name: string;
	contact_phone: string;
	contact_email?: string;
	notes?: string;
	telegram_user_id?: string;
	telegram_init_data?: string;
}

export interface PriceCalculation {
	price_per_person: number;
	subtotal: number;
	group_discount_applied: boolean;
	discount_percent: number;
	discount_amount: number;
	total: number;
	currency: string;
}

// =====================================================
// API CLIENT
// =====================================================

async function fetchBookingAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		}
	});

	const data = await response.json();

	if (!response.ok || !data.success) {
		throw new Error(data.error || `Request failed: ${response.status}`);
	}

	return data.data;
}

/**
 * GET /api/booking/config
 */
export async function getConfig(): Promise<BookingConfig> {
	return fetchBookingAPI<BookingConfig>(`${API_BASE_URL}/booking/config`);
}

/**
 * GET /api/booking/schedule/:date
 */
export async function getSchedule(date: string): Promise<DaySchedule> {
	return fetchBookingAPI<DaySchedule>(`${API_BASE_URL}/booking/schedule/${date}`);
}

/**
 * GET /api/booking/schedule/range?from=&to=
 */
export async function getScheduleRange(from: string, to: string): Promise<ScheduleRange> {
	return fetchBookingAPI<ScheduleRange>(`${API_BASE_URL}/booking/schedule/range?from=${from}&to=${to}`);
}

/**
 * POST /api/booking/bookings
 */
export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
	return fetchBookingAPI<Booking>(`${API_BASE_URL}/booking/bookings`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/**
 * GET /api/booking/bookings/:id
 */
export async function getBooking(id: number): Promise<Booking> {
	return fetchBookingAPI<Booking>(`${API_BASE_URL}/booking/bookings/${id}`);
}

/**
 * POST /api/booking/bookings/:id/cancel
 */
export async function cancelBooking(id: number, reason?: string): Promise<Booking> {
	return fetchBookingAPI<Booking>(`${API_BASE_URL}/booking/bookings/${id}/cancel`, {
		method: 'POST',
		body: JSON.stringify({ reason })
	});
}

/**
 * POST /api/booking/calculate-price
 */
export async function calculatePrice(
	participantType: 'adult' | 'child',
	duration: number,
	participantCount: number
): Promise<PriceCalculation> {
	return fetchBookingAPI<PriceCalculation>(`${API_BASE_URL}/booking/calculate-price`, {
		method: 'POST',
		body: JSON.stringify({
			participant_type: participantType,
			duration,
			participant_count: participantCount
		})
	});
}
