<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { StoriesHighlight, StoriesSettings } from '$lib/types/stories';
	import { storiesAPI } from '$lib/api/admin/stories';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data }: { data: PageData } = $props();

	// State
	let highlights = $state<StoriesHighlight[]>(data.highlights || []);
	let settings = $state<StoriesSettings | null>(data.settings);
	let analytics = $state(data.analytics);

	// Modal states
	let createModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let selectedHighlight = $state<StoriesHighlight | null>(null);
	let selectedIds = $state<number[]>([]);

	// Form state
	let formTitle = $state('');
	let formLoading = $state(false);
	let formError = $state<string | null>(null);

	// Drag & Drop state
	let draggedItem = $state<StoriesHighlight | null>(null);
	let dragOverId = $state<number | null>(null);

	// Computed
	const allSelected = $derived(selectedIds.length === highlights.length && highlights.length > 0);
	const someSelected = $derived(selectedIds.length > 0);
	const storiesEnabled = $derived(settings?.enabled ?? true);

	// =====================================================
	// HANDLERS
	// =====================================================

	function openCreateModal() {
		formTitle = '';
		formError = null;
		createModalOpen = true;
	}

	async function handleCreate() {
		if (!formTitle.trim()) {
			formError = 'Введите название';
			return;
		}

		formLoading = true;
		formError = null;

		try {
			const newHighlight = await storiesAPI.highlights.create({
				title: formTitle.trim(),
				coverImage: null,
				isActive: true
			});

			highlights = [...highlights, newHighlight];
			createModalOpen = false;
			formTitle = '';

			// Navigate to edit page
			goto(`/stories/${newHighlight.id}`);
		} catch (err: any) {
			formError = err.message || 'Ошибка при создании';
		} finally {
			formLoading = false;
		}
	}

	function openDeleteModal(highlight: StoriesHighlight) {
		selectedHighlight = highlight;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!selectedHighlight) return;

		formLoading = true;
		try {
			await storiesAPI.highlights.delete(selectedHighlight.id);
			highlights = highlights.filter(h => h.id !== selectedHighlight!.id);
			selectedIds = selectedIds.filter(id => id !== selectedHighlight!.id);
			deleteModalOpen = false;
			selectedHighlight = null;
		} catch (err: any) {
			formError = err.message || 'Ошибка при удалении';
		} finally {
			formLoading = false;
		}
	}

	async function handleDuplicate(highlight: StoriesHighlight) {
		try {
			const duplicated = await storiesAPI.highlights.duplicate(highlight.id);
			highlights = [...highlights, duplicated];
		} catch (err: any) {
			alert(err.message || 'Ошибка при копировании');
		}
	}

	async function toggleActive(highlight: StoriesHighlight) {
		try {
			const updated = await storiesAPI.highlights.update(highlight.id, {
				isActive: !highlight.isActive
			});
			highlights = highlights.map(h => h.id === highlight.id ? { ...h, isActive: updated.isActive } : h);
		} catch (err: any) {
			alert(err.message || 'Ошибка при изменении статуса');
		}
	}

	async function toggleStoriesEnabled() {
		if (!settings) return;

		try {
			const updated = await storiesAPI.settings.update({
				enabled: !settings.enabled
			});
			settings = updated;
		} catch (err: any) {
			alert(err.message || 'Ошибка при изменении настроек');
		}
	}

	// Selection handlers
	function toggleSelectAll() {
		if (allSelected) {
			selectedIds = [];
		} else {
			selectedIds = highlights.map(h => h.id);
		}
	}

	function toggleSelect(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	async function bulkToggleActive(isActive: boolean) {
		if (selectedIds.length === 0) return;

		try {
			await storiesAPI.highlights.bulkStatus({ ids: selectedIds, isActive });
			highlights = highlights.map(h =>
				selectedIds.includes(h.id) ? { ...h, isActive } : h
			);
			selectedIds = [];
		} catch (err: any) {
			alert(err.message || 'Ошибка при изменении статуса');
		}
	}

	// Drag & Drop handlers
	function handleDragStart(e: DragEvent, highlight: StoriesHighlight) {
		draggedItem = highlight;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(e: DragEvent, highlight: StoriesHighlight) {
		e.preventDefault();
		if (draggedItem && draggedItem.id !== highlight.id) {
			dragOverId = highlight.id;
		}
	}

	function handleDragLeave() {
		dragOverId = null;
	}

	async function handleDrop(e: DragEvent, targetHighlight: StoriesHighlight) {
		e.preventDefault();
		dragOverId = null;

		if (!draggedItem || draggedItem.id === targetHighlight.id) {
			draggedItem = null;
			return;
		}

		// Find indices
		const draggedIndex = highlights.findIndex(h => h.id === draggedItem!.id);
		const targetIndex = highlights.findIndex(h => h.id === targetHighlight.id);

		// Reorder array
		const newHighlights = [...highlights];
		const [removed] = newHighlights.splice(draggedIndex, 1);
		newHighlights.splice(targetIndex, 0, removed);

		// Update positions
		const reorderedItems = newHighlights.map((h, index) => ({
			id: h.id,
			position: index
		}));

		highlights = newHighlights.map((h, index) => ({ ...h, position: index }));
		draggedItem = null;

		// Save to server
		try {
			await storiesAPI.highlights.reorder(reorderedItems);
		} catch (err: any) {
			console.error('Failed to save order:', err);
			// Revert on error
			await invalidateAll();
		}
	}

	function handleDragEnd() {
		draggedItem = null;
		dragOverId = null;
	}
</script>

<div class="page-header">
	<div class="header-left">
		<h1>📸 Web Stories</h1>
		<p class="subtitle">Управление историями для главной страницы</p>
	</div>
	<div class="header-actions">
		<a href="/stories/analytics" class="btn btn-secondary">
			📊 Аналитика
		</a>
		<a href="/stories/settings" class="btn btn-secondary">
			⚙️ Настройки
		</a>
		<Button variant="primary" onclick={openCreateModal}>
			+ Создать хайлайт
		</Button>
	</div>
</div>

<!-- Global toggle -->
<div class="global-toggle-card">
	<div class="toggle-content">
		<div class="toggle-info">
			<h3>Отображение Stories</h3>
			<p>Показывать Web Stories на главной странице приложения</p>
		</div>
		<label class="toggle-switch">
			<input type="checkbox" checked={storiesEnabled} onchange={toggleStoriesEnabled} />
			<span class="slider"></span>
		</label>
	</div>
	{#if analytics}
		<div class="quick-stats">
			<div class="stat">
				<span class="stat-value">{analytics.totalViews}</span>
				<span class="stat-label">Просмотров (7 дней)</span>
			</div>
			<div class="stat">
				<span class="stat-value">{analytics.uniqueViewers}</span>
				<span class="stat-label">Уникальных зрителей</span>
			</div>
			<div class="stat">
				<span class="stat-value">{analytics.completionRate?.toFixed(0) || 0}%</span>
				<span class="stat-label">Досмотры</span>
			</div>
		</div>
	{/if}
</div>

<!-- Bulk actions -->
{#if someSelected}
	<div class="bulk-actions">
		<span>{selectedIds.length} выбрано</span>
		<Button variant="secondary" size="sm" onclick={() => bulkToggleActive(true)}>
			Включить
		</Button>
		<Button variant="secondary" size="sm" onclick={() => bulkToggleActive(false)}>
			Выключить
		</Button>
		<Button variant="ghost" size="sm" onclick={() => selectedIds = []}>
			Отменить
		</Button>
	</div>
{/if}

<!-- Highlights list -->
<div class="highlights-section">
	<div class="section-header">
		<div class="select-all">
			<input
				type="checkbox"
				checked={allSelected}
				indeterminate={someSelected && !allSelected}
				onchange={toggleSelectAll}
			/>
			<span>Хайлайты ({highlights.length})</span>
		</div>
		<p class="hint">Перетаскивайте для изменения порядка</p>
	</div>

	{#if highlights.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📸</div>
			<h3>Нет хайлайтов</h3>
			<p>Создайте первый хайлайт, чтобы начать добавлять Stories</p>
			<Button variant="primary" onclick={openCreateModal}>
				+ Создать хайлайт
			</Button>
		</div>
	{:else}
		<div class="highlights-list">
			{#each highlights as highlight (highlight.id)}
				<div
					class="highlight-card"
					class:dragging={draggedItem?.id === highlight.id}
					class:drag-over={dragOverId === highlight.id}
					class:inactive={!highlight.isActive}
					draggable="true"
					ondragstart={(e) => handleDragStart(e, highlight)}
					ondragover={(e) => handleDragOver(e, highlight)}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, highlight)}
					ondragend={handleDragEnd}
				>
					<div class="card-checkbox">
						<input
							type="checkbox"
							checked={selectedIds.includes(highlight.id)}
							onchange={() => toggleSelect(highlight.id)}
							onclick={(e) => e.stopPropagation()}
						/>
					</div>

					<div class="card-drag-handle">⠿</div>

					<div class="card-cover">
						{#if highlight.coverImage}
							<img src={highlight.coverImage} alt={highlight.title} />
						{:else}
							<div class="cover-placeholder">📷</div>
						{/if}
					</div>

					<div class="card-content">
						<h3 class="card-title">{highlight.title}</h3>
						<div class="card-meta">
							<span class="items-count">{highlight.itemsCount || 0} элементов</span>
							<span class="status-badge" class:active={highlight.isActive}>
								{highlight.isActive ? 'Активен' : 'Неактивен'}
							</span>
						</div>
					</div>

					<div class="card-actions">
						<button class="action-btn" onclick={() => goto(`/stories/${highlight.id}`)} title="Редактировать">
							✏️
						</button>
						<button class="action-btn" onclick={() => handleDuplicate(highlight)} title="Дублировать">
							📋
						</button>
						<button class="action-btn" onclick={() => toggleActive(highlight)} title={highlight.isActive ? 'Выключить' : 'Включить'}>
							{highlight.isActive ? '👁️' : '👁️‍🗨️'}
						</button>
						<button class="action-btn danger" onclick={() => openDeleteModal(highlight)} title="Удалить">
							🗑️
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Modal -->
<Modal isOpen={createModalOpen} onClose={() => createModalOpen = false} title="Создать хайлайт" size="sm">
	<form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
		<div class="form-group">
			<Input
				label="Название"
				placeholder="Например: Акции, Новинки, О нас"
				bind:value={formTitle}
				error={formError || undefined}
			/>
		</div>
		<p class="form-hint">Обложку и контент можно будет добавить после создания</p>
		<div class="modal-actions">
			<Button variant="ghost" onclick={() => createModalOpen = false} disabled={formLoading}>
				Отмена
			</Button>
			<Button variant="primary" type="submit" loading={formLoading}>
				Создать
			</Button>
		</div>
	</form>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal isOpen={deleteModalOpen} onClose={() => deleteModalOpen = false} title="Удалить хайлайт?" size="sm">
	<p class="confirm-text">
		Вы уверены, что хотите удалить хайлайт <strong>"{selectedHighlight?.title}"</strong>?
		<br><br>
		Все элементы внутри хайлайта также будут удалены. Это действие нельзя отменить.
	</p>
	<div class="modal-actions">
		<Button variant="ghost" onclick={() => deleteModalOpen = false} disabled={formLoading}>
			Отмена
		</Button>
		<Button variant="danger" onclick={handleDelete} loading={formLoading}>
			Удалить
		</Button>
	</div>
</Modal>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: #111827;
	}

	.subtitle {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	/* Global Toggle Card */
	.global-toggle-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.toggle-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.toggle-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
	}

	.toggle-info p {
		margin: 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 26px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #d1d5db;
		transition: 0.3s;
		border-radius: 26px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}

	.toggle-switch input:checked + .slider {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.toggle-switch input:checked + .slider:before {
		transform: translateX(22px);
	}

	.quick-stats {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* Bulk Actions */
	.bulk-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #eff6ff;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.bulk-actions span {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1e40af;
	}

	/* Highlights Section */
	.highlights-section {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.select-all {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.select-all input {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	/* Empty State */
	.empty-state {
		padding: 3rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		color: #374151;
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Highlights List */
	.highlights-list {
		padding: 0.5rem;
	}

	.highlight-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		margin: 0.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: all 0.2s;
		cursor: grab;
	}

	.highlight-card:hover {
		border-color: #d1d5db;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.highlight-card.dragging {
		opacity: 0.5;
		cursor: grabbing;
	}

	.highlight-card.drag-over {
		border-color: #667eea;
		background: #f5f3ff;
	}

	.highlight-card.inactive {
		opacity: 0.7;
	}

	.card-checkbox input {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.card-drag-handle {
		color: #9ca3af;
		font-size: 1.25rem;
		cursor: grab;
		user-select: none;
	}

	.card-cover {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		overflow: hidden;
		background: #f3f4f6;
		flex-shrink: 0;
	}

	.card-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cover-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: #9ca3af;
	}

	.card-content {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.items-count {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.status-badge {
		font-size: 0.6875rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
		background: #fee2e2;
		color: #7f1d1d;
	}

	.status-badge.active {
		background: #d1fae5;
		color: #065f46;
	}

	.card-actions {
		display: flex;
		gap: 0.25rem;
	}

	.action-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.action-btn:hover {
		background: #f3f4f6;
	}

	.action-btn.danger:hover {
		background: #fee2e2;
	}

	/* Modal Styles */
	.form-group {
		margin-bottom: 1rem;
	}

	.form-hint {
		margin: 0 0 1.5rem 0;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.confirm-text {
		margin: 0 0 1rem 0;
		color: #4b5563;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			width: 100%;
		}

		.quick-stats {
			flex-wrap: wrap;
			gap: 1rem;
		}

		.highlight-card {
			flex-wrap: wrap;
		}

		.card-actions {
			width: 100%;
			justify-content: flex-end;
			margin-top: 0.5rem;
			padding-top: 0.5rem;
			border-top: 1px solid #f3f4f6;
		}
	}
</style>
