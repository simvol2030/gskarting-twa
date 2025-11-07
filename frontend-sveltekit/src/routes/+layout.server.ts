import { db } from '$lib/server/db/client';
import { loyaltyUsers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

/**
 * Root layout data loader
 *
 * DATABASE VERSION:
 * - Loads demo user as fallback (for testing in browser)
 * - Real user data fetched client-side via initializeUser() API
 * - ProfileCard component merges Telegram SDK data instantly
 */
export const load: LayoutServerLoad = () => {
  // Demo user data for non-Telegram testing
  const demoUser = {
    id: 0, // Demo user ID
    name: 'Демо Пользователь',
    cardNumber: '000000', // 6 digits
    balance: 500, // Default welcome bonus amount
    totalPurchases: 0,
    totalSaved: 0
  };

  // Loyalty rules (static config)
  const loyaltyRules = {
    earning: {
      icon: '💰',
      title: 'Начисление',
      value: '4% от покупки'
    },
    payment: {
      icon: '🎯',
      title: 'Оплата',
      value: 'До 20% чека'
    },
    expiry: {
      icon: '⏱️',
      title: 'Срок',
      value: '45 дней'
    },
    detailedRulesLink: '/profile',
    detailedRulesText: 'Подробные правила программы лояльности'
  };

  return {
    user: demoUser,
    loyaltyRules,
    isDemoMode: true // Frontend will override with real Telegram data
  };
};
