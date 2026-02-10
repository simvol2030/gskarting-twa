# Plan: changes-1-db-api — БД + Backend API

**Дата:** 2026-02-10
**Источник:** spec-final.md

---

## Задачи

| # | Задача | DoD | Файлы |
|---|--------|-----|-------|
| 1 | Схема БД (Drizzle) | 6 таблиц определены, миграция создана | schema (booking tables) |
| 2 | Seed данных | booking_config заполнен начальными данными | seed script |
| 3 | Сервис генерации слотов | Слоты генерируются по конфигу, учитываются overrides | booking-slot.service.ts |
| 4 | Сервис бронирования | CRUD + атомарность + расчёт цен | booking.service.ts |
| 5 | Public API endpoints | 7 endpoints работают | booking routes |
| 6 | Rate limiting + Telegram initData | Защита от спама, валидация TWA | middleware |

---

## Задача 1: Схема БД

**DoD:**
- [ ] 6 таблиц определены через Drizzle ORM (booking_config, booking_schedule_overrides, booking_slots, bookings, booking_shift_log, booking_action_log)
- [ ] Типы и дефолты соответствуют spec-final.md
- [ ] Миграция создана (`npx drizzle-kit generate`)
- [ ] Миграция применяется без ошибок

**Как делать:**
1. Найти существующий `schema.ts` — изучить паттерн определения таблиц
2. Добавить 6 таблиц в том же стиле
3. Убедиться в FK (admins table для admin_id)
4. Создать миграцию

---

## Задача 2: Seed данных

**DoD:**
- [ ] При запуске — если booking_config пуст, заполняется дефолтами из spec
- [ ] Рабочие часы по умолчанию: Пн-Пт 11:00-22:00, Сб-Вс 10:00-23:00

**Как делать:**
1. Найти существующий seed-механизм в проекте
2. Добавить seed для booking_config
3. Значения по умолчанию — из spec-final.md (таблица booking_config)

---

## Задача 3: Сервис генерации слотов

**DoD:**
- [ ] `generateSlotsForDate(date: string)` — генерирует слоты если ещё нет
- [ ] `getSlotsForDate(date: string)` — возвращает слоты (генерирует если надо)
- [ ] Учитывает schedule_overrides (закрытые дни, изменённые часы)
- [ ] Учитывает booking_horizon_days (не генерирует дальше 90 дней)
- [ ] Не дублирует слоты при повторном вызове

**Алгоритм:**
```
1. Проверить: дата <= сегодня + horizon_days? Если нет — ошибка
2. Проверить: слоты на эту дату уже есть? Если да — вернуть
3. Проверить schedule_overrides для даты
4. Если is_closed — вернуть пустой массив
5. Определить open/close (из override или working_hours)
6. Цикл: time = open; while time + interval <= close:
     - Создать слот: start_time=time, end_time=time+default_duration
     - participant_type = 'adult' (пока все adult)
     - max_participants из config
     - time += slot_interval_minutes
7. Batch insert всех слотов
8. Вернуть слоты
```

---

## Задача 4: Сервис бронирования

**DoD:**
- [ ] `createBooking(data)` — создание с атомарной проверкой мест
- [ ] `getBookingById(id)` — получение
- [ ] `cancelBooking(id, reason)` — отмена + освобождение мест
- [ ] `calculatePrice(type, duration, count)` — расчёт с групповой скидкой
- [ ] Race condition protection (SQLite BEGIN IMMEDIATE или аналог)

**Алгоритм createBooking:**
```
1. Валидация: slot_id, duration, participant_count, contact_name, contact_phone
2. BEGIN IMMEDIATE TRANSACTION
3. SELECT slot WHERE id = slot_id (получить текущий booked_participants)
4. Проверить: max_participants - booked_participants >= participant_count
5. Если нет — ROLLBACK, вернуть ошибку "Недостаточно мест"
6. UPDATE slot SET booked_participants += participant_count
7. Обновить status слота:
     available (>50% мест), limited (<=50%), booked (0 мест)
8. Определить source: telegram_user_id ? 'twa' : 'widget'
9. Определить status: auto_confirm ? 'confirmed' : 'pending'
10. INSERT booking
11. COMMIT
12. Вернуть booking
```

**Алгоритм calculatePrice:**
```
1. Получить pricing_adult/pricing_child из config
2. price_per_person = pricing[duration]
3. subtotal = price_per_person × count
4. Если count >= group_discount_min:
     discount = subtotal × group_discount_percent / 100
5. total = subtotal - discount
6. Вернуть breakdown
```

---

## Задача 5: Public API endpoints

**DoD:**
- [ ] GET /api/booking/config — публичные настройки
- [ ] GET /api/booking/schedule/:date — слоты на день
- [ ] GET /api/booking/schedule/range — загруженность дат
- [ ] POST /api/booking/bookings — создание
- [ ] GET /api/booking/bookings/:id — получение
- [ ] POST /api/booking/bookings/:id/cancel — отмена
- [ ] POST /api/booking/calculate-price — расчёт

**Как делать:**
1. Найти существующие routes в `backend-expressjs/src/routes/` — изучить паттерн
2. Создать `booking.ts` (или `booking/index.ts`) в routes
3. Подключить в основном app/router файле
4. Каждый endpoint: валидация → сервис → ответ

---

## Задача 6: Rate limiting + Telegram initData

**DoD:**
- [ ] POST /api/booking/bookings: макс. 5 запросов / мин / IP
- [ ] Telegram initData валидация для source='twa'

**Как делать:**
1. Найти существующий rate limiting в проекте (если есть)
2. Если нет — простой middleware на Map<IP, timestamps[]>
3. Telegram initData: найти существующую валидацию в auth routes — переиспользовать

---

## Зависимости

```
Задача 1 (БД) → Задача 2 (Seed) → Задача 3 (Слоты) → Задача 4 (Бронирование) → Задача 5 (API) → Задача 6 (Security)
```

---

*Plan подготовлен CLI (Планировщиком). Developer: проведи аудит плана и скорректируй при необходимости.*
