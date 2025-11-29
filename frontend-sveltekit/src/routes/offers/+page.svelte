<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Акции - Мурзико</title>
</svelte:head>

<div class="offers-page">
	<header class="page-header">
		<h1>🎉 Акции месяца</h1>
		<p class="subtitle">Специальные предложения для вас</p>
	</header>

	<div class="offers-list">
		{#each data.offers as offer}
			<article class="offer-card">
				<!-- Image (Sprint 2 NEW) -->
				{#if offer.image}
					<img src={offer.image} alt={offer.title} class="offer-image" />
				{:else}
					<!-- Fallback for old promotions without image -->
					<div class="offer-placeholder">
						<span class="placeholder-icon">🎁</span>
					</div>
				{/if}

				<div class="offer-content">
					<h2 class="offer-title">{offer.title}</h2>
					<p class="offer-description">{offer.description}</p>

					<!-- Deadline badge (Sprint 2 simplified) -->
					<div class="deadline">
						<span class="deadline-icon">⏱️</span>
						<span class="deadline-text">До {offer.deadline}</span>
					</div>
				</div>
			</article>
		{/each}
	</div>

	{#if data.offers.length === 0}
		<div class="empty-state">
			<span class="empty-icon">🎁</span>
			<h2>Нет активных акций</h2>
			<p>Следите за обновлениями</p>
		</div>
	{/if}
</div>

<style>
	.offers-page {
		padding: 0 16px 24px;
		max-width: 480px;
		margin: 0 auto;
	}

	.page-header {
		text-align: center;
		padding: 24px 0;
	}

	.page-header h1 {
		font-size: 28px;
		font-weight: bold;
		color: var(--text-primary);
		margin: 0 0 8px 0;
		letter-spacing: -0.025em;
	}

	.subtitle {
		font-size: 15px;
		color: var(--text-secondary);
		margin: 0;
	}

	.offers-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.offer-card {
		background: var(--card-bg);
		border-radius: 16px;
		padding: 0;
		box-shadow: var(--shadow);
		transition: all 0.3s ease;
		overflow: hidden;
	}

	.offer-card:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	.offer-image {
		width: 100%;
		height: 180px;
		object-fit: cover;
		display: block;
	}

	.offer-placeholder {
		width: 100%;
		height: 180px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon {
		font-size: 64px;
		opacity: 0.8;
	}

	.offer-content {
		padding: 20px;
	}

	.offer-title {
		font-size: 20px;
		font-weight: bold;
		color: var(--text-primary);
		margin: 0 0 8px 0;
		letter-spacing: -0.025em;
	}

	.offer-description {
		font-size: 15px;
		color: var(--text-secondary);
		margin: 0 0 16px 0;
		line-height: 1.5;
	}

	.deadline {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 8px;
		background: var(--bg-light);
		font-size: 14px;
		font-weight: 600;
		color: var(--text-secondary);
		align-self: flex-start;
	}

	.deadline-icon {
		font-size: 16px;
	}

	.empty-state {
		text-align: center;
		padding: 64px 20px;
	}

	.empty-icon {
		font-size: 64px;
		display: block;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.empty-state h2 {
		font-size: 20px;
		font-weight: bold;
		color: var(--text-primary);
		margin: 0 0 8px 0;
	}

	.empty-state p {
		font-size: 15px;
		color: var(--text-secondary);
		margin: 0;
	}

	@media (max-width: 480px) {
		.offer-image,
		.offer-placeholder {
			height: 160px;
		}
	}
</style>
