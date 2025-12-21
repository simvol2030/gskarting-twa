/**
 * Orders API client
 * Handles order creation and retrieval
 */

const API_BASE = '/api/orders';

// Helper for fetch with credentials
async function fetchWithCredentials(url: string, options: RequestInit = {}): Promise<Response> {
	return fetch(url, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		}
	});
}

export interface ShopSettings {
	shopName: string;
	deliveryEnabled: boolean;
	pickupEnabled: boolean;
	deliveryCost: number;
	freeDeliveryFrom: number | null;
	minOrderAmount: number;
	stores: {
		id: number;
		name: string;
		address: string;
		phone: string;
		hours: string;
	}[];
}

export interface OrderData {
	customerName: string;
	customerPhone: string;
	customerEmail?: string;
	deliveryType: 'pickup' | 'delivery';
	deliveryCity?: string;
	deliveryAddress?: string;
	deliveryEntrance?: string;
	deliveryFloor?: string;
	deliveryApartment?: string;
	deliveryIntercom?: string;
	deliveryLocationId?: number;
	storeId?: number;
	notes?: string;
}

export interface OrderResponse {
	id: number;
	orderNumber: string;
	status: string;
	subtotal: number;
	deliveryCost: number;
	total: number;
	deliveryType: string;
	customerName: string;
	customerPhone: string;
}

export interface OrderDetails {
	id: number;
	orderNumber: string;
	status: string;
	createdAt: string;
	customer: {
		name: string;
		phone: string;
		email: string | null;
	};
	delivery: {
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
		} | null;
	};
	items: {
		productId: number;
		productName: string;
		productPrice: number;
		quantity: number;
		total: number;
	}[];
	totals: {
		subtotal: number;
		deliveryCost: number;
		discount: number;
		total: number;
	};
	notes: string | null;
	statusHistory: {
		status: string;
		changedAt: string;
		notes: string | null;
	}[];
}

export interface UserOrderHistoryItem {
	id: number;
	orderNumber: string;
	status: string;
	statusLabel: string;
	customerName: string;
	customerPhone: string;
	deliveryType: string;
	deliveryAddress: string | null;
	store: {
		name: string;
		address: string;
	} | null;
	totals: {
		subtotal: number;
		deliveryCost: number;
		discount: number;
		total: number;
	};
	notes: string | null;
	createdAt: string;
}

export const ordersAPI = {
	/**
	 * Get shop settings for checkout
	 */
	async getShopSettings(): Promise<ShopSettings> {
		const response = await fetchWithCredentials(`${API_BASE}/settings/shop`);
		if (!response.ok) {
			throw new Error('Failed to fetch shop settings');
		}
		const data = await response.json();
		return data.data;
	},

	/**
	 * Create order from cart
	 */
	async create(orderData: OrderData): Promise<OrderResponse> {
		const response = await fetchWithCredentials(API_BASE, {
			method: 'POST',
			body: JSON.stringify(orderData)
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Failed to create order');
		}

		return data.data;
	},

	/**
	 * Get order by number
	 */
	async getByNumber(orderNumber: string): Promise<OrderDetails> {
		const response = await fetchWithCredentials(`${API_BASE}/${orderNumber}`);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Order not found');
		}

		return data.data;
	},

	/**
	 * Get current user's order history
	 * Requires user to be logged in (telegram_user_id cookie)
	 */
	async getMyOrders(): Promise<UserOrderHistoryItem[]> {
		const response = await fetchWithCredentials(`${API_BASE}/my`);

		const data = await response.json();

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error('NOT_AUTHENTICATED');
			}
			throw new Error(data.error || 'Failed to fetch orders');
		}

		return data.data.orders;
	}
};
