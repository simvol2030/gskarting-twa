<script lang="ts">
	import type { Product, ProductFormData } from '$lib/types/admin';
	import { Modal, Button, Input, Textarea, Select } from '$lib/components/ui';
	import { productsAPI } from '$lib/api/admin/products';

	interface Props {
		isOpen: boolean;
		editingProduct?: Product | null;
		categories: string[];
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { isOpen, editingProduct = null, categories, onClose, onSuccess }: Props = $props();

	let formData = $state<ProductFormData>({
		name: '',
		description: '',
		price: 0,
		oldPrice: '',
		quantityInfo: '',
		image: '',
		category: categories[0] || '',
		isActive: true,
		showOnHome: false,
		isRecommendation: false
	});

	let loading = $state(false);
	let error = $state<string | null>(null);

	// MEDIUM FIX #2: Mutual exclusion - product cannot be both "Top Product" and "Recommendation"
	$effect(() => {
		if (formData.showOnHome && formData.isRecommendation) {
			formData.isRecommendation = false;
		}
	});

	$effect(() => {
		if (formData.isRecommendation && formData.showOnHome) {
			formData.showOnHome = false;
		}
	});

	$effect(() => {
		if (isOpen && editingProduct) {
			formData = {
				name: editingProduct.name,
				description: editingProduct.description ?? '',
				price: editingProduct.price,
				oldPrice: editingProduct.oldPrice ?? '',
				quantityInfo: editingProduct.quantityInfo ?? '',
				image: editingProduct.image,
				category: editingProduct.category,
				isActive: editingProduct.isActive,
				showOnHome: editingProduct.showOnHome,
				isRecommendation: editingProduct.isRecommendation
			};
		} else if (isOpen) {
			formData = {
				name: '',
				description: '',
				price: 0,
				oldPrice: '',
				quantityInfo: '',
				image: '',
				category: categories[0] || '',
				isActive: true,
				showOnHome: false,
				isRecommendation: false
			};
		}
	});

	const isFormValid = $derived(() => {
		if (!formData.name || formData.name.length < 3) return false;
		if (formData.price <= 0) return false;
		if (!formData.image) return false;
		if (!formData.category) return false;
		return true;
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!isFormValid()) return;

		loading = true;
		error = null;

		try {
			if (editingProduct) {
				await productsAPI.update(editingProduct.id, formData);
			} else {
				await productsAPI.create(formData);
			}
			onSuccess?.();
			onClose();
		} catch (err: any) {
			error = err.message || 'Ошибка при сохранении товара';
		} finally {
			loading = false;
		}
	};
</script>

<Modal {isOpen} onClose={onClose} title={editingProduct ? 'Редактировать товар' : 'Создать товар'} size="lg">
	<form onsubmit={handleSubmit}>
		<Input label="Название" bind:value={formData.name} minLength={3} maxLength={200} required />

		<Textarea label="Описание" bind:value={formData.description} maxLength={1000} rows={3} />

		<Input label="Количество/Упаковка" bind:value={formData.quantityInfo} placeholder="1 кг, 500 г, 12 шт" maxLength={50} />

		<div class="form-row">
			<Input label="Цена (₽)" type="number" bind:value={formData.price} min={0} step={0.01} required />
			<Input label="Старая цена (₽)" type="number" bind:value={formData.oldPrice} min={0} step={0.01} />
		</div>

		<Input label="URL изображения" bind:value={formData.image} placeholder="https://example.com/image.jpg" required />

		<Select label="Категория" bind:value={formData.category} options={categories.map(c => ({ value: c, label: c }))} />

		<div class="checkboxes-section">
			<div class="checkbox-row">
				<label>
					<input type="checkbox" bind:checked={formData.isActive} />
					<span>✓ Товар активен</span>
				</label>
			</div>
			<div class="checkbox-row">
				<label>
					<input type="checkbox" bind:checked={formData.showOnHome} disabled={formData.isRecommendation} />
					<span>✓ Показывать на главной (Топовые товары)</span>
				</label>
			</div>
			<div class="checkbox-row">
				<label>
					<input type="checkbox" bind:checked={formData.isRecommendation} disabled={formData.showOnHome} />
					<span>✓ Рекомендация (без цены)</span>
				</label>
			</div>
		</div>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="modal-actions">
			<Button variant="ghost" onclick={onClose} disabled={loading}>Отмена</Button>
			<Button type="submit" variant="primary" disabled={!isFormValid() || loading} {loading}>
				{editingProduct ? 'Сохранить' : 'Создать'}
			</Button>
		</div>
	</form>
</Modal>

<style>
	form { display: flex; flex-direction: column; gap: 1.5rem; }
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	.checkboxes-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.checkbox-row { padding: 1rem; background: #f9fafb; border-radius: 0.5rem; }
	.checkbox-row label { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; cursor: pointer; }
	.checkbox-row input[type='checkbox'] { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: #10b981; }
	.error-message { padding: 0.75rem 1rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem; font-size: 0.875rem; }
	.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
</style>
