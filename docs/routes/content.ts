/**
 * Content API Routes
 * Public endpoints for TWA content (recommendations, offers, products, stores)
 *
 * These endpoints replace direct DB access from frontend due to WSL/Windows conflict
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { recommendations, offers, products, stores } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// ==================== GET /api/content/home ====================
/**
 * Get homepage data (recommendations + offers + products)
 *
 * Response:
 * {
 *   "recommendations": Recommendation[],
 *   "monthOffers": Offer[],      // First 2 active offers
 *   "topProducts": Product[]      // First 6 active products
 * }
 */
router.get('/home', async (req: Request, res: Response) => {
	try {
		// Fetch recommendations (active only)
		const recommendationsList = await db
			.select()
			.from(recommendations)
			.where(eq(recommendations.is_active, true))
			.all();

		// Fetch first 2 active offers
		const offersList = await db
			.select()
			.from(offers)
			.where(eq(offers.is_active, true))
			.limit(2)
			.all();

		// Fetch first 6 active products
		const productsList = await db
			.select()
			.from(products)
			.where(eq(products.is_active, true))
			.limit(6)
			.all();

		// Transform offers to match frontend format
		const transformedOffers = offersList.map(offer => ({
			...offer,
			conditions: JSON.parse(offer.conditions) // Parse JSON string to array
		}));

		return res.json({
			recommendations: recommendationsList,
			monthOffers: transformedOffers,
			topProducts: productsList
		});

	} catch (error) {
		console.error('[CONTENT API] Error fetching home data:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details: process.env.NODE_ENV === 'development' ? String(error) : undefined
		});
	}
});

// ==================== GET /api/content/offers ====================
/**
 * Get all active offers
 *
 * Response:
 * {
 *   "offers": Offer[]
 * }
 */
router.get('/offers', async (req: Request, res: Response) => {
	try {
		const offersList = await db
			.select()
			.from(offers)
			.where(eq(offers.is_active, true))
			.all();

		// Transform offers to match frontend format
		const transformedOffers = offersList.map(offer => ({
			...offer,
			conditions: JSON.parse(offer.conditions) // Parse JSON string to array
		}));

		return res.json({
			offers: transformedOffers
		});

	} catch (error) {
		console.error('[CONTENT API] Error fetching offers:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details: process.env.NODE_ENV === 'development' ? String(error) : undefined
		});
	}
});

// ==================== GET /api/content/stores ====================
/**
 * Get all active stores
 *
 * Response:
 * {
 *   "stores": Store[]
 * }
 */
router.get('/stores', async (req: Request, res: Response) => {
	try {
		const storesList = await db
			.select()
			.from(stores)
			.where(eq(stores.is_active, true))
			.all();

		// Transform stores to match frontend format
		const transformedStores = storesList.map(store => ({
			...store,
			features: JSON.parse(store.features) // Parse JSON string to array
		}));

		return res.json({
			stores: transformedStores
		});

	} catch (error) {
		console.error('[CONTENT API] Error fetching stores:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details: process.env.NODE_ENV === 'development' ? String(error) : undefined
		});
	}
});

// ==================== GET /api/content/products ====================
/**
 * Get all active products
 *
 * Response:
 * {
 *   "products": Product[]
 * }
 */
router.get('/products', async (req: Request, res: Response) => {
	try {
		const productsList = await db
			.select()
			.from(products)
			.where(eq(products.is_active, true))
			.all();

		return res.json({
			products: productsList
		});

	} catch (error) {
		console.error('[CONTENT API] Error fetching products:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details: process.env.NODE_ENV === 'development' ? String(error) : undefined
		});
	}
});

export default router;
