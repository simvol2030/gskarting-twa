import { getUsersWithBirthdayToday } from '../services/segmentationService';
import { getAutoSendTriggers, createTriggerLog, updateTriggerLogStatus } from '../db/queries/triggerTemplates';
import { sendToUsers } from '../services/campaignService';

/**
 * Обрабатывает триггер "День рождения"
 * Запускается ежедневно в 09:00
 *
 * ОПТИМИЗИРОВАНО: Создаёт ОДНУ кампанию для всех именинников,
 * вместо отдельной кампании для каждого пользователя
 */
export async function processBirthdayTrigger(dryRun: boolean = false): Promise<{
	usersWithBirthday: number;
	triggersProcessed: number;
	campaignsCreated: number;
	errors: string[];
}> {
	const result = {
		usersWithBirthday: 0,
		triggersProcessed: 0,
		campaignsCreated: 0,
		errors: [] as string[]
	};

	try {
		// Получаем пользователей с днём рождения сегодня
		const birthdayUserIds = await getUsersWithBirthdayToday();
		result.usersWithBirthday = birthdayUserIds.length;

		if (birthdayUserIds.length === 0) {
			console.log('[BIRTHDAY] No users with birthday today');
			return result;
		}

		console.log(`[BIRTHDAY] Found ${birthdayUserIds.length} users with birthday today`);

		// Получаем активные auto_send триггеры для birthday
		const triggers = await getAutoSendTriggers('birthday');

		if (triggers.length === 0) {
			console.log('[BIRTHDAY] No active birthday triggers configured');
			return result;
		}

		console.log(`[BIRTHDAY] Processing ${triggers.length} birthday triggers`);

		for (const trigger of triggers) {
			try {
				result.triggersProcessed++;

				// Создаём лог триггера для всей группы именинников
				const log = await createTriggerLog({
					trigger_id: trigger.id,
					event_data: JSON.stringify({
						event: 'birthday',
						date: new Date().toISOString(),
						users_count: birthdayUserIds.length
					}),
					status: 'triggered'
				});

				if (dryRun) {
					console.log(`[BIRTHDAY] DRY-RUN: Would create campaign for ${birthdayUserIds.length} birthday users`);
					await updateTriggerLogStatus(log.id, 'skipped', undefined, 'Dry run mode');
					continue;
				}

				// Создаём ОДНУ кампанию для ВСЕХ именинников
				const campaignResult = await sendToUsers(
					birthdayUserIds,
					{
						title: `День рождения: ${birthdayUserIds.length} клиентов (${new Date().toLocaleDateString('ru-RU')})`,
						message_text: trigger.message_template || '🎂 С Днём рождения, {first_name}! Желаем счастья и отличного настроения!',
						message_image: trigger.image_url,
						button_text: trigger.button_text,
						button_url: trigger.button_url,
						trigger_type: 'event',
						trigger_config: JSON.stringify({ trigger_id: trigger.id, event_type: 'birthday' })
					}
				);

				if (campaignResult.success) {
					await updateTriggerLogStatus(log.id, 'campaign_created', campaignResult.campaignId);
					result.campaignsCreated++;
					console.log(`[BIRTHDAY] Campaign #${campaignResult.campaignId} created for ${birthdayUserIds.length} birthday users`);
				} else {
					await updateTriggerLogStatus(log.id, 'error', undefined, campaignResult.error);
					result.errors.push(`Trigger #${trigger.id}: ${campaignResult.error}`);
				}
			} catch (triggerError) {
				const errorMessage = triggerError instanceof Error ? triggerError.message : String(triggerError);
				console.error(`[BIRTHDAY] Error processing trigger #${trigger.id}:`, errorMessage);
				result.errors.push(`Trigger #${trigger.id}: ${errorMessage}`);
			}
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('[BIRTHDAY] Error processing birthday trigger:', errorMessage);
		result.errors.push(`General error: ${errorMessage}`);
	}

	return result;
}
