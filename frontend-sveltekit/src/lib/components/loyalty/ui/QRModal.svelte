<script lang="ts">
  import { formatNumber } from '$lib/telegram';
  import { browser } from '$app/environment';

  interface Props {
    cardNumber: string;
    balance: number;
    open: boolean;
    onClose: () => void;
  }

  let { cardNumber, balance, open, onClose }: Props = $props();

  $effect(() => {
    if (!browser) return;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="modal-overlay"
  class:show={open}
  onclick={handleOverlayClick}
  onkeydown={(e) => e.key === 'Enter' && handleOverlayClick(e as any)}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div class="modal-content">
    <div class="modal-header">
      <h2 class="modal-title">Карта лояльности</h2>
      <button class="close-button" onclick={onClose} aria-label="Закрыть">
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>
    </div>

    <div class="qr-container">
      <div class="qr-frame">
        <img src="/qr-code.png" alt="QR Code" class="qr-large" />
      </div>

      <div class="balance-info">
        <p>Ваш баланс</p>
        <div class="amount">{formatNumber(balance)}</div>
        <p>Мурзи-коинов ≈ {formatNumber(Math.round(balance / 10))} ₽</p>
      </div>

      <p style="color: var(--text-secondary); font-size: 13px; margin-top: 12px;">
        Карта № {cardNumber}
      </p>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(5px);
  }

  .modal-overlay.show {
    opacity: 1;
    pointer-events: all;
  }

  .modal-content {
    background: var(--card-bg);
    border-radius: 24px;
    padding: 32px;
    margin: 16px;
    max-width: 360px;
    width: 100%;
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .modal-overlay.show .modal-content {
    transform: scale(1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .modal-title {
    font-size: 20px;
    font-weight: bold;
    color: var(--text-primary);
  }

  .close-button {
    width: 36px;
    height: 36px;
    background: var(--bg-tertiary);
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: var(--bg-light);
    transform: rotate(90deg);
  }

  .qr-container {
    text-align: center;
  }

  .qr-frame {
    background: #ffffff;
    border: 4px solid var(--border-color);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .qr-large {
    width: 192px;
    height: 192px;
    margin: 0 auto;
    display: block;
    background: #ffffff;
    border-radius: 8px;
  }

  .balance-info {
    background: var(--bg-tertiary);
    border-radius: 16px;
    padding: 16px;
  }

  .balance-info p:first-child {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .balance-info .amount {
    font-size: 32px;
    font-weight: bold;
    background: linear-gradient(135deg, var(--primary-orange), var(--secondary-green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .balance-info p:last-child {
    color: var(--text-secondary);
    font-size: 13px;
    margin-top: 4px;
  }
</style>
