/**
 * Public Stories Routes
 * API для отображения stories на фронтенде и записи просмотров
 */

import { Router, Request, Response } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '../db/client';
import {
	storiesHighlights,
	storiesItems,
	storiesSettings,
	storiesViews
} from '../db/schema';

const router = Router();

// =====================================================
// PUBLIC API
// =====================================================

// GET /api/stories - Get stories for display on frontend
router.get('/', async (req: Request, res: Response) => {
	try {
		// Get settings
		let [settings] = await db.select().from(storiesSettings).where(eq(storiesSettings.id, 1));

		// Initialize if not exists
		if (!settings) {
			[settings] = await db.insert(storiesSettings).values({ id: 1 }).returning();
		}

		// If stories disabled, return empty
		if (!settings.enabled) {
			return res.json({
				success: true,
				data: {
					enabled: false,
					settings: null,
					highlights: []
				}
			});
		}

		// Get active highlights ordered by position
		const highlights = await db
			.select()
			.from(storiesHighlights)
			.where(eq(storiesHighlights.is_active, true))
			.orderBy(asc(storiesHighlights.position));

		// Get items for each highlight
		const highlightsWithItems = await Promise.all(
			highlights.map(async (highlight) => {
				const items = await db
					.select()
					.from(storiesItems)
					.where(and(
						eq(storiesItems.highlight_id, highlight.id),
						eq(storiesItems.is_active, true)
					))
					.orderBy(asc(storiesItems.position));

				return {
					id: highlight.id,
					title: highlight.title,
					coverImage: highlight.cover_image,
					position: highlight.position,
					updatedAt: highlight.updated_at,
					items: items.map(item => ({
						id: item.id,
						type: item.type,
						mediaUrl: item.media_url,
						thumbnailUrl: item.thumbnail_url,
						duration: item.duration,
						linkUrl: item.link_url,
						linkText: item.link_text,
						position: item.position,
						createdAt: item.created_at
					}))
				};
			})
		);

		// Filter out highlights without items
		const filteredHighlights = highlightsWithItems.filter(h => h.items.length > 0);

		// Parse gradient
		let borderGradient = null;
		if (settings.border_gradient) {
			try {
				borderGradient = JSON.parse(settings.border_gradient);
			} catch {
				borderGradient = null;
			}
		}

		res.json({
			success: true,
			data: {
				enabled: true,
				settings: {
					shape: settings.shape,
					borderWidth: settings.border_width,
					borderColor: settings.border_color,
					borderGradient,
					showTitle: settings.show_title,
					titlePosition: settings.title_position,
					highlightSize: settings.highlight_size
				},
				highlights: filteredHighlights
			}
		});
	} catch (error) {
		console.error('[Stories] Error fetching stories:', error);
		res.status(500).json({ success: false, error: 'Failed to fetch stories' });
	}
});

// POST /api/stories/view - Record a view
router.post('/view', async (req: Request, res: Response) => {
	try {
		const {
			storyItemId,
			userId,
			sessionId,
			viewDuration = 0,
			completed = false,
			linkClicked = false
		} = req.body;

		// Validate storyItemId is a positive integer
		const parsedItemId = typeof storyItemId === 'number' ? storyItemId : parseInt(storyItemId, 10);
		if (!storyItemId || isNaN(parsedItemId) || parsedItemId <= 0) {
			return res.status(400).json({ success: false, error: 'Valid storyItemId is required' });
		}

		// Verify item exists
		const [item] = await db
			.select({ id: storiesItems.id })
			.from(storiesItems)
			.where(eq(storiesItems.id, parsedItemId));

		if (!item) {
			return res.status(404).json({ success: false, error: 'Story item not found' });
		}

		// Record view
		await db.insert(storiesViews).values({
			story_item_id: parsedItemId,
			user_id: userId ? (typeof userId === 'number' ? userId : parseInt(userId, 10)) : null,
			session_id: sessionId ? String(sessionId).slice(0, 255) : null,
			view_duration: Math.max(0, Number(viewDuration) || 0),
			completed: Boolean(completed),
			link_clicked: Boolean(linkClicked)
		});

		res.json({ success: true });
	} catch (error) {
		console.error('[Stories] Error recording view:', error);
		res.status(500).json({ success: false, error: 'Failed to record view' });
	}
});

export default router;
