import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');

	if (!sessionCookie) {
		throw new Error('Session expired. Please login again.');
	}

	// Загрузить настройки лояльности из API
	const loyaltyResponse = await fetch(`${API_BASE_URL}/admin/settings/loyalty`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		}
	});

	const loyaltyJson = await loyaltyResponse.json();

	if (!loyaltyJson.success) {
		throw new Error(loyaltyJson.error || 'Failed to load loyalty settings');
	}

	const loyalty = loyaltyJson.data;

	// Структура данных для формы
	return {
		settings: {
			general: {
				appName: 'Murzico Loyalty',
				supportEmail: loyalty.supportEmail || '',
				supportPhone: loyalty.supportPhone || ''
			},
			loyalty: {
				earnRate: loyalty.earningPercent,
				maxRedeemPercent: loyalty.maxDiscountPercent,
				pointsExpiryDays: loyalty.expiryDays,
				welcomeBonus: loyalty.welcomeBonus,
				birthdayBonus: loyalty.birthdayBonus,
				minRedemptionAmount: loyalty.minRedemptionAmount,
				pointsName: loyalty.pointsName
			},
			notifications: {
				emailEnabled: false,
				smsEnabled: false,
				pushEnabled: false,
				notifyOnEarn: false,
				notifyOnRedeem: false,
				notifyOnExpiry: false
			}
		}
	};
};
