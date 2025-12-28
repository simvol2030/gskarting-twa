<script lang="ts">
	import type { Slide } from './types';
	import ProductCard from './ProductCard.svelte';

	let { slide }: { slide: Slide } = $props();
</script>

<div class="slide-products">
	<div class="products-grid">
		{#each slide.items as product (product.id)}
			<ProductCard {product} />
		{/each}
	</div>
</div>

<style>
	.slide-products {
		width: 100%;
		height: 100%;
		padding: 20px;
		display: flex;
		flex-direction: column;
	}

	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		grid-template-rows: repeat(2, 1fr);
		grid-auto-rows: 0; /* Скрыть лишние ряды */
		gap: 1rem;
		flex: 1;
		overflow: hidden; /* Обрезать выходящие за пределы */
		align-content: start;
	}

	/* Для больших экранов TV - ограничиваем ширину колонок */
	@media (min-width: 1400px) {
		.products-grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	/* Для очень больших экранов - больше колонок */
	@media (min-width: 1920px) {
		.products-grid {
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1.25rem;
		}
	}
</style>
