import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/config';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');

	if (!sessionCookie) {
		throw new Error('Session expired. Please login again.');
	}

	// Загрузить настройки лояльности и внешнего вида параллельно
	const [loyaltyResponse, appearanceResponse] = await Promise.all([
		fetch(`${API_BASE_URL}/admin/settings/loyalty`, {
			headers: { Cookie: `session=${sessionCookie}` }
		}),
		fetch(`${API_BASE_URL}/admin/settings/appearance`, {
			headers: { Cookie: `session=${sessionCookie}` }
		})
	]);

	const loyaltyJson = await loyaltyResponse.json();
	const appearanceJson = await appearanceResponse.json();

	if (!loyaltyJson.success) {
		throw new Error(loyaltyJson.error || 'Failed to load loyalty settings');
	}

	const loyalty = loyaltyJson.data;

	// Настройки внешнего вида (с дефолтами если API не доступен)
	const appearance = appearanceJson.success ? appearanceJson.data : {
		appName: 'Мурзико',
		appSlogan: 'Лояльность',
		logoUrl: '/logo.png',
		faviconUrl: '/favicon.ico',
		primaryColor: '#ff6b00',
		primaryColorDark: '#e55d00',
		primaryColorLight: '#ff8533',
		secondaryColor: '#10b981',
		secondaryColorDark: '#059669',
		accentColor: '#dc2626',
		darkBgPrimary: '#17212b',
		darkBgSecondary: '#0e1621',
		darkBgTertiary: '#1f2c38',
		darkPrimaryColor: '#ff8533',
		darkTextPrimary: '#ffffff',
		darkTextSecondary: '#aaaaaa',
		darkBorderColor: '#2b3943',
		bottomNavItems: [
			{ id: 'home', href: '/', label: 'Главная', icon: 'home', visible: true },
			{ id: 'offers', href: '/offers', label: 'Акции', icon: 'tag', visible: true },
			{ id: 'stores', href: '/stores', label: 'Магазины', icon: 'location', visible: true },
			{ id: 'history', href: '/history', label: 'Бонусы', icon: 'coins', visible: true },
			{ id: 'profile', href: '/profile', label: 'Профиль', icon: 'user', visible: true }
		],
		sidebarMenuItems: [
			{ id: 'home', href: '/', label: 'Главная', icon: '📊', visible: true, isExternal: false },
			{ id: 'products', href: '/products', label: 'Товары', icon: '🛍️', visible: true, isExternal: false },
			{ id: 'offers', href: '/offers', label: 'Акции', icon: '🎁', visible: true, isExternal: false },
			{ id: 'stores', href: '/stores', label: 'Магазины', icon: '🏪', visible: true, isExternal: false },
			{ id: 'history', href: '/history', label: 'История', icon: '📜', visible: true, isExternal: false },
			{ id: 'profile', href: '/profile', label: 'Профиль', icon: '👤', visible: true, isExternal: false }
		]
	};

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
			},
			appearance
		}
	};
};
