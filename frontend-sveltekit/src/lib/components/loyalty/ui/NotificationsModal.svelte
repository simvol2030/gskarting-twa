<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { getFromStorage, saveToStorage } from '$lib/utils/storage';

	interface NotificationSettings {
		offers: boolean;
		bonuses: boolean;
		recommendations: boolean;
		news: boolean;
	}

	const defaultSettings: NotificationSettings = {
		offers: true,
		bonuses: true,
		recommendations: false,
		news: false
	};

	let settings = $state<NotificationSettings>(
		getFromStorage('loyalty_notifications', defaultSettings)
	);

	function saveSettings() {
		saveToStorage('loyalty_notifications', settings);
		toastStore.show('Настройки сохранены!', 'success');
	}
</script>

<div class="notifications-modal">
	<div class="settings-content">
		<div class="setting-item">
			<div class="setting-info">
				<h4>Новые акции</h4>
				<p>Уведомления о новых предложениях и специальных акциях</p>
			</div>
			<label class="toggle-switch">
				<input type="checkbox" bind:checked={settings.offers} />
				<span class="toggle-slider"></span>
			</label>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<h4>Истечение бонусов</h4>
				<p>Напоминания о скором истечении накопленных бонусов</p>
			</div>
			<label class="toggle-switch">
				<input type="checkbox" bind:checked={settings.bonuses} />
				<span class="toggle-slider"></span>
			</label>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<h4>Рекомендации</h4>
				<p>Персональные рекомендации товаров на основе ваших покупок</p>
			</div>
			<label class="toggle-switch">
				<input type="checkbox" bind:checked={settings.recommendations} />
				<span class="toggle-slider"></span>
			</label>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<h4>Новости магазинов</h4>
				<p>Информация о новых магазинах и изменениях в программе</p>
			</div>
			<label class="toggle-switch">
				<input type="checkbox" bind:checked={settings.news} />
				<span class="toggle-slider"></span>
			</label>
		</div>
	</div>

	<button class="button button-primary" onclick={saveSettings}>Сохранить настройки</button>
</div>

<style>
	.notifications-modal {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.settings-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.setting-item:hover {
		background: var(--bg-hover);
	}

	.setting-info {
		flex: 1;
	}

	.setting-info h4 {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: var(--text-base);
		color: var(--text-primary);
		font-weight: var(--font-semibold);
	}

	.setting-info p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: 1.4;
	}

	/* Toggle Switch */
	.toggle-switch {
		position: relative;
		width: 50px;
		height: 28px;
		flex-shrink: 0;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--bg-secondary);
		border: 2px solid var(--border-color);
		transition: all var(--transition-base);
		border-radius: 28px;
	}

	.toggle-slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 2px;
		bottom: 2px;
		background-color: var(--text-secondary);
		transition: all var(--transition-base);
		border-radius: 50%;
	}

	input:checked + .toggle-slider {
		background-color: var(--accent);
		border-color: var(--accent);
	}

	input:checked + .toggle-slider:before {
		background-color: white;
		transform: translateX(22px);
	}

	input:focus + .toggle-slider {
		box-shadow: 0 0 0 3px rgba(255, 119, 0, 0.1);
	}

	.toggle-slider:hover {
		border-color: var(--accent);
	}

	/* Button */
	.button {
		width: 100%;
		padding: var(--spacing-md) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.button-primary {
		background: var(--accent);
		color: white;
	}

	.button-primary:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 119, 0, 0.2);
	}

	.button-primary:active {
		transform: translateY(0);
	}

	@media (min-width: 768px) {
		.setting-item {
			padding: var(--spacing-lg);
		}
	}
</style>
