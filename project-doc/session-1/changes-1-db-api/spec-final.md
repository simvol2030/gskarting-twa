# Спецификация: БД + Backend API для системы бронирования

**Версия:** final
**Дата:** 2026-02-10

---

## Есть сейчас vs Должно быть

| Аспект | Есть | Должно быть |
|--------|------|-------------|
| Таблицы бронирования | Нет | 6 таблиц (booking_config, booking_slots, bookings, booking_schedule_overrides, booking_shift_log, booking_action_log) |
| API бронирования | Нет | 7 public endpoints (/api/booking/*) |
| Генерация слотов | Нет | Сервис генерации слотов из настроек (рабочие часы, интервал, буфер) |
| Расчёт цен | Нет | Калькулятор цен с групповой скидкой |

---

## Что на выходе

1. **6 таблиц в БД** через Drizzle ORM + миграция
2. **Сервис генерации слотов** — создаёт слоты на день по шаблону из booking_config
3. **7 public API endpoints** — конфигурация, расписание, бронирование, отмена, расчёт цен
4. **Seed данные** — дефолтные настройки в booking_config

---

## Модель данных

### booking_config (singleton — одна запись с настройками)

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| id | integer PK | auto | — |
| working_hours | text (JSON) | {"1":{"open":"11:00","close":"22:00"},...} | Рабочие часы по дням недели (0=Вс, 1=Пн...) |
| slot_interval_minutes | integer | 15 | Интервал между слотами |
| buffer_minutes | integer | 5 | Буфер между заездами |
| slot_durations | text (JSON) | [10, 15, 20] | Доступные длительности заездов (мин) |
| default_duration | integer | 10 | Длительность по умолчанию |
| max_participants | integer | 8 | Макс. участников в заезде |
| pricing_adult | text (JSON) | {"10":800,"15":1100,"20":1400} | Цены взрослых по длительности (RUB) |
| pricing_child | text (JSON) | {"10":600,"15":850,"20":1100} | Цены детских по длительности |
| currency | text | "RUB" | Валюта |
| group_discount_min | integer | 5 | Мин. кол-во для групповой скидки |
| group_discount_percent | integer | 10 | % групповой скидки |
| adult_min_age | integer | 14 | Мин. возраст для взрослого заезда |
| child_min_age | integer | 6 | Мин. возраст ребёнка |
| child_max_age | integer | 13 | Макс. возраст ребёнка |
| booking_horizon_days | integer | 90 | Горизонт бронирования (дней) |
| auto_confirm | integer | 1 | Автоподтверждение (0/1) |
| reminder_enabled | integer | 1 | Напоминания включены (0/1) |
| reminder_hours_before | integer | 24 | За сколько часов напоминание |
| shift_notification_threshold | integer | 5 | Мин. смещение для уведомления (мин) |
| created_at | text | now | — |
| updated_at | text | now | — |

### booking_schedule_overrides

| Поле | Тип | Описание |
|------|-----|----------|
| id | integer PK | — |
| date | text | Дата (YYYY-MM-DD) |
| is_closed | integer | День закрыт (0/1) |
| custom_open | text | Другое время открытия (HH:MM), nullable |
| custom_close | text | Другое время закрытия (HH:MM), nullable |
| reason | text | Причина (nullable) |
| created_by_admin_id | integer FK → admins | Кто создал |
| created_at | text | — |

### booking_slots

| Поле | Тип | Описание |
|------|-----|----------|
| id | integer PK | — |
| date | text | Дата (YYYY-MM-DD) |
| start_time | text | Время начала (HH:MM) |
| end_time | text | Время окончания (HH:MM) |
| participant_type | text | "adult" / "child" |
| max_participants | integer | Макс. участников (из config) |
| booked_participants | integer (default 0) | Сколько уже забронировано |
| status | text | "available" / "limited" / "booked" / "blocked" |
| original_start_time | text (nullable) | Исходное время (до смещения) |
| shift_minutes | integer (default 0) | Величина смещения |
| shift_reason | text (nullable) | Причина смещения |
| is_blocked | integer (default 0) | Заблокирован (0/1) |
| blocked_by_admin_id | integer FK (nullable) | Кто заблокировал |
| blocked_reason | text (nullable) | Причина блокировки |
| created_at | text | — |
| updated_at | text | — |

### bookings

| Поле | Тип | Описание |
|------|-----|----------|
| id | integer PK | — |
| slot_id | integer FK → booking_slots | Слот |
| date | text | Дата (YYYY-MM-DD) |
| start_time | text | Время (HH:MM) |
| duration | integer | Длительность (мин) |
| participant_type | text | "adult" / "child" |
| participant_count | integer | Кол-во участников |
| contact_name | text | Имя клиента |
| contact_phone | text | Телефон |
| contact_email | text (nullable) | Email |
| telegram_user_id | text (nullable) | Telegram ID (если из TWA) |
| source | text | "twa" / "widget" / "admin" |
| created_by_admin_id | integer FK (nullable) | Если создан админом |
| status | text | "pending" / "confirmed" / "cancelled" / "completed" / "no_show" |
| total_price | integer | Стоимость (копейки или рубли — как в проекте) |
| notes | text (nullable) | Комментарий клиента |
| admin_notes | text (nullable) | Заметки админа |
| reminder_sent | integer (default 0) | Напоминание отправлено (0/1) |
| reminder_confirmed | integer (nullable) | Подтверждено через бот (0/1/null) |
| created_at | text | — |
| updated_at | text | — |
| confirmed_at | text (nullable) | — |
| cancelled_at | text (nullable) | — |
| cancel_reason | text (nullable) | — |

### booking_shift_log

| Поле | Тип | Описание |
|------|-----|----------|
| id | integer PK | — |
| date | text | Дата смещения |
| trigger_slot_id | integer FK → booking_slots | Слот-триггер |
| shift_minutes | integer | Величина (мин) |
| reason | text | Причина |
| cascade | integer | Каскадное (0/1) |
| affected_slots_count | integer | Затронуто слотов |
| notifications_sent | integer | Отправлено уведомлений |
| admin_id | integer FK → admins | Кто сместил |
| created_at | text | — |

### booking_action_log

| Поле | Тип | Описание |
|------|-----|----------|
| id | integer PK | — |
| booking_id | integer FK (nullable) | Бронирование |
| action | text | "created" / "confirmed" / "cancelled" / "shifted" / "edited" |
| admin_id | integer FK (nullable) | Кто сделал |
| details | text (JSON, nullable) | Подробности |
| created_at | text | — |

---

## API Endpoints

### GET /api/booking/config
Публичная конфигурация для виджета.

**Response:**
```json
{
  "slot_durations": [10, 15, 20],
  "default_duration": 10,
  "max_participants": 8,
  "pricing_adult": {"10": 800, "15": 1100, "20": 1400},
  "pricing_child": {"10": 600, "15": 850, "20": 1100},
  "currency": "RUB",
  "group_discount_min": 5,
  "group_discount_percent": 10,
  "adult_min_age": 14,
  "child_min_age": 6,
  "child_max_age": 13,
  "booking_horizon_days": 90,
  "working_hours": {...}
}
```

### GET /api/booking/schedule/:date
Слоты на конкретный день (генерируются автоматически если нет).

**Params:** `date` — YYYY-MM-DD
**Response:**
```json
{
  "date": "2026-02-15",
  "is_closed": false,
  "slots": [
    {
      "id": 1,
      "start_time": "11:00",
      "end_time": "11:15",
      "participant_type": "adult",
      "max_participants": 8,
      "booked_participants": 3,
      "available_spots": 5,
      "status": "available",
      "shift_minutes": 0
    }
  ]
}
```

### GET /api/booking/schedule/range?from=YYYY-MM-DD&to=YYYY-MM-DD
Загруженность дат для календаря.

**Response:**
```json
{
  "dates": {
    "2026-02-15": { "status": "available", "total_spots": 64, "booked_spots": 12 },
    "2026-02-16": { "status": "limited", "total_spots": 64, "booked_spots": 50 },
    "2026-02-17": { "status": "closed" }
  }
}
```

### POST /api/booking/bookings
Создание бронирования.

**Body:**
```json
{
  "slot_id": 1,
  "duration": 10,
  "participant_count": 3,
  "contact_name": "Иванов Иван",
  "contact_phone": "+79001234567",
  "contact_email": "ivan@example.com",
  "notes": "Первый раз",
  "telegram_user_id": "123456789",
  "telegram_init_data": "..."
}
```

**Логика:**
1. Валидация данных
2. Если есть telegram_init_data — валидировать, source = 'twa'
3. Если нет — source = 'widget'
4. Атомарно: проверить available_spots >= participant_count
5. Обновить booked_participants в слоте
6. Обновить status слота (available/limited/booked)
7. Если auto_confirm — status = 'confirmed', иначе 'pending'
8. Вернуть бронирование с ID

**Response:** `201 Created` + booking object

### GET /api/booking/bookings/:id
Получение бронирования по ID.

### POST /api/booking/bookings/:id/cancel
Отмена бронирования клиентом.

**Body:** `{ "reason": "Не смогу приехать" }`

**Логика:**
1. Проверить что бронь можно отменить (не completed, не cancelled)
2. Обновить status = 'cancelled'
3. Уменьшить booked_participants в слоте
4. Обновить status слота

### POST /api/booking/calculate-price
Расчёт стоимости (без создания бронирования).

**Body:**
```json
{
  "participant_type": "adult",
  "duration": 15,
  "participant_count": 6
}
```

**Response:**
```json
{
  "price_per_person": 1100,
  "subtotal": 6600,
  "group_discount_applied": true,
  "discount_percent": 10,
  "discount_amount": 660,
  "total": 5940,
  "currency": "RUB"
}
```

---

## Сервис генерации слотов

**Логика:**
1. Прочитать booking_config (working_hours, slot_interval_minutes, buffer_minutes)
2. Для запрошенной даты проверить booking_schedule_overrides
3. Если is_closed = true — вернуть пустой массив
4. Определить open/close (из override или из working_hours по дню недели)
5. Генерировать слоты от open до close с шагом slot_interval_minutes
6. Каждый слот: end_time = start_time + default_duration, max_participants из config
7. participant_type: чередовать adult/child или все adult (настраиваемо — пока все adult)
8. Не дублировать: если слоты на эту дату уже есть — вернуть существующие

**Важно:** Слоты создаются лениво — при первом запросе на дату, а не заранее на 90 дней.

---

## Факторы реализации

- **Drizzle ORM:** Все таблицы определяются в schema.ts — изучить существующий паттерн
- **SQLite:** Ограничения — нет FOR UPDATE, race condition через BEGIN IMMEDIATE
- **Rate limiting:** На POST /api/booking/bookings — чтобы один клиент не спамил
- **Telegram initData:** Валидация HMAC — уже есть в проекте для auth, переиспользовать
- **Seed:** booking_config должен заполняться начальными данными при первом запуске

---

## Критерии успеха

- [ ] Все 6 таблиц созданы, миграция работает
- [ ] Генерация слотов корректна (рабочие часы, интервал, буфер)
- [ ] Все 7 API endpoints работают
- [ ] Атомарность: нет overbooking при конкурентных запросах
- [ ] Auto-confirm работает (если включён — бронь сразу confirmed)
- [ ] Групповая скидка применяется корректно
- [ ] Telegram initData валидация не ломает существующий auth
