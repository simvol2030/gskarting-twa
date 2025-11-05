import type { PageServerLoad } from './$types';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

// Environment-aware backend URL (uses Windows Host IP for WSL)
const BACKEND_URL = PUBLIC_BACKEND_URL || 'http://localhost:3000';

export const load: PageServerLoad = async ({ url, fetch }) => {
	// Получаем storeId из URL параметра или fallback на 1
	const storeId = parseInt(url.searchParams.get('storeId') || '1');

	try {
		// Use SvelteKit's fetch (SSR-aware, supports relative URLs in production)
		const response = await fetch(`${BACKEND_URL}/api/stores/${storeId}/config`);

		if (!response.ok) {
			console.error('[SSR] Backend returned', response.status);
			return {
				storeId,
				storeConfig: null,
				error: `Backend API вернул статус ${response.status}`
			};
		}

		const config = await response.json();

		// Правила одинаковые для всех магазинов
		const storeConfig = {
			storeName: config.storeName,
			location: config.location || 'Разработка',
			cashbackPercent: 4,
			maxDiscountPercent: 20
		};

		return {
			storeId,
			storeConfig,
			error: null
		};
	} catch (err) {
		console.error('[SSR] Failed to fetch store config:', err);
		return {
			storeId,
			storeConfig: null,
			error: 'Не удалось подключиться к backend. Проверьте что backend запущен на ' + BACKEND_URL
		};
	}
};
