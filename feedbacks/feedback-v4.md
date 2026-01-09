# Feedback v4 - Модуль "Бесплатная доставка от порога"

**Дата:** 2025-01-09
**Branch to create:** `claude/free-delivery-threshold-v1`
**Score:** 15+ (бизнес-логика, 10+ файлов, БД + API + Frontend)

---

## Краткое описание

Реализовать функционал бесплатной доставки при заказе от определённой суммы (по умолчанию 3000₽), но только для определённых населённых пунктов. Включает:
1. Виджет на главной странице
2. Toast-уведомление при добавлении в корзину
3. Логику расчёта в checkout
4. Расширение админки delivery-locations
5. Кликабельный логотип в хедере

---

## Часть 1: База данных

### 1.1 Миграция для delivery_locations

**Файл:** `backend-expressjs/migrations/XXX_free_delivery_threshold.sql`

```sql
-- Добавить поле для порога бесплатной доставки
ALTER TABLE delivery_locations ADD COLUMN free_delivery_threshold INTEGER DEFAULT NULL;

-- NULL = не участвует в акции
-- Значение в рублях (не копейках!) для удобства
```

### 1.2 Обновить схему Drizzle

**Файл:** `backend-expressjs/src/db/schema.ts`

В таблицу `deliveryLocations` добавить:
```typescript
free_delivery_threshold: integer('free_delivery_threshold'), // null = не участвует, число = порог в рублях
```

### 1.3 Новая таблица: free_delivery_settings

**Файл:** `backend-expressjs/src/db/schema.ts`

```typescript
export const freeDeliverySettings = sqliteTable('free_delivery_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Глобальные настройки
  is_enabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  default_threshold: integer('default_threshold').notNull().default(3000), // в рублях

  // Виджет на главной
  widget_enabled: integer('widget_enabled', { mode: 'boolean' }).notNull().default(true),
  widget_title: text('widget_title').notNull().default('Бесплатная доставка'),
  widget_text: text('widget_text').notNull().default('При заказе от {threshold}₽ доставка бесплатная в выбранные населённые пункты'),
  widget_icon: text('widget_icon').notNull().default('🚚'),

  // Toast при добавлении в корзину
  toast_enabled: integer('toast_enabled', { mode: 'boolean' }).notNull().default(true),
  toast_text: text('toast_text').notNull().default('Добавьте ещё на {remaining}₽ — доставка может быть бесплатной!'),
  toast_show_threshold: integer('toast_show_threshold').notNull().default(500), // показывать когда осталось <= X рублей

  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});
```

---

## Часть 2: Backend API

### 2.1 Обновить delivery-locations API

**Файл:** `backend-expressjs/src/routes/admin/delivery-locations.ts`

В POST/PUT endpoints добавить обработку `free_delivery_threshold`:
- Принимать параметр `free_delivery_threshold` (number | null)
- Валидация: >= 0 или null
- Возвращать в ответе

### 2.2 Новый API: free-delivery-settings

**Файл:** `backend-expressjs/src/routes/admin/free-delivery-settings.ts`

```typescript
// GET /api/admin/free-delivery-settings - получить настройки
// PUT /api/admin/free-delivery-settings - обновить настройки
```

### 2.3 Public API для frontend

**Файл:** `backend-expressjs/src/routes/api/shop.ts`

Добавить endpoint:
```typescript
// GET /api/shop/free-delivery-info
// Возвращает:
{
  enabled: boolean,
  defaultThreshold: number,
  widget: {
    enabled: boolean,
    title: string,
    text: string,
    icon: string
  },
  toast: {
    enabled: boolean,
    text: string,
    showThreshold: number
  }
}
```

Обновить endpoint `/api/shop/delivery-locations`:
- Добавить в ответ поле `free_delivery_threshold` для каждой локации

---

## Часть 3: Frontend - Админка

### 3.1 Обновить страницу delivery-locations

**Файл:** `frontend-sveltekit/src/routes/(admin)/delivery-locations/+page.svelte`

В форму создания/редактирования добавить:
- Галочка "Участвует в акции бесплатной доставки"
- Поле "Порог бесплатной доставки (₽)" - показывать если галочка включена
- В таблице: отображать статус участия (иконка 🚚 или badge)

### 3.2 Новая страница: настройки бесплатной доставки

**Файл:** `frontend-sveltekit/src/routes/(admin)/delivery-settings/+page.svelte`

Разместить под пунктом "Локации доставки" в меню.

Содержимое:
1. **Глобальные настройки**
   - Вкл/выкл модуля
   - Порог по умолчанию (₽)

2. **Виджет на главной**
   - Вкл/выкл
   - Заголовок
   - Текст (с плейсхолдером `{threshold}`)
   - Иконка (emoji picker или текстовое поле)

3. **Toast при добавлении**
   - Вкл/выкл
   - Текст (с плейсхолдером `{remaining}`)
   - Показывать когда осталось ≤ X₽

4. **Список населённых пунктов с бесплатной доставкой** (только для информации, редактирование в delivery-locations)

### 3.3 API клиент

**Файл:** `frontend-sveltekit/src/lib/api/admin/free-delivery-settings.ts`

```typescript
export const freeDeliverySettingsAPI = {
  get(): Promise<FreeDeliverySettings>,
  update(data: Partial<FreeDeliverySettings>): Promise<FreeDeliverySettings>
};
```

---

## Часть 4: Frontend - Пользовательская часть

### 4.1 Виджет на главной странице

**Файл:** `frontend-sveltekit/src/lib/components/loyalty/ui/FreeDeliveryWidget.svelte`

```svelte
<script lang="ts">
  interface Props {
    threshold: number;
    title: string;
    text: string;
    icon: string;
  }

  let { threshold, title, text, icon }: Props = $props();

  // Заменить {threshold} в тексте
  const displayText = $derived(text.replace('{threshold}', threshold.toLocaleString('ru-RU')));
</script>

<section class="free-delivery-widget">
  <div class="widget-icon">{icon}</div>
  <div class="widget-content">
    <h3 class="widget-title">{title}</h3>
    <p class="widget-text">{displayText}</p>
  </div>
</section>
```

Стилизация:
- Градиентный фон (оранжево-жёлтый для светлой темы)
- Тёмный вариант для dark mode
- Компактный размер (высота ~80px)
- Иконка слева, текст справа

### 4.2 Интеграция на главную страницу

**Файл:** `frontend-sveltekit/src/routes/+page.svelte`

Добавить между `<StoriesCarousel>` и `<StoreSnippet>`:

```svelte
<!-- Виджет бесплатной доставки -->
{#if data.freeDeliveryInfo?.widget?.enabled}
  <FreeDeliveryWidget
    threshold={data.freeDeliveryInfo.defaultThreshold}
    title={data.freeDeliveryInfo.widget.title}
    text={data.freeDeliveryInfo.widget.text}
    icon={data.freeDeliveryInfo.widget.icon}
  />
{/if}
```

### 4.3 Загрузка данных

**Файл:** `frontend-sveltekit/src/routes/+page.ts` или `+page.server.ts`

Добавить загрузку `freeDeliveryInfo` в load function.

### 4.4 Toast при добавлении в корзину

**Файл:** `frontend-sveltekit/src/lib/stores/cart.ts`

В метод `addItem()` после успешного добавления:

```typescript
// Проверить и показать toast о бесплатной доставке
const freeDeliveryInfo = get(freeDeliveryStore); // или передать как параметр
if (freeDeliveryInfo?.toast?.enabled) {
  const remaining = freeDeliveryInfo.defaultThreshold - newTotal;
  if (remaining > 0 && remaining <= freeDeliveryInfo.toast.showThreshold) {
    const message = freeDeliveryInfo.toast.text.replace('{remaining}', remaining.toLocaleString('ru-RU'));
    toastStore.show(message, 'info', 4000);
  }
}
```

### 4.5 Логика в Checkout

**Файл:** `frontend-sveltekit/src/routes/checkout/+page.svelte`

Обновить `deliveryCost` derived:

```typescript
const deliveryCost = $derived(() => {
  if (!settings) return 0;
  if (deliveryType === 'pickup') return 0;

  // Глобальный порог (существующая логика)
  if (settings.freeDeliveryFrom && subtotal >= settings.freeDeliveryFrom) return 0;

  // НОВОЕ: Проверка по населённому пункту
  if (deliveryLocationId !== null) {
    const location = deliveryLocations.find(l => l.id === deliveryLocationId);
    if (location?.free_delivery_threshold !== null &&
        subtotal >= location.free_delivery_threshold) {
      return 0; // Бесплатная доставка по порогу населённого пункта
    }

    // Цена доставки из локации
    if (deliveryLocationPrice > 0) {
      return deliveryLocationPrice / 100;
    }
  }

  return settings.deliveryCost;
});
```

Также добавить информационное сообщение:
```svelte
{#if deliveryLocationId !== null && location?.free_delivery_threshold}
  {#if subtotal < location.free_delivery_threshold}
    <p class="free-delivery-hint">
      🚚 Добавьте ещё на {(location.free_delivery_threshold - subtotal).toLocaleString('ru-RU')}₽
      для бесплатной доставки в {deliveryCity}
    </p>
  {:else}
    <p class="free-delivery-active">
      ✅ Бесплатная доставка в {deliveryCity}!
    </p>
  {/if}
{/if}
```

---

## Часть 5: Header - Кликабельный логотип

**Файл:** `frontend-sveltekit/src/lib/components/loyalty/layout/Header.svelte`

Обернуть логотип в ссылку:

```svelte
<a href="/" class="logo-link">
  <img src={$logoUrl} alt={$appName} class="app-logo" />
</a>
```

Стили:
```css
.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}
```

---

## Часть 6: Меню админки

**Файл:** `frontend-sveltekit/src/routes/(admin)/+layout@.svelte`

Добавить пункт меню "Настройки доставки" (`/delivery-settings`) под "Локации доставки".

---

## Файлы для изменения (summary)

### Backend (5 файлов):
1. `backend-expressjs/migrations/XXX_free_delivery_threshold.sql` - NEW
2. `backend-expressjs/src/db/schema.ts` - EDIT
3. `backend-expressjs/src/routes/admin/delivery-locations.ts` - EDIT
4. `backend-expressjs/src/routes/admin/free-delivery-settings.ts` - NEW
5. `backend-expressjs/src/routes/api/shop.ts` - EDIT
6. `backend-expressjs/src/index.ts` - EDIT (register new route)

### Frontend Admin (4 файла):
1. `frontend-sveltekit/src/routes/(admin)/delivery-locations/+page.svelte` - EDIT
2. `frontend-sveltekit/src/routes/(admin)/delivery-settings/+page.svelte` - NEW
3. `frontend-sveltekit/src/routes/(admin)/+layout@.svelte` - EDIT (menu)
4. `frontend-sveltekit/src/lib/api/admin/free-delivery-settings.ts` - NEW
5. `frontend-sveltekit/src/lib/api/admin/delivery-locations.ts` - EDIT

### Frontend User (5 файлов):
1. `frontend-sveltekit/src/lib/components/loyalty/ui/FreeDeliveryWidget.svelte` - NEW
2. `frontend-sveltekit/src/routes/+page.svelte` - EDIT
3. `frontend-sveltekit/src/routes/+page.ts` - EDIT
4. `frontend-sveltekit/src/routes/checkout/+page.svelte` - EDIT
5. `frontend-sveltekit/src/lib/stores/cart.ts` - EDIT
6. `frontend-sveltekit/src/lib/components/loyalty/layout/Header.svelte` - EDIT

---

## Порядок реализации

1. **Миграция БД** - добавить поле и таблицу настроек
2. **Backend API** - endpoints для настроек и обновить delivery-locations
3. **Админка delivery-locations** - добавить галочку и поле порога
4. **Новая страница админки** - настройки бесплатной доставки
5. **Виджет на главной** - компонент + интеграция
6. **Toast в корзине** - показ уведомления
7. **Checkout логика** - расчёт с учётом порога
8. **Header** - кликабельный логотип

---

## Важно перед началом

1. **Сделать бэкап БД:**
   ```bash
   cp /opt/websites/granat.klik1.ru/data/db/sqlite/app.db /opt/websites/granat.klik1.ru/data/db/sqlite/app.db.backup-$(date +%Y%m%d)
   ```

2. **Создать ветку:**
   ```bash
   git checkout -b claude/free-delivery-threshold-v1
   ```

3. **После каждого этапа - коммит:**
   - `feat(db): add free_delivery_threshold to delivery_locations`
   - `feat(api): add free-delivery-settings endpoints`
   - `feat(admin): add threshold config to delivery-locations`
   - `feat(admin): add delivery-settings page`
   - `feat(ui): add FreeDeliveryWidget component`
   - `feat(cart): add free delivery toast notification`
   - `feat(checkout): calculate delivery with location threshold`
   - `feat(header): make logo clickable`

---

## Тексты по умолчанию (для настроек)

**Виджет:**
- Заголовок: "Бесплатная доставка"
- Текст: "При заказе от {threshold}₽ доставка бесплатная в выбранные населённые пункты"
- Иконка: "🚚"

**Toast:**
- Текст: "Добавьте ещё на {remaining}₽ — доставка может быть бесплатной!"
- Показывать когда осталось: ≤500₽

---

## Ожидаемый результат

1. Пользователь видит виджет на главной между Stories и контактами
2. При добавлении товаров в корзину появляется toast с подсказкой
3. В checkout отображается информация о бесплатной доставке
4. Если сумма >= порог И населённый пункт участвует → доставка = 0
5. В админке можно управлять всеми настройками
6. Логотип в хедере кликабельный → переход на главную
