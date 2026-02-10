<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingAdminAPI, type ActionLogEntry } from '$lib/api/admin/booking';

	let logs = $state<ActionLogEntry[]>([]);
	let loading = $state(true);
	let error = $state('');
	let total = $state(0);
	let page = $state(1);
	let limit = $state(30);

	// Filters
	let filterAction = $state('');

	async function loadLogs() {
		loading = true;
		error = '';
		try {
			const result = await bookingAdminAPI.getActionLog({
				page,
				limit,
				action: filterAction || undefined
			});
			logs = result.logs;
			total = result.total;
		} catch (e: any) {
			error = e.message || 'Failed to load action log';
		} finally {
			loading = false;
		}
	}

	function handleFilterChange() {
		page = 1;
		loadLogs();
	}

	const totalPages = $derived(Math.ceil(total / limit) || 1);

	function prevPage() {
		if (page > 1) { page--; loadLogs(); }
	}
	function nextPage() {
		if (page < totalPages) { page++; loadLogs(); }
	}

	function getActionLabel(action: string): string {
		const labels: Record<string, string> = {
			created: 'Создание',
			confirmed: 'Подтверждение',
			cancelled: 'Отмена',
			shifted: 'Смещение',
			edited: 'Изменение'
		};
		return labels[action] || action;
	}

	function getActionColor(action: string): string {
		const colors: Record<string, string> = {
			created: '#059669',
			confirmed: '#2563eb',
			cancelled: '#dc2626',
			shifted: '#7c3aed',
			edited: '#d97706'
		};
		return colors[action] || '#6b7280';
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function parseDetails(details: string | null): Record<string, any> | null {
		if (!details) return null;
		try {
			return JSON.parse(details);
		} catch {
			return null;
		}
	}

	onMount(() => { loadLogs(); });
</script>

<svelte:head>
	<title>Лог действий - Admin</title>
</svelte:head>

<div class="log-page">
	<div class="page-header">
		<div class="header-left">
			<h1>Лог действий</h1>
			<p class="text-muted">История всех действий с бронированиями</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="filters-bar">
		<select class="filter-select" bind:value={filterAction} onchange={handleFilterChange}>
			<option value="">Все действия</option>
			<option value="created">Создание</option>
			<option value="confirmed">Подтверждение</option>
			<option value="cancelled">Отмена</option>
			<option value="shifted">Смещение</option>
			<option value="edited">Изменение</option>
		</select>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Загрузка...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>{error}</p>
			<button class="btn-retry" onclick={loadLogs}>Повторить</button>
		</div>
	{:else if logs.length === 0}
		<div class="empty-state">
			<p>Нет записей в логе</p>
		</div>
	{:else}
		<div class="log-list">
			{#each logs as entry (entry.id)}
				<div class="log-entry">
					<div class="log-entry-header">
						<span
							class="action-badge"
							style="background-color: {getActionColor(entry.action)};"
						>
							{getActionLabel(entry.action)}
						</span>
						<span class="log-date">{formatDate(entry.created_at)}</span>
					</div>

					<div class="log-entry-body">
						{#if entry.booking}
							<p class="log-booking-info">
								Бронирование #{entry.booking.id}: {entry.booking.contact_name}
								| {entry.booking.date} {entry.booking.start_time}
								<span
									class="status-tag"
									style="color: {getActionColor(entry.booking.status)};"
								>
									({entry.booking.status})
								</span>
							</p>
						{/if}

						{#if entry.details}
							{@const parsed = parseDetails(entry.details)}
							{#if parsed}
								<div class="log-details">
									{#if entry.action === 'shifted' && parsed.old_start_time}
										<span>
											{parsed.old_start_time} &rarr; {parsed.new_start_time}
											({parsed.shift_minutes > 0 ? '+' : ''}{parsed.shift_minutes} мин)
										</span>
										{#if parsed.reason}
											<span class="detail-reason">Причина: {parsed.reason}</span>
										{/if}
									{:else if entry.action === 'cancelled' && parsed.reason}
										<span>Причина: {parsed.reason}</span>
									{:else if entry.action === 'created' && parsed.source}
										<span>Источник: {parsed.source} | Участников: {parsed.participant_count}</span>
									{:else if entry.action === 'edited' && parsed.type}
										<span>Тип: {parsed.type}</span>
									{:else}
										<span class="raw-details">{entry.details}</span>
									{/if}
								</div>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="pagination">
				<button class="page-btn" onclick={prevPage} disabled={page <= 1}>&laquo; Назад</button>
				<span class="page-info">{page} / {totalPages} (всего: {total})</span>
				<button class="page-btn" onclick={nextPage} disabled={page >= totalPages}>Вперёд &raquo;</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.log-page {
		max-width: 900px;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}

	.text-muted {
		color: #6b7280;
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
	}

	/* Filters */
	.filters-bar {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.filter-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background: white;
		color: #111827;
		min-width: 150px;
	}

	/* Loading/Error */
	.loading-state, .error-state, .empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	.btn-retry {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	/* Log List */
	.log-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.log-entry {
		background: white;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		border-left: 3px solid #e5e7eb;
	}

	.log-entry-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}

	.action-badge {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 500;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.log-date {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.log-entry-body {
		font-size: 0.8125rem;
		color: #374151;
	}

	.log-booking-info {
		margin: 0 0 0.25rem;
	}

	.status-tag {
		font-weight: 500;
		font-size: 0.75rem;
	}

	.log-details {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.8125rem;
		color: #6b7280;
		padding: 0.375rem 0.5rem;
		background: #f9fafb;
		border-radius: 0.25rem;
		margin-top: 0.25rem;
	}

	.detail-reason {
		font-style: italic;
	}

	.raw-details {
		font-family: monospace;
		font-size: 0.75rem;
		word-break: break-all;
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 1rem 0;
	}

	.page-btn {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
		min-height: 44px;
	}

	.page-btn:hover:not(:disabled) {
		background: #f3f4f6;
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-info {
		font-size: 0.875rem;
		color: #6b7280;
	}

	@media (max-width: 480px) {
		.log-entry-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
