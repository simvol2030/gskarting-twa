// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			csrfToken?: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		Telegram?: {
			WebApp: {
				ready: () => void;
				expand: () => void;
				enableClosingConfirmation: () => void;
				colorScheme?: 'light' | 'dark';
				initDataUnsafe?: {
					user?: {
						id: number;
						first_name: string;
						last_name?: string;
						username?: string;
					};
				};
			};
		};
	}
}

export {};
