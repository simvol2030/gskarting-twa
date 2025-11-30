<script lang="ts">
	import type { PageData } from './$types';
	import type { Store } from '$lib/types/admin';
	import { goto, invalidateAll } from '$app/navigation';
	import { Input, Select, Badge, Button, Pagination } from '$lib/components/ui';
	import ConfirmModal from '$lib/components/admin/clients/ConfirmModal.svelte';
	import { clientsAPI } from '$lib/api/admin/clients';

	let { data }: { data: PageData } = $props();

	// Form state для фильтров (не применяется автоматически)
	let searchQuery = $state(data.filters.search);
	let statusFilter = $state(data.filters.status);
	let storeFilter = $state(data.filters.storeId);

	// Modals state
	let blockModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let selectedClient = $state<typeof data.clients[0] | null>(null);
	let actionLoading = $state(false);

	// User role (TODO: получать из session)
	const userRole = 'super-admin'; // or 'editor' or 'viewer'
	const canBlock = userRole === 'super-admin';
	const canDelete = userRole === 'super-admin';

	// Применить фильтры (обновить URL)
	const applyFilters = () => {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (storeFilter !== 'all') params.set('storeId', storeFilter.toString());
		params.set('page', '1'); // Reset to page 1 when filters change

		goto(`/clients?${params.toString()}`);
	};

	// Сбросить фильтры
	const resetFilters = () => {
		searchQuery = '';
		statusFilter = 'all';
		storeFilter = 'all';
		goto('/clients');
	};

	// Изменить страницу
	const handlePageChange = (page: number) => {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (storeFilter !== 'all') params.set('storeId', storeFilter.toString());
		params.set('page', page.toString());

		goto(`/clients?${params.toString()}`);
	};

	// Форматирование
	const formatNumber = (num: number): string => num.toLocaleString('ru-RU');
	const formatCurrency = (num: number): string =>
		num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });
	const formatDate = (dateStr: string): string => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('ru-RU');
	};

	// Относительное время
	const formatRelativeTime = (dateStr: string): string => {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Сегодня';
		if (diffDays === 1) return 'Вчера';
		if (diffDays < 7) return `${diffDays} дней назад`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`;
		return formatDate(dateStr);
	};

	// Получить название магазина по ID
	const getStoreName = (storeId: number | null): string => {
		if (!storeId) return '-';
		const store = data.stores.find((s: Store) => s.id === storeId);
		return store?.name || 'Неизвестно';
	};

	// Опции для фильтра магазинов
	const storeOptions = $derived(() => [
		{ value: 'all', label: 'Все магазины' },
		...data.stores.map((s: Store) => ({ value: s.id, label: s.name }))
	]);

	// Перейти на детальную страницу
	const viewClient = (clientId: number) => {
		goto(`/clients/${clientId}`);
	};

	// Открыть модалку блокировки
	const openBlockModal = (client: typeof data.clients[0]) => {
		selectedClient = client;
		blockModalOpen = true;
	};

	// Подтвердить блокировку/разблокировку
	const confirmBlock = async () => {
		if (!selectedClient) return;

		actionLoading = true;
		try {
			await clientsAPI.toggleActive(selectedClient.id, {
				isActive: !selectedClient.isActive,
				reason: selectedClient.isActive ? 'Заблокирован администратором' : 'Разблокирован администратором'
			});

			// Reload data
			await invalidateAll();
			blockModalOpen = false;
			selectedClient = null;
		} catch (error) {
			console.error('Error blocking client:', error);
			alert('Ошибка при изменении статуса клиента');
		} finally {
			actionLoading = false;
		}
	};

	// Открыть модалку удаления
	const openDeleteModal = (client: typeof data.clients[0]) => {
		selectedClient = client;
		deleteModalOpen = true;
	};

	// Подтвердить удаление
	const confirmDelete = async () => {
		if (!selectedClient) return;

		actionLoading = true;
		try {
			await clientsAPI.delete(selectedClient.id, true); // soft delete

			// Reload data
			await invalidateAll();
			deleteModalOpen = false;
			selectedClient = null;
		} catch (error) {
			console.error('Error deleting client:', error);
			alert('Ошибка при удалении клиента');
		} finally {
			actionLoading = false;
		}
	};
</script>

<svelte:head>
	<title>Клиентская база - Loyalty Admin</title>
</svelte:head>

<div class="clients-page">
	<div class="page-header">
		<h1>Клиентская база</h1>
		<p class="text-muted">Всего клиентов: {data.clients.length}</p>
	</div>

	<!-- Фильтры -->
	<div class="filters-panel">
		<div class="search-box">
			<Input
				type="text"
				placeholder="Поиск по имени, карте, Telegram ID..."
				icon="🔍"
				bind:value={searchQuery}
			/>
		</div>

		<div class="filters-row">
			<Select
				bind:value={statusFilter}
				options={[
					{ value: 'all', label: 'Все клиенты' },
					{ value: 'active', label: 'Активные' },
					{ value: 'inactive', label: 'Заблокированные' }
				]}
			/>

			<Select bind:value={storeFilter} options={storeOptions()} />
		</div>

		<div class="filter-actions">
			<Button variant="primary" onclick={applyFilters}>🔍 Применить фильтры</Button>
			<Button variant="ghost" onclick={resetFilters}>✕ Сбросить</Button>
		</div>

		<div class="filter-results">
			<p class="text-muted">Найдено: {data.pagination.total} клиентов</p>
		</div>
	</div>

	<!-- Таблица клиентов -->
	<div class="section">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Имя</th>
						<th>Telegram</th>
						<th>Карта</th>
						<th>Баланс</th>
						<th>Покупок</th>
						<th>Магазин</th>
						<th>Статус</th>
						<th>Последняя активность</th>
						<th>Действия</th>
					</tr>
				</thead>
				<tbody>
					{#each data.clients as client (client.id)}
						<tr>
							<td class="id-cell">{client.id}</td>
							<td class="client-name">{client.name}</td>
							<td class="telegram-cell">
								{#if client.username}
									@{client.username}
								{:else}
									<span class="text-muted">{client.telegramId}</span>
								{/if}
							</td>
							<td class="card-cell">{client.cardNumber || '-'}</td>
							<td class="balance-cell">{formatCurrency(client.balance)}</td>
							<td class="text-center">{formatNumber(client.totalPurchases)}</td>
							<td class="text-muted">{getStoreName(client.registeredStoreId)}</td>
							<td>
								<Badge variant={client.isActive ? 'success' : 'danger'}>
									{client.isActive ? 'Активен' : 'Заблокирован'}
								</Badge>
							</td>
							<td class="text-muted">{formatRelativeTime(client.lastActivity)}</td>
							<td>
								<div class="action-buttons">
									<Button variant="ghost" size="sm" onclick={() => viewClient(client.id)}>
										👁️ Просмотр
									</Button>

									{#if canBlock}
										<Button
											variant={client.isActive ? 'danger' : 'primary'}
											size="sm"
											onclick={() => openBlockModal(client)}
										>
											{client.isActive ? '🔒 Блокировать' : '✓ Разблокировать'}
										</Button>
									{/if}

									{#if canDelete}
										<Button variant="danger" size="sm" onclick={() => openDeleteModal(client)}>
											🗑️ Удалить
										</Button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="10" class="empty-state">Клиенты не найдены</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Пагинация -->
		{#if data.pagination.totalPages > 1}
			<Pagination pagination={data.pagination} onPageChange={handlePageChange} />
		{/if}
	</div>
</div>

<!-- Модалки -->
<ConfirmModal
	isOpen={blockModalOpen}
	title={selectedClient?.isActive ? 'Заблокировать клиента?' : 'Разблокировать клиента?'}
	message={selectedClient?.isActive
		? `Клиент "${selectedClient?.name}" не сможет списывать баллы и получать кешбэк. Продолжить?`
		: `Клиент "${selectedClient?.name}" снова сможет использовать программу лояльности. Продолжить?`}
	confirmText={selectedClient?.isActive ? 'Заблокировать' : 'Разблокировать'}
	confirmVariant={selectedClient?.isActive ? 'danger' : 'primary'}
	onConfirm={confirmBlock}
	onCancel={() => (blockModalOpen = false)}
	loading={actionLoading}
/>

<ConfirmModal
	isOpen={deleteModalOpen}
	title="Удалить клиента?"
	message={`Вы уверены, что хотите удалить клиента "${selectedClient?.name}"? Это действие нельзя отменить.`}
	confirmText="Удалить"
	confirmVariant="danger"
	onConfirm={confirmDelete}
	onCancel={() => (deleteModalOpen = false)}
	loading={actionLoading}
/>

<style>
	.clients-page {
		max-width: 1400px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
	}

	.text-muted {
		color: #6b7280;
		margin: 0;
	}

	/* Filters Panel */
	.filters-panel {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		margin-bottom: 1.5rem;
	}

	.search-box {
		margin-bottom: 1rem;
	}

	.filters-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-actions {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.filter-results {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Section */
	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	/* Table */
	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 1000px;
	}

	thead {
		background-color: #f9fafb;
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	td {
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
		font-size: 0.875rem;
	}

	.id-cell {
		font-family: monospace;
		color: #9ca3af;
		font-size: 0.813rem;
	}

	.telegram-cell {
		font-family: monospace;
		color: #667eea;
		font-weight: 500;
	}

	.card-cell {
		font-family: monospace;
		font-weight: 500;
	}

	.client-name {
		font-weight: 500;
		color: #111827;
	}

	.balance-cell {
		font-weight: 600;
		color: #059669;
	}

	.text-center {
		text-align: center;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #9ca3af;
		font-style: italic;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.filters-row {
			flex-direction: column;
		}

		th,
		td {
			padding: 0.75rem 0.5rem;
			font-size: 0.813rem;
		}

		.table-container {
			overflow-x: scroll;
		}
	}
</style>
