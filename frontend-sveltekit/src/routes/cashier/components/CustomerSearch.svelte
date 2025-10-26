<script lang="ts">
	import { QUICK_TESTS } from '$lib/data/cashier-mocks';

	interface Props {
		value: string;
		isSearching: boolean;
		errorMessage: string;
		onSearch: () => void;
		onInput: (value: string) => void;
	}

	let { value = $bindable(''), isSearching, errorMessage, onSearch, onInput }: Props = $props();

	let inputRef: HTMLInputElement;

	export function focus() {
		inputRef?.focus();
	}
</script>

<div class="card">
	<h2 class="mb-3 text-center">Сканируйте карту или введите номер</h2>
	<input
		bind:this={inputRef}
		bind:value
		class="input mb-2"
		type="text"
		placeholder="6-значный номер карты (например: 421856)"
		onkeydown={(e) => e.key === 'Enter' && onSearch()}
		oninput={(e) => onInput(e.currentTarget.value)}
		disabled={isSearching}
	/>
	<button
		class="btn btn-primary"
		onclick={onSearch}
		disabled={!value || isSearching}
	>
		{isSearching ? 'Поиск...' : 'Найти клиента'}
	</button>
	{#if errorMessage}
		<p class="text-center mt-2" style="color: var(--danger);">{errorMessage}</p>
	{/if}
</div>

<div class="card">
	<p class="text-center" style="color: var(--text-secondary); font-size: 14px;">
		Для теста используйте:
	</p>
	<div class="test-buttons">
		<button class="test-btn" onclick={() => { value = QUICK_TESTS.high; onSearch(); }}>
			{QUICK_TESTS.high}
		</button>
		<button class="test-btn" onclick={() => { value = QUICK_TESTS.medium; onSearch(); }}>
			{QUICK_TESTS.medium}
		</button>
		<button class="test-btn" onclick={() => { value = QUICK_TESTS.low; onSearch(); }}>
			{QUICK_TESTS.low}
		</button>
	</div>
</div>

<style>
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
