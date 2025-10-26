import { db } from '$lib/server/db/client';
import { products } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Data loader for Products page - DATABASE VERSION
 */
export const load: PageServerLoad = async () => {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.is_active, true))
    .all();

  return {
    products: allProducts
  };
};
