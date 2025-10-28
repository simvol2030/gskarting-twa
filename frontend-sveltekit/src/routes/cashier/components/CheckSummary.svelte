<script lang="ts">
	import InfoTooltip from './InfoTooltip.svelte';

	interface Props {
		checkAmount: number;
		cashbackPercent: number;
		cashbackAmount: number;
		finalAmount: number;
	}

	let { checkAmount, cashbackPercent, cashbackAmount, finalAmount }: Props = $props();
</script>

<div class="card compact">
	<div class="info-row compact">
		<InfoTooltip text="Сумма чека" />
		<span class="info-value compact">{checkAmount.toFixed(2)} ₽</span>
	</div>
	<div class="info-row compact">
		<InfoTooltip text="Кэшбэк {cashbackPercent}%" />
		<span class="info-value accent compact">+{cashbackAmount} ₽</span>
	</div>
	<div class="divider compact"></div>
	<div class="info-row compact">
		<InfoTooltip text="К оплате" />
		<span class="info-value compact" style="font-size: 23px;">{finalAmount.toFixed(2)} ₽</span>
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

	:global(.divider.compact) {
		height: 1px;
		background: linear-gradient(90deg, transparent 0%, var(--border) 50%, transparent 100%);
		margin: 4px 0;
	}
</style>
