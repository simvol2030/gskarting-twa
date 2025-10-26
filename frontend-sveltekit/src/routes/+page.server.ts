import { db } from '$lib/server/db/client';
import { recommendations, offers, products } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Fetch recommendations (generic, not user-specific)
  const allRecommendations = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.is_active, true))
    .all();

  // Fetch offers
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

  // Fetch products
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.is_active, true))
    .all();

  // Берём первые 2 акции для "Акции месяца"
  const monthOffers = parsedOffers.slice(0, 2);

  // Берём первые 6 товаров для "Топовые товары"
  const topProducts = allProducts.slice(0, 6);

  return {
    recommendations: allRecommendations,
    monthOffers,
    topProducts
  };
};
