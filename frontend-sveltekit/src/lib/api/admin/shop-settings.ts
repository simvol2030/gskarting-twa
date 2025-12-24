/**
 * Admin Shop Settings API client
 */

const API_BASE = '/api/admin/shop-settings';

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

export interface ShopSettings {
	shopName: string;
	shopType: 'restaurant' | 'pet_shop' | 'clothing' | 'general';
	currency: string;
	deliveryEnabled: boolean;
	pickupEnabled: boolean;
	deliveryCost: number;
	freeDeliveryFrom: number | null;
	minOrderAmount: number;
	telegramBotToken: string | null;
	telegramBotUsername: string | null;
	telegramNotificationsEnabled: boolean;
	telegramGroupId: string | null;
	emailNotificationsEnabled: boolean;
	emailRecipients: string[];
	customerTelegramNotifications: boolean;
	smtpHost: string | null;
	smtpPort: number | null;
	smtpUser: string | null;
	smtpPassword: string | null;
	smtpFrom: string | null;
	updatedAt: string | null;
}

export type ShopSettingsUpdate = Partial<Omit<ShopSettings, 'updatedAt'>>;

export const shopSettingsAPI = {
	/**
	 * Get shop settings
	 */
	async get(): Promise<ShopSettings> {
		const response = await fetchAPI<{ success: boolean; data: ShopSettings }>(API_BASE);
		return response.data;
	},

	/**
	 * Update shop settings
	 */
	async update(settings: ShopSettingsUpdate): Promise<void> {
		await fetchAPI(API_BASE, {
			method: 'PUT',
			body: JSON.stringify(settings)
		});
	},

	/**
	 * Test Telegram notification
	 */
	async testTelegram(): Promise<{ message: string }> {
		const response = await fetchAPI<{ success: boolean; message: string }>(
			`${API_BASE}/test-telegram`,
			{ method: 'POST' }
		);
		return { message: response.message };
	},

	/**
	 * Test email notification
	 */
	async testEmail(email: string): Promise<{ message: string }> {
		const response = await fetchAPI<{ success: boolean; message: string }>(
			`${API_BASE}/test-email`,
			{
				method: 'POST',
				body: JSON.stringify({ email })
			}
		);
		return { message: response.message };
	}
};
