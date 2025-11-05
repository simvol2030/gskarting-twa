import type { PageServerLoad } from './$types';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const BACKEND_URL = PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Data loader for Offers page - API VERSION
 * Fetches all active offers from backend API
 */
export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/content/offers`);

    if (!response.ok) {
      console.error('[OFFERS PAGE] API error:', response.status, response.statusText);
      // Return empty data on error instead of failing
      return {
        offers: []
      };
    }

    const data = await response.json();

    return {
      offers: data.offers || []
    };

  } catch (error) {
    console.error('[OFFERS PAGE] Failed to fetch offers:', error);
    // Return empty data on error instead of failing
    return {
      offers: []
    };
  }
};
