<script lang="ts">
	import type { ClientTransaction } from '$lib/types/admin';
	import { Badge } from '$lib/components/ui';

	interface Props {
		transactions: ClientTransaction[];
	}

	let { transactions }: Props = $props();

	const formatCurrency = (num: number): string =>
		num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });

	const formatDateTime = (dateStr: string): string => {
		const date = new Date(dateStr);
		return date.toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getTypeBadge = (
		type: string
	): { variant: 'success' | 'warning' | 'info' | 'danger'; label: string } => {
		const map: Record<string, any> = {
			earn: { variant: 'success', label: 'Начисление' },
			purchase: { variant: 'success', label: 'Начисление' },
			spend: { variant: 'warning', label: 'Списание' }, // BUG-C1 FIX: Added spend type
			redeem: { variant: 'warning', label: 'Списание' },
			manual_add: { variant: 'info', label: 'Начисление' },
			manual_subtract: { variant: 'danger', label: 'Списание вручную' }
		};
		return map[type] || { variant: 'info', label: type };
	};

	// BUG-C2 FIX: Helper to format points with correct sign based on transaction type
	const formatPoints = (tx: ClientTransaction): string => {
		const isSpend = tx.type === 'redeem' || tx.type === 'manual_subtract';
		const absValue = Math.abs(tx.pointsChange);
		if (isSpend) {
			return `-${absValue}`;
		}
		return `+${absValue}`;
	};

	// BUG-C2 FIX: Helper to determine if points should be styled as negative
	const isNegativeTransaction = (tx: ClientTransaction): boolean => {
		return tx.type === 'redeem' || tx.type === 'manual_subtract';
	};
</script>

<div class="transactions-table">
	<h3>История транзакций</h3>

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Дата/Время</th>
					<th>Магазин</th>
					<th>Тип</th>
					<th>Сумма покупки</th>
					<th>Баллы</th>
					<th>Баланс после</th>
				</tr>
			</thead>
			<tbody>
				{#each transactions as tx (tx.id)}
					{#snippet transactionRow()}
						{@const badge = getTypeBadge(tx.type)}
						<tr>
							<td class="date-cell">{formatDateTime(tx.date)}</td>
							<td>{tx.storeName || '-'}</td>
							<td>
								<Badge variant={badge.variant} size="sm">
									{badge.label}
								</Badge>
							</td>
							<td class="amount-cell">
								{tx.purchaseAmount ? formatCurrency(tx.purchaseAmount) : '-'}
							</td>
							<td
								class="points-cell"
								class:positive={!isNegativeTransaction(tx)}
								class:negative={isNegativeTransaction(tx)}
							>
								{formatPoints(tx)}
							</td>
							<td class="balance-cell">{formatCurrency(tx.balanceAfter)}</td>
						</tr>
					{/snippet}
					{@render transactionRow()}
				{:else}
					<tr>
						<td colspan="6" class="empty-state">Транзакций пока нет</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.transactions-table {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 700px;
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
	}

	td {
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
		font-size: 0.875rem;
	}

	.date-cell {
		font-family: monospace;
		color: #6b7280;
	}

	.amount-cell {
		font-weight: 500;
	}

	.points-cell {
		font-weight: 600;
		font-family: monospace;
	}

	.points-cell.positive {
		color: #059669;
	}

	.points-cell.negative {
		color: #dc2626;
	}

	.balance-cell {
		font-weight: 600;
		color: #059669;
	}

	.empty-state {
		text-align: center;
		padding: 2rem 1rem;
		color: #9ca3af;
		font-style: italic;
	}
</style>
