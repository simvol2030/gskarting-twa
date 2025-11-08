<script lang="ts">
	import { QUICK_TESTS } from '$lib/data/cashier-mocks';
	import VirtualKeyboard from './VirtualKeyboard.svelte';

	interface Props {
		value: string;
		isSearching: boolean;
		errorMessage: string;
		onSearch: () => void;
		onInput: (value: string) => void;
	}

	let { value = $bindable(''), isSearching, errorMessage, onSearch, onInput }: Props = $props();

	let inputRef: HTMLInputElement;
	let autoSearchTimer: number | null = null;
	let isKeyboardOpen = $state(false);
	let isFocused = $state(false);

	export function focus() {
		inputRef?.focus();
	}

	function handleInput(e: Event) {
		const newValue = (e.currentTarget as HTMLInputElement).value;
		onInput(newValue);

		// Сбросить предыдущий таймер
		if (autoSearchTimer) {
			clearTimeout(autoSearchTimer);
			autoSearchTimer = null;
		}

		// Автопоиск для USB QR сканера (8 цифр с префиксом "99") или ручного ввода (6 цифр)
		const isValidLength = (newValue.length === 6 || newValue.length === 8) && /^\d+$/.test(newValue);

		if (isValidLength) {
			autoSearchTimer = setTimeout(() => {
				onSearch();
			}, 1000) as unknown as number;
		}
	}

	function openVirtualKeyboard() {
		isKeyboardOpen = true;
	}

	function closeVirtualKeyboard() {
		isKeyboardOpen = false;
	}

	function handleKeyboardInput(newValue: string) {
		onInput(newValue);

		// Сбросить предыдущий таймер
		if (autoSearchTimer) {
			clearTimeout(autoSearchTimer);
			autoSearchTimer = null;
		}

		// Если введено ровно 6 цифр → автопоиск через 1 сек
		if (newValue.length === 6 && /^\d{6}$/.test(newValue)) {
			autoSearchTimer = setTimeout(() => {
				onSearch();
				closeVirtualKeyboard();
			}, 1000) as unknown as number;
		}
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		isFocused = false;
	}
</script>

<div class="card">
	<h2 class="mb-3 text-center">Сканируйте карту или введите номер</h2>

	<!-- Input-кнопка с градиентом и переливанием -->
	<div class="input-button-wrapper" class:focused={isFocused} class:has-value={value}>
		<input
			bind:this={inputRef}
			bind:value
			class="input-as-button"
			type="text"
			inputmode="numeric"
			pattern="[0-9]*"
			placeholder="👆 НАЖМИТЕ ДЛЯ ВВОДА"
			onkeydown={(e) => e.key === 'Enter' && onSearch()}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			disabled={isSearching}
		/>
	</div>

	<div class="button-group">
		<button
			class="btn btn-primary"
			onclick={onSearch}
			disabled={!value || isSearching}
		>
			{isSearching ? 'Поиск...' : 'Найти клиента'}
		</button>

		<button
			class="btn btn-secondary"
			onclick={openVirtualKeyboard}
			disabled={isSearching}
		>
			🔢 Клавиатура
		</button>
	</div>
	{#if errorMessage}
		<p class="text-center mt-2" style="color: var(--danger);">{errorMessage}</p>
	{/if}
</div>

<!-- Демо-кнопки удалены для production -->

<VirtualKeyboard
	{value}
	onInput={handleKeyboardInput}
	isOpen={isKeyboardOpen}
	onClose={closeVirtualKeyboard}
/>

<style>
	/* Input-кнопка с градиентом */
	.input-button-wrapper {
		position: relative;
		height: 45px;
		margin-bottom: 8px;
		border-radius: 8px;
		overflow: hidden;

		/* Gradient background (оранжевый как ProfileCard в TWA) */
		background: linear-gradient(135deg,
			#ff6b00,      /* primary-orange */
			#e65100,      /* primary-orange-dark */
			#d32f2f       /* accent-red */
		);

		box-shadow: 0 4px 16px rgba(255, 107, 0, 0.4);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Плавное переливание (shimmer) - всегда активно */
	.input-button-wrapper::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			45deg,
			transparent 30%,
			rgba(255, 255, 255, 0.15) 50%,
			transparent 70%
		);
		animation: shimmer 3s infinite;
		pointer-events: none;
		z-index: 1;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%) translateY(-100%) rotate(45deg);
		}
		100% {
			transform: translateX(100%) translateY(100%) rotate(45deg);
		}
	}

	/* Мерцание раз в 5 секунд */
	.input-button-wrapper::after {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.1);
		opacity: 0;
		animation: pulse5s 5s infinite;
		pointer-events: none;
		z-index: 2;
	}

	@keyframes pulse5s {
		0%, 90% {
			opacity: 0;
		}
		95% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	/* При фокусе - усиливаем glow */
	.input-button-wrapper.focused {
		box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.3),
		            0 6px 24px rgba(255, 107, 0, 0.5);
		transform: scale(1.01);
	}

	/* Input field (прозрачный фон, текст поверх gradient) */
	.input-as-button {
		position: relative;
		z-index: 3;
		width: 100%;
		height: 45px;
		padding: 0 12px;
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.25);
		border-radius: 8px;

		/* Текст */
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 3px;
		text-align: center;
		color: white;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

		transition: all 0.2s;
	}

	.input-as-button:focus {
		outline: none;
		background: rgba(0, 0, 0, 0.1);
		border-color: rgba(255, 255, 255, 0.6);
	}

	.input-as-button::placeholder {
		color: rgba(255, 255, 255, 0.85);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 1px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	/* При вводе - показываем введённые цифры крупно */
	.input-button-wrapper.has-value .input-as-button {
		font-size: 20px;
		letter-spacing: 6px;
	}

	.button-group {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 8px;
	}

	.button-group .btn-secondary {
		font-size: 9px;
	}

	.test-buttons {
		display: flex;
		gap: 8px;
		margin-top: 12px;
		justify-content: center;
	}

	.test-btn {
		padding: 8px 16px;
		background: var(--bg-primary);
		color: var(--accent-light);
		border: 1px solid var(--border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		font-family: monospace;
		transition: all 0.2s;
	}

	.test-btn:hover {
		background: var(--bg-secondary);
		border-color: var(--accent);
		transform: translateY(-2px);
	}
</style>
