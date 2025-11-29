<script lang="ts">
  import type { Recommendation } from '$lib/types/loyalty';

  interface Props {
    recommendation: Recommendation;
  }

  let { recommendation }: Props = $props();
</script>

<div class="recommendation-card">
  <div class="recommendation-icon">
    <img src={recommendation.image} alt={recommendation.name} />
  </div>

  <div class="recommendation-content">
    <h4>{recommendation.name}</h4>
    <!-- CRITICAL FIX #2 (Sprint 3): Price removed - recommendations БЕЗ ЦЕНЫ -->
    {#if recommendation.description}
      <p class="recommendation-description">{recommendation.description}</p>
    {/if}
  </div>
</div>

<style>
  .recommendation-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 16px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: fadeIn 0.5s ease-out;
  }

  .recommendation-card:hover {
    background: var(--card-hover);
    transform: translateX(4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-orange);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .recommendation-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--bg-light);
    overflow: hidden;
  }

  .recommendation-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .recommendation-content {
    flex: 1;
    min-width: 0;
  }

  .recommendation-content h4 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
  }

  .recommendation-description {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
    /* Limit to 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 480px) {
    .recommendation-card {
      padding: 12px;
    }

    .recommendation-icon {
      width: 48px;
      height: 48px;
    }

    .recommendation-content h4 {
      font-size: 14px;
    }

    .recommendation-description {
      font-size: 12px;
    }
  }
</style>
