/**
 * App Configuration
 */

export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ||
	(import.meta.env.MODE === 'production'
		? 'https://murzicoin.murzico.ru/api'
		: 'http://localhost:3015/api');

export const config = {
	apiBaseUrl: API_BASE_URL,
	useMockData: import.meta.env.VITE_USE_MOCK === 'true',
	environment: import.meta.env.MODE
};
