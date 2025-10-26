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

  // NOTE: Don't enable closing confirmation - let user close without warning
  // tg.enableClosingConfirmation();

  // Ready signal
  tg.ready();

  return tg;
}

/**
 * Ensure Telegram WebApp is initialized and ready
 * This function MUST be called early to unblock scroll
 *
 * @param maxWaitMs - Maximum time to wait for WebApp object (default: 2000ms)
 */
export async function ensureTelegramReady(maxWaitMs: number = 2000): Promise<void> {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();

  // Wait for Telegram.WebApp object to be available
  while (!window.Telegram?.WebApp && (Date.now() - startTime < maxWaitMs)) {
    console.log('[ensureTelegramReady] Waiting for window.Telegram.WebApp...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Poll every 50ms
  }

  if (!window.Telegram?.WebApp) {
    console.warn('[ensureTelegramReady] Timeout: WebApp object not available after', maxWaitMs, 'ms');
    return;
  }

  const tg = window.Telegram.WebApp;

  // Call ready() immediately to unblock scroll
  console.log('[ensureTelegramReady] ✅ Calling tg.ready() to enable scroll');
  tg.ready();
  tg.expand();
  // NOTE: Don't enable closing confirmation - let user close without warning
  // tg.enableClosingConfirmation();
}

export function getTelegramUser(): TelegramUser | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

/**
 * Wait for Telegram SDK to fully initialize user data, including the WebApp object itself
 * Uses polling mechanism to handle race condition on production builds
 *
 * @param maxWaitMs - Maximum time to wait in milliseconds (default: 5000)
 * @returns TelegramUser if found within timeout, null otherwise
 */
export async function waitForTelegramUser(maxWaitMs: number = 5000): Promise<TelegramUser | null> {
  if (typeof window === 'undefined') return null;

  const startTime = Date.now();

  // First, wait for the Telegram.WebApp object to be available
  while (!window.Telegram?.WebApp && (Date.now() - startTime < maxWaitMs)) {
    console.log('[waitForTelegramUser] Waiting for window.Telegram.WebApp...');
    await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms for WebApp object
  }

  if (!window.Telegram?.WebApp) {
    console.warn('[waitForTelegramUser] Timeout: window.Telegram.WebApp object not available after', maxWaitMs, 'ms');
    return null;
  }

  // Once WebApp object is available, wait for user data
  while (Date.now() - startTime < maxWaitMs) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      console.log('[waitForTelegramUser] ✅ User data found:', user.first_name);
      // NOTE: ensureTelegramReady() should be called earlier in +layout.svelte onMount
      // to unblock scroll BEFORE user data loads
      return user as TelegramUser;
    }

    console.log('[waitForTelegramUser] Waiting for initDataUnsafe.user...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Poll every 50ms for user data
  }

  console.warn('[waitForTelegramUser] Timeout: SDK initDataUnsafe.user not available after', maxWaitMs, 'ms');
  return null;
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
  // FIX: Race condition - wait for Telegram user data to be available (up to 5 seconds)
  // On production, initDataUnsafe.user loads asynchronously after ready()
  // This prevents silent failure where getTelegramUser() returns null too early
  console.log('[initializeUser] 🔍 Waiting for Telegram user data...');
  const telegramUser = await waitForTelegramUser(5000);

  if (!telegramUser) {
    console.error('[initializeUser] ❌ CRITICAL: Telegram user data not available after 5s timeout');
    console.error('[initializeUser] ❌ CRITICAL: This indicates Telegram SDK failed to initialize');
    console.error('[initializeUser] 🔍 Diagnostic info:', {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      hasInitData: !!window.Telegram?.WebApp?.initDataUnsafe,
      hasUser: !!window.Telegram?.WebApp?.initDataUnsafe?.user
    });
    return null;
  }

  console.log('[initializeUser] ✅ Telegram user data available:', telegramUser.first_name);

  const userData = extractTelegramUserData();
  if (!userData) {
    console.error('[initializeUser] ❌ Failed to extract user data after successful waitForTelegramUser');
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

    // Save telegram_user_id to cookie for server-side access
    // This allows +page.server.ts to filter transactions by user
    if (result.success && typeof document !== 'undefined') {
      // Set cookie with 30 days expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `telegram_user_id=${result.user.telegram_user_id}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
      console.log('[initializeUser] Saved telegram_user_id to cookie:', result.user.telegram_user_id);
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

/**
 * Format Telegram user ID to 6-digit loyalty card number
 * Takes last 6 digits and pads with zeros if needed
 */
export function formatTelegramCardNumber(telegramId: number): string {
  const lastSix = telegramId.toString().slice(-6);
  return lastSix.padStart(6, '0');
}
