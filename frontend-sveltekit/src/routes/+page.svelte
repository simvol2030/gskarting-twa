<script lang="ts">
  import LoyaltyCard from '$lib/components/loyalty/ui/LoyaltyCard.svelte';
  import RecommendationCard from '$lib/components/loyalty/ui/RecommendationCard.svelte';
  import OfferCardCompact from '$lib/components/loyalty/ui/OfferCardCompact.svelte';
  import ProductCard from '$lib/components/loyalty/ui/ProductCard.svelte';

  let { data } = $props();
</script>

<!-- 1. Карта лояльности -->
<LoyaltyCard user={data.user} loyaltyRules={data.loyaltyRules} />

<!-- 2. Акции месяца -->
<section class="section-content">
  <div class="section-header-with-link">
    <h2 class="section-header">
      <span>🎉</span>
      <span>Акции месяца</span>
    </h2>
    <a href="/offers" class="see-all">Все акции →</a>
  </div>
  <div class="offers-list">
    {#each data.monthOffers as offer}
      <OfferCardCompact {offer} />
    {/each}
  </div>
</section>

<!-- 3. Топовые товары -->
<section class="section-content">
  <div class="section-header-with-link">
    <h2 class="section-header">
      <span>⭐</span>
      <span>Топовые товары</span>
    </h2>
    <a href="/products" class="see-all">Все товары →</a>
  </div>
  <div class="products-grid">
    {#each data.topProducts as product}
      <ProductCard {product} />
    {/each}
  </div>
</section>

<!-- 4. Рекомендации для вашего питомца -->
<section class="section-content">
  <h2 class="section-header">
    <span>🐾</span>
    <span>Рекомендации для вашего питомца</span>
  </h2>
  <div class="recommendations-list">
    {#each data.recommendations as recommendation}
      <RecommendationCard {recommendation} />
    {/each}
  </div>
</section>

<style>
  .section-content {
    padding: 0 16px;
    margin-bottom: 24px;
  }

  .section-header-with-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-header {
    font-size: 20px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 16px;
    letter-spacing: -0.025em;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  .see-all {
    font-size: 14px;
    color: var(--primary-orange);
    text-decoration: none;
    font-weight: 600;
    transition: opacity 0.2s;
    white-space: nowrap;
  }

  .see-all:hover {
    opacity: 0.8;
  }

  .offers-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (max-width: 480px) {
    .section-content {
      padding: 0 12px;
    }

    .products-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
