/**
 * Mock API for Products Management
 * Based on API-CONTRACT-Products.md
 */

import type { Product, ProductFormData, ProductsListParams, ProductCategory, Pagination } from '$lib/types/admin';
import { mockProducts } from '$lib/data/adminMockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const productsAPI = {
	/**
	 * GET /api/admin/products - Список товаров
	 */
	async list(params: ProductsListParams = {}): Promise<{
		products: Product[];
		pagination: Pagination;
	}> {
		await delay(300);

		const {
			status = 'all',
			category = 'all',
			onSale = 'all',
			priceMin,
			priceMax,
			search = '',
			sortBy = 'name',
			sortOrder = 'asc',
			page = 1,
			limit = 20
		} = params;

		let filtered = [...mockProducts];

		// Filters
		if (status !== 'all') {
			filtered = filtered.filter((p) => p.isActive === (status === 'active'));
		}

		if (category !== 'all') {
			filtered = filtered.filter((p) => p.category === category);
		}

		if (onSale !== 'all') {
			const hasDiscount = (p: Product) => p.oldPrice !== null && p.oldPrice > p.price;
			filtered = filtered.filter((p) => (onSale === 'yes' ? hasDiscount(p) : !hasDiscount(p)));
		}

		if (priceMin) {
			filtered = filtered.filter((p) => p.price >= priceMin);
		}

		if (priceMax) {
			filtered = filtered.filter((p) => p.price <= priceMax);
		}

		if (search) {
			filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
		}

		// Sort
		filtered.sort((a, b) => {
			const aVal = a[sortBy as keyof Product];
			const bVal = b[sortBy as keyof Product];

			// Handle null/undefined values
			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return 1; // null values go to the end
			if (bVal == null) return -1;

			return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
		});

		// Pagination
		const total = filtered.length;
		const totalPages = Math.ceil(total / limit);
		const start = (page - 1) * limit;
		const products = filtered.slice(start, start + limit);

		return {
			products,
			pagination: { page, limit, total, totalPages }
		};
	},

	/**
	 * GET /api/admin/products/categories - Список категорий
	 */
	async getCategories(): Promise<ProductCategory[]> {
		await delay(200);

		const categoryMap = new Map<string, number>();
		mockProducts.forEach((p) => {
			categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
		});

		return Array.from(categoryMap.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => a.name.localeCompare(b.name));
	},

	/**
	 * POST /api/admin/products - Создать товар
	 */
	async create(data: ProductFormData): Promise<Product> {
		await delay(500);

		const newProduct: Product = {
			id: Date.now(),
			name: data.name,
			description: data.description ?? null,
			price: data.price,
			oldPrice: data.oldPrice ?? null,
			quantityInfo: data.quantityInfo ?? null,
			image: data.image,
			category: data.category,
			isActive: data.isActive,
			showOnHome: data.showOnHome,
			isRecommendation: data.isRecommendation
		};

		mockProducts.push(newProduct);
		return newProduct;
	},

	/**
	 * PUT /api/admin/products/:id - Обновить
	 */
	async update(id: number, data: ProductFormData): Promise<Product> {
		await delay(500);

		const index = mockProducts.findIndex((p) => p.id === id);
		if (index === -1) throw new Error('Товар не найден');

		mockProducts[index] = {
			...mockProducts[index],
			name: data.name,
			description: data.description ?? null,
			price: data.price,
			oldPrice: data.oldPrice ?? null,
			quantityInfo: data.quantityInfo ?? null,
			image: data.image,
			category: data.category,
			isActive: data.isActive,
			showOnHome: data.showOnHome,
			isRecommendation: data.isRecommendation
		};
		return mockProducts[index];
	},

	/**
	 * DELETE /api/admin/products/:id - Удалить
	 */
	async delete(id: number, soft = true): Promise<void> {
		await delay(300);

		if (soft) {
			const product = mockProducts.find((p) => p.id === id);
			if (product) product.isActive = false;
		} else {
			const index = mockProducts.findIndex((p) => p.id === id);
			if (index !== -1) mockProducts.splice(index, 1);
		}
	},

	/**
	 * PATCH /api/admin/products/:id/toggle-active
	 */
	async toggleActive(id: number, isActive: boolean): Promise<void> {
		await delay(200);

		const product = mockProducts.find((p) => p.id === id);
		if (!product) throw new Error('Товар не найден');

		product.isActive = isActive;
	},

	/**
	 * POST /api/admin/products/upload-image - Загрузка изображения
	 */
	async uploadImage(file: File): Promise<{ url: string; thumbnail: string }> {
		await delay(1000);

		// Mock: создать data URL
		const url = `/uploads/products/${Date.now()}.jpg`;
		const thumbnail = `/uploads/products/thumbs/${Date.now()}.jpg`;

		return { url, thumbnail };
	}
};
