/**
 * Моковые данные для интерфейса кассира
 * Позже заменятся на реальные API запросы
 */

export interface Store {
	storeId: number;
	storeName: string;
	cashbackPercent: number;
	maxDiscountPercent: number;
}

export interface Customer {
	id: number;         // ID пользователя в БД (обязательно для транзакций)
	cardNumber: string; // 6-значный номер (без пробелов)
	name: string;
	balance: number;
	phone?: string;
	createdAt?: string; // Дата регистрации
}

export interface Transaction {
	id: string;
	customerId: string;
	customerName: string;
	checkAmount: number;
	pointsRedeemed: number;
	cashbackEarned: number;
	finalAmount: number;
	timestamp: string;
	storeId: number;
}

// ===== Конфигурация магазинов =====
export const MOCK_STORES: Record<number, Store> = {
	1: {
		storeId: 1,
		storeName: 'Магазин №1 - Центральный',
		cashbackPercent: 4,
		maxDiscountPercent: 20
	},
	2: {
		storeId: 2,
		storeName: 'Магазин №2 - Северный',
		cashbackPercent: 4,
		maxDiscountPercent: 20
	},
	3: {
		storeId: 3,
		storeName: 'Магазин №3 - Южный',
		cashbackPercent: 4,
		maxDiscountPercent: 20
	},
	4: {
		storeId: 4,
		storeName: 'Магазин №4 - Восточный',
		cashbackPercent: 4,
		maxDiscountPercent: 20
	},
	5: {
		storeId: 5,
		storeName: 'Магазин №5 - Западный',
		cashbackPercent: 4,
		maxDiscountPercent: 20
	},
	6: {
		storeId: 6,
		storeName: 'Магазин №6 - Торговый центр',
		cashbackPercent: 4,
		maxDiscountPercent: 20
	}
};

// ===== Тестовые клиенты =====
export const MOCK_CUSTOMERS: Customer[] = [
	{
		id: 1,
		cardNumber: '421856',
		name: 'Сергей Мурзин',
		balance: 8456,
		phone: '+7 (999) 123-45-67'
	},
	{
		id: 2,
		cardNumber: '234567',
		name: 'Анна Петрова',
		balance: 3210,
		phone: '+7 (999) 234-56-78'
	},
	{
		id: 3,
		cardNumber: '345678',
		name: 'Иван Сидоров',
		balance: 12500,
		phone: '+7 (999) 345-67-89'
	},
	{
		id: 4,
		cardNumber: '456789',
		name: 'Мария Кузнецова',
		balance: 560,
		phone: '+7 (999) 456-78-90'
	},
	{
		id: 5,
		cardNumber: '567890',
		name: 'Дмитрий Волков',
		balance: 18200,
		phone: '+7 (999) 567-89-01'
	}
];

// ===== Быстрые тестовые данные =====
export const QUICK_TESTS = {
	high: '421856', // Сергей - 8456₽
	medium: '234567', // Анна - 3210₽
	low: '456789' // Мария - 560₽
};
