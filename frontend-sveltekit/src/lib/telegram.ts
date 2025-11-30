/**
 * Telegram Web App utilities
 * Handles user initialization, balance formatting, and TWA SDK integration
 */

// Note: Window.Telegram interface is declared in app.d.ts

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot?: boolean;
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
  message: string;
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Ensures Telegram Web App is ready and scroll is enabled
 * CRITICAL: Must be called early in app lifecycle (in +layout.svelte onMount)
 * to prevent scroll issues on production builds
 */
export function ensureTelegramReady(): void {
  if (typeof window === 'undefined') return;

  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.log('[ensureTelegramReady] Not running in Telegram Web App');
    return;
  }

  console.log('[ensureTelegramReady] Telegram Web App detected');

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
 * Extract and format Telegram user data for backend (from SDK directly)
 */
export function extractTelegramUserData(): TelegramWebAppUser | null {
  const user = getTelegramUser();
  if (!user) return null;

  return extractTelegramUserDataFromObject(user);
}

/**
 * Extract Telegram user data from TelegramUser object (not from SDK directly)
 * Used to avoid race conditions when user is already pre-fetched
 */
export function extractTelegramUserDataFromObject(user: TelegramUser): TelegramWebAppUser | null {
  console.log('[extractUserData] 🔍 Step 1: Received user object:', JSON.stringify(user, null, 2));

  // Validate user object existence
  if (!user) {
    console.error('[extractUserData] ❌ CRITICAL: user is null or undefined');
    return null;
  }

  console.log('[extractUserData] 🔍 Step 2: Validating required fields...');
  console.log('[extractUserData] 🔍   - user.id:', user.id, '(type:', typeof user.id, ')');
  console.log('[extractUserData] 🔍   - user.first_name:', user.first_name, '(type:', typeof user.first_name, ')');

  // Check required fields
  if (!user.id && user.id !== 0) {
    console.error('[extractUserData] ❌ CRITICAL: user.id is missing or falsy!');
    console.error('[extractUserData] 🔍 Full user object:', JSON.stringify(user, null, 2));
    return null;
  }

  if (!user.first_name) {
    console.error('[extractUserData] ❌ CRITICAL: user.first_name is missing or falsy!');
    console.error('[extractUserData] 🔍 Full user object:', JSON.stringify(user, null, 2));
    return null;
  }

  // Convert id to number if it's a string (defensive programming)
  const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

  if (isNaN(userId)) {
    console.error('[extractUserData] ❌ CRITICAL: user.id is not a valid number!', user.id);
    return null;
  }

  console.log('[extractUserData] ✅ Step 3: Validation passed. Creating TelegramWebAppUser object...');

  const result = {
    telegram_user_id: userId,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code,
    chat_id: userId // For private chats, chat_id equals user id
  };

  console.log('[extractUserData] ✅ Step 4: Successfully created:', JSON.stringify(result, null, 2));

  return result;
}

/**
 * Initialize user on first app launch
 * Awards 500 Murzikoyns on first login
 *
 * @param storeId - Which of 6 stores user registered from (from QR code parameter)
 * @param telegramUser - Pre-fetched Telegram user data (to avoid double-waiting and race condition)
 */
export async function initializeUser(
  storeId?: number,
  telegramUser?: TelegramUser | null
): Promise<InitUserResponse | null> {
  console.log('[initializeUser] 🔍 ============ FUNCTION START ============');
  console.log('[initializeUser] 🔍 Parameters:', { storeId, hasTelegramUser: !!telegramUser });

  // IMPORTANT: Use pre-fetched user data if provided (prevents double-wait race condition)
  let user = telegramUser;

  // Only wait if not provided
  if (!user) {
    console.log('[initializeUser] 🔍 No user provided, waiting for Telegram user data...');
    user = await waitForTelegramUser(5000);
    console.log('[initializeUser] 🔍 waitForTelegramUser() returned:', JSON.stringify(user, null, 2));
  } else {
    console.log('[initializeUser] ✅ Using pre-fetched Telegram user');
    console.log('[initializeUser] 🔍 Pre-fetched user object:', JSON.stringify(telegramUser, null, 2));
  }

  if (!user) {
    console.error('[initializeUser] ❌ CRITICAL: Telegram user data not available');
    console.error('[initializeUser] 🔍 Diagnostic info:', {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      hasInitData: !!window.Telegram?.WebApp?.initDataUnsafe,
      hasUser: !!window.Telegram?.WebApp?.initDataUnsafe?.user
    });
    return null;
  }

  console.log('[initializeUser] ✅ Telegram user data available:', user.first_name);

  console.log('[initializeUser] 🔍 Step 1: Calling extractTelegramUserDataFromObject()...');

  const userData = extractTelegramUserDataFromObject(user);

  console.log('[initializeUser] 🔍 Step 2: extractTelegramUserDataFromObject() returned:', userData ? 'SUCCESS' : 'NULL');

  if (!userData) {
    console.error('[initializeUser] ❌ CRITICAL: Failed to extract user data');
    console.error('[initializeUser] 🔍 Original user object that failed validation:', JSON.stringify(user, null, 2));
    return null;
  }

  console.log('[initializeUser] ✅ Step 3: User data extracted successfully');
  console.log('[initializeUser] 🔍 Extracted userData:', JSON.stringify(userData, null, 2));

  try {
    console.log('[initializeUser] 🔍 Step 4: Preparing fetch() request...');

    const requestBody = {
      ...userData,
      store_id: storeId
    };

    console.log('[initializeUser] 🔍 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('[initializeUser] 📡 Step 5: Calling fetch() to /api/telegram/init...');

    const response = await fetch('/api/telegram/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[initializeUser] ✅ Step 6: fetch() completed');
    console.log('[initializeUser] 🔍 Response status:', response.status, response.statusText);
    console.log('[initializeUser] 🔍 Response headers:', JSON.stringify([...response.headers], null, 2));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[initializeUser] ❌ HTTP error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    console.log('[initializeUser] 🔍 Step 7: Parsing JSON response...');
    const result: InitUserResponse = await response.json();
    console.log('[initializeUser] ✅ Step 8: Response parsed:', JSON.stringify(result, null, 2));

    // If new user, they received 500 bonus coins
    if (result.isNewUser && result.success) {
      console.log('[initializeUser] 🎉 New user initialized with 500 Murzikoyns bonus');
    } else {
      console.log('[initializeUser] 👤 Existing user logged in');
    }

    // Save telegram_user_id to cookie for server-side access
    if (result.success && typeof document !== 'undefined') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `telegram_user_id=${result.user.telegram_user_id}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
      console.log('[initializeUser] 🍪 Saved telegram_user_id to cookie:', result.user.telegram_user_id);
    }

    console.log('[initializeUser] ✅ ============ FUNCTION SUCCESS ============');
    return result;
  } catch (error) {
    console.error('[initializeUser] ❌ ============ FUNCTION ERROR ============');
    console.error('[initializeUser] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[initializeUser] ❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('[initializeUser] ❌ Error stack:', error instanceof Error ? error.stack : 'N/A');

    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[initializeUser] ❌ NETWORK ERROR: fetch() failed - possible CORS or network issue');
    }

    return null;
  }
}

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format Telegram user ID to 6-digit loyalty card number
 * Takes last 6 digits, pads with zeros if needed
 */
export function formatTelegramCardNumber(telegramUserId: number): string {
  return telegramUserId.toString().slice(-6).padStart(6, '0');
}
