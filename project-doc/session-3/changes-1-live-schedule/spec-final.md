# changes-1: Live Schedule Engine + Action Log

**Developer 1 track**
**APF Tasks:** 1 (Shift API) + 2 (Shift UI) + 7 (Action Log)

---

## Есть сейчас vs Должно быть

| Аспект | Есть | Должно быть |
|--------|------|-------------|
| Слоты в Timeline | Только просмотр, нет действий | Кнопка "Сместить" на каждом слоте |
| Смещение расписания | Нет | Каскадное смещение всех последующих слотов |
| Предпросмотр | Нет | Перед смещением — показать затронутые слоты и брони |
| Смещённые слоты | Нет пометок | Бейдж "+N мин" на смещённых |
| Массовое смещение | Нет | "Сместить все +N мин" от текущего момента |
| Лог действий | Нет | Все действия админов записываются + страница просмотра |

---

## Часть 1: Backend — Live Schedule Engine

### Новые API endpoints

**POST /api/admin/booking/slots/:id/shift**
```json
Request:
{
  "shift_minutes": 5,
  "reason": "delay", // delay | malfunction | late_arrival | optimization | other
  "cascade": true,
  "preview": false   // true = only preview, don't apply
}

Response (preview=true):
{
  "affected_slots": [
    { "id": 15, "original_start": "14:30", "new_start": "14:35", "bookings_count": 2 },
    { "id": 16, "original_start": "14:45", "new_start": "14:50", "bookings_count": 0 }
  ],
  "total_affected": 12,
  "total_bookings_affected": 3,
  "warning": null  // or "Последний слот выходит за рабочие часы (22:05 > 22:00)"
}

Response (preview=false):
{
  "success": true,
  "affected_slots": [...],
  "notifications_queued": 3  // клиенты с telegram_user_id
}
```

**POST /api/admin/booking/slots/bulk-shift**
```json
Request:
{
  "date": "2026-02-10",
  "from_time": "14:00",    // сместить все слоты с этого времени
  "shift_minutes": 10,
  "reason": "delay",
  "preview": false
}
```
Same response format as single shift.

**GET /api/admin/booking/action-log**
```json
Request params: ?date=2026-02-10&admin_id=1&action=shifted&page=1&limit=50

Response:
{
  "logs": [
    {
      "id": 1,
      "admin_id": 1,
      "admin_name": "Admin",
      "action": "shifted",
      "entity_type": "slot",
      "entity_id": 15,
      "details": { "shift_minutes": 5, "reason": "delay", "affected_count": 12 },
      "created_at": "2026-02-10T14:35:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50
}
```

### Логика каскадного смещения

1. Получить target_slot по ID + shift_minutes + cascade
2. Если cascade = true → найти все слоты на ту же дату с start_time > target.start_time
3. Для каждого затронутого слота:
   - Обновить start_time += shift_minutes
   - Если original_start_time пустой — записать текущий start_time как original
   - Обновить shift_minutes (суммировать с предыдущим смещением)
4. Записать в booking_action_log: admin_id, action=shifted, details
5. Вернуть список затронутых слотов + количество бронирований на них
6. Если последний слот выходит за рабочие часы — вернуть warning (но всё равно выполнить)

### Новый сервис

**Файл:** `backend-expressjs/src/services/booking-shift.service.ts`

```typescript
export class BookingShiftService {
  // Single slot shift with optional cascade
  async shiftSlot(slotId: number, params: ShiftParams): Promise<ShiftResult>

  // Bulk shift from time
  async bulkShift(date: string, fromTime: string, params: ShiftParams): Promise<ShiftResult>

  // Preview only (no DB write)
  async previewShift(slotId: number, params: ShiftParams): Promise<ShiftPreview>
}
```

### Таблицы (добавить в schema.ts или использовать существующую booking_action_log)

**booking_action_log** (если нет — создать):
```sql
CREATE TABLE IF NOT EXISTS booking_action_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  action TEXT NOT NULL,           -- created | confirmed | cancelled | shifted | edited
  entity_type TEXT NOT NULL,      -- booking | slot | config
  entity_id INTEGER,
  details TEXT,                   -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
```

> **ВАЖНО:** Проверь schema.ts — таблица booking_action_log может уже существовать из Session 1. Если есть — используй, не дублируй.

---

## Часть 2: Frontend — Shift UI

### Обновить Dashboard Timeline (`/bookings/+page.svelte`)

На каждом слоте в Timeline добавить кнопку "Сместить" (иконка часов или стрелка).
При клике — открыть ShiftModal.

Смещённые слоты показывать с бейджем: `+5 мин` (зелёный/оранжевый цвет).

### Новые компоненты

**ShiftModal.svelte** — модальное окно:
- Поле: Минуты смещения (число, по умолчанию 5)
- Выпадающий список причин: Задержка заезда / Тех. неисправность / Опоздание клиента / Оптимизация / Другое
- Toggle: Каскадно (по умолчанию ON)
- Кнопка "Предпросмотр" → загрузить preview, показать ShiftPreview
- Кнопка "Применить" → выполнить смещение

**ShiftPreview.svelte** — предпросмотр:
- Список затронутых слотов (старое время → новое время)
- Количество затронутых бронирований
- Warning если слоты выходят за рабочие часы

### Массовое смещение

Кнопка "Сместить все +N мин" рядом с датой или в хедере Dashboard.
Форма: минуты + причина. Использует bulk-shift endpoint.

### Обновить Layout (`/bookings/+layout.svelte`)

Добавить 5-ю вкладку: "Лог" → `/bookings/log`

### Новая страница `/bookings/log/+page.svelte`

**ActionLog** — таблица действий:
- Колонки: Дата/время, Админ, Действие, Объект, Детали
- Фильтры: по админу, по действию (dropdown), по дате (datepicker)
- Пагинация

### API клиент — добавить в `$lib/api/admin/booking.ts`

```typescript
// В КОНЕЦ файла:
async shiftSlot(slotId: number, params: ShiftParams): Promise<ShiftResult>
async bulkShift(date: string, fromTime: string, params: ShiftParams): Promise<ShiftResult>
async previewShift(slotId: number, params: ShiftParams): Promise<ShiftPreview>
async getActionLog(filters: ActionLogFilters): Promise<ActionLogResponse>
```

---

## Критерии успеха

- [ ] Preview показывает корректное количество затронутых слотов
- [ ] После смещения Timeline обновляется мгновенно (без перезагрузки)
- [ ] Каскадное смещение двигает ВСЕ последующие слоты
- [ ] Action Log записывает все действия (create, confirm, cancel, shift, edit)
- [ ] Action Log отображается с фильтрами
- [ ] `npm run build` — backend + frontend без ошибок

---

## Файлы которые НЕЛЬЗЯ трогать (работает Developer 2)

- `telegram-bot/src/` — NOT YOURS
- `frontend-sveltekit/src/routes/(admin)/bookings/settings/+page.svelte` — NOT YOURS
- НЕ создавать файлы в `backend-expressjs/src/routes/bot/` — NOT YOURS
- НЕ создавать `booking-notification.service.ts` — NOT YOURS
- НЕ создавать `booking-scheduler.service.ts` — NOT YOURS

---

*Version: 1.0 | 2026-02-10*
