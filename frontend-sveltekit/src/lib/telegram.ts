/**
 * TypeScript interfaces for Telegram Web App
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebAppUser {
  telegram_user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  chat_id: number;
}

export interface InitUserResponse {
  success: boolean;
  isNewUser: boolean;
  user: {
    telegram_user_id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    current_balance: number;
    store_id?: number;
    first_login_bonus_claimed: boolean;
  };
  message?: string;
}

export function initTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  if (!window.Telegram?.WebApp) return null;

  const tg = window.Telegram.WebApp;

  // Expand application
  tg.expand();

  // Enable closing confirmation
  tg.enableClosingConfirmation();

  // Ready signal
  tg.ready();

  return tg;
}

export function getTelegramUser(): TelegramUser | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

/**
 * Extract and format Telegram user data for backend
 */
export function extractTelegramUserData(): TelegramWebAppUser | null {
  const user = getTelegramUser();
  if (!user) return null;

  return {
    telegram_user_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code,
    chat_id: user.id // For private chats, chat_id equals user id
  };
}

/**
 * Initialize user on first app launch
 * Awards 500 Murzikoyns on first login
 *
 * @param storeId - Which of 6 stores user registered from (from QR code parameter)
 */
export async function initializeUser(storeId?: number): Promise<InitUserResponse | null> {
  const userData = extractTelegramUserData();
  if (!userData) {
    console.error('No Telegram user data available');
    return null;
  }

  try {
    const response = await fetch('/api/telegram/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...userData,
        store_id: storeId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: InitUserResponse = await response.json();

    // If new user, they received 500 bonus coins
    if (result.isNewUser && result.success) {
      console.log('New user initialized with 500 Murzikoyns bonus');
    }

    return result;
  } catch (error) {
    console.error('Error initializing user:', error);
    return null;
  }
}

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
