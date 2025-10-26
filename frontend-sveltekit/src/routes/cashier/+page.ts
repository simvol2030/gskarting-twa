import { getStoreConfig } from '$lib/api/cashier';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const storeId = parseInt(url.searchParams.get('storeId') || '1');

	// Загружаем конфигурацию магазина
	const storeConfig = await getStoreConfig(storeId);

	return {
		storeId,
		storeConfig
	};
};
