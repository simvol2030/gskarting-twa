<!--
  Sellers Management Page
  - Список продавцов
  - Добавление/редактирование/удаление продавцов
  - Управление PIN-кодами
-->
<script lang="ts">
	import { onMount } from 'svelte';

	interface Seller {
		id: number;
		name: string;
		is_active: boolean;
		created_at: string;
	}

	let sellers: Seller[] = $state([]);
	let isLoading = $state(true);
	let error = $state('');

	// Form state
	let showForm = $state(false);
	let editingSeller: Seller | null = $state(null);
	let formName = $state('');
	let formPin = $state('');
	let formIsActive = $state(true);
	let formError = $state('');
	let isSubmitting = $state(false);

	// Delete confirmation
	let deletingId: number | null = $state(null);

	onMount(async () => {
		await loadSellers();
	});

	async function loadSellers() {
		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/admin/sellers');
			if (response.ok) {
				const data = await response.json();
				sellers = data.sellers || [];
			} else {
				error = 'Ошибка загрузки списка продавцов';
			}
		} catch (err) {
			console.error('Load sellers error:', err);
			error = 'Ошибка соединения';
		} finally {
			isLoading = false;
		}
	}

	function openAddForm() {
		editingSeller = null;
		formName = '';
		formPin = '';
		formIsActive = true;
		formError = '';
		showForm = true;
	}

	function openEditForm(seller: Seller) {
		editingSeller = seller;
		formName = seller.name;
		formPin = ''; // PIN не показываем, только для изменения
		formIsActive = seller.is_active;
		formError = '';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingSeller = null;
		formError = '';
	}

	async function handleSubmit() {
		formError = '';

		// Валидация
		if (!formName.trim() || formName.trim().length < 2) {
			formError = 'Имя должно содержать минимум 2 символа';
			return;
		}

		// PIN обязателен только для нового продавца
		if (!editingSeller && (!formPin || !/^\d{4}$/.test(formPin))) {
			formError = 'PIN должен быть 4-значным числом';
			return;
		}

		// Если редактируем и указан PIN, проверяем формат
		if (editingSeller && formPin && !/^\d{4}$/.test(formPin)) {
			formError = 'PIN должен быть 4-значным числом';
			return;
		}

		isSubmitting = true;

		try {
			const url = editingSeller
				? `/api/admin/sellers/${editingSeller.id}`
				: '/api/admin/sellers';

			const method = editingSeller ? 'PUT' : 'POST';

			const body: any = {
				name: formName.trim(),
				is_active: formIsActive
			};

			// PIN только если указан
			if (formPin) {
				body.pin = formPin;
			}

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			const data = await response.json();

			if (response.ok) {
				closeForm();
				await loadSellers();
			} else {
				formError = data.error || 'Ошибка сохранения';
			}
		} catch (err) {
			console.error('Submit error:', err);
			formError = 'Ошибка соединения';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(id: number) {
		try {
			const response = await fetch(`/api/admin/sellers/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				deletingId = null;
				await loadSellers();
			} else {
				const data = await response.json();
				alert(data.error || 'Ошибка удаления');
			}
		} catch (err) {
			console.error('Delete error:', err);
			alert('Ошибка соединения');
		}
	}

	async function toggleActive(seller: Seller) {
		try {
			const response = await fetch(`/api/admin/sellers/${seller.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					is_active: !seller.is_active
				})
			});

			if (response.ok) {
				await loadSellers();
			}
		} catch (err) {
			console.error('Toggle error:', err);
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Продавцы | Admin</title>
</svelte:head>

<div class="sellers-page">
	<header class="page-header">
		<div>
			<h1>Продавцы</h1>
			<p class="subtitle">Управление продавцами для PWA-приложения</p>
		</div>
		<button class="btn-add" onclick={openAddForm}>
			+ Добавить продавца
		</button>
	</header>

	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Загрузка...</p>
		</div>
	{:else if error}
		<div class="error-message">
			{error}
			<button onclick={loadSellers}>Повторить</button>
		</div>
	{:else if sellers.length === 0}
		<div class="empty-state">
			<div class="empty-icon">👥</div>
			<h3>Нет продавцов</h3>
			<p>Добавьте первого продавца для работы с PWA-приложением</p>
			<button class="btn-add" onclick={openAddForm}>
				+ Добавить продавца
			</button>
		</div>
	{:else}
		<div class="sellers-grid">
			{#each sellers as seller}
				<div class="seller-card" class:inactive={!seller.is_active}>
					<div class="seller-header">
						<div class="seller-avatar">
							{seller.name.charAt(0).toUpperCase()}
						</div>
						<div class="seller-info">
							<h3>{seller.name}</h3>
							<p class="seller-date">Добавлен: {formatDate(seller.created_at)}</p>
						</div>
						<div class="seller-status" class:active={seller.is_active}>
							{seller.is_active ? 'Активен' : 'Неактивен'}
						</div>
					</div>

					<div class="seller-actions">
						<button class="btn-edit" onclick={() => openEditForm(seller)}>
							Редактировать
						</button>
						<button
							class="btn-toggle"
							class:deactivate={seller.is_active}
							onclick={() => toggleActive(seller)}
						>
							{seller.is_active ? 'Деактивировать' : 'Активировать'}
						</button>
						{#if deletingId === seller.id}
							<div class="delete-confirm">
								<span>Удалить?</span>
								<button class="btn-confirm-delete" onclick={() => handleDelete(seller.id)}>Да</button>
								<button class="btn-cancel-delete" onclick={() => deletingId = null}>Нет</button>
							</div>
						{:else}
							<button class="btn-delete" onclick={() => deletingId = seller.id}>
								Удалить
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal Form -->
{#if showForm}
	<div class="modal-overlay" onclick={closeForm}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2>{editingSeller ? 'Редактировать продавца' : 'Новый продавец'}</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<div class="form-group">
					<label for="seller-name">Имя продавца</label>
					<input
						id="seller-name"
						type="text"
						bind:value={formName}
						placeholder="Например: Анна"
						required
					/>
				</div>

				<div class="form-group">
					<label for="seller-pin">
						PIN-код (4 цифры)
						{#if editingSeller}
							<span class="hint">Оставьте пустым, чтобы не менять</span>
						{/if}
					</label>
					<input
						id="seller-pin"
						type="password"
						inputmode="numeric"
						pattern="[0-9]*"
						maxlength="4"
						bind:value={formPin}
						placeholder={editingSeller ? '••••' : '0000'}
					/>
				</div>

				{#if editingSeller}
					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formIsActive} />
							<span>Активен</span>
						</label>
					</div>
				{/if}

				{#if formError}
					<div class="form-error">{formError}</div>
				{/if}

				<div class="form-actions">
					<button type="button" class="btn-cancel" onclick={closeForm}>
						Отмена
					</button>
					<button type="submit" class="btn-save" disabled={isSubmitting}>
						{isSubmitting ? 'Сохранение...' : 'Сохранить'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.sellers-page {
		max-width: 1000px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
		color: #1f2937;
	}

	.subtitle {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.btn-add {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-add:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
		color: #6b7280;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-message {
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.error-message button {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #dc2626;
		border-radius: 4px;
		color: #dc2626;
		cursor: pointer;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #f9fafb;
		border-radius: 12px;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
	}

	.sellers-grid {
		display: grid;
		gap: 1rem;
	}

	.seller-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s;
	}

	.seller-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.seller-card.inactive {
		opacity: 0.7;
		background: #f9fafb;
	}

	.seller-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.seller-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.seller-info {
		flex: 1;
	}

	.seller-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		color: #1f2937;
	}

	.seller-date {
		margin: 0;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.seller-status {
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		background: #fee2e2;
		color: #dc2626;
	}

	.seller-status.active {
		background: #dcfce7;
		color: #16a34a;
	}

	.seller-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.seller-actions button {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit {
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		color: #374151;
	}

	.btn-edit:hover {
		background: #e5e7eb;
	}

	.btn-toggle {
		background: #dcfce7;
		border: 1px solid #bbf7d0;
		color: #16a34a;
	}

	.btn-toggle.deactivate {
		background: #fef3c7;
		border: 1px solid #fde68a;
		color: #d97706;
	}

	.btn-delete {
		background: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
	}

	.delete-confirm {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.btn-confirm-delete {
		background: #dc2626 !important;
		border: none !important;
		color: white !important;
	}

	.btn-cancel-delete {
		background: #f3f4f6 !important;
		border: 1px solid #e5e7eb !important;
		color: #374151 !important;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		animation: modalIn 0.2s ease;
	}

	@keyframes modalIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
		color: #1f2937;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group .hint {
		font-weight: 400;
		color: #9ca3af;
		margin-left: 0.5rem;
	}

	.form-group input[type="text"],
	.form-group input[type="password"] {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.checkbox-label {
		display: flex !important;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-label input {
		width: 18px;
		height: 18px;
	}

	.form-error {
		padding: 0.75rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		color: #dc2626;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn-cancel {
		padding: 0.75rem 1.5rem;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		color: #374151;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.btn-save {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 8px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-save:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.page-header {
			flex-direction: column;
		}

		.seller-header {
			flex-wrap: wrap;
		}

		.seller-status {
			width: 100%;
			text-align: center;
			margin-top: 0.5rem;
		}
	}
</style>
