<script lang="ts">
	import type { PageData } from './$types';
	import type { Store, StoreFormData, StoreImage } from '$lib/types/admin';
	import { storesAPI } from '$lib/api/admin/stores';
	import { Button } from '$lib/components/ui';
	import { API_BASE_URL } from '$lib/config';

	let { data }: { data: PageData } = $props();

	// State
	let stores = $state<(Store & { images?: StoreImage[] })[]>(data.stores || []);
	let editingStoreId = $state<number | null>(null);
	let creatingNew = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	// Form data for editing/creating
	let formData = $state<StoreFormData>({
		name: '',
		city: undefined,
		address: '',
		phone: '',
		hours: '',
		features: [],
		iconColor: '#3b82f6',
		coordinates: { lat: 0, lng: 0 },
		isActive: true
	});
	let featuresInput = $state('');
	let uploadingImages = $state(false);
	let editingStoreImages = $state<StoreImage[]>([]);

	// Drag and drop state
	let draggedImageId = $state<number | null>(null);

	// Helper to show messages
	function showSuccess(msg: string) {
		successMessage = msg;
		setTimeout(() => successMessage = null, 3000);
	}

	function showError(msg: string) {
		error = msg;
		setTimeout(() => error = null, 5000);
	}

	// Start editing a store
	async function startEditing(store: Store & { images?: StoreImage[] }) {
		editingStoreId = store.id;
		creatingNew = false;
		formData = {
			name: store.name,
			city: store.city ?? undefined,
			address: store.address,
			phone: store.phone,
			hours: store.hours,
			features: store.features,
			iconColor: store.iconColor,
			coordinates: store.coordinates,
			isActive: store.isActive
		};
		featuresInput = store.features.join(', ');

		// Load images
		try {
			editingStoreImages = await storesAPI.getImages(store.id);
		} catch (e) {
			editingStoreImages = [];
		}
	}

	// Start creating new store
	function startCreating() {
		editingStoreId = null;
		creatingNew = true;
		formData = {
			name: '',
			city: undefined,
			address: '',
			phone: '',
			hours: '',
			features: [],
			iconColor: '#3b82f6',
			coordinates: { lat: 55.7558, lng: 37.6173 },
			isActive: true
		};
		featuresInput = '';
		editingStoreImages = [];
	}

	// Cancel editing
	function cancelEditing() {
		editingStoreId = null;
		creatingNew = false;
		error = null;
	}

	// Save store (create or update)
	async function saveStore() {
		loading = true;
		error = null;

		try {
			formData.features = featuresInput
				.split(',')
				.map(f => f.trim())
				.filter(f => f.length > 0);

			if (creatingNew) {
				const created = await storesAPI.create(formData);
				stores = [{ ...created, images: [] }, ...stores];
				showSuccess('Магазин создан');
				cancelEditing();
			} else if (editingStoreId) {
				const updated = await storesAPI.update(editingStoreId, formData);
				stores = stores.map(s => s.id === editingStoreId ? { ...updated, images: editingStoreImages } : s);
				showSuccess('Магазин обновлен');
				cancelEditing();
			}
		} catch (e: any) {
			showError(e.message || 'Ошибка при сохранении');
		} finally {
			loading = false;
		}
	}

	// Delete store
	async function deleteStore(id: number) {
		if (!confirm('Вы уверены, что хотите удалить этот магазин?')) return;

		loading = true;
		try {
			await storesAPI.delete(id, false);
			stores = stores.filter(s => s.id !== id);
			showSuccess('Магазин удален');
			if (editingStoreId === id) cancelEditing();
		} catch (e: any) {
			showError(e.message || 'Ошибка при удалении');
		} finally {
			loading = false;
		}
	}

	// Upload images
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0 || !editingStoreId) return;

		uploadingImages = true;
		try {
			const files = Array.from(input.files);
			const uploaded = await storesAPI.uploadImages(editingStoreId, files);
			editingStoreImages = [...editingStoreImages, ...uploaded];
			showSuccess(`Загружено ${uploaded.length} изображений`);
		} catch (e: any) {
			showError(e.message || 'Ошибка при загрузке');
		} finally {
			uploadingImages = false;
			input.value = '';
		}
	}

	// Delete image
	async function deleteImage(imageId: number) {
		if (!editingStoreId) return;

		try {
			await storesAPI.deleteImage(editingStoreId, imageId);
			editingStoreImages = editingStoreImages.filter(img => img.id !== imageId);
			showSuccess('Изображение удалено');
		} catch (e: any) {
			showError(e.message || 'Ошибка при удалении');
		}
	}

	// Drag and drop handlers
	function handleDragStart(imageId: number) {
		draggedImageId = imageId;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	async function handleDrop(event: DragEvent, targetImageId: number) {
		event.preventDefault();
		if (!draggedImageId || draggedImageId === targetImageId || !editingStoreId) return;

		// Reorder locally first
		const draggedIndex = editingStoreImages.findIndex(img => img.id === draggedImageId);
		const targetIndex = editingStoreImages.findIndex(img => img.id === targetImageId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		const newImages = [...editingStoreImages];
		const [draggedItem] = newImages.splice(draggedIndex, 1);
		newImages.splice(targetIndex, 0, draggedItem);
		editingStoreImages = newImages;

		// Save to backend
		try {
			const imageIds = newImages.map(img => img.id);
			await storesAPI.reorderImages(editingStoreId, imageIds);
		} catch (e: any) {
			showError('Ошибка при сортировке');
		}

		draggedImageId = null;
	}

	function handleDragEnd() {
		draggedImageId = null;
	}

	// Validation
	const isFormValid = $derived(() => {
		if (!formData.name || formData.name.length < 2) return false;
		if (!formData.address || formData.address.length < 5) return false;
		if (!formData.phone) return false;
		if (!formData.hours) return false;
		return true;
	});
</script>

<svelte:head>
	<title>Магазины - Loyalty Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<div class="header-left">
			<h1>Управление магазинами</h1>
			<p class="text-muted">Редактирование информации о магазинах</p>
		</div>
		<button class="btn-primary" onclick={startCreating} disabled={creatingNew}>
			+ Добавить магазин
		</button>
	</div>

	{#if successMessage}
		<div class="alert alert-success">{successMessage}</div>
	{/if}

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	<!-- New Store Form -->
	{#if creatingNew}
		<div class="store-card editing">
			<div class="card-header">
				<div class="store-title">
					<div class="store-icon" style="background: {formData.iconColor}">🏪</div>
					<h2>Новый магазин</h2>
				</div>
				<div class="card-actions">
					<button class="btn-success" onclick={saveStore} disabled={!isFormValid() || loading}>
						{loading ? 'Сохранение...' : 'Создать'}
					</button>
					<button class="btn-ghost" onclick={cancelEditing}>Отмена</button>
				</div>
			</div>

			<div class="form-grid">
				<div class="form-group">
					<label>Название *</label>
					<input type="text" bind:value={formData.name} placeholder="Название магазина" />
				</div>
				<div class="form-group">
					<label>Город</label>
					<input type="text" bind:value={formData.city} placeholder="Город" />
				</div>
				<div class="form-group full-width">
					<label>Адрес *</label>
					<input type="text" bind:value={formData.address} placeholder="Полный адрес" />
				</div>
				<div class="form-group">
					<label>Телефон *</label>
					<input type="text" bind:value={formData.phone} placeholder="+7 999 123-45-67" />
				</div>
				<div class="form-group">
					<label>Часы работы *</label>
					<input type="text" bind:value={formData.hours} placeholder="Пн-Пт: 9:00-21:00" />
				</div>
				<div class="form-group full-width">
					<label>Особенности (через запятую)</label>
					<input type="text" bind:value={featuresInput} placeholder="Парковка, Wi-Fi, Зоомагазин" />
				</div>
				<div class="form-group">
					<label>Широта</label>
					<input type="number" bind:value={formData.coordinates.lat} step="0.000001" />
				</div>
				<div class="form-group">
					<label>Долгота</label>
					<input type="number" bind:value={formData.coordinates.lng} step="0.000001" />
				</div>
				<div class="form-group">
					<label>Цвет иконки</label>
					<input type="color" bind:value={formData.iconColor} class="color-input" />
				</div>
				<div class="form-group checkbox-group">
					<label>
						<input type="checkbox" bind:checked={formData.isActive} />
						Магазин активен
					</label>
				</div>
			</div>
		</div>
	{/if}

	<!-- Store Cards -->
	<div class="stores-list">
		{#each stores as store (store.id)}
			<div class="store-card" class:editing={editingStoreId === store.id}>
				{#if editingStoreId === store.id}
					<!-- Editing Mode -->
					<div class="card-header">
						<div class="store-title">
							<div class="store-icon" style="background: {formData.iconColor}">🏪</div>
							<input type="text" bind:value={formData.name} class="name-input" />
						</div>
						<div class="card-actions">
							<button class="btn-success" onclick={saveStore} disabled={!isFormValid() || loading}>
								{loading ? 'Сохранение...' : 'Сохранить'}
							</button>
							<button class="btn-ghost" onclick={cancelEditing}>Отмена</button>
						</div>
					</div>

					<div class="form-grid">
						<div class="form-group">
							<label>Город</label>
							<input type="text" bind:value={formData.city} placeholder="Город" />
						</div>
						<div class="form-group full-width">
							<label>Адрес *</label>
							<input type="text" bind:value={formData.address} placeholder="Полный адрес" />
						</div>
						<div class="form-group">
							<label>Телефон *</label>
							<input type="text" bind:value={formData.phone} placeholder="+7 999 123-45-67" />
						</div>
						<div class="form-group">
							<label>Часы работы *</label>
							<input type="text" bind:value={formData.hours} placeholder="Пн-Пт: 9:00-21:00" />
						</div>
						<div class="form-group full-width">
							<label>Особенности (через запятую)</label>
							<input type="text" bind:value={featuresInput} placeholder="Парковка, Wi-Fi, Зоомагазин" />
						</div>
						<div class="form-group">
							<label>Широта</label>
							<input type="number" bind:value={formData.coordinates.lat} step="0.000001" />
						</div>
						<div class="form-group">
							<label>Долгота</label>
							<input type="number" bind:value={formData.coordinates.lng} step="0.000001" />
						</div>
						<div class="form-group">
							<label>Цвет иконки</label>
							<input type="color" bind:value={formData.iconColor} class="color-input" />
						</div>
						<div class="form-group checkbox-group">
							<label>
								<input type="checkbox" bind:checked={formData.isActive} />
								Магазин активен
							</label>
						</div>
					</div>

					<!-- Images Section -->
					<div class="images-section">
						<div class="images-header">
							<h3>Фотографии ({editingStoreImages.length}/36)</h3>
							<label class="upload-btn" class:disabled={uploadingImages}>
								{uploadingImages ? 'Загрузка...' : '+ Добавить фото'}
								<input
									type="file"
									accept="image/*"
									multiple
									onchange={handleImageUpload}
									disabled={uploadingImages}
								/>
							</label>
						</div>
						<p class="images-hint">Перетаскивайте фото для изменения порядка. Изображения автоматически конвертируются в WebP.</p>

						<div class="images-grid">
							{#each editingStoreImages as image (image.id)}
								<div
									class="image-item"
									class:dragging={draggedImageId === image.id}
									draggable="true"
									ondragstart={() => handleDragStart(image.id)}
									ondragover={handleDragOver}
									ondrop={(e) => handleDrop(e, image.id)}
									ondragend={handleDragEnd}
								>
									<img src="{API_BASE_URL.replace('/api', '')}{image.url}" alt={image.originalName} />
									<button class="delete-image" onclick={() => deleteImage(image.id)}>×</button>
									<span class="image-order">{editingStoreImages.indexOf(image) + 1}</span>
								</div>
							{/each}
							{#if editingStoreImages.length === 0}
								<div class="no-images">
									<span>📷</span>
									<p>Нет загруженных фото</p>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<!-- View Mode -->
					<div class="card-header">
						<div class="store-title">
							<div class="store-icon" style="background: {store.iconColor}">🏪</div>
							<div>
								<h2>{store.name}</h2>
								{#if store.city}
									<span class="city">{store.city}</span>
								{/if}
							</div>
						</div>
						<div class="card-actions">
							<button class="btn-edit" onclick={() => startEditing(store)}>Редактировать</button>
							<button class="btn-delete" onclick={() => deleteStore(store.id)}>Удалить</button>
						</div>
					</div>

					<div class="store-details">
						<div class="detail-row">
							<span class="detail-icon">📍</span>
							<span class="detail-value">{store.address}</span>
						</div>
						<div class="detail-row">
							<span class="detail-icon">📞</span>
							<span class="detail-value">{store.phone}</span>
						</div>
						<div class="detail-row">
							<span class="detail-icon">🕐</span>
							<span class="detail-value">{store.hours}</span>
						</div>
						<div class="detail-row">
							<span class="detail-icon">🗺️</span>
							<span class="detail-value">{store.coordinates.lat.toFixed(4)}, {store.coordinates.lng.toFixed(4)}</span>
						</div>
						{#if store.features.length > 0}
							<div class="features-row">
								{#each store.features as feature}
									<span class="feature-badge">{feature}</span>
								{/each}
							</div>
						{/if}
					</div>

					<div class="store-footer">
						<span class="status-badge" class:active={store.isActive}>
							{store.isActive ? 'Активен' : 'Неактивен'}
						</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if stores.length === 0 && !creatingNew}
		<div class="empty-state">
			<span class="empty-icon">🏪</span>
			<h2>Магазины не найдены</h2>
			<p>Добавьте первый магазин</p>
			<button class="btn-primary" onclick={startCreating}>+ Добавить магазин</button>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		padding: 1rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-left h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.text-muted {
		color: #6b7280;
		margin: 0;
		font-size: 0.875rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-weight: 500;
	}

	.alert-success {
		background: #d1fae5;
		color: #065f46;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
	}

	.stores-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.store-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
		border: 2px solid transparent;
		transition: border-color 0.2s;
	}

	.store-card.editing {
		border-color: #3b82f6;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.store-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.store-icon {
		width: 48px;
		height: 48px;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
	}

	.store-title h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.store-title .city {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.name-input {
		font-size: 1.25rem;
		font-weight: 600;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		padding: 0.5rem;
		width: 250px;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-edit, .btn-delete, .btn-success, .btn-ghost {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-edit {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-edit:hover {
		background: #e5e7eb;
	}

	.btn-delete {
		background: #fee2e2;
		color: #991b1b;
	}

	.btn-delete:hover {
		background: #fecaca;
	}

	.btn-success {
		background: #10b981;
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		background: #059669;
	}

	.btn-success:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-ghost {
		background: transparent;
		color: #6b7280;
		border: 1px solid #e5e7eb;
	}

	.btn-ghost:hover {
		background: #f9fafb;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-group.full-width {
		grid-column: span 2;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input[type="text"],
	.form-group input[type="number"] {
		padding: 0.625rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.color-input {
		width: 100%;
		height: 40px;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-group input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: #10b981;
	}

	.store-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.detail-icon {
		font-size: 1rem;
	}

	.detail-value {
		color: #374151;
	}

	.features-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.feature-badge {
		background: #f3f4f6;
		color: #6b7280;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.store-footer {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		background: #fee2e2;
		color: #991b1b;
	}

	.status-badge.active {
		background: #d1fae5;
		color: #065f46;
	}

	/* Images Section */
	.images-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.images-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.images-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.upload-btn {
		background: #3b82f6;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.upload-btn:hover:not(.disabled) {
		background: #2563eb;
	}

	.upload-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upload-btn input {
		display: none;
	}

	.images-hint {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0 0 1rem 0;
	}

	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.image-item {
		position: relative;
		aspect-ratio: 1;
		border-radius: 0.5rem;
		overflow: hidden;
		cursor: grab;
		border: 2px solid transparent;
		transition: all 0.2s;
	}

	.image-item:hover {
		border-color: #3b82f6;
	}

	.image-item.dragging {
		opacity: 0.5;
		border-color: #10b981;
	}

	.image-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.delete-image {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.9);
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.image-item:hover .delete-image {
		opacity: 1;
	}

	.image-order {
		position: absolute;
		bottom: 4px;
		left: 4px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		font-size: 0.7rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}

	.no-images {
		grid-column: span 3;
		text-align: center;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		color: #6b7280;
	}

	.no-images span {
		font-size: 2rem;
		display: block;
		margin-bottom: 0.5rem;
		opacity: 0.5;
	}

	.no-images p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-group.full-width {
			grid-column: span 1;
		}

		.card-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.images-grid {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		}
	}
</style>
