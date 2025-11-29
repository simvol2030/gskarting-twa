<script lang="ts">
  import type { Offer } from '$lib/types/loyalty';

  interface Props {
    offer: Offer;
    expanded: boolean;
    onToggle: () => void;
  }

  let { offer, expanded, onToggle }: Props = $props();
</script>

<div class="offer-item">
  <button class="list-item" onclick={onToggle}>
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
      <p class="offer-description-short">{offer.description.substring(0, 80)}...</p>
      <div class="offer-deadline">
        <span class="deadline-icon">⏱️</span>
        <span class="deadline-text">До {offer.deadline}</span>
      </div>
    </div>

    <div class="expand-icon" class:rotated={expanded}>
      <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
      </svg>
    </div>
  </button>

  <!-- Expanded details section (Sprint 2 simplified) -->
  <div class="offer-details" class:expanded>
    <div class="offer-details-content">
      <h4>Подробности акции</h4>
      <p class="offer-description-full">{offer.description}</p>
    </div>
  </div>
</div>

<style>
  .offer-item {
    margin-bottom: 12px;
  }

  .list-item {
    background: var(--card-bg);
    border-radius: 20px;
    padding: 0;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    text-align: left;
    overflow: hidden;
    display: flex;
    gap: 0;
  }

  .list-item:hover {
    background: var(--card-hover);
    box-shadow: var(--shadow-lg);
  }

  .offer-thumbnail {
    width: 120px;
    height: 120px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .offer-thumbnail-placeholder {
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, var(--primary-orange), var(--primary-orange-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .placeholder-icon {
    font-size: 40px;
    opacity: 0.8;
  }

  .offer-content {
    flex: 1;
    padding: 16px;
    min-width: 0;
  }

  .offer-title {
    font-weight: bold;
    color: var(--text-primary);
    font-size: 16px;
    letter-spacing: -0.025em;
    margin: 0 0 6px 0;
  }

  .offer-description-short {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    margin: 0 0 8px 0;
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

  .expand-icon {
    width: 48px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: transform 0.3s ease;
    flex-shrink: 0;
    background: var(--bg-light);
  }

  .expand-icon.rotated {
    transform: rotate(180deg);
  }

  .offer-details {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;
  }

  .offer-details.expanded {
    max-height: 600px;
  }

  .offer-details-content {
    background: var(--bg-tertiary);
    padding: 20px;
    border-top: 1px solid var(--border-color);
  }

  .offer-details-content h4 {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-primary);
    margin: 0 0 12px 0;
  }

  .offer-description-full {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  @media (max-width: 480px) {
    .list-item {
      flex-direction: column;
    }

    .offer-thumbnail,
    .offer-thumbnail-placeholder {
      width: 100%;
      height: 160px;
    }

    .expand-icon {
      width: 100%;
      height: 40px;
    }
  }
</style>
