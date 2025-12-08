<script lang="ts">
	import type { PageData } from './$types';
	import type { StoriesAnalytics, HighlightAnalytics } from '$lib/types/stories';
	import { analyticsAPI } from '$lib/api/admin/stories';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let analytics = $state<StoriesAnalytics | null>(data.analytics);
	let selectedDays = $state(data.days);
	let loading = $state(false);
	let error = $state<string | null>(data.error);

	// Selected highlight for detailed view
	let selectedHighlightId = $state<number | null>(null);
	let highlightAnalytics = $state<HighlightAnalytics | null>(null);
	let loadingHighlight = $state(false);

	async function changePeriod(days: number) {
		selectedDays = days;
		loading = true;
		error = null;

		try {
			analytics = await analyticsAPI.getOverall(days);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ошибка загрузки';
		} finally {
			loading = false;
		}
	}

	async function selectHighlight(id: number) {
		if (selectedHighlightId === id) {
			selectedHighlightId = null;
			highlightAnalytics = null;
			return;
		}

		selectedHighlightId = id;
		loadingHighlight = true;

		try {
			highlightAnalytics = await analyticsAPI.getByHighlight(id, selectedDays);
		} catch (err) {
			console.error('Error loading highlight analytics:', err);
			highlightAnalytics = null;
		} finally {
			loadingHighlight = false;
		}
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}

	function formatDuration(seconds: number): string {
		if (seconds < 60) {
			return seconds.toFixed(1) + ' сек';
		}
		const minutes = Math.floor(seconds / 60);
		const secs = Math.round(seconds % 60);
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	function formatPercent(value: number): string {
		return value.toFixed(1) + '%';
	}
</script>

<svelte:head>
	<title>Аналитика Stories | Admin</title>
</svelte:head>

<div class="analytics-page">
	<header class="page-header">
		<div class="header-left">
			<a href="/stories" class="back-link">← Назад к Stories</a>
			<h1>Аналитика Stories</h1>
		</div>
		<div class="period-selector">
			<button
				class="period-btn"
				class:active={selectedDays === 7}
				onclick={() => changePeriod(7)}
			>
				7 дней
			</button>
			<button
				class="period-btn"
				class:active={selectedDays === 30}
				onclick={() => changePeriod(30)}
			>
				30 дней
			</button>
			<button
				class="period-btn"
				class:active={selectedDays === 90}
				onclick={() => changePeriod(90)}
			>
				90 дней
			</button>
		</div>
	</header>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Загрузка аналитики...</p>
		</div>
	{:else if analytics}
		<!-- Summary Cards -->
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">👁️</div>
				<div class="stat-content">
					<span class="stat-value">{formatNumber(analytics.totalViews)}</span>
					<span class="stat-label">Всего просмотров</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">👤</div>
				<div class="stat-content">
					<span class="stat-value">{formatNumber(analytics.uniqueViewers)}</span>
					<span class="stat-label">Уникальных зрителей</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">✅</div>
				<div class="stat-content">
					<span class="stat-value">{formatPercent(analytics.completionRate)}</span>
					<span class="stat-label">Досмотрели до конца</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">🔗</div>
				<div class="stat-content">
					<span class="stat-value">{formatPercent(analytics.linkClickRate)}</span>
					<span class="stat-label">Кликнули на ссылку</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">⏱️</div>
				<div class="stat-content">
					<span class="stat-value">{formatDuration(analytics.avgViewDuration)}</span>
					<span class="stat-label">Среднее время просмотра</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">📊</div>
				<div class="stat-content">
					<span class="stat-value">{(analytics.totalViews / (analytics.uniqueViewers || 1)).toFixed(1)}</span>
					<span class="stat-label">Просмотров на зрителя</span>
				</div>
			</div>
		</div>

		<!-- Top Highlights -->
		{#if analytics.topHighlights && analytics.topHighlights.length > 0}
			<section class="section">
				<h2>Топ хайлайтов по просмотрам</h2>
				<div class="highlights-table">
					<table>
						<thead>
							<tr>
								<th>Хайлайт</th>
								<th>Просмотры</th>
								<th>Досмотрели</th>
								<th>Клики</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each analytics.topHighlights as highlight}
								<tr
									class:selected={selectedHighlightId === highlight.id}
									onclick={() => selectHighlight(highlight.id)}
								>
									<td class="highlight-cell">
										{#if highlight.coverImage}
											<img src={highlight.coverImage} alt="" class="highlight-thumb" />
										{:else}
											<div class="highlight-thumb placeholder">📷</div>
										{/if}
										<span>{highlight.title}</span>
									</td>
									<td>{formatNumber(highlight.views)}</td>
									<td>{formatPercent(highlight.completionRate)}</td>
									<td>{formatNumber(highlight.linkClicks)}</td>
									<td>
										<button class="btn-details">
											{selectedHighlightId === highlight.id ? '▲' : '▼'}
										</button>
									</td>
								</tr>

								{#if selectedHighlightId === highlight.id}
									<tr class="detail-row">
										<td colspan="5">
											{#if loadingHighlight}
												<div class="detail-loading">Загрузка...</div>
											{:else if highlightAnalytics}
												<div class="highlight-detail">
													<div class="detail-stats">
														<div class="detail-stat">
															<span class="detail-value">{highlightAnalytics.totalViews}</span>
															<span class="detail-label">Просмотров</span>
														</div>
														<div class="detail-stat">
															<span class="detail-value">{highlightAnalytics.uniqueViewers}</span>
															<span class="detail-label">Уникальных</span>
														</div>
														<div class="detail-stat">
															<span class="detail-value">{formatDuration(highlightAnalytics.avgViewDuration)}</span>
															<span class="detail-label">Ср. время</span>
														</div>
														<div class="detail-stat">
															<span class="detail-value">{highlightAnalytics.itemsCount}</span>
															<span class="detail-label">Элементов</span>
														</div>
													</div>

													{#if highlightAnalytics.itemsAnalytics && highlightAnalytics.itemsAnalytics.length > 0}
														<div class="items-analytics">
															<h4>Статистика по элементам</h4>
															<div class="items-list">
																{#each highlightAnalytics.itemsAnalytics as item, index}
																	<div class="item-stat">
																		<span class="item-index">{index + 1}</span>
																		<div class="item-bar-container">
																			<div
																				class="item-bar"
																				style="width: {(item.views / (highlightAnalytics.itemsAnalytics[0]?.views || 1)) * 100}%"
																			></div>
																		</div>
																		<span class="item-views">{item.views}</span>
																		<span class="item-completion">{formatPercent(item.completionRate)}</span>
																	</div>
																{/each}
															</div>
														</div>
													{/if}
												</div>
											{:else}
												<div class="detail-empty">Нет данных</div>
											{/if}
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{:else}
			<section class="section">
				<div class="empty-state">
					<span class="empty-icon">📊</span>
					<p>Пока нет данных для отображения</p>
					<p class="empty-hint">Статистика появится после первых просмотров Stories</p>
				</div>
			</section>
		{/if}

		<!-- All Highlights List -->
		{#if data.highlights && data.highlights.length > 0}
			<section class="section">
				<h2>Все хайлайты</h2>
				<div class="all-highlights">
					{#each data.highlights as highlight}
						<div
							class="highlight-card"
							class:inactive={!highlight.isActive}
							onclick={() => selectHighlight(highlight.id)}
						>
							<div class="highlight-cover">
								{#if highlight.coverImage}
									<img src={highlight.coverImage} alt="" />
								{:else}
									<div class="cover-placeholder">📷</div>
								{/if}
							</div>
							<div class="highlight-info">
								<span class="highlight-title">{highlight.title}</span>
								{#if !highlight.isActive}
									<span class="inactive-badge">Неактивен</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<div class="empty-state">
			<span class="empty-icon">📊</span>
			<p>Нет данных аналитики</p>
			<a href="/stories" class="btn btn-primary">К списку Stories</a>
		</div>
	{/if}
</div>

<style>
	.analytics-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.back-link {
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: #374151;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
	}

	.period-selector {
		display: flex;
		gap: 0.5rem;
		background: white;
		padding: 0.25rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.period-btn {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.period-btn:hover {
		background: #f3f4f6;
	}

	.period-btn.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.alert-error {
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-icon {
		font-size: 1.5rem;
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* Sections */
	.section {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section h2 {
		margin: 0 0 1.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
	}

	/* Highlights Table */
	.highlights-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #e5e7eb;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
		color: #374151;
	}

	tr:hover {
		background: #f9fafb;
	}

	tr.selected {
		background: #f3f4f6;
	}

	.highlight-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.highlight-thumb {
		width: 40px;
		height: 40px;
		border-radius: 0.5rem;
		object-fit: cover;
	}

	.highlight-thumb.placeholder {
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-details {
		background: none;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.25rem;
	}

	/* Detail Row */
	.detail-row td {
		padding: 0;
		background: #f9fafb;
	}

	.detail-loading,
	.detail-empty {
		padding: 1.5rem;
		text-align: center;
		color: #6b7280;
	}

	.highlight-detail {
		padding: 1.5rem;
	}

	.detail-stats {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.detail-stat {
		display: flex;
		flex-direction: column;
	}

	.detail-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.detail-label {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.items-analytics h4 {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.item-stat {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.item-index {
		width: 24px;
		height: 24px;
		background: #e5e7eb;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
	}

	.item-bar-container {
		flex: 1;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
	}

	.item-bar {
		height: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 4px;
		min-width: 4px;
	}

	.item-views {
		width: 50px;
		text-align: right;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.item-completion {
		width: 50px;
		text-align: right;
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* All Highlights */
	.all-highlights {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.highlight-card {
		width: 100px;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.highlight-card:hover {
		transform: translateY(-2px);
	}

	.highlight-card.inactive {
		opacity: 0.5;
	}

	.highlight-cover {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		overflow: hidden;
		margin: 0 auto 0.5rem;
		background: #f3f4f6;
	}

	.highlight-cover img {
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
	}

	.highlight-info {
		text-align: center;
	}

	.highlight-title {
		font-size: 0.75rem;
		color: #374151;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.inactive-badge {
		font-size: 0.625rem;
		color: #9ca3af;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem;
	}

	.empty-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}

	.empty-state p {
		margin: 0 0 0.5rem 0;
		color: #6b7280;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.btn {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		margin-top: 1rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
		}

		.period-selector {
			width: 100%;
			justify-content: center;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.detail-stats {
			flex-wrap: wrap;
			gap: 1rem;
		}

		.detail-stat {
			min-width: calc(50% - 0.5rem);
		}
	}

	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: 1rem;
		}

		.section {
			padding: 1rem;
		}
	}
</style>
