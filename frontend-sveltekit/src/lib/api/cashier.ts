/**
 * API layer для интерфейса кассира
 * Легко переключается с моков на реальный backend
 */

import { MOCK_STORES, MOCK_CUSTOMERS, type Store, type Customer, type Transaction } from '$lib/data/cashier-mocks';
import { parseQRData } from '$lib/utils/qr-generator';

// ===== Режим работы (true = моки, false = реальный API) =====
const USE_MOCKS = true;

// ===== Хранилище транзакций (для моков) =====
const mockTransactions: Transaction[] = [];

// ===== API функции =====

/**
 * Получить конфигурацию магазина
 */
export async function getStoreConfig(storeId: number): Promise<Store> {
	if (USE_MOCKS) {
		// Моки
		const store = MOCK_STORES[storeId];
		if (!store) {
			throw new Error(`Магазин с ID ${storeId} не найден`);
		}
		return store;
	} else {
		// Реальный API
		const response = await fetch(`/api/stores/${storeId}/config`);
		if (!response.ok) throw new Error('Ошибка загрузки конфигурации магазина');
		return response.json();
	}
}

/**
 * Найти клиента по номеру карты или QR-коду
 * Принимает: 6-значный номер "421856" или QR "99421856"
 */
export async function findCustomer(input: string, storeId: number): Promise<Customer | null> {
	// Парсим ввод (может быть QR с префиксом или прямой номер)
	const parsed = await parseQRData(input);

	if (!parsed.valid || !parsed.cardNumber) {
		return null;
	}

	// Убираем пробелы из номера для поиска
	const cardNumberClean = parsed.cardNumber.replace(/\s/g, '');

	if (USE_MOCKS) {
		// Моки - ищем в массиве
		const customer = MOCK_CUSTOMERS.find(c => c.cardNumber === cardNumberClean);
		return customer || null;
	} else {
		// Реальный API
		const response = await fetch(`/api/customers/search?card=${cardNumberClean}&storeId=${storeId}`);
		if (!response.ok) return null;
		return response.json();
	}
}

/**
 * Создать транзакцию
 */
export async function createTransaction(data: {
	customer: Customer;
	storeId: number;
	checkAmount: number;
	pointsToRedeem: number;
	cashbackAmount: number;
	finalAmount: number;
}): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
	if (USE_MOCKS) {
		// Моки - симулируем задержку и обновляем баланс
		await new Promise(resolve => setTimeout(resolve, 1500));

		// Обновляем баланс клиента в массиве
		const customer = MOCK_CUSTOMERS.find(c => c.cardNumber === data.customer.cardNumber);
		if (customer) {
			customer.balance = customer.balance - data.pointsToRedeem + data.cashbackAmount;
		}

		// Создаем транзакцию
		const transaction: Transaction = {
			id: `TXN-${Date.now()}`,
			customerId: data.customer.cardNumber,
			customerName: data.customer.name,
			checkAmount: data.checkAmount,
			pointsRedeemed: data.pointsToRedeem,
			cashbackEarned: data.cashbackAmount,
			finalAmount: data.finalAmount,
			timestamp: new Date().toISOString(),
			storeId: data.storeId
		};

		// Сохраняем в массив
		mockTransactions.unshift(transaction);

		// Ограничиваем историю до 50 транзакций
		if (mockTransactions.length > 50) {
			mockTransactions.pop();
		}

		return { success: true, transaction };
	} else {
		// Реальный API
		const response = await fetch('/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			return { success: false, error: 'Ошибка при создании транзакции' };
		}

		const transaction = await response.json();
		return { success: true, transaction };
	}
}

/**
 * Получить последние транзакции (для отображения истории)
 */
export async function getRecentTransactions(storeId: number, limit: number = 10): Promise<Transaction[]> {
	if (USE_MOCKS) {
		// Моки - возвращаем из массива
		return mockTransactions
			.filter(t => t.storeId === storeId)
			.slice(0, limit);
	} else {
		// Реальный API
		const response = await fetch(`/api/transactions/recent?storeId=${storeId}&limit=${limit}`);
		if (!response.ok) return [];
		return response.json();
	}
}
