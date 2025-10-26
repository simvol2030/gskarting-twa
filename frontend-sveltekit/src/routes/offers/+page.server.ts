import { db } from '$lib/server/db/client';
import { offers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Data loader for Offers page - DATABASE VERSION
 */
export const load: PageServerLoad = async () => {
  const allOffers = await db
    .select()
    .from(offers)
    .where(eq(offers.is_active, true))
    .all();

  // Parse conditions JSON and map to camelCase
  const parsedOffers = allOffers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    description: offer.description,
    icon: offer.icon,
    iconColor: offer.icon_color, // snake_case -> camelCase
    deadline: offer.deadline,
    deadlineClass: offer.deadline_class, // snake_case -> camelCase
    details: offer.details,
    conditions: JSON.parse(offer.conditions),
    is_active: offer.is_active
  }));

  return {
    offers: parsedOffers
  };
};
