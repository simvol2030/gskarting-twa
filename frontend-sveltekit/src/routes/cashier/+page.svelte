<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Состояние интерфейса
	let qrInput = $state('');
	let purchaseAmount = $state<number | ''>('');
	let selectedCustomer = $state<(typeof data.customers)[0] | null>(null);
	let showSuccess = $state(false);
	let successMessage = $state('');

	// Расчёт максимально возможного списания (20% от покупки)
	let maxSpend = $derived(() => {
		if (!purchaseAmount || !selectedCustomer) return 0;
		const maxPercent = Number(purchaseAmount) * 0.2;
		return Math.min(maxPercent, selectedCustomer.balance);
	});

	// Расчёт начисления (4% от покупки)
	let earnAmount = $derived(() => {
		if (!purchaseAmount) return 0;
		return Math.round(Number(purchaseAmount) * 0.04);
	});

	// Обработка сканирования QR-кода
	function handleQRScan() {
		const customer = data.customers.find((c) => c.qrCode === qrInput.trim());

		if (customer) {
			selectedCustomer = customer;
			showSuccess = false;
		} else {
			alert('Покупатель не найден. Проверьте QR-код.');
		}
	}

	// Обработка поиска по номеру карты
	function handleCardSearch() {
		const cardNumber = qrInput.trim().replace(/\s/g, '');
		const customer = data.customers.find((c) => c.cardNumber.replace(/\s/g, '') === cardNumber);

		if (customer) {
			selectedCustomer = customer;
			showSuccess = false;
		} else {
			alert('Покупатель с такой картой не найден.');
		}
	}

	// Начислить бонусы
	function handleEarnBonus() {
		if (!purchaseAmount || !selectedCustomer) {
			alert('Введите сумму покупки');
			return;
		}

		const earned = earnAmount();
		// TODO: отправить в API/БД
		console.log('Начислено:', earned, 'бонусов для', selectedCustomer.name);

		// Временно обновляем в памяти
		selectedCustomer.balance += earned;

		successMessage = `✅ Начислено ${earned} бонусов`;
		showSuccess = true;

		setTimeout(() => {
			resetTransaction();
		}, 2000);
	}

	// Списать бонусы
	function handleSpendBonus() {
		if (!purchaseAmount || !selectedCustomer) {
			alert('Введите сумму покупки');
			return;
		}

		const maxAllowed = maxSpend();
		if (maxAllowed === 0) {
			alert('Списание невозможно (недостаточно бонусов или сумма покупки слишком мала)');
			return;
		}

		// TODO: отправить в API/БД
		console.log('Списано:', maxAllowed, 'бонусов для', selectedCustomer.name);

		// Временно обновляем в памяти
		selectedCustomer.balance -= maxAllowed;

		successMessage = `✅ Списано ${maxAllowed} бонусов (${maxAllowed}₽)`;
		showSuccess = true;

		setTimeout(() => {
			resetTransaction();
		}, 2000);
	}

	// Сброс транзакции
	function resetTransaction() {
		selectedCustomer = null;
		qrInput = '';
		purchaseAmount = '';
		showSuccess = false;
	}

	// Обработка Enter в поле QR
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleQRScan();
		}
	}
</script>

<svelte:head>
	<title>Касса - {data.store.name}</title>
</svelte:head>

<div class="cashier-container">
	<!-- Шапка с информацией о магазине -->
	<header class="cashier-header">
		<div class="store-info">
			<h1>🏪 {data.store.name}</h1>
			<p class="store-address">📍 {data.store.address}</p>
			<p class="store-hours">🕐 {data.store.hours}</p>
		</div>
		<div class="header-actions">
			<button class="btn-secondary" onclick={() => (window.location.href = '/')}>
				🏠 Главная
			</button>
		</div>
	</header>

	<main class="cashier-main">
		{#if !selectedCustomer}
			<!-- Экран сканирования QR -->
			<div class="scan-section">
				<div class="scan-icon">📷</div>
				<h2>Отсканируйте QR-код покупателя</h2>
				<p class="scan-hint">Наведите сканер на QR-код в приложении клиента</p>

				<div class="scan-input-group">
					<input
						type="text"
						class="scan-input"
						placeholder="Данные QR-кода появятся здесь..."
						bind:value={qrInput}
						onkeydown={handleKeydown}
						autofocus
					/>
					<button class="btn-primary" onclick={handleQRScan} disabled={!qrInput.trim()}>
						Найти
					</button>
				</div>

				<div class="divider">или</div>

				<div class="card-search">
					<label for="cardNumber">Введите номер карты вручную:</label>
					<div class="scan-input-group">
						<input
							id="cardNumber"
							type="text"
							class="scan-input"
							placeholder="42 18 567891"
							bind:value={qrInput}
						/>
						<button class="btn-secondary" onclick={handleCardSearch} disabled={!qrInput.trim()}>
							Поиск
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Экран работы с покупателем -->
			<div class="customer-section">
				{#if showSuccess}
					<div class="success-banner">
						{successMessage}
					</div>
				{/if}

				<div class="customer-card">
					<div class="customer-header">
						<div class="customer-avatar">👤</div>
						<div class="customer-info">
							<h2>{selectedCustomer.name}</h2>
							<p class="customer-card-number">💳 Карта: {selectedCustomer.cardNumber}</p>
							<p class="customer-balance">
								💰 Баланс: <strong>{selectedCustomer.balance.toLocaleString()} бонусов</strong>
							</p>
						</div>
					</div>

					<div class="purchase-section">
						<label for="purchaseAmount" class="purchase-label">
							Сумма покупки (₽):
						</label>
						<input
							id="purchaseAmount"
							type="number"
							class="purchase-input"
							placeholder="Введите сумму..."
							bind:value={purchaseAmount}
							min="0"
							step="1"
						/>

						{#if purchaseAmount}
							<div class="calculation-info">
								<div class="calc-row">
									<span>Можно списать (до 20%):</span>
									<strong>{maxSpend().toLocaleString()} ₽</strong>
								</div>
								<div class="calc-row">
									<span>Будет начислено (4%):</span>
									<strong>{earnAmount().toLocaleString()} бонусов</strong>
								</div>
								<div class="calc-row available">
									<span>Доступно на балансе:</span>
									<strong>{selectedCustomer.balance.toLocaleString()} бонусов</strong>
								</div>
							</div>
						{/if}
					</div>

					<div class="action-buttons">
						<button
							class="btn-earn"
							onclick={handleEarnBonus}
							disabled={!purchaseAmount || showSuccess}
						>
							➕ Начислить {purchaseAmount ? `${earnAmount()} бонусов` : 'бонусы'}
						</button>

						<button
							class="btn-spend"
							onclick={handleSpendBonus}
							disabled={!purchaseAmount || maxSpend() === 0 || showSuccess}
						>
							➖ Списать {purchaseAmount ? `${maxSpend().toLocaleString()} ₽` : 'бонусы'}
						</button>
					</div>

					<div class="transaction-history">
						<h3>История (последние операции):</h3>
						<div class="history-placeholder">
							<p>• 23.10.2025 - Покупка +120 б.</p>
							<p>• 15.10.2025 - Списание -450 б.</p>
							<p>• 10.10.2025 - Покупка +85 б.</p>
						</div>
					</div>
				</div>

				<div class="footer-actions">
					<button class="btn-secondary" onclick={resetTransaction}>← Новый покупатель</button>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.cashier-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Шапка */
	.cashier-header {
		background: white;
		padding: 1.5rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.store-info h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #333;
	}

	.store-address,
	.store-hours {
		margin: 0.25rem 0;
		color: #666;
		font-size: 0.95rem;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
	}

	/* Основная область */
	.cashier-main {
		max-width: 900px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	/* Экран сканирования */
	.scan-section {
		background: white;
		border-radius: 16px;
		padding: 3rem 2rem;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.scan-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.scan-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		color: #333;
	}

	.scan-hint {
		color: #666;
		margin-bottom: 2rem;
	}

	.scan-input-group {
		display: flex;
		gap: 1rem;
		max-width: 500px;
		margin: 0 auto 2rem;
	}

	.scan-input {
		flex: 1;
		padding: 1rem;
		font-size: 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		outline: none;
		transition: border-color 0.2s;
	}

	.scan-input:focus {
		border-color: #667eea;
	}

	.divider {
		margin: 2rem 0;
		color: #999;
		font-weight: 500;
		position: relative;
	}

	.divider::before,
	.divider::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 40%;
		height: 1px;
		background: #ddd;
	}

	.divider::before {
		left: 0;
	}
	.divider::after {
		right: 0;
	}

	.card-search {
		max-width: 500px;
		margin: 0 auto;
		text-align: left;
	}

	.card-search label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	/* Экран покупателя */
	.customer-section {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.success-banner {
		background: #10b981;
		color: white;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.customer-card {
		border: 2px solid #f0f0f0;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.customer-header {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #f0f0f0;
	}

	.customer-avatar {
		font-size: 4rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		width: 80px;
		height: 80px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.customer-info h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		color: #333;
	}

	.customer-card-number,
	.customer-balance {
		margin: 0.25rem 0;
		color: #666;
		font-size: 1rem;
	}

	.customer-balance strong {
		color: #10b981;
		font-size: 1.2rem;
	}

	/* Покупка */
	.purchase-section {
		margin-bottom: 2rem;
	}

	.purchase-label {
		display: block;
		margin-bottom: 0.75rem;
		font-weight: 600;
		color: #333;
		font-size: 1.1rem;
	}

	.purchase-input {
		width: 100%;
		padding: 1rem;
		font-size: 1.25rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		outline: none;
		transition: border-color 0.2s;
	}

	.purchase-input:focus {
		border-color: #667eea;
	}

	.calculation-info {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.calc-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e0e0e0;
		font-size: 1rem;
	}

	.calc-row:last-child {
		border-bottom: none;
	}

	.calc-row.available {
		color: #10b981;
		font-weight: 600;
	}

	/* Кнопки действий */
	.action-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	button {
		padding: 1rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #5568d3;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-secondary {
		background: #6b7280;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #4b5563;
	}

	.btn-earn {
		background: #10b981;
		color: white;
		font-size: 1.1rem;
		padding: 1.25rem;
	}

	.btn-earn:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
	}

	.btn-spend {
		background: #ef4444;
		color: white;
		font-size: 1.1rem;
		padding: 1.25rem;
	}

	.btn-spend:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
	}

	/* История */
	.transaction-history {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 2px solid #f0f0f0;
	}

	.transaction-history h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #555;
	}

	.history-placeholder p {
		margin: 0.5rem 0;
		color: #666;
		font-size: 0.95rem;
	}

	.footer-actions {
		margin-top: 1.5rem;
		text-align: center;
	}

	/* Адаптив */
	@media (max-width: 768px) {
		.cashier-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.action-buttons {
			grid-template-columns: 1fr;
		}

		.customer-header {
			flex-direction: column;
			text-align: center;
		}

		.customer-avatar {
			margin: 0 auto;
		}
	}
</style>
