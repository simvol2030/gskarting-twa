<script lang="ts">
	import type { ClientStats } from '$lib/types/admin';
	import { Card, Button, Badge } from '$lib/components/ui';

	interface Props {
		stats: ClientStats;
		onAdjustBalance?: () => void;
		canAdjust?: boolean;
	}

	let { stats, onAdjustBalance, canAdjust = false }: Props = $props();

	const formatCurrency = (num: number): string =>
		num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });
</script>

<Card>
	<h3>Управление балансом</h3>

	<div class="balance-info">
		<div class="balance-row">
			<span>Текущий баланс:</span>
			<strong class="balance-value">{formatCurrency(stats.currentBalance)}</strong>
		</div>

		<div class="balance-row">
			<span>Доступно к списанию:</span>
			<strong class="effective-balance">{formatCurrency(stats.effectiveBalance)}</strong>
			{#if stats.expiredPoints > 0}
				<Badge variant="warning" size="sm">
					{formatCurrency(stats.expiredPoints)} истекают скоро
				</Badge>
			{/if}
		</div>
	</div>

	{#if canAdjust}
		<Button variant="primary" fullWidth onclick={onAdjustBalance}>
			Изменить баланс вручную
		</Button>
	{/if}
</Card>

<style>
	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.balance-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.balance-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.balance-row span {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.balance-value {
		font-size: 1.5rem;
		color: #059669;
	}

	.effective-balance {
		font-size: 1.25rem;
		color: #10b981;
	}
</style>
