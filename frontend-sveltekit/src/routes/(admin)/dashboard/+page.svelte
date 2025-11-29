<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Форматирование чисел
	const formatNumber = (num: number): string => {
		return num.toLocaleString('ru-RU');
	};

	// Форматирование валюты
	const formatCurrency = (num: number): string => {
		return num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });
	};

	// Форматирование процентов
	const formatGrowth = (percent: number): string => {
		const sign = percent >= 0 ? '+' : '';
		return `${sign}${percent.toFixed(1)}%`;
	};
</script>

<svelte:head>
	<title>Dashboard - Loyalty Admin</title>
</svelte:head>

<div class="dashboard">
	<div class="page-header">
		<h1>Dashboard</h1>
		<p class="text-muted">Общая статистика программы лояльности по всей сети магазинов</p>
	</div>

	<!-- Статистика -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">👥</div>
			<div class="stat-content">
				<p class="stat-label">Всего клиентов</p>
				<p class="stat-value">{formatNumber(data.stats.totalClients)}</p>
				<p class="stat-growth positive">{formatGrowth(data.stats.clientsGrowth)}</p>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">✨</div>
			<div class="stat-content">
				<p class="stat-label">Активных клиентов</p>
				<p class="stat-value">{formatNumber(data.stats.activeClients)}</p>
				<p class="stat-growth positive">{formatGrowth(data.stats.clientsGrowth)}</p>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">🛒</div>
			<div class="stat-content">
				<p class="stat-label">Транзакций</p>
				<p class="stat-value">{formatNumber(data.stats.totalTransactions)}</p>
				<p class="stat-growth positive">{formatGrowth(data.stats.transactionsGrowth)}</p>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">💰</div>
			<div class="stat-content">
				<p class="stat-label">Выручка</p>
				<p class="stat-value">{formatCurrency(data.stats.totalRevenue)}</p>
				<p class="stat-growth positive">{formatGrowth(data.stats.revenueGrowth)}</p>
			</div>
		</div>
	</div>

	<!-- Таблица магазинов -->
	<div class="section">
		<h2>Магазины ({data.stores.length})</h2>
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Название</th>
						<th>Клиенты</th>
						<th>Транзакции</th>
						<th>Выручка</th>
						<th>Статус</th>
					</tr>
				</thead>
				<tbody>
					{#each data.stores as store}
						<tr>
							<td>
								<div class="store-name">
									<span class="store-icon">🏪</span>
									<span>{store.name}</span>
								</div>
							</td>
							<td>{formatNumber(store.clients)}</td>
							<td>{formatNumber(store.transactions)}</td>
							<td class="revenue-cell">{formatCurrency(store.revenue)}</td>
							<td>
								<span class="badge" class:active={store.active} class:inactive={!store.active}>
									{store.active ? 'Активен' : 'Тестовый'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
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

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.stat-icon {
		font-size: 2.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		flex-shrink: 0;
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-label {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.stat-value {
		margin: 0 0 0.25rem 0;
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
		line-height: 1.2;
	}

	.stat-growth {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.stat-growth.positive {
		color: #059669;
	}

	.stat-growth.negative {
		color: #dc2626;
	}

	/* Section */
	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	/* Table */
	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
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

	.store-name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
	}

	.store-icon {
		font-size: 1.25rem;
	}

	.revenue-cell {
		font-weight: 600;
		color: #111827;
	}

	/* Badges */
	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge.active {
		background-color: #d1fae5;
		color: #065f46;
	}

	.badge.inactive {
		background-color: #fee2e2;
		color: #991b1b;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		th,
		td {
			padding: 0.75rem 0.5rem;
			font-size: 0.813rem;
		}

		.store-name {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
