<script lang="ts">
	import ReputationWidget from '$lib/components/ui/ReputationWidget.svelte';
</script>

<svelte:head>
	<title>Оцените нас - Гранат</title>
	<meta name="description" content="Поделитесь своим мнением о нашем сервисе и продуктах" />
</svelte:head>

<div class="reputation-page">
	<ReputationWidget />
</div>

<style>
	.reputation-page {
		min-height: 100vh;
		padding: var(--spacing-xl, 32px) var(--spacing-lg, 24px);
		background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.reputation-page {
			padding: var(--spacing-lg, 24px) var(--spacing-md, 16px);
		}
	}
</style>
