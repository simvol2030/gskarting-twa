/**
 * Shop API Routes - Public endpoints for shop configuration
 * /api/shop/*
 */

import { Router } from 'express';
import { db } from '../../db/client';
import { deliveryLocations, shopSettings } from '../../db/schema';
import { eq, like, and, sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/shop/delivery-locations
 *
 * Get enabled delivery locations with optional search
 *
 * Query parameters:
 * - search: string (optional) - Search by location name
 * - limit: number (optional) - Max results to return (default: 100)
 *
 * Returns: Array of enabled delivery locations sorted by name
 */
router.get('/delivery-locations', async (req, res) => {
	try {
		const { search, limit = '100' } = req.query;
		const maxLimit = Math.min(parseInt(limit as string) || 100, 300);

		// Build query conditions
		const conditions = [eq(deliveryLocations.is_enabled, true)];

		if (search && typeof search === 'string') {
			conditions.push(like(deliveryLocations.name, `%${search}%`));
		}

		// Execute query
		const locations = await db
			.select({
				id: deliveryLocations.id,
				name: deliveryLocations.name,
				price: deliveryLocations.price
			})
			.from(deliveryLocations)
			.where(and(...conditions))
			.orderBy(deliveryLocations.name)
			.limit(maxLimit);

		res.json({
			success: true,
			data: locations,
			count: locations.length
		});
	} catch (error) {
		console.error('Error fetching delivery locations:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to fetch delivery locations'
		});
	}
});

/**
 * GET /api/shop/settings
 *
 * Get public shop settings (delivery configuration)
 *
 * Returns: Shop settings including:
 * - delivery_enabled: boolean
 * - pickup_enabled: boolean
 * - delivery_cost: number (global delivery cost in kopeks)
 * - free_delivery_from: number | null (free delivery threshold in kopeks)
 * - min_order_amount: number (minimum order amount in kopeks)
 * - currency: string
 */
router.get('/settings', async (req, res) => {
	try {
		const [settings] = await db
			.select({
				delivery_enabled: shopSettings.delivery_enabled,
				pickup_enabled: shopSettings.pickup_enabled,
				delivery_cost: shopSettings.delivery_cost,
				free_delivery_from: shopSettings.free_delivery_from,
				min_order_amount: shopSettings.min_order_amount,
				currency: shopSettings.currency
			})
			.from(shopSettings)
			.where(eq(shopSettings.id, 1))
			.limit(1);

		if (!settings) {
			return res.status(404).json({
				success: false,
				error: 'Shop settings not found'
			});
		}

		res.json({
			success: true,
			data: settings
		});
	} catch (error) {
		console.error('Error fetching shop settings:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to fetch shop settings'
		});
	}
});

export default router;
