# Чек-лист: changes-1-db-api

**Дата:** 2026-02-10
**Проверяет:** Developer (после реализации)

---

## Проверка кода

- [ ] **T-001** `npm run build` — backend без ошибок
- [ ] **T-002** `npx tsc --noEmit` — типы корректны
- [ ] **T-003** Нет отладочного кода
- [ ] **T-004** Drizzle миграция создана и применяется
- [ ] **T-005** Код соответствует стилю проекта (паттерны из существующих файлов)

---

## Проверка БД

- [ ] **DB-001** 6 таблиц создаются через миграцию
- [ ] **DB-002** booking_config заполняется дефолтами (seed)
- [ ] **DB-003** FK на admins работают
- [ ] **DB-004** Индексы на booking_slots(date), bookings(slot_id, date)

---

## Проверка API (через curl / Postman)

- [ ] **A-001** GET /api/booking/config — 200, JSON с настройками
- [ ] **A-002** GET /api/booking/schedule/2026-02-15 — 200, массив слотов
- [ ] **A-003** GET /api/booking/schedule/range?from=2026-02-01&to=2026-02-28 — 200, загруженность
- [ ] **A-004** POST /api/booking/bookings — 201, бронь создана
- [ ] **A-005** GET /api/booking/bookings/1 — 200, данные брони
- [ ] **A-006** POST /api/booking/bookings/1/cancel — 200, статус cancelled
- [ ] **A-007** POST /api/booking/calculate-price — 200, расчёт верный
- [ ] **A-008** POST /api/booking/bookings с полным слотом — 400/409, ошибка "Недостаточно мест"
- [ ] **A-009** Групповая скидка: 6 участников → скидка 10%

---

## Проверка логики

- [ ] **L-001** Генерация слотов: корректные интервалы (open → close, шаг 15 мин)
- [ ] **L-002** Закрытый день (override is_closed=true) → пустой массив слотов
- [ ] **L-003** Слоты не дублируются при повторном запросе
- [ ] **L-004** auto_confirm=true → бронь сразу confirmed
- [ ] **L-005** auto_confirm=false → бронь pending
- [ ] **L-006** При отмене — booked_participants уменьшается, status слота обновляется
