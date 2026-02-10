/**
 * Admin Booking API client
 */

const API_BASE = '/api/admin/booking';

async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		}
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'API request failed');
	}

	return data;
}

// Types

export interface BookingSlot {
	id: number;
	date: string;
	start_time: string;
	end_time: string;
	participant_type: 'adult' | 'child';
	max_participants: number;
	booked_participants: number;
	status: 'available' | 'limited' | 'booked' | 'blocked';
	is_blocked: boolean | number;
	blocked_by_admin_id: number | null;
	blocked_reason: string | null;
	original_start_time: string | null;
	shift_minutes: number;
	shift_reason: string | null;
	bookings?: BookingItem[];
}

export interface BookingItem {
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
	created_by_admin_id: number | null;
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
	total_price: number;
	notes: string | null;
	admin_notes: string | null;
	created_at: string;
	updated_at: string;
	confirmed_at: string | null;
	cancelled_at: string | null;
	cancel_reason: string | null;
}

export interface DashboardStats {
	totalBookings: number;
	totalParticipants: number;
	totalRevenue: number;
	occupancyPercent: number;
}

export interface DashboardData {
	date: string;
	stats: DashboardStats;
	slots: BookingSlot[];
}

export interface BookingConfig {
	id: number;
	working_hours: string;
	slot_interval_minutes: number;
	buffer_minutes: number;
	slot_durations: string;
	default_duration: number;
	max_participants: number;
	pricing_adult: string;
	pricing_child: string;
	currency: string;
	group_discount_min: number;
	group_discount_percent: number;
	adult_min_age: number;
	child_min_age: number;
	child_max_age: number;
	booking_horizon_days: number;
	auto_confirm: boolean | number;
	reminder_enabled: boolean | number;
	reminder_hours_before: number;
	shift_notification_threshold: number;
}

export interface BookingScheduleOverride {
	id: number;
	date: string;
	is_closed: boolean | number;
	custom_open: string | null;
	custom_close: string | null;
	reason: string | null;
	created_by_admin_id: number | null;
	created_at: string;
}

export interface ShiftPreview {
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

export interface ShiftResult {
	shift_log_id: number;
	affected_slots_count: number;
	shifted_slots: Array<{ id: number; old_start: string; new_start: string }>;
}

export interface ShiftLogEntry {
	id: number;
	date: string;
	trigger_slot_id: number;
	shift_minutes: number;
	reason: string;
	cascade: boolean | number;
	affected_slots_count: number;
	notifications_sent: number;
	admin_id: number | null;
	created_at: string;
}

export interface ActionLogEntry {
	id: number;
	booking_id: number | null;
	action: 'created' | 'confirmed' | 'cancelled' | 'shifted' | 'edited';
	admin_id: number | null;
	details: string | null;
	created_at: string;
	booking?: {
		id: number;
		contact_name: string;
		date: string;
		start_time: string;
		status: string;
	} | null;
}

// API functions

export const bookingAdminAPI = {
	async getDashboard(date?: string): Promise<DashboardData> {
		const params = date ? `?date=${date}` : '';
		const result = await fetchAPI<{ success: boolean; data: DashboardData }>(`${API_BASE}/dashboard${params}`);
		return result.data;
	},

	async getBookings(filters?: {
		date?: string;
		status?: string;
		participant_type?: string;
		search?: string;
		page?: number;
		limit?: number;
	}): Promise<{ bookings: BookingItem[]; total: number; page: number; limit: number }> {
		const params = new URLSearchParams();
		if (filters?.date) params.set('date', filters.date);
		if (filters?.status) params.set('status', filters.status);
		if (filters?.participant_type) params.set('participant_type', filters.participant_type);
		if (filters?.search) params.set('search', filters.search);
		if (filters?.page) params.set('page', String(filters.page));
		if (filters?.limit) params.set('limit', String(filters.limit));

		const query = params.toString() ? `?${params.toString()}` : '';
		const result = await fetchAPI<{ success: boolean; data: { bookings: BookingItem[]; total: number; page: number; limit: number } }>(`${API_BASE}/bookings${query}`);
		return result.data;
	},

	async createBooking(data: {
		slot_id: number;
		duration: number;
		participant_count: number;
		contact_name: string;
		contact_phone: string;
		contact_email?: string;
		notes?: string;
	}): Promise<BookingItem> {
		const result = await fetchAPI<{ success: boolean; data: BookingItem }>(`${API_BASE}/bookings`, {
			method: 'POST',
			body: JSON.stringify(data)
		});
		return result.data;
	},

	async updateBooking(id: number, data: {
		status?: string;
		admin_notes?: string;
		contact_name?: string;
		contact_phone?: string;
		notes?: string;
		cancel_reason?: string;
	}): Promise<BookingItem> {
		const result = await fetchAPI<{ success: boolean; data: BookingItem }>(`${API_BASE}/bookings/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
		return result.data;
	},

	async getSlots(date: string): Promise<{ date: string; slots: BookingSlot[] }> {
		const result = await fetchAPI<{ success: boolean; data: { date: string; slots: BookingSlot[] } }>(`${API_BASE}/slots?date=${date}`);
		return result.data;
	},

	async blockSlot(slotId: number, reason?: string): Promise<BookingSlot> {
		const result = await fetchAPI<{ success: boolean; data: BookingSlot }>(`${API_BASE}/slots/${slotId}/block`, {
			method: 'POST',
			body: JSON.stringify({ reason })
		});
		return result.data;
	},

	async unblockSlot(slotId: number): Promise<BookingSlot> {
		const result = await fetchAPI<{ success: boolean; data: BookingSlot }>(`${API_BASE}/slots/${slotId}/unblock`, {
			method: 'POST'
		});
		return result.data;
	},

	async createScheduleOverride(data: {
		date: string;
		is_closed?: boolean;
		custom_open?: string;
		custom_close?: string;
		reason?: string;
	}): Promise<BookingScheduleOverride> {
		const result = await fetchAPI<{ success: boolean; data: BookingScheduleOverride }>(`${API_BASE}/schedule/override`, {
			method: 'POST',
			body: JSON.stringify(data)
		});
		return result.data;
	},

	async getConfig(): Promise<BookingConfig> {
		const result = await fetchAPI<{ success: boolean; data: BookingConfig }>(`${API_BASE}/config`);
		return result.data;
	},

	async updateConfig(data: Partial<BookingConfig>): Promise<BookingConfig> {
		const result = await fetchAPI<{ success: boolean; data: BookingConfig }>(`${API_BASE}/config`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
		return result.data;
	},

	// Session 3: Shift & Action Log

	async shiftSlot(slotId: number, data: {
		shift_minutes: number;
		reason: string;
		cascade?: boolean;
	}): Promise<ShiftResult> {
		const result = await fetchAPI<{ success: boolean; data: ShiftResult }>(`${API_BASE}/slots/${slotId}/shift`, {
			method: 'POST',
			body: JSON.stringify(data)
		});
		return result.data;
	},

	async bulkShiftSlots(data: {
		slot_ids: number[];
		shift_minutes: number;
		reason: string;
	}): Promise<ShiftResult> {
		const result = await fetchAPI<{ success: boolean; data: ShiftResult }>(`${API_BASE}/slots/bulk-shift`, {
			method: 'POST',
			body: JSON.stringify(data)
		});
		return result.data;
	},

	async previewShift(slotId: number, data: {
		shift_minutes: number;
		cascade?: boolean;
	}): Promise<ShiftPreview> {
		const result = await fetchAPI<{ success: boolean; data: ShiftPreview }>(`${API_BASE}/slots/${slotId}/shift-preview`, {
			method: 'POST',
			body: JSON.stringify(data)
		});
		return result.data;
	},

	async getShiftLog(date: string): Promise<ShiftLogEntry[]> {
		const result = await fetchAPI<{ success: boolean; data: ShiftLogEntry[] }>(`${API_BASE}/shift-log?date=${date}`);
		return result.data;
	},

	async getActionLog(filters?: {
		page?: number;
		limit?: number;
		action?: string;
		date?: string;
	}): Promise<{ logs: ActionLogEntry[]; total: number; page: number; limit: number }> {
		const params = new URLSearchParams();
		if (filters?.page) params.set('page', String(filters.page));
		if (filters?.limit) params.set('limit', String(filters.limit));
		if (filters?.action) params.set('action', filters.action);
		if (filters?.date) params.set('date', filters.date);

		const query = params.toString() ? `?${params.toString()}` : '';
		const result = await fetchAPI<{ success: boolean; data: { logs: ActionLogEntry[]; total: number; page: number; limit: number } }>(`${API_BASE}/action-log${query}`);
		return result.data;
	}
};
