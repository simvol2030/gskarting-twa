/**
 * Mock API for Clients Management
 * Based on API-CONTRACT-Clients.md
 * Will be replaced with real fetch() during integration phase
 */

import type {
	Client,
	ClientDetail,
	ClientStats,
	ClientTransaction,
	BalanceChangeHistory,
	ClientsListParams,
	TransactionsListParams,
	BalanceAdjustmentData,
	Pagination
} from '$lib/types/admin';

import {
	mockClients,
	mockClientTransactions,
	mockBalanceHistory
} from '$lib/data/adminMockData';

/**
 * Mock delay для имитации network request
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Clients API
 */
export const clientsAPI = {
	/**
	 * GET /api/admin/clients - Список клиентов с фильтрами
	 */
	async list(params: ClientsListParams = {}): Promise<{
		clients: Client[];
		pagination: Pagination;
	}> {
		await delay(500);

		const {
			search = '',
			status = 'all',
			storeId = 'all',
			sortBy = 'lastActivity',
			sortOrder = 'desc',
			page = 1,
			limit = 20
		} = params;

		let filtered = [...mockClients];

		// Search filter
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(c) =>
					c.name.toLowerCase().includes(searchLower) ||
					c.username?.toLowerCase().includes(searchLower) ||
					c.cardNumber?.includes(search) ||
					c.telegramId.includes(search)
			);
		}

		// Status filter
		if (status !== 'all') {
			filtered = filtered.filter((c) => c.isActive === (status === 'active'));
		}

		// Store filter
		if (storeId !== 'all') {
			filtered = filtered.filter((c) => c.registeredStoreId === storeId);
		}

		// Sorting
		if (sortBy) {
			filtered.sort((a, b) => {
				let aVal: any = a[sortBy as keyof Client];
				let bVal: any = b[sortBy as keyof Client];

				// Special handling for name
				if (sortBy === 'name') {
					aVal = a.name.toLowerCase();
					bVal = b.name.toLowerCase();
				}

				if (sortOrder === 'asc') {
					return aVal > bVal ? 1 : -1;
				} else {
					return aVal < bVal ? 1 : -1;
				}
			});
		}

		// Pagination
		const total = filtered.length;
		const totalPages = Math.ceil(total / limit);
		const start = (page - 1) * limit;
		const clients = filtered.slice(start, start + limit);

		return {
			clients,
			pagination: { page, limit, total, totalPages }
		};
	},

	/**
	 * GET /api/admin/clients/:id - Детали клиента
	 */
	async getById(id: number): Promise<{
		client: ClientDetail;
		stats: ClientStats;
	} | null> {
		await delay(300);

		const client = mockClients.find((c) => c.id === id);
		if (!client) return null;

		// Compute stats
		const daysSinceRegistration = Math.floor(
			(Date.now() - new Date(client.registrationDate).getTime()) / (1000 * 60 * 60 * 24)
		);

		const totalSpent = client.totalPurchases * 1200; // Mock average check
		const averageCheck = client.totalPurchases > 0 ? totalSpent / client.totalPurchases : 0;
		const expiredPoints = 200; // Mock expired points

		const stats: ClientStats = {
			currentBalance: client.balance,
			effectiveBalance: client.balance - expiredPoints,
			expiredPoints,
			totalPurchases: client.totalPurchases,
			totalSpent,
			totalSaved: client.totalSaved,
			averageCheck,
			lastPurchaseDate: client.lastActivity,
			registrationDate: client.registrationDate,
			daysSinceRegistration
		};

		// Extend client with detail fields
		const clientDetail: ClientDetail = {
			...client,
			email: null,
			phone: null,
			birthdate: null,
			languageCode: 'ru'
		};

		return { client: clientDetail, stats };
	},

	/**
	 * GET /api/admin/clients/:id/transactions - История транзакций
	 */
	async getTransactions(
		clientId: number,
		params: TransactionsListParams = {}
	): Promise<{
		transactions: ClientTransaction[];
		pagination: Pagination;
	}> {
		await delay(300);

		const { type = 'all', storeId = 'all', page = 1, limit = 20 } = params;

		let transactions = mockClientTransactions[clientId] || [];

		// Type filter
		if (type !== 'all') {
			const typeMap: Record<string, string[]> = {
				earn: ['earn', 'purchase', 'manual_add'],
				spend: ['redeem', 'manual_subtract']
			};
			transactions = transactions.filter((t) => typeMap[type].includes(t.type));
		}

		// Store filter
		if (storeId !== 'all') {
			transactions = transactions.filter((t) => t.storeId === storeId);
		}

		// Pagination
		const total = transactions.length;
		const totalPages = Math.ceil(total / limit);
		const start = (page - 1) * limit;
		const paginatedTransactions = transactions.slice(start, start + limit);

		return {
			transactions: paginatedTransactions,
			pagination: { page, limit, total, totalPages }
		};
	},

	/**
	 * POST /api/admin/clients/:id/balance/adjust - Ручное изменение баланса
	 */
	async adjustBalance(
		clientId: number,
		data: BalanceAdjustmentData
	): Promise<{
		newBalance: number;
		transaction: BalanceChangeHistory;
	}> {
		await delay(500);

		const client = mockClients.find((c) => c.id === clientId);
		if (!client) {
			throw new Error('Клиент не найден');
		}

		// Validation
		if (data.operation === 'subtract' && data.amount > client.balance) {
			throw new Error('Недостаточно баллов для списания');
		}

		const balanceBefore = client.balance;
		const newBalance =
			data.operation === 'add' ? balanceBefore + data.amount : balanceBefore - data.amount;

		// Update balance
		client.balance = newBalance;

		// Create history record
		const transaction: BalanceChangeHistory = {
			id: Date.now(),
			date: new Date().toISOString(),
			adminId: 1,
			adminName: 'Текущий админ',
			operation: data.operation,
			amount: data.amount,
			reason: data.reason,
			balanceBefore,
			balanceAfter: newBalance
		};

		// Add to history
		if (!mockBalanceHistory[clientId]) {
			mockBalanceHistory[clientId] = [];
		}
		mockBalanceHistory[clientId].unshift(transaction);

		return { newBalance, transaction };
	},

	/**
	 * PATCH /api/admin/clients/:id/toggle-active - Блокировка/разблокировка
	 */
	async toggleActive(
		clientId: number,
		data: {
			isActive: boolean;
			reason: string;
		}
	): Promise<void> {
		await delay(300);

		const client = mockClients.find((c) => c.id === clientId);
		if (!client) {
			throw new Error('Клиент не найден');
		}

		client.isActive = data.isActive;
	},

	/**
	 * GET /api/admin/clients/:id/balance-history - История изменений баланса
	 */
	async getBalanceHistory(
		clientId: number,
		params: { page?: number; limit?: number } = {}
	): Promise<{
		history: BalanceChangeHistory[];
		pagination: Pagination;
	}> {
		await delay(300);

		const { page = 1, limit = 20 } = params;
		const history = mockBalanceHistory[clientId] || [];

		const total = history.length;
		const totalPages = Math.ceil(total / limit);
		const start = (page - 1) * limit;
		const paginatedHistory = history.slice(start, start + limit);

		return {
			history: paginatedHistory,
			pagination: { page, limit, total, totalPages }
		};
	},

	/**
	 * GET /api/admin/clients/export - Экспорт в CSV
	 */
	async exportCSV(params: ClientsListParams = {}): Promise<string> {
		await delay(1000);

		// Get filtered clients
		const { clients } = await this.list(params);

		// Generate CSV
		const headers = [
			'ID',
			'Telegram ID',
			'Card Number',
			'Name',
			'Balance',
			'Total Purchases',
			'Total Saved',
			'Store',
			'Registration Date',
			'Active'
		];

		const rows = clients.map((c) => [
			c.id,
			c.telegramId,
			c.cardNumber || '',
			`"${c.name}"`,
			c.balance,
			c.totalPurchases,
			c.totalSaved,
			`"${c.registeredStoreName || ''}"`,
			c.registrationDate,
			c.isActive
		]);

		const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

		return csv;
	},

	/**
	 * DELETE /api/admin/clients/:id - Удалить клиента
	 */
	async delete(clientId: number, soft = true): Promise<void> {
		await delay(500);

		if (soft) {
			const client = mockClients.find((c) => c.id === clientId);
			if (client) client.isActive = false;
		} else {
			const index = mockClients.findIndex((c) => c.id === clientId);
			if (index !== -1) mockClients.splice(index, 1);
		}
	}
};
