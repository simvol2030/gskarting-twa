import { db } from '$lib/server/db/client';
import { offers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Загружаем все активные акции
	const allOffers = await db
		.select()
		.from(offers)
		.where(eq(offers.is_active, true));

	return {
		offers: allOffers
	};
};
