<script lang="ts">
  import { toastStore } from '$lib/stores/toast.svelte';

  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
</script>

<div class="toast-container">
  {#each toastStore.items as toast (toast.id)}
    <div class="toast toast-{toast.type}" role="alert">
      <span class="toast-icon">{iconMap[toast.type]}</span>
      <span class="toast-message">{toast.message}</span>
      <button
        class="toast-close"
        onclick={() => toastStore.remove(toast.id)}
        aria-label="Закрыть уведомление"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 400px;
  }

  .toast {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideInRight 0.3s ease;
    border-left: 4px solid;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-success {
    border-left-color: var(--secondary-green);
  }

  .toast-error {
    border-left-color: #ef4444;
  }

  .toast-info {
    border-left-color: var(--primary-orange);
  }

  .toast-warning {
    border-left-color: #f59e0b;
  }

  .toast-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
    color: var(--text-primary);
    font-size: 14px;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  @media (max-width: 480px) {
    .toast-container {
      top: 12px;
      right: 12px;
      left: 12px;
      max-width: none;
    }

    .toast {
      padding: 12px;
    }

    .toast-icon {
      font-size: 18px;
    }

    .toast-message {
      font-size: 13px;
    }
  }
</style>
