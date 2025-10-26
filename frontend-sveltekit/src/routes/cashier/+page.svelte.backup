<script lang="ts">
	import {
		MOCK_STORES,
		MOCK_QUICK_TESTS,
		mockIdentifyCustomer,
		mockGetTransactionAmount,
		mockEarnPoints,
		mockRedeemAndEarn,
		mockForceConfirm
	} from '$lib/services/cashier-mock-api';

	// =====================================
	// Состояние интерфейса
	// =====================================

	// Магазин (фиксированный, из .env)
	const currentStore = MOCK_STORES[0]; // В реальности из STORE_ID

	// Текущее состояние UI
	type UIState = 'idle' | 'customer_found' | 'amount_loaded' | 'processing' | 'success' | 'error';
	let uiState = $state<UIState>('idle');

	// Поле ввода QR/карты
	let qrInput = $state('');
	let qrInputRef: HTMLInputElement | null = null;

	// Данные покупателя
	let customer = $state<any>(null);

	// Сумма покупки
	let purchaseAmount = $state<number>(0);
	let isLoadingAmount = $state(false);
	let amountError = $state<string | null>(null);
	let manualAmountInput = $state<string>('');

	// Обработка транзакции
	let isProcessing = $state(false);
	let processingMessage = $state('');
	let successMessage = $state('');
	let errorMessage = $state('');
	let showManualConfirm = $state(false);

	// Расчётные суммы
	let earnAmount = $derived(() => {
		if (!purchaseAmount) return 0;
		return Math.round(purchaseAmount * 0.04);
	});

	let maxRedeemAmount = $derived(() => {
		if (!purchaseAmount || !customer) return 0;
		const maxFromPurchase = purchaseAmount * 0.2;
		return Math.min(maxFromPurchase, customer.balance);
	});

	let canRedeem = $derived(() => {
		return customer && customer.balance >= 50 && maxRedeemAmount() > 0;
	});

	// =====================================
	// Обработчики событий
	// =====================================

	/**
	 * Поиск покупателя по QR/карте
	 */
	async function handleSearch() {
		if (!qrInput.trim()) return;

		uiState = 'processing';
		processingMessage = 'Поиск покупателя...';

		try {
			const result = await mockIdentifyCustomer(qrInput.trim());

			if (result.success) {
				customer = result.customer;
				uiState = 'customer_found';
				qrInput = '';

				// Автоматический запрос суммы из 1С
				fetchAmountFrom1C();
			} else {
				uiState = 'error';
				errorMessage = result.error || 'Покупатель не найден';
			}
		} catch (error) {
			uiState = 'error';
			errorMessage = 'Ошибка при поиске покупателя';
		}
	}

	/**
	 * Автоматический запрос суммы из 1С
	 */
	async function fetchAmountFrom1C() {
		isLoadingAmount = true;
		amountError = null;

		try {
			const result = await mockGetTransactionAmount(currentStore.id);

			if (result.success) {
				purchaseAmount = result.transaction.amount;
				uiState = 'amount_loaded';
			} else {
				amountError = result.error;
			}
		} catch (error) {
			amountError = 'Не удалось получить сумму из 1С';
		} finally {
			isLoadingAmount = false;
		}
	}

	/**
	 * Ручной ввод суммы (если 1С недоступен)
	 */
	function handleManualAmountSubmit() {
		const amount = parseFloat(manualAmountInput);
		if (amount > 0) {
			purchaseAmount = amount;
			amountError = null;
			uiState = 'amount_loaded';
		}
	}

	/**
	 * Начислить баллы
	 */
	async function handleEarnOnly() {
		if (!customer || !purchaseAmount) return;

		uiState = 'processing';
		processingMessage = 'Начисление баллов...';
		isProcessing = true;

		try {
			const result = await mockEarnPoints({
				userId: customer.id,
				storeId: currentStore.id,
				purchaseAmount,
				earnAmount: earnAmount()
			});

			if (result.success) {
				customer.balance = result.newBalance;
				uiState = 'success';
				successMessage = `✅ Начислено: +${result.earned} М\nНовый баланс: ${result.newBalance} М`;

				// Автосброс через 3 секунды
				setTimeout(resetInterface, 3000);
			} else {
				uiState = 'error';
				errorMessage = result.error;
			}
		} catch (error) {
			uiState = 'error';
			errorMessage = 'Ошибка при начислении баллов';
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * Списать + начислить
	 */
	async function handleRedeemAndEarn() {
		if (!customer || !purchaseAmount || !canRedeem()) return;

		uiState = 'processing';
		processingMessage = 'Ожидание ответа от 1С...';
		isProcessing = true;

		try {
			const result = await mockRedeemAndEarn({
				userId: customer.id,
				storeId: currentStore.id,
				purchaseAmount,
				redeemAmount: maxRedeemAmount(),
				earnAmount: earnAmount(),
				transactionId: 'TXN-MOCK'
			});

			if (result.success) {
				customer.balance = result.newBalance;
				uiState = 'success';
				const finalAmount = purchaseAmount - maxRedeemAmount();
				successMessage = `✅ Списано: -${result.redeemed} М\n✅ Начислено: +${result.earned} М\nНовый баланс: ${result.newBalance} М\n\nПокупатель платит: ${finalAmount.toFixed(2)} ₽`;

				setTimeout(resetInterface, 3000);
			} else if (result.requireManualConfirmation) {
				// 1С не ответил - показываем ручное подтверждение
				showManualConfirm = true;
				processingMessage = result.error;
			} else {
				uiState = 'error';
				errorMessage = result.error;
			}
		} catch (error) {
			uiState = 'error';
			errorMessage = 'Ошибка при обработке транзакции';
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * Принудительное подтверждение (без ответа 1С)
	 */
	async function handleForceConfirm() {
		if (!customer) return;

		isProcessing = true;

		try {
			const result = await mockForceConfirm({
				userId: customer.id,
				redeemAmount: maxRedeemAmount(),
				earnAmount: earnAmount()
			});

			if (result.success) {
				customer.balance = result.newBalance;
				uiState = 'success';
				successMessage = `⚠️ ${result.warning}\n\nСписано: -${result.redeemed} М\nНачислено: +${result.earned} М\nНовый баланс: ${result.newBalance} М`;

				showManualConfirm = false;
				setTimeout(resetInterface, 5000);
			}
		} catch (error) {
			uiState = 'error';
			errorMessage = 'Ошибка при принудительном подтверждении';
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * Сброс интерфейса (Esc или автоматически после успеха)
	 */
	function resetInterface() {
		customer = null;
		purchaseAmount = 0;
		qrInput = '';
		manualAmountInput = '';
		amountError = null;
		successMessage = '';
		errorMessage = '';
		showManualConfirm = false;
		uiState = 'idle';

		// Возврат фокуса в поле ввода
		setTimeout(() => {
			qrInputRef?.focus();
		}, 100);
	}

	/**
	 * Быстрые кнопки для тестирования
	 */
	function quickTest(qr: string) {
		qrInput = qr;
		handleSearch();
	}

	// Глобальная обработка Esc
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			resetInterface();
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="cashier-container">
	<!-- ==================== HEADER: Магазин ==================== -->
	<div class="store-header">
		<div class="store-icon">🏪</div>
		<div class="store-info">
			<div class="store-name">{currentStore.name}</div>
			<div class="store-address">{currentStore.address}</div>
		</div>
	</div>

	<!-- ==================== ПОИСК ПОКУПАТЕЛЯ ==================== -->
	<div class="search-section">
		<label for="qr-input" class="search-label">Номер карты / QR-код:</label>
		<div class="search-input-row">
			<input
				id="qr-input"
				type="text"
				bind:value={qrInput}
				bind:this={qrInputRef}
				on:keydown={(e) => e.key === 'Enter' && handleSearch()}
				placeholder="Сканируйте QR или введите номер"
				class="search-input"
				disabled={uiState === 'processing'}
			/>
			<button
				onclick={handleSearch}
				disabled={!qrInput.trim() || uiState === 'processing'}
				class="search-button"
			>
				🔍 Найти
			</button>
		</div>
	</div>

	<!-- ==================== ДАННЫЕ ПОКУПАТЕЛЯ ==================== -->
	{#if customer && uiState !== 'idle'}
		<div class="customer-info">
			<div class="customer-row">
				<span class="customer-label">👤 Покупатель:</span>
				<span class="customer-value">{customer.firstName} {customer.lastName}</span>
			</div>
			<div class="customer-row">
				<span class="customer-label">💳 Карта:</span>
				<span class="customer-value">{customer.cardNumber}</span>
			</div>
			<div class="customer-row">
				<span class="customer-label">💰 Баланс:</span>
				<span class="customer-balance">{customer.balance.toFixed(0)} М</span>
			</div>
		</div>
	{/if}

	<!-- ==================== СУММА ПОКУПКИ ==================== -->
	{#if customer && uiState !== 'idle'}
		<div class="amount-section">
			{#if isLoadingAmount}
				<div class="amount-loading">🔄 Запрос суммы из 1С...</div>
			{:else if amountError}
				<div class="amount-error">
					<div class="error-text">⚠️ {amountError}</div>
					<button onclick={fetchAmountFrom1C} class="retry-button">🔄 Повторить запрос</button>
					<div class="manual-input-section">
						<label>Или введите сумму вручную:</label>
						<div class="manual-input-row">
							<input
								type="number"
								bind:value={manualAmountInput}
								placeholder="Сумма в ₽"
								class="manual-input"
							/>
							<button onclick={handleManualAmountSubmit} class="manual-submit-button">
								Продолжить
							</button>
						</div>
						<div class="manual-warning">⚠️ При ручном вводе доступно только начисление</div>
					</div>
				</div>
			{:else if purchaseAmount > 0}
				<div class="amount-display">
					<span class="amount-label">💵 Сумма покупки:</span>
					<span class="amount-value">{purchaseAmount.toFixed(2)} ₽</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ==================== КНОПКИ ДЕЙСТВИЙ ==================== -->
	{#if uiState === 'amount_loaded'}
		<div class="actions-section">
			<!-- Кнопка: Только начислить -->
			<button onclick={handleEarnOnly} disabled={isProcessing} class="action-button earn-button">
				<div class="button-icon">💚</div>
				<div class="button-title">НАЧИСЛИТЬ</div>
				<div class="button-details">+ {earnAmount()} М (4% кешбэк)</div>
				<div class="button-payment">Покупатель платит: {purchaseAmount.toFixed(2)} ₽</div>
			</button>

			<!-- Кнопка: Списать + начислить -->
			<button
				onclick={handleRedeemAndEarn}
				disabled={isProcessing || !canRedeem() || amountError !== null}
				class="action-button redeem-button"
				class:disabled={!canRedeem() || amountError !== null}
			>
				<div class="button-icon">⭐</div>
				<div class="button-title">
					{#if amountError}
						СПИСАТЬ НЕДОСТУПНО
					{:else if !canRedeem()}
						СПИСАТЬ НЕДОСТУПНО
					{:else}
						СПИСАТЬ + НАЧИСЛИТЬ
					{/if}
				</div>
				{#if canRedeem() && !amountError}
					<div class="button-details">- {maxRedeemAmount().toFixed(0)} М (скидка {maxRedeemAmount().toFixed(0)} ₽)</div>
					<div class="button-details">+ {earnAmount()} М (4% кешбэк)</div>
					<div class="button-payment">
						Покупатель платит: {(purchaseAmount - maxRedeemAmount()).toFixed(2)} ₽
					</div>
				{:else}
					<div class="button-disabled-reason">
						{#if amountError}
							Нет связи с 1С - скидка невозможна
						{:else}
							Недостаточно баллов (минимум 50 М)
						{/if}
					</div>
				{/if}
			</button>
		</div>
	{/if}

	<!-- ==================== ОБРАБОТКА ТРАНЗАКЦИИ ==================== -->
	{#if uiState === 'processing'}
		<div class="processing-overlay">
			<div class="processing-message">{processingMessage}</div>
			{#if showManualConfirm}
				<div class="manual-confirm-section">
					<button onclick={fetchAmountFrom1C} class="retry-button">🔄 Повторить запрос</button>
					<button onclick={handleForceConfirm} class="force-confirm-button">
						⚠️ ПОДТВЕРДИТЬ ПРИНУДИТЕЛЬНО
					</button>
					<div class="force-warning">
						⚠️ Баллы спишутся, но скидка в 1С<br />не будет применена автоматически
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ==================== УСПЕХ ==================== -->
	{#if uiState === 'success'}
		<div class="success-overlay">
			<div class="success-icon">✅</div>
			<div class="success-title">Транзакция завершена</div>
			<div class="success-message">{successMessage}</div>
			<div class="success-auto-close">Автоматически закроется через 3 сек</div>
		</div>
	{/if}

	<!-- ==================== ОШИБКА ==================== -->
	{#if uiState === 'error'}
		<div class="error-overlay">
			<div class="error-icon">❌</div>
			<div class="error-title">Ошибка</div>
			<div class="error-message-text">{errorMessage}</div>
			<button onclick={resetInterface} class="error-button">OK</button>
		</div>
	{/if}

	<!-- ==================== НИЖНЯЯ ПАНЕЛЬ ==================== -->
	<div class="bottom-panel">
		<button onclick={resetInterface} class="reset-button">Esc - Сброс</button>
	</div>

	<!-- ==================== ТЕСТОВЫЕ КНОПКИ (DEV ONLY) ==================== -->
	<div class="dev-test-buttons">
		<div class="dev-label">🧪 Тестовые кнопки:</div>
		<button onclick={() => quickTest(MOCK_QUICK_TESTS.ivan)} class="dev-button">
			Иван (1,250 М)
		</button>
		<button onclick={() => quickTest(MOCK_QUICK_TESTS.maria)} class="dev-button">
			Мария (3,500 М)
		</button>
		<button onclick={() => quickTest(MOCK_QUICK_TESTS.alex)} class="dev-button">
			Алексей (50 М)
		</button>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
		background: #f5f5f5;
	}

	.cashier-container {
		width: 550px;
		height: 550px;
		background: white;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* ========== HEADER: Магазин ========== */
	.store-header {
		background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
		color: white;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		height: 60px;
		flex-shrink: 0;
	}

	.store-icon {
		font-size: 28px;
	}

	.store-info {
		flex: 1;
	}

	.store-name {
		font-size: 16px;
		font-weight: 600;
	}

	.store-address {
		font-size: 12px;
		opacity: 0.9;
	}

	/* ========== ПОИСК ПОКУПАТЕЛЯ ========== */
	.search-section {
		padding: 16px;
		border-bottom: 1px solid #e0e0e0;
		flex-shrink: 0;
	}

	.search-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 8px;
		color: #333;
	}

	.search-input-row {
		display: flex;
		gap: 8px;
	}

	.search-input {
		flex: 1;
		padding: 10px 12px;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		transition: border-color 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: #ff6b00;
	}

	.search-button {
		padding: 10px 20px;
		background: #ff6b00;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.search-button:hover:not(:disabled) {
		background: #ff5500;
	}

	.search-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	/* ========== ДАННЫЕ ПОКУПАТЕЛЯ ========== */
	.customer-info {
		padding: 16px;
		background: #f9f9f9;
		border-bottom: 1px solid #e0e0e0;
		flex-shrink: 0;
	}

	.customer-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
		font-size: 14px;
	}

	.customer-row:last-child {
		margin-bottom: 0;
	}

	.customer-label {
		font-weight: 500;
		color: #666;
	}

	.customer-value {
		font-weight: 600;
		color: #333;
	}

	.customer-balance {
		font-weight: 700;
		font-size: 16px;
		color: #ff6b00;
	}

	/* ========== СУММА ПОКУПКИ ========== */
	.amount-section {
		padding: 16px;
		border-bottom: 1px solid #e0e0e0;
		flex-shrink: 0;
	}

	.amount-loading {
		text-align: center;
		color: #666;
		font-size: 14px;
	}

	.amount-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 16px;
	}

	.amount-label {
		font-weight: 500;
	}

	.amount-value {
		font-weight: 700;
		font-size: 20px;
		color: #333;
	}

	.amount-error {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.error-text {
		color: #d32f2f;
		font-size: 14px;
		font-weight: 500;
	}

	.retry-button {
		padding: 8px 16px;
		background: #2196f3;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
	}

	.manual-input-section {
		margin-top: 12px;
	}

	.manual-input-section label {
		display: block;
		font-size: 13px;
		margin-bottom: 8px;
		color: #666;
	}

	.manual-input-row {
		display: flex;
		gap: 8px;
	}

	.manual-input {
		flex: 1;
		padding: 8px 12px;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
	}

	.manual-submit-button {
		padding: 8px 16px;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
	}

	.manual-warning {
		margin-top: 8px;
		font-size: 12px;
		color: #ff9800;
	}

	/* ========== КНОПКИ ДЕЙСТВИЙ ========== */
	.actions-section {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex: 1;
		overflow-y: auto;
	}

	.action-button {
		padding: 16px;
		border: 2px solid #ddd;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		background: white;
	}

	.action-button:hover:not(:disabled):not(.disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.action-button:disabled,
	.action-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.earn-button {
		border-color: #4caf50;
	}

	.earn-button:hover:not(:disabled) {
		background: #f1f8f4;
	}

	.redeem-button {
		border-color: #ff9800;
	}

	.redeem-button:hover:not(:disabled):not(.disabled) {
		background: #fff8f0;
	}

	.button-icon {
		font-size: 32px;
	}

	.button-title {
		font-weight: 700;
		font-size: 16px;
		color: #333;
	}

	.button-details {
		font-size: 13px;
		color: #666;
	}

	.button-payment {
		font-size: 14px;
		font-weight: 600;
		color: #ff6b00;
		margin-top: 4px;
	}

	.button-disabled-reason {
		font-size: 12px;
		color: #999;
		text-align: center;
		margin-top: 4px;
	}

	/* ========== ОВЕРЛЕИ ========== */
	.processing-overlay,
	.success-overlay,
	.error-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		gap: 16px;
		padding: 24px;
	}

	.processing-message {
		font-size: 18px;
		font-weight: 500;
	}

	.success-icon,
	.error-icon {
		font-size: 64px;
	}

	.success-title,
	.error-title {
		font-size: 24px;
		font-weight: 700;
	}

	.success-message,
	.error-message-text {
		font-size: 16px;
		text-align: center;
		white-space: pre-line;
	}

	.success-auto-close {
		font-size: 13px;
		opacity: 0.7;
		margin-top: 8px;
	}

	.manual-confirm-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 24px;
	}

	.force-confirm-button {
		padding: 12px 24px;
		background: #ff9800;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
	}

	.force-warning {
		font-size: 12px;
		text-align: center;
		opacity: 0.8;
	}

	.error-button {
		padding: 12px 32px;
		background: #d32f2f;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 16px;
		font-weight: 600;
		margin-top: 16px;
	}

	/* ========== НИЖНЯЯ ПАНЕЛЬ ========== */
	.bottom-panel {
		padding: 12px 16px;
		border-top: 1px solid #e0e0e0;
		text-align: center;
		flex-shrink: 0;
	}

	.reset-button {
		padding: 8px 20px;
		background: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
		color: #666;
	}

	.reset-button:hover {
		background: #e0e0e0;
	}

	/* ========== ТЕСТОВЫЕ КНОПКИ ========== */
	.dev-test-buttons {
		position: absolute;
		bottom: 60px;
		left: 16px;
		right: 16px;
		background: rgba(33, 150, 243, 0.95);
		padding: 12px;
		border-radius: 8px;
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.dev-label {
		color: white;
		font-size: 12px;
		font-weight: 600;
	}

	.dev-button {
		padding: 6px 12px;
		background: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 11px;
		font-weight: 600;
		color: #2196f3;
	}
</style>
