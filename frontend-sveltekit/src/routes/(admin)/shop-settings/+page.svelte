<script lang="ts">
	import { onMount } from 'svelte';
	import { shopSettingsAPI, type ShopSettings } from '$lib/api/admin/shop-settings';

	// State
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let success = $state('');
	let testingTelegram = $state(false);

	// Form data
	let settings = $state<ShopSettings>({
		shopName: '',
		shopType: 'general',
		currency: 'RUB',
		deliveryEnabled: true,
		pickupEnabled: true,
		deliveryCost: 0,
		freeDeliveryFrom: null,
		minOrderAmount: 0,
		telegramBotToken: null,
		telegramBotUsername: null,
		telegramNotificationsEnabled: false,
		telegramGroupId: null,
		emailNotificationsEnabled: false,
		emailRecipients: [],
		customerTelegramNotifications: false,
		smtpHost: null,
		smtpPort: null,
		smtpUser: null,
		smtpPassword: null,
		smtpFrom: null,
		updatedAt: null
	});

	// Email recipients input
	let emailInput = $state('');

	// Shop type options
	const shopTypes = [
		{ value: 'general', label: 'Универсальный магазин' },
		{ value: 'pet_shop', label: 'Зоомагазин' },
		{ value: 'restaurant', label: 'Ресторан/Кафе' },
		{ value: 'clothing', label: 'Одежда и аксессуары' }
	];

	// Load settings
	async function loadSettings() {
		loading = true;
		error = '';

		try {
			settings = await shopSettingsAPI.get();
		} catch (e: any) {
			error = e.message || 'Failed to load settings';
		} finally {
			loading = false;
		}
	}

	// Save settings
	async function saveSettings() {
		saving = true;
		error = '';
		success = '';

		try {
			await shopSettingsAPI.update({
				shopName: settings.shopName,
				shopType: settings.shopType,
				currency: settings.currency,
				deliveryEnabled: settings.deliveryEnabled,
				pickupEnabled: settings.pickupEnabled,
				deliveryCost: settings.deliveryCost,
				freeDeliveryFrom: settings.freeDeliveryFrom,
				minOrderAmount: settings.minOrderAmount,
				telegramBotToken: settings.telegramBotToken,
				telegramBotUsername: settings.telegramBotUsername,
				telegramNotificationsEnabled: settings.telegramNotificationsEnabled,
				telegramGroupId: settings.telegramGroupId,
				emailNotificationsEnabled: settings.emailNotificationsEnabled,
				emailRecipients: settings.emailRecipients,
				customerTelegramNotifications: settings.customerTelegramNotifications,
				smtpHost: settings.smtpHost,
				smtpPort: settings.smtpPort,
				smtpUser: settings.smtpUser,
				smtpPassword: settings.smtpPassword,
				smtpFrom: settings.smtpFrom
			});

			success = 'Settings saved successfully';
			setTimeout(() => success = '', 3000);
		} catch (e: any) {
			error = e.message || 'Failed to save settings';
		} finally {
			saving = false;
		}
	}

	// Test Telegram
	async function testTelegram() {
		testingTelegram = true;
		error = '';
		success = '';

		try {
			const result = await shopSettingsAPI.testTelegram();
			success = result.message;
			setTimeout(() => success = '', 5000);
		} catch (e: any) {
			error = e.message || 'Failed to send test message';
		} finally {
			testingTelegram = false;
		}
	}

	// Add email recipient
	function addEmail() {
		const email = emailInput.trim();
		if (email && !settings.emailRecipients.includes(email)) {
			settings.emailRecipients = [...settings.emailRecipients, email];
		}
		emailInput = '';
	}

	// Remove email recipient
	function removeEmail(email: string) {
		settings.emailRecipients = settings.emailRecipients.filter(e => e !== email);
	}

	// Mount
	onMount(() => {
		loadSettings();
	});
</script>

<svelte:head>
	<title>Shop Settings - Admin</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1>Shop Settings</h1>
		<p class="subtitle">Configure your shop parameters and notifications</p>
	</header>

	{#if error}
		<div class="alert error">{error}</div>
	{/if}

	{#if success}
		<div class="alert success">{success}</div>
	{/if}

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading settings...</p>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); saveSettings(); }}>
			<!-- Basic Settings -->
			<section class="settings-section">
				<h2>Basic Settings</h2>

				<div class="form-group">
					<label for="shopName">Shop Name</label>
					<input
						type="text"
						id="shopName"
						bind:value={settings.shopName}
						placeholder="My Shop"
					/>
				</div>

				<div class="form-group">
					<label for="shopType">Shop Type</label>
					<select id="shopType" bind:value={settings.shopType}>
						{#each shopTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="currency">Currency</label>
					<select id="currency" bind:value={settings.currency}>
						<option value="RUB">RUB (₽)</option>
						<option value="USD">USD ($)</option>
						<option value="EUR">EUR (€)</option>
					</select>
				</div>
			</section>

			<!-- Delivery Settings -->
			<section class="settings-section">
				<h2>Delivery & Pickup</h2>

				<div class="toggle-group">
					<label class="toggle">
						<input type="checkbox" bind:checked={settings.deliveryEnabled} />
						<span class="toggle-label">Enable Delivery</span>
					</label>

					<label class="toggle">
						<input type="checkbox" bind:checked={settings.pickupEnabled} />
						<span class="toggle-label">Enable Pickup</span>
					</label>
				</div>

				{#if settings.deliveryEnabled}
					<div class="form-row">
						<div class="form-group">
							<label for="deliveryCost">Delivery Cost</label>
							<div class="input-addon">
								<input
									type="number"
									id="deliveryCost"
									bind:value={settings.deliveryCost}
									min="0"
									step="0.01"
								/>
								<span class="addon">₽</span>
							</div>
							<small>Set to 0 for free delivery</small>
						</div>

						<div class="form-group">
							<label for="freeDeliveryFrom">Free Delivery From</label>
							<div class="input-addon">
								<input
									type="number"
									id="freeDeliveryFrom"
									bind:value={settings.freeDeliveryFrom}
									min="0"
									step="0.01"
									placeholder="Optional"
								/>
								<span class="addon">₽</span>
							</div>
							<small>Leave empty to disable</small>
						</div>
					</div>
				{/if}

				<div class="form-group">
					<label for="minOrderAmount">Minimum Order Amount</label>
					<div class="input-addon">
						<input
							type="number"
							id="minOrderAmount"
							bind:value={settings.minOrderAmount}
							min="0"
							step="0.01"
						/>
						<span class="addon">₽</span>
					</div>
					<small>Set to 0 for no minimum</small>
				</div>
			</section>

			<!-- Telegram Notifications -->
			<section class="settings-section">
				<h2>Telegram Notifications</h2>

				<div class="toggle-group">
					<label class="toggle">
						<input type="checkbox" bind:checked={settings.telegramNotificationsEnabled} />
						<span class="toggle-label">Enable Telegram Notifications for New Orders</span>
					</label>

					<label class="toggle">
						<input type="checkbox" bind:checked={settings.customerTelegramNotifications} />
						<span class="toggle-label">Enable Customer Order Status Updates</span>
					</label>
				</div>

				<div class="form-group">
					<label for="telegramBotToken">Bot Token</label>
					<input
						type="password"
						id="telegramBotToken"
						bind:value={settings.telegramBotToken}
						placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
					/>
					<small>Get from @BotFather</small>
				</div>

				<div class="form-group">
					<label for="telegramBotUsername">Bot Username</label>
					<input
						type="text"
						id="telegramBotUsername"
						bind:value={settings.telegramBotUsername}
						placeholder="@myshopbot"
					/>
				</div>

				<div class="form-group">
					<label for="telegramGroupId">Group/Channel ID</label>
					<input
						type="text"
						id="telegramGroupId"
						bind:value={settings.telegramGroupId}
						placeholder="-1001234567890"
					/>
					<small>Group ID for order notifications</small>
				</div>

				{#if settings.telegramBotToken && settings.telegramGroupId}
					<button
						type="button"
						class="btn-test"
						onclick={testTelegram}
						disabled={testingTelegram}
					>
						{testingTelegram ? 'Sending...' : 'Send Test Message'}
					</button>
				{/if}
			</section>

			<!-- Email Notifications -->
			<section class="settings-section">
				<h2>Email Notifications</h2>

				<label class="toggle">
					<input type="checkbox" bind:checked={settings.emailNotificationsEnabled} />
					<span class="toggle-label">Enable Email Notifications</span>
				</label>

				{#if settings.emailNotificationsEnabled}
					<div class="form-group">
						<label>Recipients</label>
						<div class="email-input-group">
							<input
								type="email"
								bind:value={emailInput}
								placeholder="email@example.com"
								onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
							/>
							<button type="button" onclick={addEmail}>Add</button>
						</div>

						{#if settings.emailRecipients.length > 0}
							<div class="email-list">
								{#each settings.emailRecipients as email}
									<span class="email-tag">
										{email}
										<button type="button" onclick={() => removeEmail(email)}>&times;</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<h3>SMTP Settings</h3>

					<div class="form-row">
						<div class="form-group">
							<label for="smtpHost">SMTP Host</label>
							<input
								type="text"
								id="smtpHost"
								bind:value={settings.smtpHost}
								placeholder="smtp.example.com"
							/>
						</div>

						<div class="form-group small">
							<label for="smtpPort">Port</label>
							<input
								type="number"
								id="smtpPort"
								bind:value={settings.smtpPort}
								placeholder="587"
							/>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="smtpUser">SMTP User</label>
							<input
								type="text"
								id="smtpUser"
								bind:value={settings.smtpUser}
								placeholder="user@example.com"
							/>
						</div>

						<div class="form-group">
							<label for="smtpPassword">SMTP Password</label>
							<input
								type="password"
								id="smtpPassword"
								bind:value={settings.smtpPassword}
								placeholder="••••••••"
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="smtpFrom">From Address</label>
						<input
							type="email"
							id="smtpFrom"
							bind:value={settings.smtpFrom}
							placeholder="noreply@example.com"
						/>
					</div>
				{/if}
			</section>

			<!-- Save Button -->
			<div class="form-actions">
				<button type="submit" class="btn-save" disabled={saving}>
					{saving ? 'Saving...' : 'Save Settings'}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.settings-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 24px;
	}

	.page-header {
		margin-bottom: 32px;
	}

	.page-header h1 {
		font-size: 28px;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 8px 0;
	}

	.subtitle {
		color: #6b7280;
		margin: 0;
	}

	.alert {
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 20px;
		font-size: 14px;
	}

	.alert.error {
		background: #fee2e2;
		color: #dc2626;
	}

	.alert.success {
		background: #d1fae5;
		color: #059669;
	}

	.loading {
		text-align: center;
		padding: 60px 20px;
		color: #6b7280;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #f97316;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 16px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.settings-section {
		background: white;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.settings-section h2 {
		font-size: 18px;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 20px 0;
		padding-bottom: 12px;
		border-bottom: 1px solid #e5e7eb;
	}

	.settings-section h3 {
		font-size: 15px;
		font-weight: 600;
		color: #374151;
		margin: 20px 0 16px 0;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: #374151;
		margin-bottom: 8px;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 14px;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #f97316;
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
	}

	.form-group small {
		display: block;
		font-size: 12px;
		color: #9ca3af;
		margin-top: 4px;
	}

	.form-row {
		display: flex;
		gap: 16px;
	}

	.form-row .form-group {
		flex: 1;
	}

	.form-row .form-group.small {
		flex: 0 0 100px;
	}

	.input-addon {
		display: flex;
	}

	.input-addon input {
		border-radius: 8px 0 0 8px;
	}

	.input-addon .addon {
		padding: 10px 12px;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-left: none;
		border-radius: 0 8px 8px 0;
		color: #6b7280;
		font-size: 14px;
	}

	.toggle-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
	}

	.toggle input[type="checkbox"] {
		width: 20px;
		height: 20px;
		accent-color: #f97316;
	}

	.toggle-label {
		font-size: 14px;
		color: #374151;
	}

	.email-input-group {
		display: flex;
		gap: 8px;
	}

	.email-input-group input {
		flex: 1;
	}

	.email-input-group button {
		padding: 10px 16px;
		background: #f97316;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
	}

	.email-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}

	.email-tag {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: #f3f4f6;
		border-radius: 6px;
		font-size: 13px;
		color: #374151;
	}

	.email-tag button {
		background: none;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		font-size: 16px;
		padding: 0;
		line-height: 1;
	}

	.email-tag button:hover {
		color: #ef4444;
	}

	.btn-test {
		padding: 10px 20px;
		background: #e5e7eb;
		color: #374151;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-test:hover:not(:disabled) {
		background: #d1d5db;
	}

	.btn-test:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 24px;
	}

	.btn-save {
		padding: 12px 32px;
		background: #f97316;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-save:hover:not(:disabled) {
		background: #ea580c;
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 600px) {
		.form-row {
			flex-direction: column;
		}

		.form-row .form-group.small {
			flex: 1;
		}
	}
</style>
