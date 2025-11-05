import type { PageServerLoad } from './$types';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const BACKEND_URL = PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Data loader for Products page - API VERSION
 * Fetches all active products from backend API
 */
export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/content/products`);

    if (!response.ok) {
      console.error('[PRODUCTS PAGE] API error:', response.status, response.statusText);
      // Return empty data on error instead of failing
      return {
        products: []
      };
    }

    const data = await response.json();

    return {
      products: data.products || []
    };

  } catch (error) {
    console.error('[PRODUCTS PAGE] Failed to fetch products:', error);
    // Return empty data on error instead of failing
    return {
      products: []
    };
  }
};
