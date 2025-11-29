<script lang="ts">
	import type { ClientStats } from '$lib/types/admin';
	import { Card } from '$lib/components/ui';

	interface Props {
		stats: ClientStats;
	}

	let { stats }: Props = $props();

	const formatCurrency = (num: number): string =>
		num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });
</script>

<div class="stats-grid">
	<Card>
		<div class="stat">
			<span class="icon">💰</span>
			<div>
				<div class="value">{formatCurrency(stats.currentBalance)}</div>
				<div class="label">Баланс</div>
			</div>
		</div>
	</Card>

	<Card>
		<div class="stat">
			<span class="icon">🛒</span>
			<div>
				<div class="value">{stats.totalPurchases}</div>
				<div class="label">Покупок</div>
			</div>
		</div>
	</Card>

	<Card>
		<div class="stat">
			<span class="icon">💸</span>
			<div>
				<div class="value">{formatCurrency(stats.totalSaved)}</div>
				<div class="label">Сэкономлено</div>
			</div>
		</div>
	</Card>

	<Card>
		<div class="stat">
			<span class="icon">📅</span>
			<div>
				<div class="value">{stats.daysSinceRegistration}</div>
				<div class="label">Дней с регистрации</div>
			</div>
		</div>
	</Card>
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.value {
		font-size: 1.5rem;
		font-weight: bold;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
