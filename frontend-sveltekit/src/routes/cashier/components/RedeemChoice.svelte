<script lang="ts">
	interface Props {
		maxRedeemPoints: number;
		currentBalance: number;
		cashbackAmount: number;
		isRedeemSelected: boolean;
		onRedeemSelect: () => void;
		onAccumulateSelect: () => void;
	}

	let {
		maxRedeemPoints,
		currentBalance,
		cashbackAmount,
		isRedeemSelected,
		onRedeemSelect,
		onAccumulateSelect
	}: Props = $props();
</script>

<div class="card compact">
	<p class="info-hint-text" title="Максимальная сумма для списания баллов">
		Можно списать: {maxRedeemPoints} ₽ <span class="info-hint-icon">ⓘ</span>
	</p>

	<div class="choice-buttons">
		<!-- Кнопка "Списать" -->
		<button
			class="choice-btn"
			class:selected={isRedeemSelected}
			onclick={onRedeemSelect}
		>
			<div class="choice-title">💳 СПИСАТЬ</div>
			<div class="choice-amount">-{maxRedeemPoints} ₽</div>
		</button>

		<!-- Кнопка "Копить" -->
		<button
			class="choice-btn"
			class:selected={!isRedeemSelected}
			onclick={onAccumulateSelect}
		>
			<div class="choice-title">💰 КОПИТЬ</div>
		</button>
	</div>
</div>

<style>
	:global(.card.compact) {
		padding: 12px;
		margin-bottom: 0;
	}

	.info-hint-text {
		text-align: center;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 10px;
		cursor: help;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.info-hint-icon {
		font-size: 12px;
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.info-hint-text:hover .info-hint-icon {
		opacity: 1;
	}

	.choice-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-top: 10px;
	}

	.choice-btn {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, #1a2332 100%);
		border: 2px solid var(--border);
		border-radius: 12px;
		padding: 16px 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: center;
		min-height: 100px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.choice-btn:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
	}

	.choice-btn.selected {
		border-color: var(--accent);
		background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
		color: white;
		box-shadow: 0 0 24px var(--glow-accent);
	}

	.choice-title {
		font-size: 16px;
		font-weight: 600;
	}

	.choice-amount {
		font-size: 22px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.choice-btn.selected .choice-amount {
		color: white;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}
</style>
