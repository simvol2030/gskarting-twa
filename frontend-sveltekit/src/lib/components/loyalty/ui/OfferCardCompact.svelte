<script lang="ts">
  import type { Offer } from '$lib/types/loyalty';

  interface Props {
    offer: Offer;
  }

  let { offer }: Props = $props();
</script>

<a href="/offers" class="offer-item">
  <!-- Image thumbnail (Sprint 2 NEW) -->
  {#if offer.image}
    <img src={offer.image} alt={offer.title} class="offer-thumbnail" />
  {:else}
    <!-- Fallback for old data -->
    <div class="offer-thumbnail-placeholder">
      <span class="placeholder-icon">🎁</span>
    </div>
  {/if}

  <div class="offer-content">
    <h3 class="offer-title">{offer.title}</h3>
    <p class="offer-description">{offer.description}</p>
    <div class="offer-deadline">
      <span class="deadline-icon">⏱️</span>
      <span class="deadline-text">До {offer.deadline}</span>
    </div>
  </div>
</a>

<style>
  .offer-item {
    background: var(--card-bg);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: block;
  }

  .offer-item:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .offer-thumbnail {
    width: 100%;
    height: 140px;
    object-fit: cover;
    display: block;
  }

  .offer-thumbnail-placeholder {
    width: 100%;
    height: 140px;
    background: linear-gradient(135deg, var(--primary-orange), var(--primary-orange-dark));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-icon {
    font-size: 48px;
    opacity: 0.8;
  }

  .offer-content {
    padding: 16px;
  }

  .offer-title {
    font-weight: bold;
    color: var(--text-primary);
    font-size: 16px;
    letter-spacing: -0.025em;
    margin: 0 0 6px 0;
  }

  .offer-description {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    margin: 0 0 10px 0;
    /* Limit to 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .offer-deadline {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: var(--bg-light);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .deadline-icon {
    font-size: 14px;
  }
</style>
