import type { PageServerLoad } from './$types';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const BACKEND_URL = PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Data loader for Stores page - API VERSION
 * Fetches all active stores from backend API
 */
export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/content/stores`);

    if (!response.ok) {
      console.error('[STORES PAGE] API error:', response.status, response.statusText);
      // Return empty data on error instead of failing
      return {
        stores: []
      };
    }

    const data = await response.json();

    return {
      stores: data.stores || []
    };

  } catch (error) {
    console.error('[STORES PAGE] Failed to fetch stores:', error);
    // Return empty data on error instead of failing
    return {
      stores: []
    };
  }
};
