# Modal Components - Usage Guide

## Созданные компоненты

1. **PetsModal.svelte** - управление питомцами
2. **NotificationsModal.svelte** - настройки уведомлений
3. **PaymentModal.svelte** - управление платёжными картами
4. **ReferralModal.svelte** - реферальная программа

## Как использовать

### 1. Импорт компонентов

```svelte
<script lang="ts">
  import Modal from '$lib/components/loyalty/ui/Modal.svelte';
  import {
    PetsModal,
    NotificationsModal,
    PaymentModal,
    ReferralModal
  } from '$lib/components/loyalty/ui';
  import { modalStore } from '$lib/stores/modal.svelte';
</script>
```

### 2. Открытие модальных окон

```svelte
<!-- Кнопки для открытия -->
<button onclick={() => modalStore.open('pets')}>
  🐾 Мои питомцы
</button>

<button onclick={() => modalStore.open('notifications')}>
  🔔 Уведомления
</button>

<button onclick={() => modalStore.open('payment')}>
  💳 Платёжные карты
</button>

<button onclick={() => modalStore.open('referral')}>
  🎁 Реферальная программа
</button>
```

### 3. Рендеринг модалей

```svelte
<!-- Модалка с питомцами -->
{#if modalStore.currentModal === 'pets'}
  <Modal title="Мои питомцы" size="large">
    <PetsModal />
  </Modal>
{/if}

<!-- Модалка с настройками уведомлений -->
{#if modalStore.currentModal === 'notifications'}
  <Modal title="Настройки уведомлений">
    <NotificationsModal />
  </Modal>
{/if}

<!-- Модалка с платёжными картами -->
{#if modalStore.currentModal === 'payment'}
  <Modal title="Платёжные карты" size="large">
    <PaymentModal />
  </Modal>
{/if}

<!-- Модалка реферальной программы -->
{#if modalStore.currentModal === 'referral'}
  <Modal title="Реферальная программа" size="large">
    <ReferralModal />
  </Modal>
{/if}
```

## Полный пример страницы

```svelte
<script lang="ts">
  import Modal from '$lib/components/loyalty/ui/Modal.svelte';
  import {
    PetsModal,
    NotificationsModal,
    PaymentModal,
    ReferralModal
  } from '$lib/components/loyalty/ui';
  import { modalStore } from '$lib/stores/modal.svelte';
</script>

<div class="settings-page">
  <h1>Настройки</h1>

  <div class="settings-grid">
    <button class="setting-card" onclick={() => modalStore.open('pets')}>
      <span class="icon">🐾</span>
      <h3>Мои питомцы</h3>
      <p>Управление информацией о питомцах</p>
    </button>

    <button class="setting-card" onclick={() => modalStore.open('notifications')}>
      <span class="icon">🔔</span>
      <h3>Уведомления</h3>
      <p>Настройки уведомлений</p>
    </button>

    <button class="setting-card" onclick={() => modalStore.open('payment')}>
      <span class="icon">💳</span>
      <h3>Платёжные карты</h3>
      <p>Управление способами оплаты</p>
    </button>

    <button class="setting-card" onclick={() => modalStore.open('referral')}>
      <span class="icon">🎁</span>
      <h3>Реферальная программа</h3>
      <p>Приглашайте друзей и получайте бонусы</p>
    </button>
  </div>
</div>

<!-- Модальные окна -->
{#if modalStore.currentModal === 'pets'}
  <Modal title="Мои питомцы" size="large">
    <PetsModal />
  </Modal>
{/if}

{#if modalStore.currentModal === 'notifications'}
  <Modal title="Настройки уведомлений">
    <NotificationsModal />
  </Modal>
{/if}

{#if modalStore.currentModal === 'payment'}
  <Modal title="Платёжные карты" size="large">
    <PaymentModal />
  </Modal>
{/if}

{#if modalStore.currentModal === 'referral'}
  <Modal title="Реферальная программа" size="large">
    <ReferralModal />
  </Modal>
{/if}

<style>
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-md);
  }

  .setting-card {
    padding: var(--spacing-lg);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .setting-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
</style>
```

## LocalStorage ключи

Компоненты используют следующие ключи для localStorage:

- `loyalty_pets` - массив питомцев (Pet[])
- `loyalty_notifications` - настройки уведомлений (NotificationSettings)
- `loyalty_cards` - платёжные карты (PaymentCard[])
- `loyalty_referral_stats` - статистика рефералов (ReferralStats)

## Интеграция с Toast уведомлениями

Все модальные окна автоматически используют `toastStore` для отображения уведомлений:

- Успешное сохранение: `toastStore.show('Сохранено!', 'success')`
- Ошибка: `toastStore.show('Ошибка', 'error')`
- Информация: `toastStore.show('Информация', 'info')`

## Особенности

### PetsModal
- Добавление/редактирование/удаление питомцев
- 4 типа: кошка, собака, птица, другое
- Валидация имени (обязательно)
- Опциональные поля: порода, возраст

### NotificationsModal
- 4 toggle-переключателя
- Автоматическое сохранение в localStorage
- Toast уведомление при сохранении

### PaymentModal
- Добавление/удаление карт
- Автоформатирование номера карты (добавление пробелов)
- Автоформатирование срока (MM/YY)
- Маскирование номера (**** **** **** 1234)
- Определение типа карты (Visa/Mastercard/Mir)
- Валидация всех полей

### ReferralModal
- Генерация реферального кода
- Копирование кода в буфер обмена
- Web Share API для шаринга (с fallback)
- Статистика приглашений
- Инструкция по использованию
