import {
	getCampaignById,
	createCampaign,
	updateCampaign,
	addCampaignRecipients,
	getPendingRecipients,
	updateRecipientStatus,
	updateRecipientsStatus,
	updateCampaignStats,
	startCampaignSending,
	completeCampaign,
	getCampaignRecipientsStats
} from '../db/queries/campaigns';
import { getSegmentUserIds, getAllActiveUserIds, type SegmentFilters } from './segmentationService';
import { safeJsonParse, sleep, withRetry } from '../utils/helpers';
import type { NewCampaign } from '../db/schema';

// Configuration from environment
const TELEGRAM_BOT_URL = process.env.TELEGRAM_BOT_URL || 'http://localhost:2017';
const BATCH_SIZE = parseInt(process.env.CAMPAIGN_BATCH_SIZE || '25');
const RATE_LIMIT_MS = parseInt(process.env.CAMPAIGN_RATE_LIMIT_MS || '35');
const BATCH_DELAY_MS = parseInt(process.env.CAMPAIGN_BATCH_DELAY_MS || '1000');
const MAX_EXECUTION_MS = parseInt(process.env.CAMPAIGN_MAX_EXECUTION_MS || '300000'); // 5 minutes

/**
 * Персонализация текста сообщения
 */
export function personalizeMessage(
	template: string,
	user: {
		first_name?: string | null;
		last_name?: string | null;
		current_balance?: number;
		card_number?: string | null;
		total_purchases?: number;
	}
): string {
	return template
		.replace(/\{first_name\}/g, user.first_name || 'Друг')
		.replace(/\{last_name\}/g, user.last_name || '')
		.replace(/\{balance\}/g, String(user.current_balance || 0))
		.replace(/\{card_number\}/g, user.card_number || '')
		.replace(/\{total_purchases\}/g, String(user.total_purchases || 0));
}

/**
 * Подготовить кампанию к отправке (выбрать получателей)
 */
export async function prepareCampaign(campaignId: number): Promise<{ success: boolean; recipientsCount: number; error?: string }> {
	const campaign = await getCampaignById(campaignId);
	if (!campaign) {
		return { success: false, recipientsCount: 0, error: 'Кампания не найдена' };
	}

	if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
		return { success: false, recipientsCount: 0, error: `Кампания в статусе "${campaign.status}" не может быть подготовлена` };
	}

	// Получаем ID пользователей по фильтрам
	let userIds: number[];

	if (campaign.target_type === 'all') {
		userIds = await getAllActiveUserIds();
	} else {
		const filters = safeJsonParse<SegmentFilters>(campaign.target_filters, {});
		userIds = await getSegmentUserIds(filters);
	}

	if (userIds.length === 0) {
		return { success: false, recipientsCount: 0, error: 'Не найдено получателей по заданным фильтрам' };
	}

	// Добавляем получателей
	await addCampaignRecipients(campaignId, userIds);

	// Обновляем статистику
	await updateCampaignStats(campaignId, { total_recipients: userIds.length });

	return { success: true, recipientsCount: userIds.length };
}

/**
 * Отправить сообщение в Telegram с retry логикой
 */
async function sendTelegramMessage(
	chatId: number,
	text: string,
	imageUrl?: string | null,
	buttonText?: string | null,
	buttonUrl?: string | null
): Promise<{ success: boolean; error?: string; retryable?: boolean }> {
	try {
		const result = await withRetry(
			async () => {
				const response = await fetch(`${TELEGRAM_BOT_URL}/send-campaign-message`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						chatId,
						text,
						imageUrl,
						buttonText,
						buttonUrl
					})
				});

				if (!response.ok) {
					const errorText = await response.text();

					// Don't retry client errors (4xx) - user blocked bot, etc.
					if (response.status >= 400 && response.status < 500) {
						throw Object.assign(new Error(errorText), { retryable: false });
					}

					// Retry server errors (5xx)
					throw Object.assign(new Error(errorText), { retryable: true });
				}

				return { success: true };
			},
			{
				maxRetries: 3,
				initialDelay: 500,
				maxDelay: 5000,
				shouldRetry: (error: any) => error.retryable !== false
			}
		);

		return result;
	} catch (error: any) {
		// Sanitize error message
		const errorMessage = error.message?.substring(0, 200) || 'Unknown error';
		return { success: false, error: errorMessage };
	}
}

/**
 * Отправить batch сообщений
 */
export async function sendCampaignBatch(
	campaignId: number,
	batchSize: number = BATCH_SIZE
): Promise<{ sent: number; failed: number; remaining: number }> {
	const campaign = await getCampaignById(campaignId);
	if (!campaign) {
		throw new Error('Кампания не найдена');
	}

	// Получаем pending получателей
	const recipients = await getPendingRecipients(campaignId, batchSize);

	const sentIds: number[] = [];
	const failedResults: { id: number; error?: string }[] = [];

	for (const recipient of recipients) {
		// Персонализируем сообщение
		const personalizedText = personalizeMessage(campaign.message_text, {
			first_name: recipient.first_name,
			last_name: recipient.last_name,
			current_balance: recipient.current_balance,
			card_number: recipient.card_number,
			total_purchases: recipient.total_purchases
		});

		// Rate limiting
		await sleep(RATE_LIMIT_MS);

		const result = await sendTelegramMessage(
			recipient.chat_id,
			personalizedText,
			campaign.message_image,
			campaign.button_text,
			campaign.button_url
		);

		if (result.success) {
			sentIds.push(recipient.id);
		} else {
			failedResults.push({ id: recipient.id, error: result.error });
		}
	}

	// Bulk update sent recipients
	if (sentIds.length > 0) {
		await updateRecipientsStatus(sentIds, 'delivered');
	}

	// Update failed recipients individually (to store error messages)
	for (const { id, error } of failedResults) {
		await updateRecipientStatus(id, 'failed', error);
	}

	// Update campaign stats - FIX: Don't double-count delivered
	const stats = await getCampaignRecipientsStats(campaignId);
	await updateCampaignStats(campaignId, {
		sent_count: stats.sent,
		delivered_count: stats.delivered,
		failed_count: stats.failed
	});

	return {
		sent: sentIds.length,
		failed: failedResults.length,
		remaining: stats.pending
	};
}

/**
 * Запустить полную отправку кампании с таймаутом
 */
export async function startCampaign(campaignId: number): Promise<{ success: boolean; error?: string }> {
	const campaign = await getCampaignById(campaignId);
	if (!campaign) {
		return { success: false, error: 'Кампания не найдена' };
	}

	if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
		return { success: false, error: `Кампания в статусе "${campaign.status}" не может быть запущена` };
	}

	// Подготавливаем получателей если еще не подготовлены
	if (campaign.total_recipients === 0) {
		const prepResult = await prepareCampaign(campaignId);
		if (!prepResult.success) {
			return { success: false, error: prepResult.error };
		}
	}

	// Обновляем статус на sending
	await startCampaignSending(campaignId);

	const startTime = Date.now();
	let hasMore = true;
	let timedOut = false;

	// Отправляем батчами с таймаутом
	while (hasMore) {
		// Check timeout
		if (Date.now() - startTime > MAX_EXECUTION_MS) {
			console.warn(`[CAMPAIGN] Campaign #${campaignId} timed out after ${MAX_EXECUTION_MS}ms`);
			timedOut = true;
			break;
		}

		const result = await sendCampaignBatch(campaignId, BATCH_SIZE);
		hasMore = result.remaining > 0;

		// Пауза между батчами
		if (hasMore) {
			await sleep(BATCH_DELAY_MS);
		}
	}

	if (timedOut) {
		// Campaign will continue on next scheduled check
		console.log(`[CAMPAIGN] Campaign #${campaignId} will continue on next run`);
		return { success: true };
	}

	// Завершаем кампанию
	await completeCampaign(campaignId);

	return { success: true };
}

/**
 * Создать и сразу запустить кампанию
 */
export async function createAndSendCampaign(
	data: NewCampaign,
	filters?: SegmentFilters
): Promise<{ success: boolean; campaignId?: number; error?: string }> {
	// Создаем кампанию
	const campaign = await createCampaign({
		...data,
		target_type: filters ? 'segment' : 'all',
		target_filters: filters ? JSON.stringify(filters) : null,
		trigger_type: data.trigger_type || 'manual',
		status: 'draft'
	});

	if (!campaign) {
		return { success: false, error: 'Не удалось создать кампанию' };
	}

	// Запускаем
	const result = await startCampaign(campaign.id);

	return {
		success: result.success,
		campaignId: campaign.id,
		error: result.error
	};
}

/**
 * Создать кампанию для конкретных пользователей и отправить
 */
export async function sendToUsers(
	userIds: number[],
	data: Omit<NewCampaign, 'target_type' | 'target_filters' | 'status'>
): Promise<{ success: boolean; campaignId?: number; error?: string }> {
	if (userIds.length === 0) {
		return { success: false, error: 'Нет получателей' };
	}

	// Создаем кампанию
	const campaign = await createCampaign({
		...data,
		target_type: 'segment',
		target_filters: null,
		status: 'draft',
		total_recipients: userIds.length
	});

	if (!campaign) {
		return { success: false, error: 'Не удалось создать кампанию' };
	}

	// Добавляем получателей напрямую
	await addCampaignRecipients(campaign.id, userIds);

	// Запускаем
	const result = await startCampaign(campaign.id);

	return {
		success: result.success,
		campaignId: campaign.id,
		error: result.error
	};
}

/**
 * Получить превью аудитории по фильтрам
 */
export async function previewAudience(filters: SegmentFilters): Promise<{ count: number; sample: number[] }> {
	const userIds = await getSegmentUserIds(filters);
	return {
		count: userIds.length,
		sample: userIds.slice(0, 10) // Первые 10 для превью
	};
}

/**
 * Запланировать кампанию
 */
export async function scheduleCampaign(
	campaignId: number,
	scheduledAt: string
): Promise<{ success: boolean; error?: string }> {
	const campaign = await getCampaignById(campaignId);
	if (!campaign) {
		return { success: false, error: 'Кампания не найдена' };
	}

	if (campaign.status !== 'draft') {
		return { success: false, error: 'Только черновики могут быть запланированы' };
	}

	// Подготавливаем получателей
	const prepResult = await prepareCampaign(campaignId);
	if (!prepResult.success) {
		return { success: false, error: prepResult.error };
	}

	// Обновляем статус
	await updateCampaign(campaignId, {
		status: 'scheduled',
		scheduled_at: scheduledAt
	});

	return { success: true };
}
