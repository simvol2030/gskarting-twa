<script lang="ts">
	import type { Store, StoreFormData } from '$lib/types/admin';
	import { Modal, Button, Input } from '$lib/components/ui';
	import { storesAPI } from '$lib/api/admin/stores';

	interface Props {
		isOpen: boolean;
		editingStore?: Store | null;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { isOpen, editingStore = null, onClose, onSuccess }: Props = $props();

	let formData = $state<StoreFormData>({
		name: '',
		city: undefined,
		address: '',
		phone: '',
		hours: '',
		features: [],
		iconColor: '#3b82f6',
		coordinates: {
			lat: 0,
			lng: 0
		},
		isActive: true
	});

	let featuresInput = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (isOpen && editingStore) {
			formData = {
				name: editingStore.name,
				city: editingStore.city ?? undefined,
				address: editingStore.address,
				phone: editingStore.phone,
				hours: editingStore.hours,
				features: editingStore.features,
				iconColor: editingStore.iconColor,
				coordinates: editingStore.coordinates,
				isActive: editingStore.isActive
			};
			featuresInput = editingStore.features.join(', ');
		} else if (isOpen) {
			formData = {
				name: '',
				city: undefined,
				address: '',
				phone: '',
				hours: '',
				features: [],
				iconColor: '#3b82f6',
				coordinates: {
					lat: 0,
					lng: 0
				},
				isActive: true
			};
			featuresInput = '';
		}
	});

	const isFormValid = $derived(() => {
		if (!formData.name || formData.name.length < 3) return false;
		if (!formData.address || formData.address.length < 10) return false;
		if (!formData.phone || !/^\+7\d{10}$/.test(formData.phone)) return false;
		if (!formData.hours) return false;
		// Sprint 4 Cycle 2 Fix: Optional city validation
		if (formData.city && formData.city.length > 100) return false;
		return true;
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!isFormValid()) return;

		loading = true;
		error = null;

		try {
			// Parse features from comma-separated input
			formData.features = featuresInput
				.split(',')
				.map((f) => f.trim())
				.filter((f) => f.length > 0);

			if (editingStore) {
				await storesAPI.update(editingStore.id, formData);
			} else {
				await storesAPI.create(formData);
			}
			onSuccess?.();
			onClose();
		} catch (err: any) {
			error = err.message || 'Ошибка при сохранении магазина';
		} finally {
			loading = false;
		}
	};
</script>

<Modal {isOpen} onClose={onClose} title={editingStore ? 'Редактировать магазин' : 'Создать магазин'} size="lg">
	<form onsubmit={handleSubmit}>
		<Input label="Название магазина" bind:value={formData.name} minLength={3} maxLength={100} required />

		<Input label="Город" bind:value={formData.city} maxLength={100} placeholder="Например: Москва" />

		<Input label="Адрес" bind:value={formData.address} minLength={10} maxLength={300} required />

		<Input
			label="Телефон"
			bind:value={formData.phone}
			placeholder="+79991234567"
			required
		/>

		<Input label="Часы работы" bind:value={formData.hours} placeholder="Пн-Пт: 9:00-21:00" required />

		<Input
			label="Особенности (через запятую)"
			bind:value={featuresInput}
			placeholder="Парковка, Wi-Fi, Зоомагазин"
		/>

		<div class="form-row">
			<Input
				label="Широта"
				type="number"
				bind:value={formData.coordinates.lat}
				min={-90}
				max={90}
				step={0.000001}
				required
			/>
			<Input
				label="Долгота"
				type="number"
				bind:value={formData.coordinates.lng}
				min={-180}
				max={180}
				step={0.000001}
				required
			/>
		</div>

		<div class="form-row">
			<label>
				Цвет иконки
				<input type="color" bind:value={formData.iconColor} class="color-picker" />
			</label>
		</div>

		<div class="checkbox-section">
			<label>
				<input type="checkbox" bind:checked={formData.isActive} />
				<span>✓ Магазин активен</span>
			</label>
		</div>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="modal-actions">
			<Button variant="ghost" onclick={onClose} disabled={loading}>Отмена</Button>
			<Button type="submit" variant="primary" disabled={!isFormValid() || loading} {loading}>
				{editingStore ? 'Сохранить' : 'Создать'}
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
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.color-picker {
		width: 100%;
		height: 40px;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
	}
	.checkbox-section {
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.5rem;
	}
	.checkbox-section label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.checkbox-section input[type='checkbox'] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
		accent-color: #10b981;
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
