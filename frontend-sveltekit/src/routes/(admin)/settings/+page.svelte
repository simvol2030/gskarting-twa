<script lang="ts">
	import type { PageData } from './$types';
	import { API_BASE_URL } from '$lib/config';

	let { data }: { data: PageData } = $props();

	type Tab = 'general' | 'loyalty' | 'notifications';
	let activeTab = $state<Tab>('general');

	// Form states (initialized from data.settings)
	let generalForm = $state({
		appName: data.settings.general.appName,
		supportEmail: data.settings.general.supportEmail,
		supportPhone: data.settings.general.supportPhone
	});

	let loyaltyForm = $state({
		earnRate: data.settings.loyalty.earnRate,
		maxRedeemPercent: data.settings.loyalty.maxRedeemPercent,
		pointsExpiryDays: data.settings.loyalty.pointsExpiryDays,
		welcomeBonus: data.settings.loyalty.welcomeBonus,
		birthdayBonus: data.settings.loyalty.birthdayBonus,
		minRedemptionAmount: data.settings.loyalty.minRedemptionAmount,
		pointsName: data.settings.loyalty.pointsName
	});

	let saving = $state(false);
	let saveMessage = $state('');

	let notificationsForm = $state({
		emailEnabled: data.settings.notifications.emailEnabled,
		smsEnabled: data.settings.notifications.smsEnabled,
		pushEnabled: data.settings.notifications.pushEnabled,
		notifyOnEarn: data.settings.notifications.notifyOnEarn,
		notifyOnRedeem: data.settings.notifications.notifyOnRedeem,
		notifyOnExpiry: data.settings.notifications.notifyOnExpiry
	});

	function switchToGeneral() {
		activeTab = 'general';
	}

	function switchToLoyalty() {
		activeTab = 'loyalty';
	}

	function switchToNotifications() {
		activeTab = 'notifications';
	}

	function resetGeneral() {
		generalForm = {
			appName: data.settings.general.appName,
			supportEmail: data.settings.general.supportEmail,
			supportPhone: data.settings.general.supportPhone
		};
	}

	function resetLoyalty() {
		loyaltyForm = {
			earnRate: data.settings.loyalty.earnRate,
			maxRedeemPercent: data.settings.loyalty.maxRedeemPercent,
			pointsExpiryDays: data.settings.loyalty.pointsExpiryDays,
			welcomeBonus: data.settings.loyalty.welcomeBonus,
			birthdayBonus: data.settings.loyalty.birthdayBonus,
			minRedemptionAmount: data.settings.loyalty.minRedemptionAmount,
			pointsName: data.settings.loyalty.pointsName
		};
	}

	function resetNotifications() {
		notificationsForm = {
			emailEnabled: data.settings.notifications.emailEnabled,
			smsEnabled: data.settings.notifications.smsEnabled,
			pushEnabled: data.settings.notifications.pushEnabled,
			notifyOnEarn: data.settings.notifications.notifyOnEarn,
			notifyOnRedeem: data.settings.notifications.notifyOnRedeem,
			notifyOnExpiry: data.settings.notifications.notifyOnExpiry
		};
	}

	async function saveSettings() {
		if (saving) return;

		saving = true;
		saveMessage = '';

		try {
			if (activeTab === 'loyalty') {
				const response = await fetch(`${API_BASE_URL}/admin/settings/loyalty`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						earningPercent: loyaltyForm.earnRate,
						maxDiscountPercent: loyaltyForm.maxRedeemPercent,
						expiryDays: loyaltyForm.pointsExpiryDays,
						welcomeBonus: loyaltyForm.welcomeBonus,
						birthdayBonus: loyaltyForm.birthdayBonus,
						minRedemptionAmount: loyaltyForm.minRedemptionAmount,
						pointsName: loyaltyForm.pointsName,
						supportEmail: generalForm.supportEmail,
						supportPhone: generalForm.supportPhone
					}),
					credentials: 'include'
				});

				// 🔒 SECURITY: Check HTTP status before parsing JSON
				if (!response.ok) {
					if (response.status === 401) {
						saveMessage = 'Сессия истекла. Войдите заново.';
						setTimeout(() => window.location.href = '/login', 2000);
						return;
					}
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				// 🔒 SECURITY: Verify content type
				const contentType = response.headers.get('content-type');
				if (!contentType?.includes('application/json')) {
					throw new Error('Сервер вернул некорректный ответ');
				}

				const result = await response.json();

				if (result.success) {
					saveMessage = 'Настройки успешно сохранены!';
					setTimeout(() => saveMessage = '', 3000);
				} else {
					saveMessage = 'Ошибка: ' + result.error;
				}
			} else {
				saveMessage = 'Сохранение других разделов пока не реализовано';
			}
		} catch (error) {
			console.error('Save settings error:', error);
			if (error instanceof TypeError && error.message.includes('fetch')) {
				saveMessage = 'Ошибка сети. Проверьте подключение к интернету.';
			} else {
				saveMessage = 'Ошибка сохранения: ' + (error as Error).message;
			}
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Настройки - Loyalty Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Настройки</h1>
		<p class="text-muted">Управление параметрами программы лояльности</p>
	</div>

	<!-- Tabs -->
	<div class="tabs">
		<button class="tab" class:active={activeTab === 'general'} onclick={switchToGeneral}>
			Общие
		</button>
		<button class="tab" class:active={activeTab === 'loyalty'} onclick={switchToLoyalty}>
			Программа лояльности
		</button>
		<button
			class="tab"
			class:active={activeTab === 'notifications'}
			onclick={switchToNotifications}
		>
			Уведомления
		</button>
	</div>

	<!-- Tab Content -->
	<div class="section">
		{#if activeTab === 'general'}
			<h2>Общие настройки</h2>
			<form class="settings-form">
				<div class="form-group">
					<label for="appName">Название приложения</label>
					<input type="text" id="appName" bind:value={generalForm.appName} />
				</div>

				<div class="form-group">
					<label for="supportEmail">Email поддержки</label>
					<input type="email" id="supportEmail" bind:value={generalForm.supportEmail} />
				</div>

				<div class="form-group">
					<label for="supportPhone">Телефон поддержки</label>
					<input type="tel" id="supportPhone" bind:value={generalForm.supportPhone} />
				</div>

				<div class="button-group">
					<button type="button" class="btn btn-primary" onclick={saveSettings}>
						Сохранить изменения
					</button>
					<button type="button" class="btn btn-secondary" onclick={resetGeneral}>Сбросить</button>
				</div>
			</form>
		{:else if activeTab === 'loyalty'}
			<h2>Программа лояльности</h2>
			<form class="settings-form">
				<div class="form-group">
					<label for="earnRate">Процент начисления (%)</label>
					<input type="number" id="earnRate" bind:value={loyaltyForm.earnRate} min="0.1" max="20" step="0.1" />
					<small>Текущее значение: {loyaltyForm.earnRate}% (максимум 20%)</small>
				</div>

				<div class="form-group">
					<label for="maxRedeemPercent">Максимальная скидка (%)</label>
					<input
						type="number"
						id="maxRedeemPercent"
						bind:value={loyaltyForm.maxRedeemPercent}
						min="1"
						max="50"
						step="1"
					/>
					<small>Текущее значение: {loyaltyForm.maxRedeemPercent}% (максимум 50%)</small>
				</div>

				<div class="form-group">
					<label for="pointsExpiryDays">Срок действия баллов (дней)</label>
					<input
						type="number"
						id="pointsExpiryDays"
						bind:value={loyaltyForm.pointsExpiryDays}
						min="0"
					/>
					<small>Текущее значение: {loyaltyForm.pointsExpiryDays} дней</small>
				</div>

				<div class="form-group">
					<label for="welcomeBonus">Приветственный бонус (баллы)</label>
					<input type="number" id="welcomeBonus" bind:value={loyaltyForm.welcomeBonus} min="0" />
					<small>Текущее значение: {loyaltyForm.welcomeBonus} баллов</small>
				</div>

				<div class="form-group">
					<label for="birthdayBonus">Бонус в день рождения (баллы)</label>
					<input type="number" id="birthdayBonus" bind:value={loyaltyForm.birthdayBonus} min="0" />
					<small>Текущее значение: {loyaltyForm.birthdayBonus} баллов</small>
				</div>

				<div class="form-group">
					<label for="minRedemptionAmount">Минимальная сумма для списания (баллы)</label>
					<input
						type="number"
						id="minRedemptionAmount"
						bind:value={loyaltyForm.minRedemptionAmount}
						min="0"
					/>
					<small>Текущее значение: {loyaltyForm.minRedemptionAmount} баллов</small>
				</div>

				<div class="form-group">
					<label for="pointsName">Название баллов</label>
					<input
						type="text"
						id="pointsName"
						bind:value={loyaltyForm.pointsName}
						maxlength="50"
					/>
					<small>Отображается в TWA (например: "Мурзи-коины", "Бонусы")</small>
				</div>

				{#if saveMessage}
					<div class="alert" class:success={saveMessage.includes('успешно')} class:error={saveMessage.includes('Ошибка')}>
						{saveMessage}
					</div>
				{/if}

				<div class="button-group">
					<button type="button" class="btn btn-primary" onclick={saveSettings} disabled={saving}>
						{saving ? 'Сохранение...' : 'Сохранить изменения'}
					</button>
					<button type="button" class="btn btn-secondary" onclick={resetLoyalty}>Сбросить</button>
				</div>
			</form>
		{:else if activeTab === 'notifications'}
			<h2>Уведомления</h2>
			<form class="settings-form">
				<div class="settings-section">
					<h3>Каналы уведомлений</h3>
					<div class="checkbox-group">
						<label>
							<input type="checkbox" bind:checked={notificationsForm.emailEnabled} />
							Email уведомления
						</label>
					</div>
					<div class="checkbox-group">
						<label>
							<input type="checkbox" bind:checked={notificationsForm.smsEnabled} />
							SMS уведомления
						</label>
					</div>
					<div class="checkbox-group">
						<label>
							<input type="checkbox" bind:checked={notificationsForm.pushEnabled} />
							Push уведомления
						</label>
					</div>
				</div>

				<div class="settings-section">
					<h3>События для уведомлений</h3>
					<div class="checkbox-group">
						<label>
							<input type="checkbox" bind:checked={notificationsForm.notifyOnEarn} />
							При начислении баллов
						</label>
					</div>
					<div class="checkbox-group">
						<label>
							<input type="checkbox" bind:checked={notificationsForm.notifyOnRedeem} />
							При списании баллов
						</label>
					</div>
					<div class="checkbox-group">
						<label>
							<input type="checkbox" bind:checked={notificationsForm.notifyOnExpiry} />
							Перед сгоранием баллов
						</label>
					</div>
				</div>

				<div class="button-group">
					<button type="button" class="btn btn-primary" onclick={saveSettings}>
						Сохранить изменения
					</button>
					<button type="button" class="btn btn-secondary" onclick={resetNotifications}>
						Сбросить
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
	}

	.text-muted {
		color: #6b7280;
		margin: 0;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		transition: all 0.2s;
		margin-bottom: -2px;
	}

	.tab:hover {
		color: #111827;
		background: #f9fafb;
	}

	.tab.active {
		color: #667eea;
		border-bottom-color: #667eea;
	}

	/* Section */
	.section {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	/* Form */
	.settings-form {
		max-width: 600px;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		color: #374151;
	}

	.form-group input[type='text'],
	.form-group input[type='email'],
	.form-group input[type='tel'],
	.form-group input[type='number'] {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-group small {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* Settings sections */
	.settings-section {
		margin-bottom: 2rem;
	}

	.settings-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
	}

	.checkbox-group {
		margin-bottom: 1rem;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 400;
		cursor: pointer;
	}

	.checkbox-group input[type='checkbox'] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	/* Buttons */
	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	.alert {
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 16px;
		font-size: 14px;
		font-weight: 500;
	}

	.alert.success {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	.alert.error {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	@media (max-width: 768px) {
		.tabs {
			overflow-x: auto;
		}

		.tab {
			white-space: nowrap;
		}

		.section {
			padding: 1.5rem;
		}

		.button-group {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}
</style>
