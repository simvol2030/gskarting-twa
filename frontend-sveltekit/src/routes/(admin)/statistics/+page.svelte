<script lang="ts">
	import type { PageData } from './$types';

	// Local interfaces for statistics page data
	interface StatTransaction {
		id: number;
		date: string;
		storeId: number;
		clientId: number;
		type: string;
		amount: number;
		points: number;
		description: string;
	}

	interface StatStore {
		id: number;
		name: string;
		active: boolean;
		clients: number;
		transactions: number;
		revenue: number;
	}

	interface StatClient {
		id: number;
		name: string;
	}

	let { data }: { data: PageData } = $props();

	// Selected store state
	let selectedStoreId = $state<number>(0); // 0 = all stores

	// Event handlers
	function selectStore(storeId: number) {
		selectedStoreId = storeId;
	}

	function selectAllStores() {
		selectedStoreId = 0;
	}

	// Computed statistics based on selected store
	const filteredTransactions = $derived(() => {
		if (selectedStoreId === 0) {
			return data.transactions;
		}
		return data.transactions.filter((t: StatTransaction) => t.storeId === selectedStoreId);
	});

	const selectedStore = $derived(() => {
		if (selectedStoreId === 0) return null;
		return data.stores.find((s: StatStore) => s.id === selectedStoreId);
	});

	const totalRevenue = $derived(() => {
		return filteredTransactions().reduce((sum: number, t: StatTransaction) => {
			return t.type === 'purchase' ? sum + t.amount : sum;
		}, 0);
	});

	const totalTransactions = $derived(() => {
		return filteredTransactions().length;
	});

	const totalPointsEarned = $derived(() => {
		return filteredTransactions().reduce((sum: number, t: StatTransaction) => {
			return t.type === 'earn' || t.type === 'purchase' ? sum + t.points : sum;
		}, 0);
	});

	const totalPointsRedeemed = $derived(() => {
		return filteredTransactions().reduce((sum: number, t: StatTransaction) => {
			return t.type === 'redeem' ? sum + t.points : sum;
		}, 0);
	});

	// Format helpers
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function getClientName(clientId: number): string {
		const client = data.clients.find((c: StatClient) => c.id === clientId);
		return client?.name || 'Неизвестный';
	}

	function getStoreName(storeId: number): string {
		const store = data.stores.find((s: StatStore) => s.id === storeId);
		return store?.name || 'Неизвестный';
	}

	function getTransactionBadgeClass(type: string): string {
		switch (type) {
			case 'purchase':
				return 'badge-success';
			case 'redeem':
				return 'badge-warning';
			case 'earn':
				return 'badge-info';
			default:
				return '';
		}
	}
</script>

<svelte:head>
	<title>Статистика по магазинам - Loyalty Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Статистика по магазинам</h1>
		<p class="text-muted">Детальная аналитика продаж и транзакций</p>
	</div>

	<!-- Store Selector -->
	<div class="store-selector">
		<h2>Выберите магазин</h2>
		<div class="store-buttons">
			<button
				class="store-btn"
				class:active={selectedStoreId === 0}
				onclick={selectAllStores}
			>
				Все магазины
			</button>
			{#each data.stores as store}
				<button
					class="store-btn"
					class:active={selectedStoreId === store.id}
					class:inactive={!store.active}
					onclick={() => selectStore(store.id)}
				>
					{store.name}
					{#if !store.active}
						<span class="inactive-badge">(неактивен)</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">💰</div>
			<div class="stat-content">
				<div class="stat-label">Общая выручка</div>
				<div class="stat-value">{formatCurrency(totalRevenue())}</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📊</div>
			<div class="stat-content">
				<div class="stat-label">Транзакций</div>
				<div class="stat-value">{totalTransactions()}</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">➕</div>
			<div class="stat-content">
				<div class="stat-label">Начислено баллов</div>
				<div class="stat-value">{totalPointsEarned().toLocaleString('ru-RU')}</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">➖</div>
			<div class="stat-content">
				<div class="stat-label">Списано баллов</div>
				<div class="stat-value">{totalPointsRedeemed().toLocaleString('ru-RU')}</div>
			</div>
		</div>
	</div>

	<!-- Selected Store Info -->
	{#if selectedStore()}
		<div class="store-info">
			<h3>Информация о магазине: {selectedStore()?.name}</h3>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Адрес:</span>
					<span class="info-value">Магазин {selectedStore()?.name}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Клиентов:</span>
					<span class="info-value">{selectedStore()?.clients}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Транзакций:</span>
					<span class="info-value">{selectedStore()?.transactions}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Выручка:</span>
					<span class="info-value">{formatCurrency(selectedStore()?.revenue || 0)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Transactions Table -->
	<div class="section">
		<h2>История транзакций</h2>
		{#if filteredTransactions().length > 0}
			<div class="table-wrapper">
				<table class="table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Дата</th>
							<th>Клиент</th>
							{#if selectedStoreId === 0}
								<th>Магазин</th>
							{/if}
							<th>Тип</th>
							<th>Сумма</th>
							<th>Баллы</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredTransactions() as transaction}
							<tr>
								<td>{transaction.id}</td>
								<td>{formatDate(transaction.date)}</td>
								<td>{getClientName(transaction.clientId)}</td>
								{#if selectedStoreId === 0}
									<td>{getStoreName(transaction.storeId)}</td>
								{/if}
								<td>
									<span class="badge {getTransactionBadgeClass(transaction.type)}">
										{transaction.description}
									</span>
								</td>
								<td>{formatCurrency(transaction.amount)}</td>
								<td class="points">{transaction.points}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">
				<p>Нет транзакций для отображения</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 1400px;
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

	/* Store Selector */
	.store-selector {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		margin-bottom: 2rem;
	}

	.store-selector h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.store-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.store-btn {
		padding: 0.75rem 1.5rem;
		background: #f3f4f6;
		border: 2px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		transition: all 0.2s;
	}

	.store-btn:hover {
		background: #e5e7eb;
	}

	.store-btn.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-color: #667eea;
	}

	.store-btn.inactive {
		opacity: 0.6;
	}

	.inactive-badge {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-icon {
		font-size: 2.5rem;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #111827;
	}

	/* Store Info */
	.store-info {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		margin-bottom: 2rem;
	}

	.store-info h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.info-value {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
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

	/* Table */
	.table-wrapper {
		overflow-x: auto;
	}

	.table {
		width: 100%;
		border-collapse: collapse;
	}

	.table thead {
		background: #f9fafb;
	}

	.table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}

	.table td {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: #111827;
		border-bottom: 1px solid #e5e7eb;
	}

	.table tbody tr:hover {
		background: #f9fafb;
	}

	.table td.points {
		font-weight: 600;
		color: #667eea;
	}

	/* Badge */
	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge-success {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-warning {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-info {
		background: #dbeafe;
		color: #1e40af;
	}

	/* Empty State */
	.empty-state {
		padding: 3rem;
		text-align: center;
		color: #6b7280;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.store-buttons {
			flex-direction: column;
		}

		.store-btn {
			width: 100%;
		}

		.section {
			padding: 1.5rem;
		}

		.table {
			font-size: 0.75rem;
		}

		.table th,
		.table td {
			padding: 0.5rem;
		}
	}
</style>
