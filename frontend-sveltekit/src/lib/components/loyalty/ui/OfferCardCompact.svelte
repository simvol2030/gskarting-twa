<script lang="ts">
  import type { Offer } from '$lib/types/loyalty';

  interface Props {
    offer: Offer;
  }

  let { offer }: Props = $props();
</script>

<a href="/offers" class="offer-item">
  <div class="list-item-content">
    <div class="list-item-icon icon-{offer.iconColor}">
      <span>{offer.icon}</span>
    </div>
    <div class="list-item-text">
      <h3>{offer.title}</h3>
      <p>{offer.description}</p>
      <div class="list-item-meta {offer.deadlineClass}">{offer.deadline}</div>
    </div>
  </div>
</a>

<style>
  .offer-item {
    background: var(--card-bg);
    border-radius: 20px;
    padding: 20px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: block;
  }

  .offer-item:hover {
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
</style>
