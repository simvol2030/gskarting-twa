<script lang="ts">
	import { Modal, Button } from '$lib/components/ui';

	interface Props {
		isOpen: boolean;
		title: string;
		message: string;
		confirmText?: string;
		confirmVariant?: 'primary' | 'danger';
		onConfirm: () => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let {
		isOpen,
		title,
		message,
		confirmText = 'Подтвердить',
		confirmVariant = 'danger',
		onConfirm,
		onCancel,
		loading = false
	}: Props = $props();
</script>

<Modal {isOpen} onClose={onCancel} {title} size="sm">
	<div class="confirm-content">
		<p class="message">{message}</p>

		<div class="modal-actions">
			<Button variant="ghost" onclick={onCancel} disabled={loading}>Отмена</Button>
			<Button variant={confirmVariant} onclick={onConfirm} {loading}>
				{confirmText}
			</Button>
		</div>
	</div>
</Modal>

<style>
	.confirm-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.message {
		color: #374151;
		line-height: 1.5;
		margin: 0;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}
</style>
