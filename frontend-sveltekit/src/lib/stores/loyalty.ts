import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const theme = writable<'light' | 'dark'>('light');

export function initTheme() {
  if (!browser) return;

  // Check for saved theme preference
  const saved = localStorage.getItem('murzico_theme');
  if (saved && (saved === 'light' || saved === 'dark')) {
    theme.set(saved);
    applyTheme(saved);
    return;
  }

  // Check Telegram Web App
  if (window.Telegram?.WebApp?.colorScheme) {
    const tgTheme = window.Telegram.WebApp.colorScheme as 'light' | 'dark';
    theme.set(tgTheme);
    applyTheme(tgTheme);
    return;
  }

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.set('dark');
    applyTheme('dark');
  } else {
    theme.set('light');
    applyTheme('light');
  }
}

export function toggleTheme() {
  theme.update((t) => {
    const newTheme = t === 'light' ? 'dark' : 'light';
    if (browser) {
      localStorage.setItem('murzico_theme', newTheme);
      applyTheme(newTheme);
    }
    return newTheme;
  });
}

function applyTheme(t: 'light' | 'dark') {
  if (!browser) return;

  if (t === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateMetaThemeColor('#17212b');
  } else {
    document.documentElement.removeAttribute('data-theme');
    updateMetaThemeColor('#ff6b00');
  }
}

function updateMetaThemeColor(color: string) {
  if (!browser) return;

  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color);
  }
}
