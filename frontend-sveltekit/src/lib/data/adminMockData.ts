/**
 * Admin Panel Mock Data
 * Extended data for admin panel CRUD operations
 * Based on DATA-MODEL documents
 */

import type {
	Client,
	ClientTransaction,
	BalanceChangeHistory,
	Promotion,
	Product
} from '$lib/types/admin';

// ============================================
// CLIENTS MOCK DATA
// ============================================

export const mockClients: Client[] = [
	{
		id: 1,
		telegramId: '123456789',
		cardNumber: '421856',
		name: 'Иван Петров',
		firstName: 'Иван',
		lastName: 'Петров',
		username: 'ivan_petrov',
		balance: 2500,
		totalPurchases: 15,
		totalSaved: 1200,
		registeredStoreId: 1,
		registeredStoreName: 'Ашукино',
		registrationDate: '2024-01-15T10:00:00Z',
		lastActivity: '2025-01-18T14:30:00Z',
		isActive: true,
		chatId: 123456789
	},
	{
		id: 2,
		telegramId: '987654321',
		cardNumber: '789012',
		name: 'Мария Иванова',
		firstName: 'Мария',
		lastName: 'Иванова',
		username: null,
		balance: 800,
		totalPurchases: 8,
		totalSaved: 450,
		registeredStoreId: 2,
		registeredStoreName: 'Софрино',
		registrationDate: '2024-02-20T12:00:00Z',
		lastActivity: '2025-01-19T09:15:00Z',
		isActive: true,
		chatId: 987654321
	},
	{
		id: 3,
		telegramId: '555666777',
		cardNumber: '654321',
		name: 'Алексей Сидоров',
		firstName: 'Алексей',
		lastName: 'Сидоров',
		username: 'alex_sidorov',
		balance: 150,
		totalPurchases: 3,
		totalSaved: 75,
		registeredStoreId: 1,
		registeredStoreName: 'Ашукино',
		registrationDate: '2024-11-10T08:00:00Z',
		lastActivity: '2025-01-10T16:45:00Z',
		isActive: true,
		chatId: 555666777
	},
	{
		id: 4,
		telegramId: '111222333',
		cardNumber: null,
		name: 'Елена Козлова',
		firstName: 'Елена',
		lastName: 'Козлова',
		username: 'elena_k',
		balance: 5400,
		totalPurchases: 42,
		totalSaved: 3200,
		registeredStoreId: 3,
		registeredStoreName: 'Зеленоградский',
		registrationDate: '2023-12-01T14:00:00Z',
		lastActivity: '2025-01-19T11:20:00Z',
		isActive: true,
		chatId: 111222333
	},
	{
		id: 5,
		telegramId: '999888777',
		cardNumber: '112233',
		name: 'Дмитрий Волков',
		firstName: 'Дмитрий',
		lastName: 'Волков',
		username: null,
		balance: 0,
		totalPurchases: 5,
		totalSaved: 200,
		registeredStoreId: 4,
		registeredStoreName: 'Заветы Ильича',
		registrationDate: '2024-08-15T09:30:00Z',
		lastActivity: '2024-12-20T13:00:00Z',
		isActive: false,
		chatId: 999888777
	}
];

export const mockClientTransactions: Record<number, ClientTransaction[]> = {
	1: [
		{
			id: 101,
			date: '2025-01-19T14:30:00Z',
			storeId: 1,
			storeName: 'Ашукино',
			type: 'earn',
			purchaseAmount: 1200,
			pointsChange: 48,
			balanceAfter: 2548,
			description: 'Покупка'
		},
		{
			id: 102,
			date: '2025-01-18T10:15:00Z',
			storeId: 1,
			storeName: 'Ашукино',
			type: 'redeem',
			purchaseAmount: 500,
			pointsChange: -100,
			balanceAfter: 2500,
			description: 'Списание баллов'
		},
		{
			id: 103,
			date: '2025-01-15T16:20:00Z',
			storeId: 1,
			storeName: 'Ашукино',
			type: 'earn',
			purchaseAmount: 850,
			pointsChange: 34,
			balanceAfter: 2600,
			description: 'Покупка'
		},
		{
			id: 104,
			date: '2025-01-10T12:00:00Z',
			storeId: 1,
			storeName: 'Ашукино',
			type: 'manual_add',
			purchaseAmount: null,
			pointsChange: 500,
			balanceAfter: 2566,
			description: 'Компенсация за ошибку в системе'
		}
	],
	2: [
		{
			id: 201,
			date: '2025-01-19T09:15:00Z',
			storeId: 2,
			storeName: 'Софрино',
			type: 'earn',
			purchaseAmount: 650,
			pointsChange: 26,
			balanceAfter: 826,
			description: 'Покупка'
		},
		{
			id: 202,
			date: '2025-01-16T14:30:00Z',
			storeId: 2,
			storeName: 'Софрино',
			type: 'redeem',
			purchaseAmount: 300,
			pointsChange: -60,
			balanceAfter: 800,
			description: 'Списание баллов'
		}
	]
};

export const mockBalanceHistory: Record<number, BalanceChangeHistory[]> = {
	1: [
		{
			id: 1,
			date: '2025-01-10T12:00:00Z',
			adminId: 1,
			adminName: 'Иван Админов',
			operation: 'add',
			amount: 500,
			reason: 'Компенсация за ошибку в системе',
			balanceBefore: 2066,
			balanceAfter: 2566
		}
	]
};

// ============================================
// PROMOTIONS MOCK DATA
// ============================================

export const mockPromotions: Promotion[] = [
	{
		id: 1,
		title: 'Двойные баллы по выходным',
		description: 'Получайте в 2 раза больше баллов за каждую покупку в субботу и воскресенье. Акция действует на все товары кроме алкоголя и табачных изделий.',
		image: '/images/promotions/double-points-weekend.jpg',
		deadline: '2025-01-31',
		isActive: true,
		showOnHome: true
	},
	{
		id: 2,
		title: 'Кешбэк 10% на молочку',
		description: 'Специальное предложение на все молочные продукты. Повышенный кешбэк 10% вместо стандартных 4% на весь ассортимент молочной продукции.',
		image: '/images/promotions/cashback-dairy.jpg',
		deadline: '2025-01-25',
		isActive: true,
		showOnHome: false
	},
	{
		id: 3,
		title: 'День рождения магазина',
		description: 'Тройные баллы на все покупки сегодня! В честь дня рождения магазина дарим тройные баллы за каждую покупку. Спешите!',
		image: '/images/promotions/store-birthday.jpg',
		deadline: '2025-01-19',
		isActive: false,
		showOnHome: false
	}
];

// ============================================
// PRODUCTS MOCK DATA
// ============================================

export const mockProducts: Product[] = [
	{
		id: 1,
		name: 'Молоко "Простоквашино" 3.2%',
		price: 89.9,
		oldPrice: 109.9,
		image: '/uploads/products/milk-prostokvashino.jpg',
		category: 'Молочные продукты',
		categoryId: null,
		sku: 'MILK-001',
		position: 0,
		variationAttribute: null,
		isActive: true,
		description: 'Свежее молоко с жирностью 3.2%. Натуральный продукт без консервантов.',
		quantityInfo: '1 л',
		showOnHome: true,
		isRecommendation: true
	},
	{
		id: 2,
		name: 'Хлеб "Бородинский"',
		price: 45.0,
		oldPrice: null,
		image: '/uploads/products/bread-borodinsky.jpg',
		category: 'Хлебобулочные изделия',
		categoryId: null,
		sku: 'BREAD-001',
		position: 0,
		variationAttribute: null,
		isActive: true,
		description: 'Ржаной хлеб с кориандром. Классический рецепт.',
		quantityInfo: '500 г',
		showOnHome: true,
		isRecommendation: false
	},
	{
		id: 3,
		name: 'Йогурт "Активиа" клубника',
		price: 65.0,
		oldPrice: 75.0,
		image: '/uploads/products/yogurt-activia.jpg',
		category: 'Молочные продукты',
		categoryId: null,
		sku: 'YOGURT-001',
		position: 0,
		variationAttribute: null,
		isActive: false,
		description: null,
		quantityInfo: '150 г',
		showOnHome: false,
		isRecommendation: false
	},
	{
		id: 4,
		name: 'Сыр "Российский" 50%',
		price: 450.0,
		oldPrice: null,
		image: '/uploads/products/cheese-russian.jpg',
		category: 'Молочные продукты',
		categoryId: null,
		sku: 'CHEESE-001',
		position: 0,
		variationAttribute: null,
		isActive: true,
		description: 'Твердый сыр жирностью 50%. Идеален для бутербродов.',
		quantityInfo: '1 кг',
		showOnHome: false,
		isRecommendation: false
	}
];
