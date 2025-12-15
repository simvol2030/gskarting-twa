/**
 * Product Variations queries
 * CRUD операции для вариаций товаров
 */

import { db } from '../client';
import { productVariations, products, type ProductVariation, type NewProductVariation } from '../schema';
import { eq, and, asc, desc } from 'drizzle-orm';

/**
 * Получить все вариации товара
 */
export async function getVariationsByProductId(productId: number): Promise<ProductVariation[]> {
	return db
		.select()
		.from(productVariations)
		.where(eq(productVariations.product_id, productId))
		.orderBy(asc(productVariations.position), asc(productVariations.id));
}

/**
 * Получить активные вариации товара
 */
export async function getActiveVariationsByProductId(productId: number): Promise<ProductVariation[]> {
	return db
		.select()
		.from(productVariations)
		.where(
			and(
				eq(productVariations.product_id, productId),
				eq(productVariations.is_active, true)
			)
		)
		.orderBy(asc(productVariations.position), asc(productVariations.id));
}

/**
 * Получить вариацию по ID
 */
export async function getVariationById(id: number): Promise<ProductVariation | null> {
	const result = await db
		.select()
		.from(productVariations)
		.where(eq(productVariations.id, id))
		.limit(1);
	return result[0] || null;
}

/**
 * Получить вариацию по умолчанию для товара
 */
export async function getDefaultVariation(productId: number): Promise<ProductVariation | null> {
	const result = await db
		.select()
		.from(productVariations)
		.where(
			and(
				eq(productVariations.product_id, productId),
				eq(productVariations.is_default, true),
				eq(productVariations.is_active, true)
			)
		)
		.limit(1);

	// Если нет вариации по умолчанию, вернуть первую активную
	if (!result[0]) {
		const firstActive = await db
			.select()
			.from(productVariations)
			.where(
				and(
					eq(productVariations.product_id, productId),
					eq(productVariations.is_active, true)
				)
			)
			.orderBy(asc(productVariations.position))
			.limit(1);
		return firstActive[0] || null;
	}

	return result[0];
}

/**
 * Создать вариацию
 */
export async function createVariation(data: NewProductVariation): Promise<ProductVariation> {
	// Если это первая вариация или помечена как default, сбросить другие
	if (data.is_default) {
		await db
			.update(productVariations)
			.set({ is_default: false })
			.where(eq(productVariations.product_id, data.product_id));
	}

	const result = await db
		.insert(productVariations)
		.values(data)
		.returning();

	return result[0];
}

/**
 * Обновить вариацию
 */
export async function updateVariation(
	id: number,
	data: Partial<Omit<ProductVariation, 'id' | 'product_id' | 'created_at'>>
): Promise<ProductVariation | null> {
	// Если устанавливается как default, сбросить у других
	if (data.is_default === true) {
		const variation = await getVariationById(id);
		if (variation) {
			await db
				.update(productVariations)
				.set({ is_default: false })
				.where(eq(productVariations.product_id, variation.product_id));
		}
	}

	const result = await db
		.update(productVariations)
		.set({
			...data,
			updated_at: new Date().toISOString()
		})
		.where(eq(productVariations.id, id))
		.returning();

	return result[0] || null;
}

/**
 * Удалить вариацию
 */
export async function deleteVariation(id: number): Promise<boolean> {
	const result = await db
		.delete(productVariations)
		.where(eq(productVariations.id, id))
		.returning();

	return result.length > 0;
}

/**
 * Удалить все вариации товара
 */
export async function deleteAllVariations(productId: number): Promise<number> {
	const result = await db
		.delete(productVariations)
		.where(eq(productVariations.product_id, productId))
		.returning();

	return result.length;
}

/**
 * Массовое создание вариаций (для импорта)
 */
export async function createVariationsBulk(
	productId: number,
	variations: Array<Omit<NewProductVariation, 'product_id'>>
): Promise<ProductVariation[]> {
	if (variations.length === 0) return [];

	// Удалить существующие вариации
	await deleteAllVariations(productId);

	// Создать новые
	const result = await db
		.insert(productVariations)
		.values(variations.map((v, index) => ({
			...v,
			product_id: productId,
			position: v.position ?? index,
			is_default: v.is_default ?? (index === 0) // Первая по умолчанию
		})))
		.returning();

	return result;
}

/**
 * Обновить позиции вариаций (для drag-and-drop)
 */
export async function updateVariationsOrder(
	productId: number,
	orderedIds: number[]
): Promise<void> {
	for (let i = 0; i < orderedIds.length; i++) {
		await db
			.update(productVariations)
			.set({ position: i })
			.where(
				and(
					eq(productVariations.id, orderedIds[i]),
					eq(productVariations.product_id, productId)
				)
			);
	}
}

/**
 * Проверить есть ли у товара вариации
 */
export async function hasVariations(productId: number): Promise<boolean> {
	const result = await db
		.select({ id: productVariations.id })
		.from(productVariations)
		.where(
			and(
				eq(productVariations.product_id, productId),
				eq(productVariations.is_active, true)
			)
		)
		.limit(1);

	return result.length > 0;
}
