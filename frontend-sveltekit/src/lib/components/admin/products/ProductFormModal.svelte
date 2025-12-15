<script lang="ts">
	import type { Product, ProductFormData, Category } from '$lib/types/admin';
	import { Modal, Button, Input, Textarea, Select } from '$lib/components/ui';
	import { productsAPI } from '$lib/api/admin/products';

	interface ProductVariationForm {
		id?: number;
		name: string;
		price: number;
		oldPrice?: number;
		sku?: string;
		isDefault: boolean;
	}

	interface Props {
		isOpen: boolean;
		editingProduct?: Product | null;
		categories: string[]; // Legacy text categories
		categoriesNew?: Category[]; // New categories from table
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { isOpen, editingProduct = null, categories, categoriesNew = [], onClose, onSuccess }: Props = $props();

	let formData = $state<ProductFormData>({
		name: '',
		description: undefined,
		price: 0,
		oldPrice: undefined,
		quantityInfo: undefined,
		image: '',
		category: categories[0] || '',
		categoryId: null,
		sku: undefined,
		isActive: true,
		showOnHome: false,
		isRecommendation: false
	});

	// Variations state
	let variationAttribute = $state<string>('');
	let variations = $state<ProductVariationForm[]>([]);

	let imagePreview = $state<string | null>(null);
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
				description: editingProduct.description ?? undefined,
				price: editingProduct.price,
				oldPrice: editingProduct.oldPrice ?? undefined,
				quantityInfo: editingProduct.quantityInfo ?? undefined,
				image: editingProduct.image,
				category: editingProduct.category,
				categoryId: editingProduct.categoryId ?? null,
				sku: editingProduct.sku ?? undefined,
				isActive: editingProduct.isActive,
				showOnHome: editingProduct.showOnHome,
				isRecommendation: editingProduct.isRecommendation
			};
			imagePreview = editingProduct.image;
			// Load variations if available
			variationAttribute = (editingProduct as any).variationAttribute || '';
			const productVariations = (editingProduct as any).variations || [];
			variations = productVariations.map((v: any) => ({
				id: v.id,
				name: v.name,
				price: v.price,
				oldPrice: v.oldPrice,
				sku: v.sku,
				isDefault: v.isDefault
			}));
		} else if (isOpen) {
			formData = {
				name: '',
				description: undefined,
				price: 0,
				oldPrice: undefined,
				quantityInfo: undefined,
				image: '',
				category: categories[0] || '',
				categoryId: null,
				sku: undefined,
				isActive: true,
				showOnHome: false,
				isRecommendation: false
			};
			imagePreview = null;
			variationAttribute = '';
			variations = [];
		}
	});

	const isFormValid = $derived(() => {
		if (!formData.name || formData.name.length < 3) return false;
		if (formData.price <= 0) return false;
		// FIX #2: Image is optional - can be empty or valid URL
		if (formData.image && formData.image.length > 0 && formData.image.length < 3) return false;
		// Either legacy category or new categoryId must be set
		if (!formData.category && !formData.categoryId) return false;
		return true;
	});

	// Category options from new categories table
	const categoryOptions = $derived(() => {
		return [
			{ value: '', label: 'Без категории' },
			...categoriesNew.map(c => ({ value: String(c.id), label: c.name }))
		];
	});

	const handleCategoryChange = (value: string) => {
		formData.categoryId = value ? parseInt(value) : null;
		// Auto-set legacy category from selected category name
		if (value) {
			const selectedCategory = categoriesNew.find(c => c.id === parseInt(value));
			if (selectedCategory) {
				formData.category = selectedCategory.name;
			}
		}
	};

	const handleImageUrlChange = (value: string) => {
		formData.image = value;
		if (value && value.startsWith('http')) {
			imagePreview = value;
		}
	};

	// Variation management functions
	const addVariation = () => {
		const isFirst = variations.length === 0;
		variations = [...variations, {
			name: '',
			price: formData.price || 0,
			oldPrice: undefined,
			sku: undefined,
			isDefault: isFirst // First variation is default
		}];
	};

	const removeVariation = (index: number) => {
		const wasDefault = variations[index].isDefault;
		variations = variations.filter((_, i) => i !== index);
		// If we removed the default, make first one default
		if (wasDefault && variations.length > 0) {
			variations = variations.map((v, i) => ({ ...v, isDefault: i === 0 }));
		}
	};

	const setDefaultVariation = (index: number) => {
		variations = variations.map((v, i) => ({ ...v, isDefault: i === index }));
	};

	const updateVariation = (index: number, field: keyof ProductVariationForm, value: any) => {
		variations = variations.map((v, i) => i === index ? { ...v, [field]: value } : v);
	};

	const handleFileUpload = async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Пожалуйста, выберите изображение';
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Размер изображения не должен превышать 5 МБ';
			return;
		}

		error = null;
		loading = true;

		try {
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);

			// Upload file to server
			const formDataToUpload = new FormData();
			formDataToUpload.append('image', file);

			const response = await fetch('/api/admin/products/upload', {
				method: 'POST',
				body: formDataToUpload
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Ошибка загрузки изображения');
			}

			// Save the server URL path to form data
			formData.image = result.data.url;
		} catch (err: any) {
			error = err.message || 'Ошибка загрузки изображения';
			imagePreview = null;
			formData.image = '';
		} finally {
			loading = false;
		}
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!isFormValid()) return;

		loading = true;
		error = null;

		try {
			// Prepare data with variations
			const dataWithVariations = {
				...formData,
				variationAttribute: variations.length > 0 ? variationAttribute : undefined,
				variations: variations.length > 0 ? variations.map(v => ({
					id: v.id,
					name: v.name,
					price: v.price,
					oldPrice: v.oldPrice,
					sku: v.sku,
					isDefault: v.isDefault
				})) : []
			};

			if (editingProduct) {
				await productsAPI.update(editingProduct.id, dataWithVariations);
			} else {
				await productsAPI.create(dataWithVariations);
			}
			onSuccess?.();
			onClose();
		} catch (err: any) {
			error = err.message || 'Ошибка при сохранении товара';
		} finally {
			loading = false;
		}
	};

	// FIX #3: Prevent modal from closing when Delete/Backspace is pressed
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Delete' || e.key === 'Backspace') {
			// Only prevent default if we're NOT in an input/textarea
			const target = e.target as HTMLElement;
			if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
				e.stopPropagation();
			}
		}
	};
</script>

<Modal {isOpen} onClose={onClose} title={editingProduct ? 'Редактировать товар' : 'Создать товар'} size="lg">
	<form onsubmit={handleSubmit} onkeydown={handleKeyDown}>
		<Input label="Название" bind:value={formData.name} minLength={3} maxLength={200} required />

		<Textarea label="Описание" bind:value={formData.description} maxLength={1000} rows={3} />

		<Input label="Количество/Упаковка" bind:value={formData.quantityInfo} placeholder="1 кг, 500 г, 12 шт" maxLength={50} />

		<div class="form-row">
			<Input label="Цена (₽)" type="number" bind:value={formData.price} min={0} step={0.01} required />
			<Input label="Старая цена (₽)" type="number" bind:value={formData.oldPrice} min={0} step={0.01} />
		</div>

		<!-- Вариации товара -->
		<div class="variations-section">
			<div class="variations-header">
				<label class="section-label">Вариации товара</label>
				<button type="button" class="add-variation-btn" onclick={addVariation}>
					+ Добавить вариацию
				</button>
			</div>

			{#if variations.length > 0}
				<div class="variation-attribute">
					<Input
						label="Название атрибута"
						placeholder="Размер, Объём, Цвет..."
						bind:value={variationAttribute}
						maxLength={50}
					/>
				</div>

				<div class="variations-list">
					{#each variations as variation, index}
						<div class="variation-item">
							<div class="variation-row">
								<div class="variation-name">
									<input
										type="text"
										placeholder="Название (25см, 500мл)"
										value={variation.name}
										oninput={(e) => updateVariation(index, 'name', (e.target as HTMLInputElement).value)}
										class="variation-input"
									/>
								</div>
								<div class="variation-price">
									<input
										type="number"
										placeholder="Цена"
										value={variation.price}
										oninput={(e) => updateVariation(index, 'price', parseFloat((e.target as HTMLInputElement).value) || 0)}
										min="0"
										step="0.01"
										class="variation-input"
									/>
								</div>
								<div class="variation-old-price">
									<input
										type="number"
										placeholder="Старая цена"
										value={variation.oldPrice || ''}
										oninput={(e) => updateVariation(index, 'oldPrice', parseFloat((e.target as HTMLInputElement).value) || undefined)}
										min="0"
										step="0.01"
										class="variation-input"
									/>
								</div>
								<div class="variation-default">
									<label class="default-label">
										<input
											type="radio"
											name="default-variation"
											checked={variation.isDefault}
											onchange={() => setDefaultVariation(index)}
										/>
										<span>По умолч.</span>
									</label>
								</div>
								<button type="button" class="remove-variation-btn" onclick={() => removeVariation(index)}>
									×
								</button>
							</div>
						</div>
					{/each}
				</div>

				<p class="variations-hint">
					Вариация «по умолчанию» отображается в каталоге. Цена товара выше используется если вариаций нет.
				</p>
			{/if}
		</div>

		<!-- Изображение -->
		<div class="image-section">
			<label class="section-label">Изображение товара *</label>

			<div class="image-upload-area">
				<!-- Image URL Input -->
				<Input
					label="URL изображения"
					placeholder="https://example.com/image.jpg"
					value={formData.image}
					onInput={handleImageUrlChange}
					maxLength={500}
				/>

				<!-- OR -->
				<div class="divider">
					<span>или</span>
				</div>

				<!-- File Upload -->
				<div class="file-upload-box">
					<label for="product-image-upload" class="file-upload-label">
						<span class="upload-icon">📁</span>
						<span>Загрузить файл</span>
						<span class="upload-hint">PNG, JPG, GIF до 5 МБ</span>
					</label>
					<input
						type="file"
						id="product-image-upload"
						accept="image/*"
						onchange={handleFileUpload}
						class="file-input"
					/>
				</div>

				<!-- Image Preview -->
				{#if imagePreview}
					<div class="image-preview">
						<img src={imagePreview} alt="Preview" />
					</div>
				{/if}
			</div>
		</div>

		<!-- Категория и SKU -->
		<div class="form-row">
			{#if categoriesNew.length > 0}
				<Select
					label="Категория"
					value={formData.categoryId ? String(formData.categoryId) : ''}
					options={categoryOptions()}
					onChange={handleCategoryChange}
				/>
			{:else}
				<Select label="Категория" bind:value={formData.category} options={categories.map(c => ({ value: c, label: c }))} />
			{/if}
			<Input label="Артикул (SKU)" bind:value={formData.sku} placeholder="ABC-12345" maxLength={50} />
		</div>

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

	.section-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.75rem;
	}

	.image-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.image-upload-area {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #d1d5db;
	}

	.file-upload-box {
		position: relative;
	}

	.file-upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem;
		border: 2px dashed #d1d5db;
		border-radius: 0.5rem;
		background: #f9fafb;
		cursor: pointer;
		transition: all 0.2s;
	}

	.file-upload-label:hover {
		border-color: #10b981;
		background: #ecfdf5;
	}

	.upload-icon {
		font-size: 2rem;
	}

	.upload-hint {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.file-input {
		position: absolute;
		width: 0.1px;
		height: 0.1px;
		opacity: 0;
		overflow: hidden;
		z-index: -1;
	}

	.image-preview {
		max-width: 400px;
		max-height: 200px;
		overflow: hidden;
		border-radius: 0.5rem;
		border: 1px solid #d1d5db;
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.checkboxes-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.checkbox-row { padding: 1rem; background: #f9fafb; border-radius: 0.5rem; }
	.checkbox-row label { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; cursor: pointer; }
	.checkbox-row input[type='checkbox'] { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: #10b981; }
	.error-message { padding: 0.75rem 1rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem; font-size: 0.875rem; }
	.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }

	/* Variations styles */
	.variations-section {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		background: #fafafa;
	}

	.variations-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.variations-header .section-label {
		margin-bottom: 0;
	}

	.add-variation-btn {
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.add-variation-btn:hover {
		background: #059669;
	}

	.variation-attribute {
		margin-bottom: 1rem;
	}

	.variations-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.variation-item {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		padding: 0.75rem;
	}

	.variation-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr auto auto;
		gap: 0.5rem;
		align-items: center;
	}

	.variation-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.variation-input:focus {
		outline: none;
		border-color: #10b981;
	}

	.variation-default {
		white-space: nowrap;
	}

	.default-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
	}

	.default-label input {
		accent-color: #10b981;
	}

	.remove-variation-btn {
		width: 28px;
		height: 28px;
		background: #fee2e2;
		color: #dc2626;
		border: none;
		border-radius: 0.375rem;
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.remove-variation-btn:hover {
		background: #fecaca;
	}

	.variations-hint {
		margin-top: 0.75rem;
		font-size: 0.75rem;
		color: #6b7280;
	}
</style>
