<script lang="ts">
	import type { PageData } from './$types';
	import type { Promotion } from '$lib/types/admin';
	import { goto, invalidateAll } from '$app/navigation';
	import { Input, Select, Button } from '$lib/components/ui';
	import PromotionCard from '$lib/components/admin/promotions/PromotionCard.svelte';
	import PromotionFormModal from '$lib/components/admin/promotions/PromotionFormModal.svelte';
	import ConfirmModal from '$lib/components/admin/clients/ConfirmModal.svelte';
	import { promotionsAPI } from '$lib/api/admin/promotions';

	let { data }: { data: PageData } = $props();

	// Form state
	let searchQuery = $state(data.filters.search);
	let statusFilter = $state(data.filters.status);
	let urgencyFilter = $state(data.filters.deadlineClass);

	// Modals
	let formModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let editingPromotion = $state<Promotion | null>(null);
	let deletingPromotion = $state<Promotion | null>(null);
	let actionLoading = $state(false);

	// Permissions
	const userRole = 'super-admin';
	const canEdit = ['super-admin', 'editor'].includes(userRole);
	const canDelete = userRole === 'super-admin';

	// Apply filters
	const applyFilters = () => {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (urgencyFilter !== 'all') params.set('deadlineClass', urgencyFilter);
		goto(`/promotions?${params.toString()}`);
	};

	// Reset filters
	const resetFilters = () => {
		searchQuery = '';
		statusFilter = 'all';
		urgencyFilter = 'all';
		goto('/promotions');
	};

	// Open create modal
	const openCreateModal = () => {
		editingPromotion = null;
		formModalOpen = true;
	};

	// Open edit modal
	const openEditModal = (promotion: Promotion) => {
		editingPromotion = promotion;
		formModalOpen = true;
	};

	// Open delete modal
	const openDeleteModal = (promotion: Promotion) => {
		deletingPromotion = promotion;
		deleteModalOpen = true;
	};

	// Toggle active
	const handleToggleActive = async (promotion: Promotion) => {
		try {
			await promotionsAPI.toggleActive(promotion.id, !promotion.isActive);
			await invalidateAll();
		} catch (error) {
			console.error('Error toggling promotion:', error);
		}
	};

	// Confirm delete
	const confirmDelete = async () => {
		if (!deletingPromotion) return;

		actionLoading = true;
		try {
			await promotionsAPI.delete(deletingPromotion.id, true);
			await invalidateAll();
			deleteModalOpen = false;
			deletingPromotion = null;
		} catch (error) {
			console.error('Error deleting promotion:', error);
		} finally {
			actionLoading = false;
		}
	};

	// Form success
	const handleFormSuccess = async () => {
		await invalidateAll();
	};

	const activeCount = $derived(data.promotions.filter((p: Promotion) => p.isActive).length);
</script>

<svelte:head>
	<title>Акции - Loyalty Admin</title>
</svelte:head>

<div class="promotions-page">
	<div class="page-header">
		<div>
			<h1>Управление акциями</h1>
			<p class="text-muted">
				Всего акций: {data.pagination.total} | Активных: {activeCount}
			</p>
		</div>

		{#if canEdit}
			<Button variant="primary" onclick={openCreateModal}>+ Создать акцию</Button>
		{/if}
	</div>

	<!-- Фильтры -->
	<div class="filters-panel">
		<div class="search-box">
			<Input
				type="text"
				placeholder="Поиск по названию акции..."
				icon="🔍"
				bind:value={searchQuery}
			/>
		</div>

		<div class="filters-row">
			<Select
				bind:value={statusFilter}
				options={[
					{ value: 'all', label: 'Все акции' },
					{ value: 'active', label: 'Активные' },
					{ value: 'inactive', label: 'Неактивные' }
				]}
			/>

			<Select
				bind:value={urgencyFilter}
				options={[
					{ value: 'all', label: 'Любая срочность' },
					{ value: 'urgent', label: '🔴 Срочные' },
					{ value: 'soon', label: '🟠 Скоро' },
					{ value: 'normal', label: '🟢 Обычные' }
				]}
			/>
		</div>

		<div class="filter-actions">
			<Button variant="primary" onclick={applyFilters}>🔍 Применить фильтры</Button>
			<Button variant="ghost" onclick={resetFilters}>✕ Сбросить</Button>
		</div>
	</div>

	<!-- Grid акций -->
	<div class="promotions-grid">
		{#each data.promotions as promo (promo.id)}
			<PromotionCard
				promotion={promo}
				onEdit={() => openEditModal(promo)}
				onDelete={() => openDeleteModal(promo)}
				onToggleActive={() => handleToggleActive(promo)}
				{canEdit}
				{canDelete}
			/>
		{:else}
			<div class="empty-state">
				<p>Акции не найдены</p>
				{#if canEdit}
					<Button variant="primary" onclick={openCreateModal}>Создать первую акцию</Button>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Modals -->
<PromotionFormModal
	isOpen={formModalOpen}
	{editingPromotion}
	onClose={() => (formModalOpen = false)}
	onSuccess={handleFormSuccess}
/>

<ConfirmModal
	isOpen={deleteModalOpen}
	title="Удалить акцию?"
	message={`Вы уверены, что хотите удалить акцию "${deletingPromotion?.title}"? Это действие нельзя отменить.`}
	confirmText="Удалить"
	confirmVariant="danger"
	onConfirm={confirmDelete}
	onCancel={() => (deleteModalOpen = false)}
	loading={actionLoading}
/>

<style>
	.promotions-page {
		max-width: 1400px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
	}

	.text-muted {
		color: #6b7280;
		margin: 0;
	}

	/* Filters Panel */
	.filters-panel {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		margin-bottom: 1.5rem;
	}

	.search-box {
		margin-bottom: 1rem;
	}

	.filters-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-actions {
		display: flex;
		gap: 0.75rem;
	}

	/* Promotions Grid */
	.promotions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.empty-state p {
		color: #9ca3af;
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.filters-row {
			grid-template-columns: 1fr;
		}

		.promotions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
