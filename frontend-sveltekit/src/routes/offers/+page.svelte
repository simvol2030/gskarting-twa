<script lang="ts">
  import Header from '$lib/components/loyalty/layout/Header.svelte';
  import MobileMenu from '$lib/components/loyalty/layout/MobileMenu.svelte';
  import OfferCard from '$lib/components/loyalty/ui/OfferCard.svelte';

  let { data } = $props();
  let menuOpen = $state(false);
  let expandedOffers = $state<Record<number, boolean>>({});

  function openMenu() {
    menuOpen = true;
  }

  function closeMenu() {
    menuOpen = false;
  }

  function toggleOffer(id: number) {
    expandedOffers = { ...expandedOffers, [id]: !expandedOffers[id] };
  }
</script>

<div class="app-container">
  <Header onMenuClick={openMenu} />
  <MobileMenu open={menuOpen} onClose={closeMenu} />

  <main class="content">
    <section class="section-content">
      <h2 class="section-header">
        <span>🎁</span>
        <span>Акции и предложения</span>
      </h2>
      <div class="offers-list">
        {#each data.offers as offer}
          <OfferCard
            {offer}
            expanded={!!expandedOffers[offer.id]}
            onToggle={() => toggleOffer(offer.id)}
          />
        {/each}
      </div>
    </section>
  </main>
</div>

<style>
  .content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-white);
    -webkit-overflow-scrolling: touch;
    margin-top: calc(64px + env(safe-area-inset-top));
    padding-bottom: 24px;
  }

  .section-content {
    padding: 16px;
    margin-bottom: 24px;
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
  }

  .offers-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (max-width: 480px) {
    .section-content {
      padding: 12px;
    }
  }
</style>
