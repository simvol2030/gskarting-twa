# Session 2: Admin Panel for Bookings — Roadmap

**Дата:** 2026-02-10
**Чек-лист:** checklist.md
**Зависимости:** Session 1 (Core Booking) — DONE

---

## Описание

Раздел "Бронирования" в существующей админ-панели. Админ — ключевая роль: управляет расписанием, создаёт брони по телефону, подтверждает/отменяет, блокирует слоты, настраивает систему. Хронометраж в реальном времени. Responsive — работает на мобильном и десктопе. Несколько админов с логированием действий.

---

## Changes (порядок выполнения)

| # | Change | Описание | Зависимости |
|---|--------|----------|-------------|
| 1 | changes-1-admin-api | Backend: 10 Admin API endpoints (booking CRUD, slots, config) | — |
| 2 | changes-2-admin-dashboard | Frontend: Dashboard + Timeline View + Хронометраж | changes-1 |
| 3 | changes-3-admin-management | Frontend: Таблица бронирований + Ручное создание + Слоты + Настройки | changes-1 |

**Порядок:** сначала backend API (changes-1), потом frontend (changes-2 и changes-3 можно параллельно).

---

## Архитектурные решения

### Интеграция в существующую админку
- Навигация: пункт "Бронирования" в сайдбаре `(admin)/+layout@.svelte`
- Маршруты: `/admin/bookings/` (внутри route group `(admin)/`)
- Layout: используем существующий `(admin)/+layout@.svelte` и `+layout.server.ts`
- Auth: все admin endpoints защищены JWT (как существующие)

### Существующие ресурсы (из Session 1)
- 6 таблиц в БД (`bookingConfig`, `bookingSlots`, `bookings`, `bookingScheduleOverrides`, `bookingShiftLog`, `bookingActionLog`)
- Public booking API (`/api/booking/*`) — 7 endpoints
- BookingWidget с 5 шагами — работает
- Сервисы: `booking.service.ts`, `booking-slot.service.ts`

### Backend
- Новый файл: `backend-expressjs/src/routes/admin/booking.routes.ts`
- Новый сервис: `backend-expressjs/src/services/admin-booking.service.ts`
- Все endpoints под `/api/admin/booking/*`
- Каждое действие → запись в `booking_action_log`
- Валидация переходов статусов

### Frontend
- Страницы внутри `(admin)/` route group
- Компоненты в `src/lib/components/admin/booking/`
- Dark theme — согласовать с существующей админкой
- Responsive: desktop (> 1024px) + mobile (375px)

---

## Навигация админки (текущая → новая)

Текущий sidebar содержит 19 пунктов. Добавить:
- Пункт "Бронирования" с подменю:
  - Dashboard (/admin/bookings)
  - Список бронирований (/admin/bookings/list)
  - Управление слотами (/admin/bookings/slots)
  - Настройки (/admin/bookings/settings)

---

*Версия: 1.0 | 2026-02-10*
