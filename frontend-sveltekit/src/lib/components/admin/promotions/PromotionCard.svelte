<script lang="ts">
	import type { Promotion } from '$lib/types/admin';
	import { Card, Badge, Button } from '$lib/components/ui';

	interface Props {
		promotion: Promotion;
		onEdit?: () => void;
		onDelete?: () => void;
		onToggleActive?: () => void;
		canEdit?: boolean;
		canDelete?: boolean;
	}

	let { promotion, onEdit, onDelete, onToggleActive, canEdit = false, canDelete = false }: Props =
		$props();
</script>

<Card class="promotion-card">
	<div class="card-header">
		{#if promotion.image}
			<img src={promotion.image} alt={promotion.title} class="promotion-image" />
		{/if}
		<h3>{promotion.title}</h3>
	</div>

	<p class="description">{promotion.description}</p>

	<div class="meta-info">
		<Badge variant="info" size="sm">
			📅 До {promotion.deadline}
		</Badge>

		{#if promotion.showOnHome}
			<Badge variant="success" size="sm">
				⭐ На главной
			</Badge>
		{/if}
	</div>

	<div class="card-actions">
		<Button variant="ghost" size="sm" onclick={onToggleActive}>
			{promotion.isActive ? '✓ Активна' : '✗ Неактивна'}
		</Button>

		{#if canEdit}
			<Button variant="primary" size="sm" onclick={onEdit}>✏️ Изменить</Button>
		{/if}

		{#if canDelete}
			<Button variant="danger" size="sm" onclick={onDelete}>🗑️ Удалить</Button>
		{/if}
	</div>
</Card>

<style>
	:global(.promotion-card) {
		border-left: 4px solid var(--border, #e5e7eb);
		transition: all 0.2s;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.promotion-image {
		width: 100%;
		height: 150px;
		object-fit: cover;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.description {
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
		flex: 1;
	}

	.meta-info {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
		flex-wrap: wrap;
	}
</style>
