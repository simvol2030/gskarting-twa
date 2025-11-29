<script lang="ts">
	/**
	 * Button Component
	 * Based on PRD-UI-Components.md
	 */

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		fullWidth?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children?: any;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		fullWidth = false,
		type = 'button',
		onclick,
		class: className = '',
		children
	}: Props = $props();

	const handleClick = (e: MouseEvent) => {
		if (disabled || loading) return;
		onclick?.(e);
	};
</script>

<button
	{type}
	class="btn btn-{variant} btn-{size} {className}"
	class:full-width={fullWidth}
	class:loading
	disabled={disabled || loading}
	onclick={handleClick}
	aria-busy={loading}
>
	{#if loading}
		<span class="spinner"></span>
	{/if}
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Sizes */
	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}

	.btn-md {
		padding: 0.625rem 1.25rem;
		font-size: 1rem;
	}

	.btn-lg {
		padding: 0.875rem 1.75rem;
		font-size: 1.125rem;
	}

	/* Variants */
	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-secondary {
		background: white;
		color: #667eea;
		border-color: #e5e7eb;
	}

	.btn-secondary:hover:not(:disabled) {
		border-color: #667eea;
		background: #f9fafb;
	}

	.btn-danger {
		background: #ef4444;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
	}

	.btn-ghost {
		background: transparent;
		color: #6b7280;
	}

	.btn-ghost:hover:not(:disabled) {
		background: #f9fafb;
		color: #111827;
	}

	/* Full width */
	.full-width {
		width: 100%;
	}

	/* Loading */
	.btn.loading {
		position: relative;
		color: transparent;
	}

	.spinner {
		position: absolute;
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
