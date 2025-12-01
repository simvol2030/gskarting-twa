<script lang="ts">
	interface Props {
		images: { id: number; url: string }[];
		baseUrl?: string;
	}

	let { images, baseUrl = '' }: Props = $props();

	let currentIndex = $state(0);
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let isDragging = $state(false);

	function goTo(index: number) {
		if (index < 0) {
			currentIndex = images.length - 1;
		} else if (index >= images.length) {
			currentIndex = 0;
		} else {
			currentIndex = index;
		}
	}

	function prev(e?: Event) {
		e?.stopPropagation();
		goTo(currentIndex - 1);
	}

	function next(e?: Event) {
		e?.stopPropagation();
		goTo(currentIndex + 1);
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		isDragging = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging) return;
		touchEndX = e.touches[0].clientX;
	}

	function handleTouchEnd() {
		if (!isDragging) return;
		isDragging = false;

		const diff = touchStartX - touchEndX;
		const threshold = 50; // Minimum swipe distance

		if (Math.abs(diff) > threshold) {
			if (diff > 0) {
				next(); // Swipe left - go next
			} else {
				prev(); // Swipe right - go prev
			}
		}

		touchStartX = 0;
		touchEndX = 0;
	}

	// Mouse drag support
	function handleMouseDown(e: MouseEvent) {
		touchStartX = e.clientX;
		isDragging = true;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		touchEndX = e.clientX;
	}

	function handleMouseUp() {
		if (!isDragging) return;
		isDragging = false;

		const diff = touchStartX - touchEndX;
		const threshold = 50;

		if (Math.abs(diff) > threshold) {
			if (diff > 0) {
				next();
			} else {
				prev();
			}
		}

		touchStartX = 0;
		touchEndX = 0;
	}

	function handleMouseLeave() {
		isDragging = false;
	}
</script>

{#if images.length > 0}
	<div class="slider-container">
		<div
			class="slider"
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseLeave}
			role="region"
			aria-label="Галерея изображений"
		>
			<div class="slider-track" style="transform: translateX(-{currentIndex * 100}%)">
				{#each images as image (image.id)}
					<div class="slide">
						<img src="{baseUrl}{image.url}" alt="Фото магазина" draggable="false" />
					</div>
				{/each}
			</div>

			<!-- Navigation Arrows -->
			{#if images.length > 1}
				<button
					class="nav-btn prev"
					onclick={prev}
					onmousedown={(e) => e.stopPropagation()}
					onmouseup={(e) => e.stopPropagation()}
					aria-label="Предыдущее фото"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</button>
				<button
					class="nav-btn next"
					onclick={next}
					onmousedown={(e) => e.stopPropagation()}
					onmouseup={(e) => e.stopPropagation()}
					aria-label="Следующее фото"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6" />
					</svg>
				</button>
			{/if}
		</div>

		<!-- Dots Navigation -->
		{#if images.length > 1}
			<div class="dots">
				{#each images as _, i}
					<button
						class="dot"
						class:active={i === currentIndex}
						onclick={() => goTo(i)}
						aria-label="Перейти к фото {i + 1}"
					></button>
				{/each}
			</div>
		{/if}

		<!-- Counter -->
		{#if images.length > 1}
			<div class="counter">{currentIndex + 1} / {images.length}</div>
		{/if}
	</div>
{/if}

<style>
	.slider-container {
		position: relative;
		width: 100%;
		margin-bottom: 12px;
	}

	.slider {
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 12px;
		background: #f3f4f6;
		cursor: grab;
		user-select: none;
	}

	.slider:active {
		cursor: grabbing;
	}

	.slider-track {
		display: flex;
		transition: transform 0.3s ease-out;
	}

	.slide {
		flex-shrink: 0;
		width: 100%;
	}

	.slide img {
		width: 100%;
		aspect-ratio: 16 / 10;
		object-fit: cover;
		display: block;
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transition: all 0.2s;
		z-index: 10;
		color: #374151;
	}

	.nav-btn:hover {
		background: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.nav-btn:active {
		transform: translateY(-50%) scale(0.95);
	}

	.nav-btn.prev {
		left: 8px;
	}

	.nav-btn.next {
		right: 8px;
	}

	.dots {
		display: flex;
		justify-content: center;
		gap: 6px;
		margin-top: 10px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #d1d5db;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s;
	}

	.dot.active {
		background: var(--primary-orange, #f97316);
		width: 20px;
		border-radius: 4px;
	}

	.dot:hover:not(.active) {
		background: #9ca3af;
	}

	.counter {
		position: absolute;
		bottom: 8px;
		right: 8px;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	@media (max-width: 480px) {
		.nav-btn {
			width: 32px;
			height: 32px;
		}

		.nav-btn svg {
			width: 20px;
			height: 20px;
		}
	}
</style>
