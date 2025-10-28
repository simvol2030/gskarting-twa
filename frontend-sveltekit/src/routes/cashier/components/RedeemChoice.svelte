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
			<div class="choice-title">СПИСАТЬ</div>
			<div class="choice-amount">-{maxRedeemPoints} ₽</div>
		</button>

		<!-- Кнопка "Копить" -->
		<button
			class="choice-btn"
			class:selected={!isRedeemSelected}
			onclick={onAccumulateSelect}
		>
			<div class="choice-title">КОПИТЬ</div>
		</button>
	</div>
</div>

<style>
	:global(.card.compact) {
		padding: 6px;
		margin-bottom: 0;
	}

	.info-hint-text {
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
		cursor: help;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
	}

	.info-hint-icon {
		font-size: 11px;
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.info-hint-text:hover .info-hint-icon {
		opacity: 1;
	}

	.choice-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-top: 4px;
	}

	.choice-btn {
		background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
		border: 1px solid var(--accent);
		border-radius: 6px;
		padding: 8px 6px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: center;
		min-height: 50px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		color: white;
		box-shadow: 0 2px 8px var(--glow-accent);
	}

	.choice-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px var(--glow-accent), 0 0 32px var(--glow-accent);
		border-color: var(--accent-light);
	}

	.choice-btn:active {
		transform: translateY(0);
		box-shadow: 0 2px 8px var(--glow-accent);
	}

	.choice-title {
		font-size: 14px;
		font-weight: 600;
	}

	.choice-amount {
		font-size: 19px;
		font-weight: 700;
		color: white;
		text-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
	}
</style>
