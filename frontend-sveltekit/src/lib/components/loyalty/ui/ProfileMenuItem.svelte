<script lang="ts">
  import { goto } from '$app/navigation';
  import { modalStore, type ModalType } from '$lib/stores/modal.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';

  interface ProfileMenuItemData {
    id: string;
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    action: string | null;
    href?: string;
  }

  interface Props {
    item: ProfileMenuItemData;
  }

  let { item }: Props = $props();

  function handleClick() {
    if (item.action === 'link' && item.href) {
      goto(item.href);
    } else if (item.action === 'alert') {
      // M-001 FIX: Added phone number to support message
      toastStore.show('Свяжитесь с нами: +7 (495) 123-45-67 или support@murzico.ru', 'info');
    } else if (item.action === 'openPetsModal') {
      modalStore.open('pets');
    } else if (item.action === 'openNotificationsModal') {
      modalStore.open('notifications');
    } else if (item.action === 'openPaymentModal') {
      modalStore.open('payment');
    } else if (item.id === 'referral') {
      modalStore.open('referral');
    }
  }
</script>

<button class="profile-menu-item" onclick={handleClick}>
  <div class="profile-menu-item-content">
    <div class="profile-menu-item-icon icon-{item.iconColor}">
      <span>{item.icon}</span>
    </div>
    <div class="profile-menu-item-text">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  </div>
</button>

<style>
  .profile-menu-item {
    width: 100%;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: block;
    text-align: left;
  }

  .profile-menu-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-orange);
  }

  .profile-menu-item:active {
    transform: translateY(0);
  }

  .profile-menu-item-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .profile-menu-item-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  .icon-orange {
    background: rgba(255, 107, 0, 0.1);
    color: var(--primary-orange);
  }

  .icon-blue {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .icon-green {
    background: rgba(34, 197, 94, 0.1);
    color: var(--secondary-green);
  }

  .icon-purple {
    background: rgba(168, 85, 247, 0.1);
    color: #a855f7;
  }

  .icon-pink {
    background: rgba(236, 72, 153, 0.1);
    color: #ec4899;
  }

  .profile-menu-item-text {
    flex: 1;
  }

  .profile-menu-item-text h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
  }

  .profile-menu-item-text p {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
  }

  @media (max-width: 480px) {
    .profile-menu-item {
      padding: 14px;
    }

    .profile-menu-item-icon {
      width: 44px;
      height: 44px;
      font-size: 22px;
    }

    .profile-menu-item-text h3 {
      font-size: 15px;
    }

    .profile-menu-item-text p {
      font-size: 12px;
    }
  }
</style>
