<script lang="ts">
	import type { ClientDetail } from '$lib/types/admin';
	import { Button, Badge } from '$lib/components/ui';
	import { goto } from '$app/navigation';

	interface Props {
		client: ClientDetail;
		onToggleBlock?: () => void;
		canBlock?: boolean;
	}

	let { client, onToggleBlock, canBlock = false }: Props = $props();

	const goBack = () => {
		goto('/clients');
	};
</script>

<header class="detail-header">
	<Button variant="ghost" onclick={goBack}>← Назад к списку</Button>

	<div class="header-content">
		<div class="client-info">
			<h1>{client.name}</h1>
			<p class="telegram-id">Telegram ID: {client.telegramId}</p>
		</div>

		<div class="header-badges">
			<Badge variant={client.isActive ? 'success' : 'danger'} size="md">
				{client.isActive ? 'Активен' : 'Заблокирован'}
			</Badge>

			{#if canBlock}
				<Button size="sm" variant="danger" onclick={onToggleBlock}>
					🔒 {client.isActive ? 'Заблокировать' : 'Разблокировать'}
				</Button>
			{/if}
		</div>
	</div>
</header>

<style>
	.detail-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
	}

	.client-info h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
	}

	.telegram-id {
		font-family: monospace;
		color: #667eea;
		font-size: 0.875rem;
		margin: 0;
	}

	.header-badges {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>
