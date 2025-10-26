<script lang="ts">
	import type { Transaction } from '$lib/data/cashier-mocks';

	interface Props {
		transactions: Transaction[];
	}

	let { transactions }: Props = $props();
</script>

{#if transactions.length > 0}
	<div class="card">
		<h3 class="mb-2">Последние транзакции</h3>
		{#each transactions.slice(0, 3) as tx}
			<div class="info-row" style="font-size: 12px;">
				<span style="color: var(--text-secondary);">
					{new Date(tx.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
					- {tx.customerName}
				</span>
				<span style="color: var(--accent); font-weight: 600;">
					{tx.finalAmount.toFixed(2)} ₽
				</span>
			</div>
		{/each}
	</div>
{/if}
