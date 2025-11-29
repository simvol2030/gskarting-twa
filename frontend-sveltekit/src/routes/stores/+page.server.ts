import { db } from '$lib/server/db/client';
import { stores } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Загружаем все активные магазины
	const allStores = await db
		.select()
		.from(stores)
		.where(eq(stores.is_active, true));

	return {
		stores: allStores
	};
};
