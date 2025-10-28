<script lang="ts">
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
		<span class="info-label-icon compact" title="Сумма чека">
			🧾 <span class="info-hint">ⓘ</span>
		</span>
		<span class="info-value compact">{checkAmount.toFixed(2)} ₽</span>
	</div>
	<div class="info-row compact">
		<span class="info-label-icon compact" title="Кэшбэк {cashbackPercent}%">
			⚡ <span class="info-hint">ⓘ</span>
		</span>
		<span class="info-value accent compact">+{cashbackAmount} ₽</span>
	</div>
	<div class="divider compact"></div>
	<div class="info-row compact">
		<span class="info-label-icon compact" title="К оплате">
			💵 <span class="info-hint">ⓘ</span>
		</span>
		<span class="info-value compact" style="font-size: 20px;">{finalAmount.toFixed(2)} ₽</span>
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

	:global(.divider.compact) {
		height: 1px;
		background: linear-gradient(90deg, transparent 0%, var(--border) 50%, transparent 100%);
		margin: 8px 0;
	}
</style>
