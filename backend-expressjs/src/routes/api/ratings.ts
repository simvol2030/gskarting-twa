import { Router, Request, Response } from 'express';
import { sendRatingToGroup } from '../../services/notifications';

const router = Router();

interface RatingRequestBody {
	rating: string;
	phone?: string;
	cause?: string;
	feedback?: string;
	timestamp: string;
}

/**
 * POST /api/ratings
 * Submit a customer rating/review
 *
 * Body:
 * - rating: string (required) - "Отлично" | "Хорошо" | "Удовлетворительно" | "Неудовлетворительно"
 * - phone: string (optional) - Customer phone number
 * - cause: string (optional) - Reason for rating
 * - feedback: string (optional) - Additional feedback text
 * - timestamp: string (required) - ISO 8601 timestamp
 */
router.post('/', async (req: Request, res: Response) => {
	try {
		const { rating, phone, cause, feedback, timestamp } = req.body as RatingRequestBody;

		// Validate required fields
		if (!rating) {
			return res.status(400).json({
				success: false,
				error: 'Rating is required'
			});
		}

		if (!timestamp) {
			return res.status(400).json({
				success: false,
				error: 'Timestamp is required'
			});
		}

		// Validate rating value
		const validRatings = ['Отлично', 'Хорошо', 'Удовлетворительно', 'Неудовлетворительно'];
		if (!validRatings.includes(rating)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid rating value'
			});
		}

		console.log('[Ratings API] Received rating submission:', {
			rating,
			hasPhone: !!phone,
			hasCause: !!cause,
			hasFeedback: !!feedback,
			timestamp
		});

		// Send to Telegram group
		const sent = await sendRatingToGroup({
			rating,
			phone,
			cause,
			feedback,
			timestamp
		});

		if (!sent) {
			console.warn('[Ratings API] Failed to send to Telegram, but returning success');
		}

		// Always return success to client (notification failures shouldn't block UI)
		return res.status(200).json({
			success: true,
			message: 'Rating submitted successfully'
		});

	} catch (error) {
		console.error('[Ratings API] Error processing rating:', error);
		return res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

export default router;
