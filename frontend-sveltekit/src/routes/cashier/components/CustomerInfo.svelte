<script lang="ts">
	import type { Customer } from '$lib/data/cashier-mocks';
	import InfoTooltip from './InfoTooltip.svelte';

	interface Props {
		customer: Customer;
	}

	let { customer }: Props = $props();
</script>

<div class="card compact">
	<div class="info-row compact">
		<InfoTooltip text="Клиент" />
		<span class="info-value compact">{customer.name || 'Без имени'}</span>
	</div>
	<div class="info-row compact">
		<InfoTooltip text="Номер карты" />
		<span class="info-value compact" style="font-family: monospace;">{customer.cardNumber}</span>
	</div>
	<div class="info-row compact">
		<InfoTooltip text="Баланс баллов" />
		<span class="info-value accent compact">{customer.balance.toFixed(0)} ₽</span>
	</div>
</div>

<style>
	:global(.card.compact) {
		padding: 6px;
		margin-bottom: 0;
	}

	:global(.info-row.compact) {
		padding: 3px 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	:global(.info-value.compact) {
		font-size: 19px;
		color: #ffffff !important;
		font-weight: 600;
	}

	:global(.info-value.accent.compact) {
		color: var(--accent-light) !important;
	}
</style>
