import stores from '$lib/data/loyalty/stores.json';
import customers from '$lib/data/loyalty/loyalty-customers.json';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const storeId = parseInt(url.searchParams.get('store_id') || '1');
	const store = stores.find((s) => s.id === storeId) || stores[0];

	return {
		store,
		customers,
		allStores: stores
	};
};
