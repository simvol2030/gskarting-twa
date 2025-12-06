<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { ordersAdminAPI, type OrderListItem, type OrderDetails } from '$lib/api/admin/orders';
	import { onMount } from 'svelte';

	// State
	let orders = $state<OrderListItem[]>([]);
	let pagination = $state({ page: 1, limit: 20, total: 0, totalPages: 0 });
	let statusCounts = $state<Record<string, number>>({});
	let loading = $state(true);
	let error = $state('');

	// Filters
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let dateFrom = $state('');
	let dateTo = $state('');

	// Selected order for detail view
	let selectedOrder = $state<OrderDetails | null>(null);
	let detailModalOpen = $state(false);
	let detailLoading = $state(false);

	// Status change
	let statusChangeModalOpen = $state(false);
	let newStatus = $state('');
	let statusNotes = $state('');
	let statusChanging = $state(false);

	// Status options
	const statusOptions = [
		{ value: 'all', label: 'Все заказы' },
		{ value: 'new', label: 'Новые' },
		{ value: 'confirmed', label: 'Подтверждённые' },
		{ value: 'processing', label: 'В обработке' },
		{ value: 'shipped', label: 'Отправленные' },
		{ value: 'delivered', label: 'Доставленные' },
		{ value: 'cancelled', label: 'Отменённые' }
	];

	const statusColors: Record<string, string> = {
		new: '#3b82f6',
		confirmed: '#10b981',
		processing: '#f59e0b',
		shipped: '#8b5cf6',
		delivered: '#22c55e',
		cancelled: '#ef4444'
	};

	// Load orders
	async function loadOrders() {
		loading = true;
		error = '';

		try {
			const result = await ordersAdminAPI.getOrders({
				status: statusFilter !== 'all' ? statusFilter : undefined,
				search: searchQuery || undefined,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined,
				page: pagination.page,
				limit: pagination.limit
			});

			orders = result.orders;
			pagination = result.pagination;
			statusCounts = result.statusCounts;
		} catch (e: any) {
			error = e.message || 'Failed to load orders';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	// Apply filters
	function applyFilters() {
		pagination.page = 1;
		loadOrders();
	}

	// Reset filters
	function resetFilters() {
		searchQuery = '';
		statusFilter = 'all';
		dateFrom = '';
		dateTo = '';
		pagination.page = 1;
		loadOrders();
	}

	// Change page
	function handlePageChange(newPage: number) {
		pagination.page = newPage;
		loadOrders();
	}

	// View order details
	async function viewOrder(order: OrderListItem) {
		detailLoading = true;
		detailModalOpen = true;

		try {
			selectedOrder = await ordersAdminAPI.getOrder(order.id);
		} catch (e: any) {
			error = e.message || 'Failed to load order details';
			detailModalOpen = false;
		} finally {
			detailLoading = false;
		}
	}

	// Open status change modal
	function openStatusChange(order: OrderListItem) {
		selectedOrder = { ...order } as any;
		newStatus = order.status;
		statusNotes = '';
		statusChangeModalOpen = true;
	}

	// Submit status change
	async function submitStatusChange() {
		if (!selectedOrder || statusChanging) return;

		statusChanging = true;

		try {
			await ordersAdminAPI.updateStatus(
				selectedOrder.id,
				newStatus,
				statusNotes || undefined,
				'admin' // TODO: get from session
			);

			statusChangeModalOpen = false;
			loadOrders();
		} catch (e: any) {
			error = e.message || 'Failed to update status';
		} finally {
			statusChanging = false;
		}
	}

	// Format helpers
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatPrice(price: number): string {
		return price.toLocaleString('ru-RU') + ' ₽';
	}

	// Mount
	onMount(() => {
		loadOrders();
	});
</script>

<svelte:head>
	<title>Заказы - Админ-панель</title>
</svelte:head>

<div class="orders-page">
	<header class="page-header">
		<h1>Заказы</h1>
		<p class="subtitle">Управление заказами магазина</p>
	</header>

	<!-- Status Tabs -->
	<div class="status-tabs">
		{#each statusOptions as option}
			<button
				class="status-tab"
				class:active={statusFilter === option.value}
				onclick={() => { statusFilter = option.value; applyFilters(); }}
			>
				{option.label}
				{#if option.value !== 'all' && statusCounts[option.value]}
					<span class="count">{statusCounts[option.value]}</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Filters -->
	<div class="filters-bar">
		<div class="search-box">
			<input
				type="text"
				placeholder="Поиск по номеру, имени, телефону..."
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && applyFilters()}
			/>
			<button onclick={applyFilters}>Найти</button>
		</div>

		<div class="date-filters">
			<input type="date" bind:value={dateFrom} placeholder="От" />
			<span>—</span>
			<input type="date" bind:value={dateTo} placeholder="До" />
		</div>

		{#if searchQuery || dateFrom || dateTo}
			<button class="reset-btn" onclick={resetFilters}>Сбросить</button>
		{/if}
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Загрузка заказов...</p>
		</div>
	{:else if orders.length === 0}
		<div class="empty-state">
			<h3>Заказы не найдены</h3>
			<p>Попробуйте изменить фильтры поиска</p>
		</div>
	{:else}
		<!-- Orders Table -->
		<div class="orders-table-wrapper">
			<table class="orders-table">
				<thead>
					<tr>
						<th>Заказ</th>
						<th>Клиент</th>
						<th>Сумма</th>
						<th>Доставка</th>
						<th>Статус</th>
						<th>Дата</th>
						<th>Действия</th>
					</tr>
				</thead>
				<tbody>
					{#each orders as order (order.id)}
						<tr>
							<td class="order-number">
								<button class="link-btn" onclick={() => viewOrder(order)}>
									#{order.orderNumber}
								</button>
							</td>
							<td class="customer">
								<div class="customer-name">{order.customer.name}</div>
								<div class="customer-phone">{order.customer.phone}</div>
							</td>
							<td class="total">{formatPrice(order.totals.total)}</td>
							<td class="delivery">
								{order.deliveryType === 'delivery' ? '🚚 Доставка' : '🏪 Самовывоз'}
							</td>
							<td class="status">
								<span
									class="status-badge"
									style="background-color: {statusColors[order.status] || '#666'}"
								>
									{order.statusLabel}
								</span>
							</td>
							<td class="date">{formatDate(order.createdAt)}</td>
							<td class="actions">
								<button class="action-btn view" onclick={() => viewOrder(order)}>
									👁
								</button>
								<button class="action-btn edit" onclick={() => openStatusChange(order)}>
									✏️
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if pagination.totalPages > 1}
			<div class="pagination">
				<button
					disabled={pagination.page === 1}
					onclick={() => handlePageChange(pagination.page - 1)}
				>
					&larr; Назад
				</button>

				<span class="page-info">
					Страница {pagination.page} из {pagination.totalPages}
				</span>

				<button
					disabled={pagination.page === pagination.totalPages}
					onclick={() => handlePageChange(pagination.page + 1)}
				>
					Далее &rarr;
				</button>
			</div>
		{/if}
	{/if}
</div>

<!-- Order Detail Modal -->
{#if detailModalOpen}
	<div class="modal-overlay" onclick={() => detailModalOpen = false}>
		<div class="modal detail-modal" onclick={(e) => e.stopPropagation()}>
			<header class="modal-header">
				<h2>Заказ #{selectedOrder?.orderNumber || '...'}</h2>
				<button class="close-btn" onclick={() => detailModalOpen = false}>&times;</button>
			</header>

			{#if detailLoading}
				<div class="modal-loading">
					<div class="spinner"></div>
				</div>
			{:else if selectedOrder}
				<div class="modal-body">
					<!-- Status -->
					<div class="detail-section">
						<span
							class="status-badge large"
							style="background-color: {statusColors[selectedOrder.status] || '#666'}"
						>
							{selectedOrder.statusLabel}
						</span>
					</div>

					<!-- Customer -->
					<div class="detail-section">
						<h3>Клиент</h3>
						<p><strong>Имя:</strong> {selectedOrder.customer.name}</p>
						<p><strong>Телефон:</strong> {selectedOrder.customer.phone}</p>
						{#if selectedOrder.customer.email}
							<p><strong>Email:</strong> {selectedOrder.customer.email}</p>
						{/if}
						{#if selectedOrder.loyaltyUser}
							<p class="loyalty-badge">
								🎁 Карта лояльности: {selectedOrder.loyaltyUser.cardNumber || 'Без карты'}
								(баланс: {selectedOrder.loyaltyUser.balance.toFixed(0)} баллов)
							</p>
						{/if}
					</div>

					<!-- Delivery -->
					<div class="detail-section">
						<h3>{selectedOrder.delivery.type === 'delivery' ? 'Доставка' : 'Самовывоз'}</h3>
						{#if selectedOrder.delivery.type === 'delivery'}
							<p>{selectedOrder.delivery.address}</p>
							{#if selectedOrder.delivery.entrance || selectedOrder.delivery.floor || selectedOrder.delivery.apartment}
								<p class="address-details">
									{#if selectedOrder.delivery.entrance}Подъезд {selectedOrder.delivery.entrance}{/if}
									{#if selectedOrder.delivery.floor}, Этаж {selectedOrder.delivery.floor}{/if}
									{#if selectedOrder.delivery.apartment}, Кв. {selectedOrder.delivery.apartment}{/if}
								</p>
							{/if}
							{#if selectedOrder.delivery.intercom}
								<p>Домофон: {selectedOrder.delivery.intercom}</p>
							{/if}
						{:else if selectedOrder.delivery.store}
							<p><strong>{selectedOrder.delivery.store.name}</strong></p>
							<p>{selectedOrder.delivery.store.address}</p>
							<p>Тел: {selectedOrder.delivery.store.phone}</p>
						{/if}
					</div>

					<!-- Items -->
					<div class="detail-section">
						<h3>Позиции заказа</h3>
						<table class="items-table">
							<thead>
								<tr>
									<th>Товар</th>
									<th>Цена</th>
									<th>Кол-во</th>
									<th>Сумма</th>
								</tr>
							</thead>
							<tbody>
								{#each selectedOrder.items as item}
									<tr>
										<td>{item.productName}</td>
										<td>{formatPrice(item.productPrice)}</td>
										<td>{item.quantity}</td>
										<td>{formatPrice(item.total)}</td>
									</tr>
								{/each}
							</tbody>
						</table>

						<div class="order-totals">
							<div class="total-row">
								<span>Подытог:</span>
								<span>{formatPrice(selectedOrder.totals.subtotal)}</span>
							</div>
							{#if selectedOrder.totals.deliveryCost > 0}
								<div class="total-row">
									<span>Доставка:</span>
									<span>{formatPrice(selectedOrder.totals.deliveryCost)}</span>
								</div>
							{/if}
							{#if selectedOrder.totals.discount > 0}
								<div class="total-row discount">
									<span>Скидка:</span>
									<span>-{formatPrice(selectedOrder.totals.discount)}</span>
								</div>
							{/if}
							<div class="total-row grand">
								<span>Итого:</span>
								<span>{formatPrice(selectedOrder.totals.total)}</span>
							</div>
						</div>
					</div>

					<!-- Notes -->
					{#if selectedOrder.notes}
						<div class="detail-section">
							<h3>Примечание</h3>
							<p class="notes">{selectedOrder.notes}</p>
						</div>
					{/if}

					<!-- Status History -->
					{#if selectedOrder.statusHistory.length > 0}
						<div class="detail-section">
							<h3>История статусов</h3>
							<div class="status-history">
								{#each selectedOrder.statusHistory as history}
									<div class="history-item">
										<span class="history-status">{history.newStatusLabel}</span>
										<span class="history-date">{formatDate(history.createdAt)}</span>
										{#if history.notes}
											<span class="history-notes">{history.notes}</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<footer class="modal-footer">
					<button class="btn-secondary" onclick={() => detailModalOpen = false}>
						Закрыть
					</button>
					<button class="btn-primary" onclick={() => { detailModalOpen = false; openStatusChange(selectedOrder as any); }}>
						Изменить статус
					</button>
				</footer>
			{/if}
		</div>
	</div>
{/if}

<!-- Status Change Modal -->
{#if statusChangeModalOpen}
	<div class="modal-overlay" onclick={() => statusChangeModalOpen = false}>
		<div class="modal status-modal" onclick={(e) => e.stopPropagation()}>
			<header class="modal-header">
				<h2>Изменить статус</h2>
				<button class="close-btn" onclick={() => statusChangeModalOpen = false}>&times;</button>
			</header>

			<div class="modal-body">
				<div class="form-group">
					<label for="status-select">Новый статус</label>
					<select id="status-select" bind:value={newStatus}>
						{#each statusOptions.filter(o => o.value !== 'all') as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="status-notes">Комментарий (необязательно)</label>
					<textarea
						id="status-notes"
						bind:value={statusNotes}
						rows="3"
						placeholder="Причина изменения статуса..."
					></textarea>
				</div>
			</div>

			<footer class="modal-footer">
				<button class="btn-secondary" onclick={() => statusChangeModalOpen = false}>
					Отмена
				</button>
				<button
					class="btn-primary"
					onclick={submitStatusChange}
					disabled={statusChanging}
				>
					{statusChanging ? 'Сохранение...' : 'Сохранить'}
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.orders-page {
		padding: 24px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 24px;
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

	.status-tabs {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
		overflow-x: auto;
		padding-bottom: 8px;
	}

	.status-tab {
		padding: 8px 16px;
		border-radius: 20px;
		border: 1px solid #e5e7eb;
		background: white;
		color: #6b7280;
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
		transition: all 0.2s;
	}

	.status-tab:hover {
		border-color: #f97316;
		color: #f97316;
	}

	.status-tab.active {
		background: #f97316;
		color: white;
		border-color: #f97316;
	}

	.status-tab .count {
		background: rgba(255, 255, 255, 0.2);
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 12px;
	}

	.filters-bar {
		display: flex;
		gap: 16px;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.search-box {
		display: flex;
		gap: 8px;
		flex: 1;
		min-width: 300px;
	}

	.search-box input {
		flex: 1;
		padding: 10px 16px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 14px;
	}

	.search-box button {
		padding: 10px 20px;
		background: #f97316;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
	}

	.date-filters {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.date-filters input {
		padding: 10px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 14px;
	}

	.reset-btn {
		padding: 10px 16px;
		background: #f3f4f6;
		border: none;
		border-radius: 8px;
		color: #6b7280;
		cursor: pointer;
	}

	.error-banner {
		background: #fee2e2;
		color: #dc2626;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.loading, .empty-state {
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

	.orders-table-wrapper {
		overflow-x: auto;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.orders-table {
		width: 100%;
		border-collapse: collapse;
	}

	.orders-table th,
	.orders-table td {
		padding: 14px 16px;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	.orders-table th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
		font-size: 13px;
		text-transform: uppercase;
	}

	.link-btn {
		background: none;
		border: none;
		color: #f97316;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
	}

	.customer-name {
		font-weight: 500;
		color: #1f2937;
	}

	.customer-phone {
		font-size: 13px;
		color: #6b7280;
	}

	.total {
		font-weight: 600;
		color: #1f2937;
	}

	.status-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 12px;
		color: white;
		font-size: 13px;
		font-weight: 500;
	}

	.status-badge.large {
		padding: 8px 20px;
		font-size: 15px;
	}

	.date {
		font-size: 13px;
		color: #6b7280;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.action-btn {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		background: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: #f3f4f6;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 20px;
		padding: 20px;
	}

	.pagination button {
		padding: 8px 16px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		cursor: pointer;
	}

	.pagination button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-info {
		color: #6b7280;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.detail-modal {
		max-width: 700px;
	}

	.status-modal {
		max-width: 450px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: none;
		background: #f3f4f6;
		font-size: 20px;
		cursor: pointer;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	.modal-loading {
		padding: 60px;
		text-align: center;
	}

	.detail-section {
		margin-bottom: 24px;
	}

	.detail-section h3 {
		font-size: 14px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		margin: 0 0 12px 0;
	}

	.detail-section p {
		margin: 0 0 8px 0;
		color: #1f2937;
	}

	.loyalty-badge {
		background: #fef3c7;
		padding: 8px 12px;
		border-radius: 8px;
		margin-top: 8px;
	}

	.address-details {
		color: #6b7280 !important;
		font-size: 14px;
	}

	.items-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 16px;
	}

	.items-table th,
	.items-table td {
		padding: 10px 12px;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	.items-table th {
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
	}

	.order-totals {
		border-top: 2px solid #e5e7eb;
		padding-top: 12px;
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		color: #6b7280;
	}

	.total-row.discount {
		color: #22c55e;
	}

	.total-row.grand {
		font-size: 18px;
		font-weight: 700;
		color: #1f2937;
		border-top: 1px solid #e5e7eb;
		padding-top: 12px;
		margin-top: 8px;
	}

	.notes {
		background: #f9fafb;
		padding: 12px;
		border-radius: 8px;
		font-style: italic;
	}

	.status-history {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.history-item {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 8px 12px;
		background: #f9fafb;
		border-radius: 8px;
		font-size: 13px;
	}

	.history-status {
		font-weight: 600;
		color: #1f2937;
	}

	.history-date {
		color: #6b7280;
	}

	.history-notes {
		color: #9ca3af;
		font-style: italic;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 24px;
		border-top: 1px solid #e5e7eb;
	}

	.btn-secondary, .btn-primary {
		padding: 10px 20px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-secondary {
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		color: #374151;
	}

	.btn-primary {
		background: #f97316;
		border: none;
		color: white;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 14px;
	}

	.form-group textarea {
		resize: vertical;
	}
</style>
