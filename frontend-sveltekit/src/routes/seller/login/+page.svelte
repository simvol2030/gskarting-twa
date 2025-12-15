<!--
  Seller Login Page
  - Вход по 4-значному PIN-коду
  - Цифровая клавиатура
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let pin = $state('');
	let error = $state('');
	let isLoading = $state(false);

	// Проверяем не авторизован ли уже
	onMount(() => {
		const token = localStorage.getItem('seller_token');
		if (token) {
			goto('/seller');
		}
	});

	function addDigit(digit: string) {
		if (pin.length < 4) {
			pin += digit;
			error = '';

			// Автоматический вход при вводе 4 цифр
			if (pin.length === 4) {
				handleLogin();
			}
		}
	}

	function removeDigit() {
		if (pin.length > 0) {
			pin = pin.slice(0, -1);
			error = '';
		}
	}

	function clearPin() {
		pin = '';
		error = '';
	}

	async function handleLogin() {
		if (pin.length !== 4) {
			error = 'Введите 4 цифры';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/seller/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ pin })
			});

			const data = await response.json();

			if (response.ok) {
				// Сохраняем токен и имя
				localStorage.setItem('seller_token', data.token);
				localStorage.setItem('seller_name', data.seller.name);
				localStorage.setItem('seller_id', data.seller.id.toString());

				// Редирект на главную
				goto('/seller');
			} else {
				error = data.error || 'Неверный PIN-код';
				pin = '';
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'Ошибка соединения';
			pin = '';
		} finally {
			isLoading = false;
		}
	}

	// Отображение PIN в виде точек
	let pinDisplay = $derived(() => {
		const filled = '●'.repeat(pin.length);
		const empty = '○'.repeat(4 - pin.length);
		return filled + empty;
	});
</script>

<div class="login-container">
	<div class="login-card">
		<div class="logo-section">
			<div class="logo-icon">👤</div>
			<h1>Вход для продавца</h1>
			<p>Введите ваш PIN-код</p>
		</div>

		<div class="pin-section">
			<div class="pin-display" class:error={error}>
				{#each pinDisplay().split('') as dot}
					<span class="pin-dot">{dot}</span>
				{/each}
			</div>

			{#if error}
				<p class="error-message">{error}</p>
			{/if}
		</div>

		<div class="keypad">
			{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
				<button
					class="key-btn"
					onclick={() => addDigit(digit)}
					disabled={isLoading}
				>
					{digit}
				</button>
			{/each}

			<button
				class="key-btn key-clear"
				onclick={clearPin}
				disabled={isLoading}
			>
				C
			</button>

			<button
				class="key-btn"
				onclick={() => addDigit('0')}
				disabled={isLoading}
			>
				0
			</button>

			<button
				class="key-btn key-delete"
				onclick={removeDigit}
				disabled={isLoading}
			>
				←
			</button>
		</div>

		{#if isLoading}
			<div class="loading-indicator">
				<div class="spinner-small"></div>
				<span>Проверка...</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: 20px;
		box-sizing: border-box;
	}

	.login-card {
		width: 100%;
		max-width: 340px;
		padding: 32px 24px;
		background: rgba(30, 41, 59, 0.6);
		border-radius: 24px;
		border: 1px solid rgba(148, 163, 184, 0.1);
		backdrop-filter: blur(12px);
	}

	.logo-section {
		text-align: center;
		margin-bottom: 32px;
	}

	.logo-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.logo-section h1 {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #f8fafc;
	}

	.logo-section p {
		font-size: 14px;
		color: #94a3b8;
		margin: 0;
	}

	.pin-section {
		margin-bottom: 24px;
		text-align: center;
	}

	.pin-display {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin-bottom: 12px;
		transition: all 0.2s ease;
	}

	.pin-display.error {
		animation: shake 0.4s ease;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-8px); }
		75% { transform: translateX(8px); }
	}

	.pin-dot {
		font-size: 32px;
		color: #10b981;
		line-height: 1;
	}

	.error-message {
		color: #ef4444;
		font-size: 14px;
		margin: 0;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.keypad {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 16px;
	}

	.key-btn {
		height: 64px;
		font-size: 28px;
		font-weight: 600;
		background: rgba(51, 65, 85, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.15);
		border-radius: 16px;
		color: #f8fafc;
		cursor: pointer;
		transition: all 0.15s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.key-btn:hover:not(:disabled) {
		background: rgba(71, 85, 105, 0.8);
	}

	.key-btn:active:not(:disabled) {
		transform: scale(0.95);
		background: rgba(16, 185, 129, 0.3);
	}

	.key-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.key-clear {
		color: #f59e0b;
	}

	.key-delete {
		color: #ef4444;
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: #94a3b8;
		font-size: 14px;
	}

	.spinner-small {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(16, 185, 129, 0.2);
		border-top-color: #10b981;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
