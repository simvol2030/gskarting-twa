<script lang="ts">
	import type { Customer } from '$lib/data/cashier-mocks';

	interface Props {
		customer: Customer;
	}

	let { customer }: Props = $props();
</script>

<div class="card">
	<div class="info-row">
		<span class="info-label">Клиент</span>
		<span class="info-value">{customer.name}</span>
	</div>
	<div class="info-row">
		<span class="info-label">Номер карты</span>
		<span class="info-value" style="font-family: monospace;">{customer.cardNumber}</span>
	</div>
	<div class="info-row">
		<span class="info-label">Баланс баллов</span>
		<span class="info-value accent">{customer.balance.toFixed(0)} ₽</span>
	</div>
</div>
