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

export function getTelegramUser() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user;
}

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
