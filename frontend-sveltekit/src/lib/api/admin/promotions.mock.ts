/**
 * Mock API for Promotions Management
 * Based on API-CONTRACT-Promotions.md
 */

import type {
	Promotion,
	PromotionFormData,
	PromotionsListParams,
	Pagination
} from '$lib/types/admin';

import { mockPromotions } from '$lib/data/adminMockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const promotionsAPI = {
	/**
	 * GET /api/admin/promotions - Список акций
	 */
	async list(params: PromotionsListParams = {}): Promise<{
		promotions: Promotion[];
		pagination: Pagination;
	}> {
		await delay(300);

		const { status = 'all', search = '', page = 1, limit = 20 } = params;

		let filtered = [...mockPromotions];

		// Status filter
		if (status !== 'all') {
			filtered = filtered.filter((p) => p.isActive === (status === 'active'));
		}

		// Search filter
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.title.toLowerCase().includes(searchLower) ||
					p.description.toLowerCase().includes(searchLower)
			);
		}

		// Pagination
		const total = filtered.length;
		const totalPages = Math.ceil(total / limit);
		const start = (page - 1) * limit;
		const promotions = filtered.slice(start, start + limit);

		return {
			promotions,
			pagination: { page, limit, total, totalPages }
		};
	},

	/**
	 * GET /api/admin/promotions/:id - Получить акцию по ID
	 */
	async getById(id: number): Promise<Promotion | null> {
		await delay(200);
		return mockPromotions.find((p) => p.id === id) || null;
	},

	/**
	 * POST /api/admin/promotions - Создать акцию
	 */
	async create(data: PromotionFormData): Promise<Promotion> {
		await delay(500);

		const newPromotion: Promotion = {
			id: Date.now(),
			...data,
			createdAt: new Date().toISOString()
		};

		mockPromotions.push(newPromotion);
		return newPromotion;
	},

	/**
	 * PUT /api/admin/promotions/:id - Обновить акцию
	 */
	async update(id: number, data: PromotionFormData): Promise<Promotion> {
		await delay(500);

		const index = mockPromotions.findIndex((p) => p.id === id);
		if (index === -1) throw new Error('Акция не найдена');

		const updated = {
			...mockPromotions[index],
			...data,
			updatedAt: new Date().toISOString()
		};

		mockPromotions[index] = updated;
		return updated;
	},

	/**
	 * DELETE /api/admin/promotions/:id - Удалить акцию
	 */
	async delete(id: number, soft = true): Promise<void> {
		await delay(300);

		if (soft) {
			const promo = mockPromotions.find((p) => p.id === id);
			if (promo) promo.isActive = false;
		} else {
			const index = mockPromotions.findIndex((p) => p.id === id);
			if (index !== -1) mockPromotions.splice(index, 1);
		}
	},

	/**
	 * PATCH /api/admin/promotions/:id/toggle-active - Включить/выключить
	 */
	async toggleActive(id: number, isActive: boolean): Promise<void> {
		await delay(200);

		const promo = mockPromotions.find((p) => p.id === id);
		if (!promo) throw new Error('Акция не найдена');

		promo.isActive = isActive;
	}
};
