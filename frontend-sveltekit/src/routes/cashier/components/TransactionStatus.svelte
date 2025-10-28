<script lang="ts">
	interface Props {
		status: 'processing' | 'success' | 'error';
		finalAmount?: number;
		pointsRedeemed?: number;
		cashbackEarned?: number;
		newBalance?: number;
		errorMessage?: string;
	}

	let { 
		status, 
		finalAmount = 0,
		pointsRedeemed = 0,
		cashbackEarned = 0,
		newBalance = 0,
		errorMessage = ''
	}: Props = $props();
</script>

{#if status === 'processing'}
	<div class="card text-center">
		<h2 class="mb-3" style="font-size: 23px;">Обработка...</h2>
		<div class="status-badge status-processing" style="font-size: 15px;">Транзакция обрабатывается</div>
	</div>
{:else if status === 'success'}
	<div class="card success-animation text-center">
		<h2 class="mb-3" style="color: var(--accent); font-size: 25px;">✓ Успешно!</h2>
		<div class="info-row">
			<span class="info-label" style="font-size: 16px;">Оплачено</span>
			<span class="info-value" style="font-size: 20px;">{finalAmount.toFixed(2)} ₽</span>
		</div>
		{#if pointsRedeemed > 0}
			<div class="info-row">
				<span class="info-label" style="font-size: 16px;">Списано баллов</span>
				<span class="info-value warning" style="font-size: 20px;">-{pointsRedeemed} ₽</span>
			</div>
		{/if}
		<div class="info-row">
			<span class="info-label" style="font-size: 16px;">Начислено баллов</span>
			<span class="info-value accent" style="font-size: 20px;">+{cashbackEarned} ₽</span>
		</div>
		<div class="divider"></div>
		<div class="info-row">
			<span class="info-label" style="font-size: 16px;">Новый баланс</span>
			<span class="info-value accent" style="font-size: 35px;">
				{newBalance.toFixed(0)} ₽
			</span>
		</div>
		<p class="mt-3" style="color: var(--text-secondary); font-size: 14px;">
			Автоматический переход к новой транзакции...
		</p>
	</div>
{:else if status === 'error'}
	<div class="card text-center" style="border-color: var(--danger);">
		<h2 class="mb-3" style="color: var(--danger); font-size: 25px;">✗ Ошибка</h2>
		<p style="color: var(--text-secondary); font-size: 18px;">{errorMessage}</p>
	</div>
{/if}
