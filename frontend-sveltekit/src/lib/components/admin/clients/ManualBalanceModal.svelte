<script lang="ts">
	import type { BalanceAdjustmentData } from '$lib/types/admin';
	import { Modal, Button, Input, Textarea } from '$lib/components/ui';
	import { clientsAPI } from '$lib/api/admin/clients';

	interface Props {
		isOpen: boolean;
		clientId: number;
		currentBalance: number;
		onClose: () => void;
		onSuccess?: (newBalance: number) => void;
	}

	let { isOpen, clientId, currentBalance, onClose, onSuccess }: Props = $props();

	// Form state
	let operation = $state<'add' | 'subtract'>('add');
	let amount = $state<number>(0);
	let reason = $state<string>('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Computed
	const newBalance = $derived(() => {
		return operation === 'add' ? currentBalance + amount : currentBalance - amount;
	});

	const isFormValid = $derived(() => {
		if (!amount || amount <= 0) return false;
		if (operation === 'subtract' && amount > currentBalance) return false;
		if (!reason || reason.length < 10) return false;
		return true;
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		if (!isFormValid()) return;

		loading = true;
		error = null;

		try {
			const data: BalanceAdjustmentData = {
				operation,
				amount,
				reason
			};

			const result = await clientsAPI.adjustBalance(clientId, data);

			// Success
			onSuccess?.(result.newBalance);
			onClose();

			// Reset form
			operation = 'add';
			amount = 0;
			reason = '';
		} catch (err: any) {
			error = err.message || 'Ошибка при изменении баланса';
		} finally {
			loading = false;
		}
	};

	const handleClose = () => {
		if (loading) return;
		error = null;
		onClose();
	};

	const formatCurrency = (num: number): string =>
		num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });
</script>

<Modal {isOpen} onClose={handleClose} title="Изменить баланс" size="md">
	<form onsubmit={handleSubmit}>
		<!-- Operation selector -->
		<div class="operation-selector">
			<label class="operation-option">
				<input type="radio" bind:group={operation} value="add" />
				<span>Начислить баллы</span>
			</label>
			<label class="operation-option">
				<input type="radio" bind:group={operation} value="subtract" />
				<span>Списать баллы</span>
			</label>
		</div>

		<!-- Amount -->
		<Input
			type="number"
			label="Сумма"
			placeholder="Введите сумму баллов"
			bind:value={amount}
			min={1}
			max={operation === 'subtract' ? currentBalance : 100000}
			required
		/>

		<!-- Reason -->
		<Textarea
			label="Причина"
			placeholder="Укажите причину изменения баланса (минимум 10 символов)"
			bind:value={reason}
			minLength={10}
			maxLength={500}
			rows={4}
			required
		/>

		<!-- Balance preview -->
		<div class="balance-preview">
			<div class="preview-row">
				<span>Текущий баланс:</span>
				<strong>{formatCurrency(currentBalance)}</strong>
			</div>
			<div class="preview-row">
				<span>Новый баланс:</span>
				<strong class={newBalance() < 0 ? 'text-danger' : 'text-success'}>
					{formatCurrency(newBalance())}
				</strong>
			</div>
		</div>

		<!-- Error message -->
		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<!-- Actions -->
		<div class="modal-actions">
			<Button variant="ghost" onclick={handleClose} disabled={loading}>Отмена</Button>
			<Button type="submit" variant="primary" disabled={!isFormValid() || loading} {loading}>
				Применить
			</Button>
		</div>
	</form>
</Modal>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.operation-selector {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.5rem;
	}

	.operation-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.operation-option input[type='radio'] {
		cursor: pointer;
	}

	.balance-preview {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.preview-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.preview-row span {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.preview-row strong {
		font-size: 1.125rem;
	}

	.text-success {
		color: #059669;
	}

	.text-danger {
		color: #dc2626;
	}

	.error-message {
		padding: 0.75rem 1rem;
		background: #fee2e2;
		color: #991b1b;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
