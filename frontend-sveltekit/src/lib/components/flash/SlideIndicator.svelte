<script lang="ts">
	let {
		total,
		current,
		onSelect
	}: {
		total: number;
		current: number;
		onSelect?: (index: number) => void;
	} = $props();

	function handleClick(index: number) {
		if (onSelect) {
			onSelect(index);
		}
	}
</script>

<div class="slide-indicator">
	{#each Array(total) as _, i}
		<button
			class="dot"
			class:active={i === current}
			onclick={() => handleClick(i)}
			aria-label="Перейти к слайду {i + 1}"
		></button>
	{/each}
</div>

<style>
	.slide-indicator {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.dot:hover {
		background: rgba(255, 255, 255, 0.5);
		transform: scale(1.1);
	}

	.dot.active {
		background: var(--accent, #64B5F6);
		transform: scale(1.3);
	}

	.dot.active:hover {
		transform: scale(1.3);
	}
</style>
