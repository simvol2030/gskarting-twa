<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { StoryHighlight, StoryItem } from '$lib/api/stories';
	import { recordView, getSessionId } from '$lib/api/stories';

	// Props
	let {
		highlights,
		activeHighlightIndex,
		userId = null,
		onClose,
		onNext,
		onPrev,
		onGoTo
	}: {
		highlights: StoryHighlight[];
		activeHighlightIndex: number;
		userId?: number | null;
		onClose: () => void;
		onNext: () => void;
		onPrev: () => void;
		onGoTo?: (index: number) => void;
	} = $props();

	// State
	let currentItemIndex = $state(0);
	let progress = $state(0);
	let paused = $state(false);
	let videoElement = $state<HTMLVideoElement | null>(null);
	let viewStartTime = $state(Date.now());

	// Computed
	let currentHighlight = $derived(highlights[activeHighlightIndex]);
	let currentItem = $derived(currentHighlight?.items[currentItemIndex]);
	let itemsCount = $derived(currentHighlight?.items.length || 0);
	let duration = $derived(currentItem?.type === 'video' ? (currentItem.duration || 15) * 1000 : (currentItem?.duration || 5) * 1000);

	// Progress timer
	let progressInterval: ReturnType<typeof setInterval> | null = null;

	function startProgress() {
		progress = 0;
		viewStartTime = Date.now();

		if (progressInterval) {
			clearInterval(progressInterval);
		}

		progressInterval = setInterval(() => {
			if (!paused) {
				progress += 50;
				if (progress >= duration) {
					goToNextItem();
				}
			}
		}, 50);
	}

	function stopProgress() {
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
	}

	function goToNextItem() {
		recordCurrentView(true);

		if (currentItemIndex < itemsCount - 1) {
			currentItemIndex++;
			startProgress();
		} else {
			onNext();
		}
	}

	function goToPrevItem() {
		recordCurrentView(false);

		if (progress > duration * 0.2) {
			// Restart current item if past 20%
			startProgress();
		} else if (currentItemIndex > 0) {
			currentItemIndex--;
			startProgress();
		} else {
			onPrev();
			currentItemIndex = 0;
		}
	}

	async function recordCurrentView(completed: boolean) {
		if (!currentItem) return;

		const viewDuration = (Date.now() - viewStartTime) / 1000;

		try {
			await recordView({
				storyItemId: currentItem.id,
				userId,
				sessionId: getSessionId(),
				viewDuration,
				completed
			});
		} catch (err) {
			console.error('Failed to record view:', err);
		}
	}

	async function handleLinkClick() {
		if (!currentItem?.linkUrl) return;

		try {
			await recordView({
				storyItemId: currentItem.id,
				userId,
				sessionId: getSessionId(),
				viewDuration: (Date.now() - viewStartTime) / 1000,
				completed: false,
				linkClicked: true
			});
		} catch (err) {
			console.error('Failed to record link click:', err);
		}

		window.open(currentItem.linkUrl, '_blank');
	}

	function handleTouchStart(e: TouchEvent | MouseEvent) {
		paused = true;
	}

	function handleTouchEnd(e: TouchEvent | MouseEvent) {
		paused = false;
	}

	function handleTap(e: MouseEvent | TouchEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();

		let clientX: number;
		if ('touches' in e) {
			clientX = e.changedTouches[0].clientX;
		} else {
			clientX = e.clientX;
		}

		const tapPosition = (clientX - rect.left) / rect.width;

		if (tapPosition < 0.3) {
			goToPrevItem();
		} else if (tapPosition > 0.7) {
			goToNextItem();
		}
	}

	// Handle keyboard navigation
	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowLeft':
				goToPrevItem();
				break;
			case 'ArrowRight':
				goToNextItem();
				break;
			case 'Escape':
				onClose();
				break;
			case ' ':
				paused = !paused;
				e.preventDefault();
				break;
		}
	}

	// Reset item index when highlight changes
	$effect(() => {
		if (activeHighlightIndex >= 0) {
			currentItemIndex = 0;
			startProgress();
		}
	});

	// Handle video playback
	$effect(() => {
		if (videoElement && currentItem?.type === 'video') {
			if (paused) {
				videoElement.pause();
			} else {
				videoElement.play().catch(() => {});
			}
		}
	});

	onMount(() => {
		// Note: startProgress is called by $effect when activeHighlightIndex changes
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		stopProgress();
		window.removeEventListener('keydown', handleKeydown);
		recordCurrentView(false);
	});
</script>

<div class="story-viewer">
	<div class="viewer-backdrop" onclick={onClose}></div>

	<div class="viewer-container">
		<!-- Progress bars -->
		<div class="progress-bars">
			{#each currentHighlight?.items || [] as item, index}
				<div class="progress-bar">
					<div
						class="progress-fill"
						class:completed={index < currentItemIndex}
						class:active={index === currentItemIndex}
						style={index === currentItemIndex ? `width: ${(progress / duration) * 100}%` : ''}
					></div>
				</div>
			{/each}
		</div>

		<!-- Header -->
		<div class="viewer-header">
			<div class="highlight-info">
				<div class="highlight-avatar">
					{#if currentHighlight?.coverImage}
						<img src={currentHighlight.coverImage} alt="" />
					{:else}
						<span>📷</span>
					{/if}
				</div>
				<span class="highlight-title">{currentHighlight?.title}</span>
			</div>
			<button class="close-btn" onclick={onClose}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div
			class="viewer-content"
			role="button"
			tabindex="0"
			onmousedown={handleTouchStart}
			onmouseup={handleTouchEnd}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
			onclick={handleTap}
		>
			{#if currentItem}
				{#if currentItem.type === 'photo'}
					<img
						src={currentItem.mediaUrl}
						alt=""
						class="story-media"
						draggable="false"
					/>
				{:else if currentItem.type === 'video'}
					<video
						bind:this={videoElement}
						src={currentItem.mediaUrl}
						class="story-media"
						autoplay
						playsinline
						muted
						loop={false}
					>
						<track kind="captions" />
					</video>
				{/if}
			{/if}
		</div>

		<!-- Link button -->
		{#if currentItem?.linkUrl}
			<div class="link-overlay">
				<button class="link-btn" onclick={handleLinkClick}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M7 17L17 7M17 7H7M17 7v10" />
					</svg>
					{currentItem.linkText || 'Подробнее'}
				</button>
			</div>
		{/if}

		<!-- Navigation hints -->
		<div class="nav-hint left"></div>
		<div class="nav-hint right"></div>

		<!-- Highlight navigation (for multiple highlights) -->
		{#if highlights.length > 1}
			<div class="highlight-nav">
				{#each highlights as h, index}
					<button
						class="highlight-dot"
						class:active={index === activeHighlightIndex}
						onclick={() => onGoTo?.(index)}
					></button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.story-viewer {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.viewer-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.95);
	}

	.viewer-container {
		position: relative;
		width: 100%;
		max-width: 420px;
		height: 100%;
		max-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #000;
	}

	@media (min-width: 768px) {
		.viewer-container {
			height: 90vh;
			max-height: 800px;
			border-radius: 1rem;
			overflow: hidden;
		}
	}

	/* Progress bars */
	.progress-bars {
		display: flex;
		gap: 4px;
		padding: 8px 12px;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
	}

	.progress-bar {
		flex: 1;
		height: 3px;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: white;
		width: 0;
		transition: width 50ms linear;
	}

	.progress-fill.completed {
		width: 100%;
	}

	/* Header */
	.viewer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2.5rem 12px 8px;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
	}

	.highlight-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.highlight-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		overflow: hidden;
		background: #333;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid white;
	}

	.highlight-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.highlight-title {
		color: white;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.close-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.close-btn svg {
		width: 20px;
		height: 20px;
	}

	/* Content */
	.viewer-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
	}

	.story-media {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}

	/* Link button */
	.link-overlay {
		position: absolute;
		bottom: 60px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		z-index: 10;
	}

	.link-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 24px;
		background: white;
		border: none;
		border-radius: 2rem;
		color: #111;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}

	.link-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
	}

	.link-btn:active {
		transform: scale(0.98);
	}

	.link-btn svg {
		width: 18px;
		height: 18px;
	}

	/* Navigation hints */
	.nav-hint {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 30%;
		z-index: 5;
	}

	.nav-hint.left {
		left: 0;
	}

	.nav-hint.right {
		right: 0;
	}

	/* Highlight navigation dots */
	.highlight-nav {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 6px;
		z-index: 10;
	}

	.highlight-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.4);
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		padding: 0;
	}

	.highlight-dot.active {
		background: white;
		transform: scale(1.2);
	}

	.highlight-dot:hover {
		background: rgba(255, 255, 255, 0.7);
	}
</style>
