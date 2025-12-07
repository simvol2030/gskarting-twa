<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { API_BASE_URL } from '$lib/config';

	let { data }: { data: PageData } = $props();

	// Form state
	let message_text = $state(data.message.message_text);
	let message_image = $state(data.message.message_image || '');
	let button_text = $state(data.message.button_text || '');
	let button_url = $state(data.message.button_url || '');
	let delay_seconds = $state(data.message.delay_seconds);
	let order_number = $state(data.message.order_number);
	let is_active = $state(data.message.is_active);

	// UI state
	let isSaving = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Save message
	const saveMessage = async () => {
		// Validation
		if (!message_text.trim()) {
			errorMessage = 'Текст сообщения обязателен';
			return;
		}

		if (delay_seconds < 0) {
			errorMessage = 'Задержка не может быть отрицательной';
			return;
		}

		if (order_number < 1) {
			errorMessage = 'Порядковый номер должен быть больше 0';
			return;
		}

		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch(`${API_BASE_URL}/admin/welcome-messages/${data.message.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					message_text: message_text.trim(),
					message_image: message_image.trim() || null,
					button_text: button_text.trim() || null,
					button_url: button_url.trim() || null,
					delay_seconds,
					order_number,
					is_active
				})
			});

			const json = await response.json();

			if (!json.success) {
				errorMessage = json.error || 'Ошибка при сохранении';
				return;
			}

			successMessage = 'Изменения сохранены';
			await invalidateAll();

			// Redirect back to list after 1 second
			setTimeout(() => {
				goto('/campaigns/welcome');
			}, 1000);
		} catch (error) {
			console.error('Error saving message:', error);
			errorMessage = 'Ошибка при сохранении сообщения';
		} finally {
			isSaving = false;
		}
	};
</script>

<div class="page-container">
	<div class="page-header">
		<div>
			<h1>Редактировать сообщение #{data.message.order_number}</h1>
			<p class="page-description">Управление приветственным сообщением</p>
		</div>
		<button class="btn btn-secondary" onclick={() => goto('/campaigns/welcome')}>
			← Назад к списку
		</button>
	</div>

	{#if errorMessage}
		<div class="alert alert-error">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div class="alert alert-success">
			{successMessage}
		</div>
	{/if}

	<div class="form-card">
		<form onsubmit={(e) => { e.preventDefault(); saveMessage(); }}>
			<div class="form-group">
				<label for="message_text">Текст сообщения *</label>
				<textarea
					id="message_text"
					bind:value={message_text}
					rows="6"
					placeholder="Введите текст приветственного сообщения"
					required
				></textarea>
				<div class="form-hint">Используйте переменные: &#123;first_name&#125;, &#123;last_name&#125;, &#123;username&#125;</div>
			</div>

			<div class="form-group">
				<label for="message_image">URL изображения</label>
				<input
					type="url"
					id="message_image"
					bind:value={message_image}
					placeholder="https://example.com/image.jpg"
				/>
				<div class="form-hint">Ссылка на изображение, которое будет отображаться в сообщении</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="button_text">Текст кнопки</label>
					<input
						type="text"
						id="button_text"
						bind:value={button_text}
						placeholder="Мурзи-коины"
					/>
				</div>

				<div class="form-group">
					<label for="button_url">URL кнопки</label>
					<input
						type="text"
						id="button_url"
						bind:value={button_url}
						placeholder="&#123;WEB_APP_URL&#125;"
					/>
					<div class="form-hint">Используйте &#123;WEB_APP_URL&#125; для ссылки на приложение</div>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="order_number">Порядковый номер *</label>
					<input
						type="number"
						id="order_number"
						bind:value={order_number}
						min="1"
						required
					/>
					<div class="form-hint">Порядок отправки сообщения</div>
				</div>

				<div class="form-group">
					<label for="delay_seconds">Задержка (секунды) *</label>
					<input
						type="number"
						id="delay_seconds"
						bind:value={delay_seconds}
						min="0"
						required
					/>
					<div class="form-hint">Задержка перед отправкой</div>
				</div>
			</div>

			<div class="form-group">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={is_active}
					/>
					<span>Сообщение активно</span>
				</label>
			</div>

			<div class="form-actions">
				<button type="submit" class="btn btn-primary" disabled={isSaving}>
					{isSaving ? 'Сохранение...' : 'Сохранить изменения'}
				</button>
				<button
					type="button"
					class="btn btn-secondary"
					onclick={() => goto('/campaigns/welcome')}
					disabled={isSaving}
				>
					Отмена
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 32px;
	}

	h1 {
		font-size: 28px;
		font-weight: 600;
		margin: 0 0 8px 0;
		color: #111827;
	}

	.page-description {
		color: #6b7280;
		margin: 0;
	}

	.alert {
		padding: 12px 16px;
		border-radius: 6px;
		margin-bottom: 24px;
		font-size: 14px;
	}

	.alert-error {
		background: #fee2e2;
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.alert-success {
		background: #d1fae5;
		color: #059669;
		border: 1px solid #6ee7b7;
	}

	.form-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 24px;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-bottom: 20px;
	}

	label {
		display: block;
		font-weight: 500;
		margin-bottom: 8px;
		color: #374151;
		font-size: 14px;
	}

	input[type="text"],
	input[type="url"],
	input[type="number"],
	textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		color: #111827;
		transition: border-color 0.2s;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	textarea {
		resize: vertical;
		font-family: inherit;
	}

	.form-hint {
		font-size: 12px;
		color: #6b7280;
		margin-top: 4px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		gap: 12px;
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid #e5e7eb;
	}

	.btn {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #e5e7eb;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			gap: 16px;
		}
	}
</style>
