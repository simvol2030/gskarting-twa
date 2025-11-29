<script lang="ts">
	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
		title?: string;
		size?: 'sm' | 'md' | 'lg';
		children?: any;
	}

	let { isOpen = false, onClose, title, size = 'md', children }: Props = $props();

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose?.();
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose?.();
		}
	};
</script>

{#if isOpen}
	<div
		class="modal-overlay"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		tabindex="-1"
	>
		<div class="modal-container modal-{size}">
			{#if title}
				<div class="modal-header">
					<h2 id="modal-title" class="modal-title">{title}</h2>
					<button class="modal-close" onclick={onClose} aria-label="Закрыть">✕</button>
				</div>
			{/if}

			<div class="modal-body">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s;
	}

	.modal-container {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s;
	}

	.modal-sm {
		width: 100%;
		max-width: 400px;
	}

	.modal-md {
		width: 100%;
		max-width: 600px;
	}

	.modal-lg {
		width: 100%;
		max-width: 800px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		transition: color 0.2s;
	}

	.modal-close:hover {
		color: #111827;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
