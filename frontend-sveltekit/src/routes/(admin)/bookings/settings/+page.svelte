<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingAdminAPI, type BookingConfig } from '$lib/api/admin/booking';

	let config = $state<BookingConfig | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let success = $state('');

	// Parsed form fields
	let workingHours = $state<Record<string, { open: string; close: string }>>({});
	let slotDurations = $state<number[]>([10, 15, 20]);
	let pricingAdult = $state<Record<string, number>>({});
	let pricingChild = $state<Record<string, number>>({});

	// Simple fields
	let slotInterval = $state(15);
	let bufferMinutes = $state(5);
	let defaultDuration = $state(10);
	let maxParticipants = $state(8);
	let autoConfirm = $state(true);
	let bookingHorizon = $state(90);

	// Notification settings
	let reminderEnabled = $state(true);
	let reminderHoursBefore = $state(24);
	let shiftNotificationThreshold = $state(5);

	const dayNames: Record<string, string> = {
		'0': 'Воскресенье',
		'1': 'Понедельник',
		'2': 'Вторник',
		'3': 'Среда',
		'4': 'Четверг',
		'5': 'Пятница',
		'6': 'Суббота'
	};

	async function loadConfig() {
		loading = true;
		error = '';
		try {
			config = await bookingAdminAPI.getConfig();

			// Parse JSON fields
			workingHours = JSON.parse(config.working_hours);
			slotDurations = JSON.parse(config.slot_durations);
			pricingAdult = JSON.parse(config.pricing_adult);
			pricingChild = JSON.parse(config.pricing_child);

			// Simple fields
			slotInterval = config.slot_interval_minutes;
			bufferMinutes = config.buffer_minutes;
			defaultDuration = config.default_duration;
			maxParticipants = config.max_participants;
			autoConfirm = !!config.auto_confirm;
			bookingHorizon = config.booking_horizon_days;

			// Notification fields
			reminderEnabled = !!config.reminder_enabled;
			reminderHoursBefore = config.reminder_hours_before;
			shiftNotificationThreshold = config.shift_notification_threshold;
		} catch (e: any) {
			error = e.message || 'Failed to load config';
		} finally {
			loading = false;
		}
	}

	async function saveConfig() {
		saving = true;
		error = '';
		success = '';
		try {
			await bookingAdminAPI.updateConfig({
				working_hours: JSON.stringify(workingHours) as any,
				slot_interval_minutes: slotInterval,
				buffer_minutes: bufferMinutes,
				slot_durations: JSON.stringify(slotDurations) as any,
				default_duration: defaultDuration,
				max_participants: maxParticipants,
				pricing_adult: JSON.stringify(pricingAdult) as any,
				pricing_child: JSON.stringify(pricingChild) as any,
				auto_confirm: autoConfirm as any,
				booking_horizon_days: bookingHorizon,
				reminder_enabled: reminderEnabled as any,
				reminder_hours_before: reminderHoursBefore,
				shift_notification_threshold: shiftNotificationThreshold
			});
			success = 'Настройки сохранены';
			setTimeout(() => success = '', 3000);
		} catch (e: any) {
			error = e.message || 'Failed to save config';
		} finally {
			saving = false;
		}
	}

	onMount(() => { loadConfig(); });
</script>

<svelte:head>
	<title>Настройки бронирования - Admin</title>
</svelte:head>

<div class="settings-page">
	<div class="page-header">
		<div class="header-left">
			<h1>Настройки бронирования</h1>
			<p class="text-muted">Конфигурация системы бронирования</p>
		</div>
	</div>

	{#if loading}
		<div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
	{:else if error && !config}
		<div class="error-state"><p>{error}</p><button class="btn-retry" onclick={loadConfig}>Повторить</button></div>
	{:else}
		{#if error}
			<div class="alert alert-error">{error}</div>
		{/if}
		{#if success}
			<div class="alert alert-success">{success}</div>
		{/if}

		<div class="settings-sections">
			<!-- Working Hours -->
			<section class="settings-card">
				<h2>Рабочие часы</h2>
				<div class="working-hours-grid">
					{#each ['1', '2', '3', '4', '5', '6', '0'] as day}
						<div class="wh-row">
							<span class="wh-day">{dayNames[day]}</span>
							{#if workingHours[day]}
								<input type="time" bind:value={workingHours[day].open} class="wh-input" />
								<span class="wh-sep">—</span>
								<input type="time" bind:value={workingHours[day].close} class="wh-input" />
							{:else}
								<span class="wh-closed">Выходной</span>
							{/if}
						</div>
					{/each}
				</div>
			</section>

			<!-- Slot Settings -->
			<section class="settings-card">
				<h2>Параметры слотов</h2>
				<div class="settings-grid">
					<div class="form-group">
						<label>Интервал слотов (мин)</label>
						<input type="number" bind:value={slotInterval} min="5" max="60" class="form-input" />
					</div>
					<div class="form-group">
						<label>Буфер между заездами (мин)</label>
						<input type="number" bind:value={bufferMinutes} min="0" max="30" class="form-input" />
					</div>
					<div class="form-group">
						<label>Длительность по умолчанию (мин)</label>
						<input type="number" bind:value={defaultDuration} min="5" max="60" class="form-input" />
					</div>
					<div class="form-group">
						<label>Макс. участников в заезде</label>
						<input type="number" bind:value={maxParticipants} min="1" max="20" class="form-input" />
					</div>
				</div>
				<div class="form-group">
					<label>Доступные длительности (через запятую, мин)</label>
					<input type="text" value={slotDurations.join(', ')} onchange={(e) => {
						const val = (e.target as HTMLInputElement).value;
						slotDurations = val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
					}} class="form-input" />
				</div>
			</section>

			<!-- Pricing -->
			<section class="settings-card">
				<h2>Цены</h2>
				<div class="pricing-section">
					<h3>Взрослые (руб)</h3>
					<div class="pricing-grid">
						{#each slotDurations as duration}
							<div class="pricing-item">
								<label>{duration} мин</label>
								<input type="number" bind:value={pricingAdult[String(duration)]} min="0" class="form-input" />
							</div>
						{/each}
					</div>
				</div>
				<div class="pricing-section">
					<h3>Дети (руб)</h3>
					<div class="pricing-grid">
						{#each slotDurations as duration}
							<div class="pricing-item">
								<label>{duration} мин</label>
								<input type="number" bind:value={pricingChild[String(duration)]} min="0" class="form-input" />
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Notifications -->
			<section class="settings-card">
				<h2>Уведомления (Telegram)</h2>
				<div class="settings-grid">
					<div class="form-group">
						<label class="toggle-label">
							<input type="checkbox" bind:checked={reminderEnabled} />
							<span>Напоминания о заездах</span>
						</label>
						<p class="form-hint">Отправлять напоминание через Telegram бота перед заездом</p>
					</div>
					<div class="form-group">
						<label>За сколько часов напоминать</label>
						<input type="number" bind:value={reminderHoursBefore} min="1" max="72" class="form-input" disabled={!reminderEnabled} />
					</div>
					<div class="form-group">
						<label>Порог уведомлений о смещении (мин)</label>
						<input type="number" bind:value={shiftNotificationThreshold} min="0" max="60" class="form-input" />
						<p class="form-hint">Уведомлять клиентов если смещение больше этого значения</p>
					</div>
				</div>
				<div class="notification-types">
					<h3>Типы уведомлений</h3>
					<ul class="notif-list">
						<li><span class="notif-icon">🏎️</span> Создание бронирования</li>
						<li><span class="notif-icon">✅</span> Подтверждение бронирования</li>
						<li><span class="notif-icon">❌</span> Отмена бронирования</li>
						<li><span class="notif-icon">🔔</span> Напоминание перед заездом</li>
						<li><span class="notif-icon">⏩</span> Смещение времени</li>
					</ul>
					<p class="form-hint">Уведомления отправляются только пользователям с привязанным Telegram аккаунтом</p>
				</div>
			</section>

			<!-- Other Settings -->
			<section class="settings-card">
				<h2>Другие настройки</h2>
				<div class="settings-grid">
					<div class="form-group">
						<label>Горизонт бронирования (дней)</label>
						<input type="number" bind:value={bookingHorizon} min="1" max="365" class="form-input" />
					</div>
					<div class="form-group">
						<label class="toggle-label">
							<input type="checkbox" bind:checked={autoConfirm} />
							<span>Автоподтверждение броней</span>
						</label>
						<p class="form-hint">При включении новые брони сразу получают статус "Подтверждена"</p>
					</div>
				</div>
			</section>
		</div>

		<div class="save-bar">
			<button class="btn-primary btn-lg" onclick={saveConfig} disabled={saving}>
				{saving ? 'Сохранение...' : 'Сохранить настройки'}
			</button>
		</div>
	{/if}
</div>

<style>
	.settings-page { max-width: 900px; }

	.page-header { margin-bottom: 1.5rem; }
	.page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #111827; }
	.text-muted { color: #6b7280; margin: 0.25rem 0 0 0; font-size: 0.875rem; }

	/* Loading/Error */
	.loading-state, .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; }
	.spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn-retry { margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 0.375rem; cursor: pointer; }

	/* Alerts */
	.alert { padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.875rem; }
	.alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
	.alert-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }

	/* Settings Sections */
	.settings-sections { display: flex; flex-direction: column; gap: 1.5rem; }

	.settings-card { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
	.settings-card h2 { margin: 0 0 1rem; font-size: 1.125rem; font-weight: 600; color: #111827; }
	.settings-card h3 { margin: 0.75rem 0 0.5rem; font-size: 0.9375rem; font-weight: 600; color: #374151; }

	.settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }

	/* Working Hours */
	.working-hours-grid { display: flex; flex-direction: column; gap: 0.5rem; }
	.wh-row { display: flex; align-items: center; gap: 0.5rem; }
	.wh-day { width: 120px; font-size: 0.875rem; font-weight: 500; color: #374151; flex-shrink: 0; }
	.wh-input { width: 100px; padding: 0.375rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem; }
	.wh-sep { color: #9ca3af; }
	.wh-closed { color: #9ca3af; font-style: italic; font-size: 0.875rem; }

	/* Pricing */
	.pricing-section { margin-bottom: 1rem; }
	.pricing-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
	.pricing-item { display: flex; flex-direction: column; gap: 0.25rem; }
	.pricing-item label { font-size: 0.8125rem; font-weight: 500; color: #6b7280; }
	.pricing-item input { width: 100px; }

	/* Form */
	.form-group { margin-bottom: 0.75rem; }
	.form-group label { display: block; margin-bottom: 0.25rem; font-size: 0.8125rem; font-weight: 500; color: #374151; }
	.form-input { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem; color: #111827; box-sizing: border-box; }
	.form-hint { margin: 0.25rem 0 0; font-size: 0.75rem; color: #9ca3af; }

	.toggle-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; color: #374151; }
	.toggle-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #667eea; }

	/* Save Bar */
	.save-bar { margin-top: 1.5rem; padding: 1rem 0; display: flex; justify-content: flex-end; }
	.btn-primary { padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }

	/* Notification Types */
	.notification-types { margin-top: 1rem; }
	.notification-types h3 { margin: 0 0 0.5rem; font-size: 0.9375rem; font-weight: 600; color: #374151; }
	.notif-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }
	.notif-list li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #374151; padding: 0.375rem 0; }
	.notif-icon { font-size: 1rem; }

	@media (max-width: 768px) {
		.settings-grid { grid-template-columns: 1fr; }
		.wh-row { flex-wrap: wrap; }
		.wh-day { width: 100%; }
		.pricing-grid { flex-direction: column; }
		.pricing-item input { width: 100%; }
	}
</style>
