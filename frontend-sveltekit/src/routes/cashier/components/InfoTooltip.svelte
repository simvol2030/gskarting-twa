<script lang="ts">
	interface Props {
		text: string;
	}

	let { text }: Props = $props();

	let isOpen = $state(false);

	function toggleTooltip(e: MouseEvent) {
		e.stopPropagation();
		isOpen = !isOpen;
	}

	function closeTooltip() {
		isOpen = false;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="tooltip-container">
	<span class="info-label-icon" onclick={toggleTooltip}>
		<span class="info-hint-clickable">ⓘ</span>
	</span>

	{#if isOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="tooltip-backdrop" onclick={closeTooltip}></div>
		<div class="tooltip-popup">
			{text}
		</div>
	{/if}
</div>

<style>
	.tooltip-container {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.info-label-icon {
		font-size: 15px;
		display: flex;
		align-items: center;
		gap: 2px;
		cursor: pointer;
		transition: opacity 0.2s;
		user-select: none;
	}

	.info-label-icon:active {
		opacity: 0.7;
	}

	.info-hint-clickable {
		font-size: 15px;
		color: var(--accent-light);
		font-weight: 700;
		opacity: 0.8;
		transition: all 0.2s;
		background: rgba(16, 185, 129, 0.2);
		border-radius: 50%;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.info-label-icon:hover .info-hint-clickable {
		opacity: 1;
		background: rgba(16, 185, 129, 0.3);
		box-shadow: 0 0 8px var(--glow-accent);
	}

	.tooltip-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		background: transparent;
	}

	.tooltip-popup {
		position: absolute;
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-left: 8px;
		background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
		color: white;
		padding: 6px 10px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 12px var(--glow-accent);
		z-index: 1000;
		animation: tooltipFadeIn 0.2s ease-out;
		pointer-events: none;
	}

	.tooltip-popup::after {
		content: '';
		position: absolute;
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		border: 4px solid transparent;
		border-right-color: var(--accent);
	}

	@keyframes tooltipFadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
