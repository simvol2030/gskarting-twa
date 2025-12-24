<script lang="ts">
	import type { PageData } from './$types';
	import type { StoriesSettings } from '$lib/types/stories';
	import { settingsAPI } from '$lib/api/admin/stories';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Form state
	let settings = $state<StoriesSettings>(data.settings || {
		enabled: true,
		shape: 'circle',
		borderWidth: 3,
		borderColor: '#667eea',
		borderGradient: null,
		showTitle: true,
		titlePosition: 'bottom',
		highlightSize: 80,
		maxVideoDuration: 45,
		maxVideoSizeMb: 50,
		autoConvertWebp: true,
		webpQuality: 85
	});

	// Gradient settings
	let useGradient = $state(!!settings.borderGradient);
	let gradientColors = $state<string[]>(
		settings.borderGradient?.colors || ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']
	);
	let gradientAngle = $state(settings.borderGradient?.angle || 45);

	// UI state
	let saving = $state(false);
	let error = $state<string | null>(data.error);
	let successMessage = $state<string | null>(null);

	// Preview highlight data
	const previewHighlight = {
		title: 'Акции',
		coverImage: null
	};

	async function saveSettings() {
		saving = true;
		error = null;
		successMessage = null;

		try {
			const updatedSettings: Partial<StoriesSettings> = {
				enabled: settings.enabled,
				shape: settings.shape,
				borderWidth: settings.borderWidth,
				borderColor: settings.borderColor,
				borderGradient: useGradient ? { colors: gradientColors, angle: gradientAngle } : null,
				showTitle: settings.showTitle,
				titlePosition: settings.titlePosition,
				highlightSize: settings.highlightSize,
				maxVideoDuration: settings.maxVideoDuration,
				maxVideoSizeMb: settings.maxVideoSizeMb,
				autoConvertWebp: settings.autoConvertWebp,
				webpQuality: settings.webpQuality
			};

			const result = await settingsAPI.update(updatedSettings);
			settings = result;
			successMessage = 'Настройки сохранены';

			setTimeout(() => {
				successMessage = null;
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ошибка сохранения';
		} finally {
			saving = false;
		}
	}

	function addGradientColor() {
		if (gradientColors.length < 8) {
			gradientColors = [...gradientColors, '#000000'];
		}
	}

	function removeGradientColor(index: number) {
		if (gradientColors.length > 2) {
			gradientColors = gradientColors.filter((_, i) => i !== index);
		}
	}

	function updateGradientColor(index: number, color: string) {
		gradientColors = gradientColors.map((c, i) => i === index ? color : c);
	}

	// Computed gradient CSS
	let gradientCSS = $derived(
		useGradient
			? `linear-gradient(${gradientAngle}deg, ${gradientColors.join(', ')})`
			: settings.borderColor
	);
</script>

<svelte:head>
	<title>Настройки Stories | Admin</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<div class="header-left">
			<a href="/stories" class="back-link">← Назад к Stories</a>
			<h1>Настройки Stories</h1>
		</div>
		<div class="header-actions">
			<button class="btn btn-primary" onclick={saveSettings} disabled={saving}>
				{saving ? 'Сохранение...' : 'Сохранить'}
			</button>
		</div>
	</header>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	{#if successMessage}
		<div class="alert alert-success">{successMessage}</div>
	{/if}

	<div class="settings-layout">
		<div class="settings-form">
			<!-- General Settings -->
			<section class="settings-section">
				<h2>Основные настройки</h2>

				<div class="form-group">
					<label class="toggle-label">
						<input type="checkbox" bind:checked={settings.enabled} />
						<span class="toggle-text">Показывать Stories на главной странице</span>
					</label>
				</div>
			</section>

			<!-- Appearance Settings -->
			<section class="settings-section">
				<h2>Внешний вид</h2>

				<div class="form-group">
					<label>Форма хайлайтов</label>
					<div class="radio-group">
						<label class="radio-label">
							<input type="radio" bind:group={settings.shape} value="circle" />
							<span>Круг</span>
						</label>
						<label class="radio-label">
							<input type="radio" bind:group={settings.shape} value="square" />
							<span>Квадрат (скругленный)</span>
						</label>
					</div>
				</div>

				<div class="form-group">
					<label for="highlight-size">Размер хайлайтов: {settings.highlightSize}px</label>
					<input
						type="range"
						id="highlight-size"
						bind:value={settings.highlightSize}
						min="50"
						max="120"
						step="5"
					/>
					<div class="range-labels">
						<span>50px</span>
						<span>120px</span>
					</div>
				</div>

				<div class="form-group">
					<label class="toggle-label">
						<input type="checkbox" bind:checked={settings.showTitle} />
						<span class="toggle-text">Показывать название</span>
					</label>
				</div>

				{#if settings.showTitle}
					<div class="form-group">
						<label>Позиция названия</label>
						<div class="radio-group">
							<label class="radio-label">
								<input type="radio" bind:group={settings.titlePosition} value="bottom" />
								<span>Снизу</span>
							</label>
							<label class="radio-label">
								<input type="radio" bind:group={settings.titlePosition} value="inside" />
								<span>Внутри</span>
							</label>
						</div>
					</div>
				{/if}
			</section>

			<!-- Border Settings -->
			<section class="settings-section">
				<h2>Обводка</h2>

				<div class="form-group">
					<label for="border-width">Толщина обводки: {settings.borderWidth}px</label>
					<input
						type="range"
						id="border-width"
						bind:value={settings.borderWidth}
						min="0"
						max="6"
						step="1"
					/>
					<div class="range-labels">
						<span>0px</span>
						<span>6px</span>
					</div>
				</div>

				<div class="form-group">
					<label class="toggle-label">
						<input type="checkbox" bind:checked={useGradient} />
						<span class="toggle-text">Использовать градиент</span>
					</label>
				</div>

				{#if useGradient}
					<div class="form-group">
						<label>Цвета градиента</label>
						<div class="gradient-colors">
							{#each gradientColors as color, index}
								<div class="gradient-color-item">
									<input
										type="color"
										value={color}
										onchange={(e) => updateGradientColor(index, e.currentTarget.value)}
									/>
									{#if gradientColors.length > 2}
										<button
											type="button"
											class="btn-remove-color"
											onclick={() => removeGradientColor(index)}
										>
											×
										</button>
									{/if}
								</div>
							{/each}
							{#if gradientColors.length < 8}
								<button type="button" class="btn-add-color" onclick={addGradientColor}>
									+
								</button>
							{/if}
						</div>
					</div>

					<div class="form-group">
						<label for="gradient-angle">Угол градиента: {gradientAngle}°</label>
						<input
							type="range"
							id="gradient-angle"
							bind:value={gradientAngle}
							min="0"
							max="360"
							step="15"
						/>
						<div class="range-labels">
							<span>0°</span>
							<span>360°</span>
						</div>
					</div>
				{:else}
					<div class="form-group">
						<label for="border-color">Цвет обводки</label>
						<div class="color-input-wrapper">
							<input
								type="color"
								id="border-color"
								bind:value={settings.borderColor}
							/>
							<input
								type="text"
								value={settings.borderColor}
								onchange={(e) => settings.borderColor = e.currentTarget.value}
								class="color-text-input"
							/>
						</div>
					</div>
				{/if}
			</section>

			<!-- Media Settings -->
			<section class="settings-section">
				<h2>Настройки медиа</h2>

				<div class="form-group">
					<label class="toggle-label">
						<input type="checkbox" bind:checked={settings.autoConvertWebp} />
						<span class="toggle-text">Автоматически конвертировать изображения в WebP</span>
					</label>
				</div>

				{#if settings.autoConvertWebp}
					<div class="form-group">
						<label for="webp-quality">Качество WebP: {settings.webpQuality}%</label>
						<input
							type="range"
							id="webp-quality"
							bind:value={settings.webpQuality}
							min="50"
							max="100"
							step="5"
						/>
						<div class="range-labels">
							<span>50%</span>
							<span>100%</span>
						</div>
					</div>
				{/if}

				<div class="form-group">
					<label for="max-video-duration">Макс. длительность видео: {settings.maxVideoDuration} сек</label>
					<input
						type="range"
						id="max-video-duration"
						bind:value={settings.maxVideoDuration}
						min="10"
						max="60"
						step="5"
					/>
					<div class="range-labels">
						<span>10 сек</span>
						<span>60 сек</span>
					</div>
				</div>

				<div class="form-group">
					<label for="max-video-size">Макс. размер видео: {settings.maxVideoSizeMb} MB</label>
					<input
						type="range"
						id="max-video-size"
						bind:value={settings.maxVideoSizeMb}
						min="10"
						max="100"
						step="10"
					/>
					<div class="range-labels">
						<span>10 MB</span>
						<span>100 MB</span>
					</div>
				</div>
			</section>
		</div>

		<!-- Preview -->
		<div class="preview-panel">
			<h2>Предпросмотр</h2>
			<div class="preview-container">
				<div class="preview-stories">
					{#each [1, 2, 3] as i}
						<div class="preview-highlight" style="--size: {settings.highlightSize}px">
							<div
								class="preview-highlight-border"
								class:circle={settings.shape === 'circle'}
								class:square={settings.shape === 'square'}
								style="
									--border-width: {settings.borderWidth}px;
									--border-style: {gradientCSS};
								"
							>
								<div class="preview-highlight-inner">
									<span class="preview-icon">{['🎁', '🔥', '⭐'][i - 1]}</span>
								</div>
							</div>
							{#if settings.showTitle && settings.titlePosition === 'bottom'}
								<span class="preview-title">{['Акции', 'Новинки', 'Хиты'][i - 1]}</span>
							{/if}
							{#if settings.showTitle && settings.titlePosition === 'inside'}
								<span class="preview-title-inside">{['Акции', 'Нов...', 'Хиты'][i - 1]}</span>
							{/if}
						</div>
					{/each}
				</div>
				<p class="preview-hint">Так Stories будут выглядеть на главной странице</p>
			</div>
		</div>
	</div>
</div>

<style>
	.settings-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.back-link {
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: #374151;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.alert-error {
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.alert-success {
		background-color: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}

	.settings-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 2rem;
	}

	.settings-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.settings-section {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.settings-section h2 {
		margin: 0 0 1.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group > label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
	}

	.toggle-label input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: #667eea;
	}

	.toggle-text {
		font-size: 0.875rem;
		color: #374151;
	}

	.radio-group {
		display: flex;
		gap: 1.5rem;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
	}

	.radio-label input[type="radio"] {
		accent-color: #667eea;
	}

	input[type="range"] {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #e5e7eb;
		outline: none;
		accent-color: #667eea;
	}

	.range-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: #9ca3af;
		margin-top: 0.25rem;
	}

	.color-input-wrapper {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.color-input-wrapper input[type="color"] {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		padding: 0;
	}

	.color-text-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-family: monospace;
	}

	.gradient-colors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.gradient-color-item {
		position: relative;
	}

	.gradient-color-item input[type="color"] {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		padding: 0;
	}

	.btn-remove-color {
		position: absolute;
		top: -6px;
		right: -6px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #ef4444;
		color: white;
		border: none;
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.btn-add-color {
		width: 40px;
		height: 40px;
		border: 2px dashed #d1d5db;
		border-radius: 0.375rem;
		background: transparent;
		color: #9ca3af;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-add-color:hover {
		border-color: #667eea;
		color: #667eea;
	}

	/* Preview Panel */
	.preview-panel {
		position: sticky;
		top: 1rem;
		height: fit-content;
	}

	.preview-panel h2 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
	}

	.preview-container {
		background: #f9fafb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
	}

	.preview-stories {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.preview-highlight {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		position: relative;
	}

	.preview-highlight-border {
		width: var(--size);
		height: var(--size);
		padding: var(--border-width);
		background: var(--border-style);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-highlight-border.circle {
		border-radius: 50%;
	}

	.preview-highlight-border.square {
		border-radius: 16%;
	}

	.preview-highlight-inner {
		width: 100%;
		height: 100%;
		background: #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: calc(var(--size) * 0.35);
	}

	.preview-highlight-border.circle .preview-highlight-inner {
		border-radius: 50%;
	}

	.preview-highlight-border.square .preview-highlight-inner {
		border-radius: 12%;
	}

	.preview-title {
		font-size: 0.75rem;
		color: #374151;
		text-align: center;
		max-width: var(--size);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview-title-inside {
		position: absolute;
		bottom: calc(var(--size) * 0.1);
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.625rem;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		max-width: calc(var(--size) * 0.8);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview-hint {
		margin: 1.5rem 0 0 0;
		font-size: 0.75rem;
		color: #9ca3af;
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 900px) {
		.settings-layout {
			grid-template-columns: 1fr;
		}

		.preview-panel {
			position: static;
			order: -1;
		}
	}

	@media (max-width: 480px) {
		.settings-section {
			padding: 1rem;
		}

		.radio-group {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
