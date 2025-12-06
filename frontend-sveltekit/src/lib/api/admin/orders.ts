/**
 * Admin Orders API client
 */

const API_BASE = '/api/admin/orders';

// Fetch helper with credentials
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

export interface OrderCustomer {
	name: string;
	phone: string;
	email: string | null;
}

export interface OrderTotals {
	subtotal: number;
	deliveryCost: number;
	discount: number;
	total: number;
}

export interface OrderListItem {
	id: number;
	orderNumber: string;
	status: string;
	statusLabel: string;
	customer: OrderCustomer;
	deliveryType: string;
	deliveryAddress: string | null;
	storeId: number | null;
	totals: OrderTotals;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface OrderItem {
	id: number;
	productId: number | null;
	productName: string;
	productPrice: number;
	quantity: number;
	total: number;
}

export interface OrderDelivery {
	type: string;
	address: string | null;
	entrance: string | null;
	floor: string | null;
	apartment: string | null;
	intercom: string | null;
	store: {
		id: number;
		name: string;
		address: string;
		phone: string;
	} | null;
}

export interface OrderLoyaltyUser {
	id: number;
	telegramUserId: number;
	firstName: string;
	lastName: string | null;
	cardNumber: string | null;
	balance: number;
}

export interface OrderStatusHistoryItem {
	id: number;
	oldStatus: string | null;
	newStatus: string;
	newStatusLabel: string;
	changedBy: string | null;
	notes: string | null;
	createdAt: string;
}

export interface OrderDetails {
	id: number;
	orderNumber: string;
	status: string;
	statusLabel: string;
	customer: OrderCustomer;
	loyaltyUser: OrderLoyaltyUser | null;
	delivery: OrderDelivery;
	items: OrderItem[];
	totals: OrderTotals;
	notes: string | null;
	statusHistory: OrderStatusHistoryItem[];
	createdAt: string;
	updatedAt: string;
}

export interface OrdersListResponse {
	success: boolean;
	data: {
		orders: OrderListItem[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
		statusCounts: Record<string, number>;
	};
}

export interface OrderFilters {
	status?: string;
	search?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
}

export const ordersAdminAPI = {
	/**
	 * Get orders list with filters
	 */
	async getOrders(filters: OrderFilters = {}): Promise<OrdersListResponse['data']> {
		const params = new URLSearchParams();
		if (filters.status) params.set('status', filters.status);
		if (filters.search) params.set('search', filters.search);
		if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
		if (filters.dateTo) params.set('dateTo', filters.dateTo);
		if (filters.page) params.set('page', filters.page.toString());
		if (filters.limit) params.set('limit', filters.limit.toString());

		const response = await fetchAPI<OrdersListResponse>(
			`${API_BASE}?${params.toString()}`
		);
		return response.data;
	},

	/**
	 * Get order details
	 */
	async getOrder(id: number): Promise<OrderDetails> {
		const response = await fetchAPI<{ success: boolean; data: OrderDetails }>(
			`${API_BASE}/${id}`
		);
		return response.data;
	},

	/**
	 * Update order status
	 */
	async updateStatus(
		id: number,
		status: string,
		notes?: string,
		changedBy?: string
	): Promise<void> {
		await fetchAPI(`${API_BASE}/${id}/status`, {
			method: 'PUT',
			body: JSON.stringify({ status, notes, changedBy })
		});
	},

	/**
	 * Update order details
	 */
	async updateOrder(
		id: number,
		data: Partial<{
			customerName: string;
			customerPhone: string;
			customerEmail: string;
			deliveryAddress: string;
			deliveryEntrance: string;
			deliveryFloor: string;
			deliveryApartment: string;
			deliveryIntercom: string;
			notes: string;
		}>
	): Promise<void> {
		await fetchAPI(`${API_BASE}/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	},

	/**
	 * Delete order
	 */
	async deleteOrder(id: number): Promise<void> {
		await fetchAPI(`${API_BASE}/${id}`, {
			method: 'DELETE'
		});
	}
};
