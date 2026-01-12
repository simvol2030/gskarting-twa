# Development Checklist - Loyalty System

> Чеклисты для предотвращения повторяющихся ошибок при разработке новых проектов на базе этого шаблона.

---

## 1. Drizzle Schema Sync (Frontend ↔ Backend)

**Проблема:** При добавлении нового поля в backend schema, frontend schema не обновляется автоматически. Drizzle возвращает `undefined`, используется fallback значение.

**Пример:** `stories_border_color` было в backend, но отсутствовало в frontend schema → цвет рамки всегда был оранжевый вместо настроенного.

### Чеклист при добавлении нового поля в БД:

- [ ] 1. **Миграция:** `backend-expressjs/migrations/XXX_*.sql`
- [ ] 2. **Backend schema:** `backend-expressjs/src/db/schema.ts`
- [ ] 3. **Frontend schema:** `frontend-sveltekit/src/lib/server/db/schema.ts` ⚠️
- [ ] 4. **API endpoint:** Если нужно (routes)
- [ ] 5. **Layout loader:** `+layout.server.ts` (для SSR данных)
- [ ] 6. **Store/Component:** Передать данные через props

### Рекомендация для будущих проектов:
Использовать **shared schema** в monorepo:
```
packages/
└── shared/
    └── db/
        └── schema.ts  ← Единая схема
```

---

## 2. Компоненты vs Inline код

**Проблема:** Функционал реализован inline в одном месте, но использует упрощённый компонент в другом месте.

**Пример:** Карточки товаров на `/products` имели кнопку корзины (inline код), а `ProductCard.svelte` на главной — нет.

### Чеклист при создании UI компонентов:

- [ ] Проверить все места использования аналогичного UI
- [ ] Унифицировать: либо везде компонент, либо везде inline
- [ ] Если компонент — добавить все нужные props с разумными defaults
- [ ] Документировать props в комментариях

### Правило:
> Если UI используется в 2+ местах — создать компонент с ПОЛНЫМ функционалом.
> Опциональные фичи — через props (например `showCartButton={true}`).

---

## 3. SSR vs Client-side State

**Проблема:** Svelte stores не сохраняют состояние между SSR и client hydration.

**Пример:** Customization загружался в store на клиенте, но SSR рендерил с default значениями → "мигание" логотипа.

### Чеклист для SSR-критичных данных:

- [ ] Загружать в `+layout.server.ts` или `+page.server.ts`
- [ ] Передавать через `data` prop, не через store
- [ ] Использовать `$derived` для реактивных вычислений
- [ ] Для props-override: `let value = $derived(propOverride || $storeValue)`

---

## 4. Customization Fields

**Проблема:** Много слоёв для одного поля кастомизации.

### Чеклист при добавлении поля кастомизации:

| Шаг | Файл | Что делать |
|-----|------|------------|
| 1 | `migrations/XXX.sql` | ALTER TABLE |
| 2 | `backend/src/db/schema.ts` | Добавить column |
| 3 | `frontend/src/lib/server/db/schema.ts` | Добавить column ⚠️ |
| 4 | `backend/src/routes/api/customization.ts` | Добавить в response |
| 5 | `backend/src/routes/admin/appearance.ts` | Добавить в форму |
| 6 | `frontend/src/routes/+layout.server.ts` | Маппинг в customization object |
| 7 | `frontend/src/lib/stores/customization.ts` | Default value |
| 8 | Component | Использовать значение |

---

## 5. Navigation Items

**Проблема:** Навигация настраивается в админке, но изменения не применяются.

### Чеклист:
- [ ] `bottom_nav_items` и `sidebar_menu_items` — JSON в БД
- [ ] Парсить в `+layout.server.ts`: `JSON.parse(s.bottom_nav_items || '[]')`
- [ ] Передавать в компоненты `BottomNav` и `MobileMenu`

---

## История исправлений

| Дата | Проблема | Причина | Файлы |
|------|----------|---------|-------|
| 2026-01-12 | Stories border color не применялся | Frontend schema не имела поля | `frontend/.../schema.ts` |
| 2026-01-12 | Корзина не отображалась в Топовых товарах | ProductCard не имел кнопки | `ProductCard.svelte` |

---

*Версия: 1.0 | 2026-01-12*
