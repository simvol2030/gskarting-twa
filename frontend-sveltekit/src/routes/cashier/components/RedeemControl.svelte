<script lang="ts">
	import type { Store } from '$lib/data/cashier-mocks';

	interface Props {
		checkAmount: number;
		customerBalance: number;
		storeConfig: Store;
		pointsToRedeem: number;
		maxRedeemPoints: number;
		canRedeem: boolean;
		onRedeemChange: (points: number) => void;
		onRedeemMax: () => void;
		onRedeemNone: () => void;
	}

	let { 
		checkAmount,
		customerBalance,
		storeConfig,
		pointsToRedeem = $bindable(0),
		maxRedeemPoints,
		canRedeem,
		onRedeemChange,
		onRedeemMax,
		onRedeemNone
	}: Props = $props();

	let redeemInput = $state(pointsToRedeem.toString());

	function handleInput() {
		const points = parseInt(redeemInput) || 0;
		onRedeemChange(points);
	}
</script>

<div class="card">
	<div class="info-row">
		<span class="info-label">Сумма чека</span>
		<span class="info-value">{checkAmount.toFixed(2)} ₽</span>
	</div>
	<div class="info-row">
		<span class="info-label">Кэшбэк {storeConfig.cashbackPercent}%</span>
		<span class="info-value accent">+{Math.floor(checkAmount * storeConfig.cashbackPercent / 100)} ₽</span>
	</div>
	<div class="divider"></div>
	<div class="info-row">
		<span class="info-label">К оплате</span>
		<span class="info-value" style="font-size: 24px;">{(checkAmount - pointsToRedeem).toFixed(2)} ₽</span>
	</div>
</div>

{#if canRedeem}
	<div class="card">
		<h3 class="mb-2">Списать баллы?</h3>
		<p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">
			Максимум: {maxRedeemPoints} ₽ (до {storeConfig.maxDiscountPercent}% от чека)
		</p>
		<input
			bind:value={redeemInput}
			class="input mb-2"
			type="number"
			placeholder="Сколько баллов списать..."
			min="0"
			max={maxRedeemPoints}
			oninput={handleInput}
		/>
		<div class="grid-2">
			<button class="btn btn-secondary" onclick={onRedeemNone}>
				Не списывать
			</button>
			<button class="btn btn-primary" onclick={() => { redeemInput = maxRedeemPoints.toString(); onRedeemMax(); }}>
				Макс ({maxRedeemPoints} ₽)
			</button>
		</div>
	</div>
{/if}
