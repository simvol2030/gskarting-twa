/**
 * Telegram Web App Types
 */

export interface TelegramWebApp {
	ready: () => void;
	expand: () => void;
	enableClosingConfirmation: () => void;
	disableClosingConfirmation: () => void;
	close: () => void;
	colorScheme?: 'light' | 'dark';
	initData?: string;
	initDataUnsafe?: {
		user?: {
			id: number;
			first_name: string;
			last_name?: string;
			username?: string;
			language_code?: string;
			is_premium?: boolean;
		};
		auth_date?: number;
		hash?: string;
	};
	MainButton?: {
		text: string;
		color: string;
		textColor: string;
		isVisible: boolean;
		isActive: boolean;
		isProgressVisible: boolean;
		setText: (text: string) => void;
		onClick: (callback: () => void) => void;
		offClick: (callback: () => void) => void;
		show: () => void;
		hide: () => void;
		enable: () => void;
		disable: () => void;
		showProgress: (leaveActive?: boolean) => void;
		hideProgress: () => void;
	};
	BackButton?: {
		isVisible: boolean;
		onClick: (callback: () => void) => void;
		offClick: (callback: () => void) => void;
		show: () => void;
		hide: () => void;
	};
	showPopup?: (params: { title?: string; message: string; buttons?: any[] }) => void;
	showAlert?: (message: string) => void;
	showConfirm?: (message: string) => void;
	showScanQrPopup?: (params: { text?: string }, callback?: (text: string) => void) => void;
	closeScanQrPopup?: () => void;
	HapticFeedback?: {
		impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
		notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
		selectionChanged: () => void;
	};
}
