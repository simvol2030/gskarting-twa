<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { page } from '$app/stores';
  import { initTheme } from '$lib/stores/loyalty';
  import { initTelegramWebApp } from '$lib/telegram';
  import Header from '$lib/components/loyalty/layout/Header.svelte';
  import BottomNav from '$lib/components/loyalty/layout/BottomNav.svelte';
  import MobileMenu from '$lib/components/loyalty/layout/MobileMenu.svelte';
  import QRModal from '$lib/components/loyalty/ui/QRModal.svelte';
  import favicon from '$lib/assets/favicon.svg';
  import '$lib/styles/themes.css';
  import '$lib/styles/loyalty.css';

  let { children, data } = $props();

  // Check if current route is loyalty app (not admin routes)
  const isLoyaltyApp = $derived(!$page.url.pathname.startsWith('/dashboard') &&
                                !$page.url.pathname.startsWith('/users') &&
                                !$page.url.pathname.startsWith('/posts') &&
                                !$page.url.pathname.startsWith('/settings') &&
                                !$page.url.pathname.startsWith('/login') &&
                                !$page.url.pathname.startsWith('/logout'));

  let menuOpen = $state(false);
  let qrModalOpen = $state(false);

  function openMenu() {
    menuOpen = true;
  }

  function closeMenu() {
    menuOpen = false;
  }

  function openQRModal() {
    qrModalOpen = true;
  }

  function closeQRModal() {
    qrModalOpen = false;
  }

  // Set context so child components can access openQRModal
  setContext('openQRModal', openQRModal);

  onMount(() => {
    if (isLoyaltyApp) {
      // Initialize theme
      initTheme();

      // Initialize Telegram Web App
      initTelegramWebApp();
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  {#if isLoyaltyApp}
    <title>Мурзико - Программа лояльности</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#ff6b00" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
  {/if}
</svelte:head>

{#if isLoyaltyApp}
  <div class="app-container">
    <Header onMenuClick={openMenu} />
    <MobileMenu open={menuOpen} onClose={closeMenu} />

    <main class="content">
      {@render children?.()}
    </main>

    <BottomNav />

    {#if data?.user && qrModalOpen}
      <QRModal
        cardNumber={data.user.cardNumber}
        balance={data.user.balance}
        open={qrModalOpen}
        onClose={closeQRModal}
      />
    {/if}
  </div>
{:else}
  {@render children?.()}
{/if}

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg-white);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-white);
    -webkit-overflow-scrolling: touch;
    margin-top: calc(64px + env(safe-area-inset-top));
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
</style>
