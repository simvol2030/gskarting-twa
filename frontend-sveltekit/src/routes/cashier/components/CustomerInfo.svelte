<script lang="ts">
	import type { Customer } from '$lib/data/cashier-mocks';

	interface Props {
		customer: Customer;
	}

	let { customer }: Props = $props();
</script>

<div class="card compact">
	<div class="info-row compact">
		<span class="info-label-icon compact" title="Клиент">
			👤 <span class="info-hint">ⓘ</span>
		</span>
		<span class="info-value compact">{customer.name || 'Без имени'}</span>
	</div>
	<div class="info-row compact">
		<span class="info-label-icon compact" title="Номер карты">
			💳 <span class="info-hint">ⓘ</span>
		</span>
		<span class="info-value compact" style="font-family: monospace;">{customer.cardNumber}</span>
	</div>
	<div class="info-row compact">
		<span class="info-label-icon compact" title="Баланс баллов">
			💰 <span class="info-hint">ⓘ</span>
		</span>
		<span class="info-value accent compact">{customer.balance.toFixed(0)} ₽</span>
	</div>
</div>

<style>
	:global(.card.compact) {
		padding: 12px;
		margin-bottom: 0;
	}

	:global(.info-row.compact) {
		padding: 6px 0;
	}

	:global(.info-label-icon.compact) {
		font-size: 20px;
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: help;
		transition: opacity 0.2s;
	}

	:global(.info-label-icon.compact:hover) {
		opacity: 0.8;
	}

	:global(.info-hint) {
		font-size: 12px;
		color: var(--text-secondary);
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	:global(.info-label-icon:hover .info-hint) {
		opacity: 1;
	}

	:global(.info-value.compact) {
		font-size: 16px;
		color: #ffffff !important;
		font-weight: 600;
	}

	:global(.info-value.accent.compact) {
		color: var(--accent-light) !important;
	}
</style>
