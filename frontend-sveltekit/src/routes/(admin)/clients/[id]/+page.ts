import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { clientsAPI } from '$lib/api/admin/clients';

export const load: PageLoad = async ({ params }) => {
	const clientId = parseInt(params.id);

	if (isNaN(clientId)) {
		throw error(400, 'Неверный ID клиента');
	}

	const result = await clientsAPI.getById(clientId);

	if (!result) {
		throw error(404, 'Клиент не найден');
	}

	const { transactions } = await clientsAPI.getTransactions(clientId, { page: 1, limit: 20 });
	const { history: balanceHistory } = await clientsAPI.getBalanceHistory(clientId, {
		page: 1,
		limit: 10
	});

	return {
		client: result.client,
		stats: result.stats,
		transactions,
		balanceHistory
	};
};
