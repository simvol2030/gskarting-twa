import { db } from '$lib/server/db/client';
import { stores, storeImages } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Загружаем все активные магазины
	const allStores = await db
		.select()
		.from(stores)
		.where(eq(stores.is_active, true));

	// Загружаем изображения для всех магазинов
	const allImages = await db
		.select()
		.from(storeImages)
		.orderBy(asc(storeImages.sort_order));

	// Группируем изображения по store_id
	const imagesByStore = allImages.reduce((acc, img) => {
		if (!acc[img.store_id]) {
			acc[img.store_id] = [];
		}
		acc[img.store_id].push({
			id: img.id,
			url: `/api/uploads/stores/${img.filename}`
		});
		return acc;
	}, {} as Record<number, { id: number; url: string }[]>);

	// Добавляем изображения к магазинам
	const storesWithImages = allStores.map(store => ({
		...store,
		images: imagesByStore[store.id] || []
	}));

	return {
		stores: storesWithImages
	};
};
