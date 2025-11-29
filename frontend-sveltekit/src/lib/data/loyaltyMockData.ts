// Mock data for Loyalty Admin Dashboard

export interface LoyaltyStats {
	totalClients: number;
	activeClients: number;
	totalTransactions: number;
	totalRevenue: number;
	clientsGrowth: number; // процент
	transactionsGrowth: number;
	revenueGrowth: number;
}

export interface StoreSummary {
	id: number;
	name: string;
	clients: number;
	transactions: number;
	revenue: number;
	active: boolean;
}

export interface Client {
	id: number;
	telegramId: string;
	name: string;
	balance: number;
	registered: string; // ISO date
	lastPurchase: string; // ISO date
	totalPurchases: number;
	totalSpent: number;
	storeId: number; // Магазин регистрации
	active: boolean;
}

export interface Promotion {
	id: number;
	title: string;
	description: string;
	image: string; // Эмодзи или URL
	startDate: string; // ISO date
	endDate: string; // ISO date
	active: boolean;
	createdAt: string;
}

export interface Product {
	id: number;
	name: string;
	description: string;
	price: number;
	image: string; // Эмодзи или URL
	category: string;
	active: boolean;
	createdAt: string;
}

// Данные по магазинам
export const mockStores: StoreSummary[] = [
	{
		id: 1,
		name: 'Ашукино',
		clients: 342,
		transactions: 1256,
		revenue: 487500,
		active: true
	},
	{
		id: 2,
		name: 'Софрино',
		clients: 289,
		transactions: 987,
		revenue: 365200,
		active: true
	},
	{
		id: 3,
		name: 'Зеленоградский',
		clients: 421,
		transactions: 1543,
		revenue: 612300,
		active: true
	},
	{
		id: 4,
		name: 'Заветы Ильича',
		clients: 198,
		transactions: 674,
		revenue: 234800,
		active: true
	},
	{
		id: 5,
		name: 'Клязьма',
		clients: 267,
		transactions: 892,
		revenue: 321500,
		active: true
	},
	{
		id: 6,
		name: 'Зверосовхоз',
		clients: 156,
		transactions: 543,
		revenue: 189400,
		active: true
	},
	{
		id: 7,
		name: 'Тестовый',
		clients: 12,
		transactions: 45,
		revenue: 15600,
		active: false
	}
];

// Общая статистика
export const mockLoyaltyStats: LoyaltyStats = {
	totalClients: mockStores.reduce((sum, store) => sum + store.clients, 0),
	activeClients: mockStores
		.filter((s) => s.active)
		.reduce((sum, store) => sum + store.clients, 0),
	totalTransactions: mockStores.reduce((sum, store) => sum + store.transactions, 0),
	totalRevenue: mockStores.reduce((sum, store) => sum + store.revenue, 0),
	clientsGrowth: 12.5,
	transactionsGrowth: 18.3,
	revenueGrowth: 15.7
};

// Mock данные клиентов
export const mockClients: Client[] = [
	{
		id: 1,
		telegramId: '123456789',
		name: 'Иван Петров',
		balance: 2500,
		registered: '2024-01-15',
		lastPurchase: '2024-11-18',
		totalPurchases: 45,
		totalSpent: 125600,
		storeId: 1,
		active: true
	},
	{
		id: 2,
		telegramId: '987654321',
		name: 'Мария Сидорова',
		balance: 800,
		registered: '2024-02-20',
		lastPurchase: '2024-11-17',
		totalPurchases: 32,
		totalSpent: 89400,
		storeId: 3,
		active: true
	},
	{
		id: 3,
		telegramId: '456789123',
		name: 'Алексей Иванов',
		balance: 150,
		registered: '2024-03-10',
		lastPurchase: '2024-11-10',
		totalPurchases: 18,
		totalSpent: 42300,
		storeId: 2,
		active: true
	},
	{
		id: 4,
		telegramId: '321654987',
		name: 'Елена Васильева',
		balance: 3200,
		registered: '2024-01-05',
		lastPurchase: '2024-11-19',
		totalPurchases: 67,
		totalSpent: 198500,
		storeId: 1,
		active: true
	},
	{
		id: 5,
		telegramId: '654987321',
		name: 'Дмитрий Смирнов',
		balance: 0,
		registered: '2024-05-12',
		lastPurchase: '2024-08-15',
		totalPurchases: 8,
		totalSpent: 15600,
		storeId: 4,
		active: false
	},
	{
		id: 6,
		telegramId: '789123456',
		name: 'Ольга Кузнецова',
		balance: 1450,
		registered: '2024-04-18',
		lastPurchase: '2024-11-16',
		totalPurchases: 28,
		totalSpent: 76200,
		storeId: 5,
		active: true
	},
	{
		id: 7,
		telegramId: '147258369',
		name: 'Сергей Попов',
		balance: 620,
		registered: '2024-06-22',
		lastPurchase: '2024-11-12',
		totalPurchases: 15,
		totalSpent: 38900,
		storeId: 3,
		active: true
	},
	{
		id: 8,
		telegramId: '963852741',
		name: 'Анна Михайлова',
		balance: 4100,
		registered: '2024-02-28',
		lastPurchase: '2024-11-19',
		totalPurchases: 52,
		totalSpent: 167800,
		storeId: 6,
		active: true
	},
	{
		id: 9,
		telegramId: '258369147',
		name: 'Павел Николаев',
		balance: 890,
		registered: '2024-07-14',
		lastPurchase: '2024-11-11',
		totalPurchases: 22,
		totalSpent: 54700,
		storeId: 2,
		active: true
	},
	{
		id: 10,
		telegramId: '369147258',
		name: 'Татьяна Федорова',
		balance: 0,
		registered: '2024-03-30',
		lastPurchase: '2024-07-20',
		totalPurchases: 5,
		totalSpent: 12400,
		storeId: 1,
		active: false
	}
];

// Mock данные акций
export const mockPromotions: Promotion[] = [
	{
		id: 1,
		title: 'Двойные баллы на корм',
		description: 'Покупайте корм для кошек и собак и получайте двойные баллы!',
		image: '🎁',
		startDate: '2024-11-01',
		endDate: '2024-11-30',
		active: true,
		createdAt: '2024-10-25'
	},
	{
		id: 2,
		title: 'Скидка 20% на игрушки',
		description: 'Специальное предложение на все игрушки для домашних животных',
		image: '🐾',
		startDate: '2024-11-15',
		endDate: '2024-12-15',
		active: true,
		createdAt: '2024-11-10'
	},
	{
		id: 3,
		title: 'Бесплатная доставка',
		description: 'Бесплатная доставка при заказе от 3000 рублей',
		image: '🚚',
		startDate: '2024-12-01',
		endDate: '2024-12-31',
		active: false,
		createdAt: '2024-10-20'
	}
];

// Mock данные товаров
export const mockProducts: Product[] = [
	{
		id: 1,
		name: 'Корм Royal Canin для кошек',
		description: 'Премиум корм для кошек, 2кг',
		price: 1890,
		image: '🐱',
		category: 'Корм для кошек',
		active: true,
		createdAt: '2024-01-10'
	},
	{
		id: 2,
		name: 'Игрушка "Мышка"',
		description: 'Интерактивная игрушка для кошек',
		price: 450,
		image: '🐭',
		category: 'Игрушки',
		active: true,
		createdAt: '2024-01-15'
	},
	{
		id: 3,
		name: 'Наполнитель для кошачьего туалета',
		description: 'Комкующийся наполнитель, 5кг',
		price: 890,
		image: '🪣',
		category: 'Наполнители',
		active: true,
		createdAt: '2024-01-20'
	},
	{
		id: 4,
		name: 'Лежанка для собак',
		description: 'Мягкая лежанка для собак средних пород',
		price: 2300,
		image: '🛏️',
		category: 'Аксессуары',
		active: true,
		createdAt: '2024-02-01'
	},
	{
		id: 5,
		name: 'Корм Hill\'s для собак',
		description: 'Диетический корм для собак, 3кг',
		price: 2150,
		image: '🐕',
		category: 'Корм для собак',
		active: true,
		createdAt: '2024-02-10'
	},
	{
		id: 6,
		name: 'Когтеточка',
		description: 'Когтеточка-столбик с игрушкой',
		price: 1650,
		image: '🪵',
		category: 'Аксессуары',
		active: false,
		createdAt: '2024-03-01'
	}
];

// Settings interfaces and data
export interface GeneralSettings {
	appName: string;
	supportEmail: string;
	supportPhone: string;
}

export interface LoyaltySettings {
	earnRate: number; // 4 = 4%
	maxRedeemPercent: number; // 20 = 20%
	pointsExpiryDays: number; // 45 days
	welcomeBonus: number;
	birthdayBonus: number;
}

export interface NotificationSettings {
	emailEnabled: boolean;
	smsEnabled: boolean;
	pushEnabled: boolean;
	notifyOnEarn: boolean;
	notifyOnRedeem: boolean;
	notifyOnExpiry: boolean;
}

export interface AppSettings {
	general: GeneralSettings;
	loyalty: LoyaltySettings;
	notifications: NotificationSettings;
}

// Mock settings data
export const mockSettings: AppSettings = {
	general: {
		appName: 'Мурзикоин',
		supportEmail: 'support@murzico.ru',
		supportPhone: '+7 (495) 123-45-67'
	},
	loyalty: {
		earnRate: 4,
		maxRedeemPercent: 20,
		pointsExpiryDays: 45,
		welcomeBonus: 100,
		birthdayBonus: 500
	},
	notifications: {
		emailEnabled: false,
		smsEnabled: false,
		pushEnabled: true,
		notifyOnEarn: true,
		notifyOnRedeem: true,
		notifyOnExpiry: true
	}
};
