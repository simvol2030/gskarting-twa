# Чек-лист: changes-1-admin-api

**Change:** Backend Admin Booking API
**Session:** session-2

---

## Проверка кода

- [ ] `npm run build` — backend без ошибок
- [ ] `npx tsc --noEmit` — типы корректны
- [ ] Нет отладочного кода (console.log, TODO)
- [ ] Роут зарегистрирован в Express app

---

## API Endpoints

- [ ] **AA-001** GET /api/admin/booking/dashboard — данные для дашборда | HIGH
- [ ] **AA-002** GET /api/admin/booking/bookings — список с фильтрами | HIGH
- [ ] **AA-003** POST /api/admin/booking/bookings — ручное создание | HIGH
- [ ] **AA-004** PATCH /api/admin/booking/bookings/:id — обновление статуса | HIGH
- [ ] **AA-005** GET /api/admin/booking/slots?date= — слоты на дату | HIGH
- [ ] **AA-006** POST /api/admin/booking/slots/:id/block — блокировка | HIGH
- [ ] **AA-007** POST /api/admin/booking/slots/:id/unblock — разблокировка | HIGH
- [ ] **AA-008** POST /api/admin/booking/schedule/override — исключение для дня | HIGH
- [ ] **AA-009** GET /api/admin/booking/config — чтение настроек | HIGH
- [ ] **AA-010** PATCH /api/admin/booking/config — обновление настроек | HIGH

---

## Безопасность

- [ ] **AA-011** Все endpoints возвращают 401 без JWT | CRITICAL
- [ ] JWT middleware применяется ко всему роутеру
- [ ] admin_id извлекается из JWT для логирования

---

## Бизнес-логика

- [ ] Ручное создание: source='admin', created_by_admin_id из JWT
- [ ] Переходы статусов валидируются (pending->confirmed, pending->cancelled, etc.)
- [ ] Атомарное обновление booked_participants при создании брони
- [ ] Блокировка слота меняет статус на 'blocked'
- [ ] Разблокировка пересчитывает статус (available/limited/booked)
- [ ] Каждое действие -> запись в booking_action_log
- [ ] Dashboard statistics агрегируются корректно

---

**Всего: 24 проверки**
