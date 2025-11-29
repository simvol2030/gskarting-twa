<script lang="ts">
	import type { Pagination } from '$lib/types/admin';
	import { Button } from '$lib/components/ui';

	interface Props {
		pagination: Pagination;
		onPageChange: (page: number) => void;
	}

	let { pagination, onPageChange }: Props = $props();

	const maxVisiblePages = 5;

	const visiblePages = $derived(() => {
		const pages: number[] = [];
		const { page, totalPages } = pagination;

		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			const start = Math.max(1, page - 2);
			const end = Math.min(totalPages, start + maxVisiblePages - 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (start > 1) pages.unshift(-1); // Ellipsis
			if (end < totalPages) pages.push(-2); // Ellipsis
		}

		return pages;
	});

	const goToPage = (pageNum: number) => {
		if (pageNum < 1 || pageNum > pagination.totalPages || pageNum === pagination.page) return;
		onPageChange(pageNum);
	};
</script>

<div class="pagination">
	<div class="pagination-info">
		Показано {(pagination.page - 1) * pagination.limit + 1}–{Math.min(
			pagination.page * pagination.limit,
			pagination.total
		)} из {pagination.total}
	</div>

	<div class="pagination-controls">
		<Button
			variant="ghost"
			size="sm"
			disabled={pagination.page === 1}
			onclick={() => goToPage(pagination.page - 1)}
		>
			← Назад
		</Button>

		{#each visiblePages() as pageNum}
			{#if pageNum === -1 || pageNum === -2}
				<span class="ellipsis">...</span>
			{:else}
				<button
					class="page-btn"
					class:active={pageNum === pagination.page}
					onclick={() => goToPage(pageNum)}
				>
					{pageNum}
				</button>
			{/if}
		{/each}

		<Button
			variant="ghost"
			size="sm"
			disabled={pagination.page === pagination.totalPages}
			onclick={() => goToPage(pagination.page + 1)}
		>
			Вперед →
		</Button>
	</div>
</div>

<style>
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 0;
		gap: 1rem;
	}

	.pagination-info {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.page-btn {
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		background: white;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.page-btn:hover:not(.active) {
		border-color: #667eea;
		background: #f9fafb;
	}

	.page-btn.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-color: transparent;
	}

	.ellipsis {
		color: #9ca3af;
		padding: 0 0.25rem;
	}

	@media (max-width: 768px) {
		.pagination {
			flex-direction: column;
		}

		.pagination-info {
			order: 2;
		}

		.pagination-controls {
			order: 1;
		}
	}
</style>
