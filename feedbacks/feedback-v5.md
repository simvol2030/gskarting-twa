# Feedback v5 - Доработка виджета "Бесплатная доставка"

**Дата:** 2026-01-09
**Branch to create:** `claude/free-delivery-widget-locations-v1`
**Score:** 8 (UI компонент + API + данные из БД)

---

## Краткое описание

Доработать виджет `FreeDeliveryWidget` на главной странице, чтобы показывать список населённых пунктов, участвующих в акции бесплатной доставки.

**Текущее состояние:**
- Виджет показывает текст "При заказе от 3000₽ доставка бесплатная в выбранные населённые пункты"
- НЕ показывает какие именно пункты участвуют

**Требуемое поведение:**
1. Показывать 2-3 первых населённых пункта сразу (например: "Зеленоградский, Софрино...")
2. Кнопка "Подробнее" раскрывает полный список всех участвующих локаций
3. Данные берутся из `delivery_locations` где `free_delivery_threshold IS NOT NULL`

---

## Изменения

### 1. Backend API

**Файл:** `backend-expressjs/src/routes/api/shop.ts`

Обновить endpoint `GET /api/shop/free-delivery-info`:

```typescript
// Добавить в ответ список локаций с бесплатной доставкой
{
  enabled: boolean,
  defaultThreshold: number,
  widget: { ... },
  toast: { ... },
  // НОВОЕ:
  locations: [
    { id: number, name: string, threshold: number },
    { id: number, name: string, threshold: number },
    ...
  ]
}
```

SQL запрос:
```sql
SELECT id, name, free_delivery_threshold as threshold
FROM delivery_locations
WHERE free_delivery_threshold IS NOT NULL
  AND is_enabled = 1
ORDER BY name ASC
```

---

### 2. Frontend компонент

**Файл:** `frontend-sveltekit/src/lib/components/loyalty/ui/FreeDeliveryWidget.svelte`

Изменить props:
```typescript
interface Props {
  threshold: number;
  title: string;
  text: string;
  icon: string;
  locations: Array<{ id: number; name: string; threshold: number }>; // НОВОЕ
}
```

Добавить логику:
```typescript
let expanded = $state(false);

// Первые 2-3 локации для превью
const previewLocations = $derived(locations.slice(0, 2));
const hasMore = $derived(locations.length > 2);
```

Добавить UI:
```svelte
<!-- После текста виджета -->
{#if locations.length > 0}
  <div class="locations-preview">
    <span class="locations-label">Действует в:</span>
    <span class="locations-names">
      {previewLocations.map(l => l.name).join(', ')}
      {#if hasMore && !expanded}...{/if}
    </span>

    {#if hasMore}
      <button class="btn-more" onclick={() => expanded = !expanded}>
        {expanded ? 'Свернуть' : 'Подробнее'}
      </button>
    {/if}
  </div>

  {#if expanded}
    <div class="locations-full">
      {#each locations as location}
        <div class="location-item">
          <span class="location-name">{location.name}</span>
          <span class="location-threshold">от {location.threshold.toLocaleString('ru-RU')}₽</span>
        </div>
      {/each}
    </div>
  {/if}
{/if}
```

Стили:
- Превью локаций в одну строку, компактно
- Кнопка "Подробнее" маленькая, стиль ссылки
- Развернутый список - вертикальный, с отступами
- Поддержка темной темы (CSS variables)

---

### 3. Интеграция на главной

**Файл:** `frontend-sveltekit/src/routes/+page.svelte`

Передать `locations` в компонент:
```svelte
<FreeDeliveryWidget
  threshold={data.freeDeliveryInfo.defaultThreshold}
  title={data.freeDeliveryInfo.widget.title}
  text={data.freeDeliveryInfo.widget.text}
  icon={data.freeDeliveryInfo.widget.icon}
  locations={data.freeDeliveryInfo.locations || []}
/>
```

**Файл:** `frontend-sveltekit/src/routes/+page.server.ts`

Убедиться что `locations` приходят в `load` функции.

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `backend-expressjs/src/routes/api/shop.ts` | EDIT - добавить locations в ответ |
| `frontend-sveltekit/src/lib/components/loyalty/ui/FreeDeliveryWidget.svelte` | EDIT - добавить UI локаций |
| `frontend-sveltekit/src/routes/+page.svelte` | EDIT - передать locations prop |
| `frontend-sveltekit/src/routes/+page.server.ts` | VERIFY - данные приходят |

---

## Дизайн виджета (итоговый)

```
┌─────────────────────────────────────────────────────┐
│ 🚚  Бесплатная доставка                             │
│     При заказе от 3 000₽ доставка бесплатная        │
│     в выбранные населённые пункты                   │
│                                                     │
│     Действует в: Зеленоградский, Софрино... [Подробнее] │
└─────────────────────────────────────────────────────┘

После клика "Подробнее":

┌─────────────────────────────────────────────────────┐
│ 🚚  Бесплатная доставка                             │
│     При заказе от 3 000₽ доставка бесплатная        │
│     в выбранные населённые пункты                   │
│                                                     │
│     Действует в: Зеленоградский, Софрино... [Свернуть] │
│     ┌─────────────────────────────────────────────┐ │
│     │ Зеленоградский          от 3 000₽           │ │
│     │ Софрино                 от 3 000₽           │ │
│     │ Матюшино                от 2 500₽           │ │
│     │ ...                                         │ │
│     └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Коммиты

1. `feat(api): add locations to free-delivery-info endpoint`
2. `feat(widget): show participating locations in FreeDeliveryWidget`

---

## Тестирование

1. Добавить несколько локаций с порогом в админке `/delivery-locations`
2. Проверить виджет на главной - должны показываться названия
3. Нажать "Подробнее" - должен раскрыться полный список
4. Проверить темную тему
5. Проверить когда 0, 1, 2, 3+ локаций

