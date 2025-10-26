import { db } from '$lib/server/db/client';
import { stores } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Data loader for Stores page - DATABASE VERSION
 */
export const load: PageServerLoad = async () => {
  const allStores = await db
    .select()
    .from(stores)
    .where(eq(stores.is_active, true))
    .all();

  // Parse features JSON string to array and restructure coords
  const parsedStores = allStores.map((store) => ({
    ...store,
    features: JSON.parse(store.features),
    coords: {
      lat: store.coords_lat,
      lng: store.coords_lng
    }
  }));

  return {
    stores: parsedStores
  };
};
