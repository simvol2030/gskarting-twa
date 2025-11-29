<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const formatNumber = (num: number | undefined | null) => (num ?? 0).toLocaleString('ru-RU');
	const formatCurrency = (num: number | undefined | null) => (num ?? 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });
</script>

<svelte:head>
	<title>Магазины - Loyalty Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Управление магазинами</h1>
		<p class="text-muted">Всего магазинов: {data.stores.length}</p>
	</div>

	<div class="section">
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
								<span class="badge" class:active={store.active}>
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
	.page { max-width: 1200px; }
	.page-header { margin-bottom: 2rem; }
	.page-header h1 { margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; }
	.text-muted { color: #6b7280; margin: 0; }

	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.table-container { overflow-x: auto; }

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead { background-color: #f9fafb; }

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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

	.store-icon { font-size: 1.25rem; }

	.revenue-cell {
		font-weight: 600;
		color: #111827;
	}

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

	.badge:not(.active) {
		background-color: #fee2e2;
		color: #991b1b;
	}

	@media (max-width: 768px) {
		th, td {
			padding: 0.75rem 0.5rem;
			font-size: 0.813rem;
		}
	}
</style>
