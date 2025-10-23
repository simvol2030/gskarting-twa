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
    <div class="list-item-content">
      <div class="list-item-icon icon-{offer.iconColor}">
        <span>{offer.icon}</span>
      </div>
      <div class="list-item-text">
        <h3>{offer.title}</h3>
        <p>{offer.description}</p>
        <div class="list-item-meta {offer.deadlineClass}">{offer.deadline}</div>
      </div>
      <div class="expand-icon" class:rotated={expanded}>
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </div>
    </div>
  </button>

  <div class="offer-details" class:expanded>
    <div class="offer-details-content">
      <h4>Подробности акции</h4>
      <p class="offer-description">{offer.details}</p>
      <h5>Условия:</h5>
      <ul class="offer-conditions">
        {#each offer.conditions as condition}
          <li>{condition}</li>
        {/each}
      </ul>
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
    padding: 20px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    text-align: left;
  }

  .list-item:hover {
    background: var(--card-hover);
    transform: translateX(4px);
    box-shadow: var(--shadow-lg);
  }

  .list-item-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .list-item-icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    box-shadow: var(--shadow);
    flex-shrink: 0;
  }

  .icon-green {
    background: linear-gradient(135deg, var(--secondary-green), var(--secondary-green-dark));
  }

  .icon-orange {
    background: linear-gradient(135deg, var(--primary-orange), var(--primary-orange-dark));
  }

  .icon-blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  .icon-purple {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  }

  .icon-pink {
    background: linear-gradient(135deg, #ec4899, #db2777);
  }

  .list-item-text {
    flex: 1;
  }

  .list-item-text h3 {
    font-weight: bold;
    color: var(--text-primary);
    font-size: 16px;
    letter-spacing: -0.025em;
    margin-bottom: 4px;
  }

  .list-item-text p {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
  }

  .list-item-meta {
    color: var(--secondary-green);
    font-weight: bold;
    font-size: 13px;
    margin-top: 6px;
  }

  .list-item-meta.orange {
    color: var(--primary-orange);
  }

  .expand-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: transform 0.3s ease;
    flex-shrink: 0;
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
    border-radius: 0 0 20px 20px;
    padding: 20px;
    margin-top: -12px;
    border: 1px solid var(--border-color);
    border-top: none;
  }

  .offer-details-content h4 {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 12px;
  }

  .offer-details-content h5 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-top: 16px;
    margin-bottom: 8px;
  }

  .offer-description {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .offer-conditions {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .offer-conditions li {
    font-size: 13px;
    color: var(--text-secondary);
    padding: 8px 12px;
    background: var(--card-bg);
    border-radius: 8px;
    margin-bottom: 6px;
    border-left: 3px solid var(--primary-orange);
    line-height: 1.4;
  }

  .offer-conditions li:before {
    content: '✓';
    color: var(--secondary-green);
    font-weight: bold;
    margin-right: 8px;
  }
</style>
