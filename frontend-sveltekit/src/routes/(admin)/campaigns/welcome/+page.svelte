<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { API_BASE_URL } from '$lib/config';

	let { data }: { data: PageData } = $props();

	// Delete message
	const deleteMessage = async (id: number, title: string) => {
		if (!confirm(`Удалить сообщение "${title.substring(0, 50)}..."?`)) return;

		try {
			const response = await fetch(`${API_BASE_URL}/admin/welcome-messages/${id}`, {
				method: 'DELETE',
				credentials: 'include'
			});

			const json = await response.json();

			if (!json.success) {
				alert(json.error || 'Ошибка при удалении');
				return;
			}

			await invalidateAll();
		} catch (error) {
			console.error('Error deleting message:', error);
			alert('Ошибка при удалении сообщения');
		}
	};

	// Toggle active status
	const toggleActive = async (id: number, currentStatus: boolean) => {
		try {
			const response = await fetch(`${API_BASE_URL}/admin/welcome-messages/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ is_active: !currentStatus })
			});

			const json = await response.json();

			if (!json.success) {
				alert(json.error || 'Ошибка при обновлении');
				return;
			}

			await invalidateAll();
		} catch (error) {
			console.error('Error toggling status:', error);
			alert('Ошибка при изменении статуса');
		}
	};
</script>

<div class="page-container">
	<div class="page-header">
		<div>
			<h1>Приветственные сообщения</h1>
			<p class="page-description">
				Управление сообщениями, которые получают новые пользователи при команде /start
			</p>
		</div>
		<button class="btn btn-primary" onclick={() => goto('/campaigns/welcome/new')}>
			+ Добавить сообщение
		</button>
	</div>

	<div class="messages-list">
		{#if data.messages.length === 0}
			<div class="empty-state">
				<p>Нет сообщений</p>
				<button class="btn btn-primary" onclick={() => goto('/campaigns/welcome/new')}>
					Создать первое сообщение
				</button>
			</div>
		{:else}
			{#each data.messages as message}
				<div class="message-card">
					<div class="message-header">
						<div class="message-order">#{message.order_number}</div>
						<div class="message-status">
							<label class="switch">
								<input
									type="checkbox"
									checked={message.is_active}
									onchange={() => toggleActive(message.id, message.is_active)}
								/>
								<span class="slider"></span>
							</label>
							<span class="status-label">{message.is_active ? 'Активно' : 'Неактивно'}</span>
						</div>
					</div>

					<div class="message-content">
						<div class="message-text">{message.message_text.substring(0, 200)}{message.message_text.length > 200 ? '...' : ''}</div>

						{#if message.button_text}
							<div class="message-button">
								<span class="button-icon">🔘</span>
								<span>{message.button_text}</span>
							</div>
						{/if}
					</div>

					<div class="message-meta">
						<div class="meta-item">
							<span class="meta-label">Задержка:</span>
							<span>{message.delay_seconds} сек</span>
						</div>
						{#if message.message_image}
							<div class="meta-item">
								<span class="meta-label">📷 Изображение</span>
							</div>
						{/if}
					</div>

					<div class="message-actions">
						<button
							class="btn btn-secondary btn-sm"
							onclick={() => goto(`/campaigns/welcome/${message.id}`)}
						>
							Редактировать
						</button>
						<button
							class="btn btn-danger btn-sm"
							onclick={() => deleteMessage(message.id, message.message_text)}
						>
							Удалить
						</button>
					</div>
				</div>
			{/each}
		{/if}
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

	.messages-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.message-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 20px;
		transition: box-shadow 0.2s;
	}

	.message-card:hover {
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.message-order {
		font-size: 18px;
		font-weight: 600;
		color: #3b82f6;
	}

	.message-status {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.status-label {
		font-size: 14px;
		color: #6b7280;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 24px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #cbd5e1;
		transition: 0.3s;
		border-radius: 24px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #10b981;
	}

	input:checked + .slider:before {
		transform: translateX(24px);
	}

	.message-content {
		margin-bottom: 16px;
	}

	.message-text {
		white-space: pre-wrap;
		color: #374151;
		line-height: 1.6;
		margin-bottom: 12px;
	}

	.message-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: #eff6ff;
		border: 1px solid #3b82f6;
		border-radius: 6px;
		color: #3b82f6;
		font-size: 14px;
	}

	.button-icon {
		font-size: 16px;
	}

	.message-meta {
		display: flex;
		gap: 24px;
		padding: 12px 0;
		border-top: 1px solid #f3f4f6;
		border-bottom: 1px solid #f3f4f6;
		margin-bottom: 16px;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}

	.meta-label {
		color: #6b7280;
		font-weight: 500;
	}

	.message-actions {
		display: flex;
		gap: 8px;
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

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	.btn-danger {
		background: #fee2e2;
		color: #dc2626;
	}

	.btn-danger:hover {
		background: #fecaca;
	}

	.btn-sm {
		padding: 6px 12px;
		font-size: 13px;
	}

	.empty-state {
		text-align: center;
		padding: 64px 20px;
		color: #6b7280;
	}

	.empty-state p {
		margin-bottom: 16px;
		font-size: 16px;
	}
</style>
