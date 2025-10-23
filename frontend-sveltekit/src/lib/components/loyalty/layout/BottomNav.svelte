<script lang="ts">
  import { page } from '$app/stores';

  const navItems = [
    {
      href: '/',
      label: 'Главная',
      icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'
    },
    {
      href: '/offers',
      label: 'Акции',
      icon: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z'
    },
    {
      href: '/stores',
      label: 'Магазины',
      icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
    },
    {
      href: '/history',
      label: 'Бонусы',
      icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z'
    },
    {
      href: '/profile',
      label: 'Профиль',
      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
    }
  ];

  function isActive(href: string): boolean {
    if (href === '/') {
      return $page.url.pathname === '/';
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<nav class="bottom-nav">
  <div class="nav-container">
    {#each navItems as item}
      <a
        href={item.href}
        class="nav-item"
        class:active={isActive(item.href)}
        aria-label={item.label}
      >
        <svg class="nav-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d={item.icon} />
        </svg>
        <span class="nav-label">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-white);
    border-top: 1px solid var(--border-color);
    padding: 8px 4px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
    box-shadow: 0 -10px 30px -10px rgba(0, 0, 0, 0.1);
    z-index: 50;
  }

  .nav-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 4px;
    max-width: 480px;
    margin: 0 auto;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    color: var(--text-secondary);
    text-decoration: none;
    min-width: 0;
    flex: 1;
    position: relative;
  }

  .nav-item:hover {
    color: #4b5563;
  }

  .nav-item.active {
    color: var(--primary-orange);
    background: #fff7ed;
    box-shadow: 0 10px 15px -3px rgba(255, 107, 0, 0.1);
    transform: scale(1.05);
  }

  .nav-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .nav-label {
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
