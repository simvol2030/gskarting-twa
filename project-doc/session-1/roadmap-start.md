# Session 1: Core Booking System — Roadmap

**Дата:** 2026-02-10
**Чек-лист:** checklist.md

---

## Описание

Фундамент системы бронирования: схема БД, backend API, клиентский виджет бронирования. Виджет **универсальный** — один компонент, который работает и как секция на главной TWA (под сторисами), и как standalone-страница для iframe-встраивания на сайты.

---

## Changes (порядок выполнения)

| # | Change | Описание | Зависимости |
|---|--------|----------|-------------|
| 1 | changes-1-db-api | БД + сервис слотов + Public API | — |
| 2 | changes-2-booking-widget | BookingWidget + интеграция TWA + Standalone | changes-1 |

**Порядок строго последовательный:** сначала backend, потом frontend.

---

## Архитектурные решения

### Модель данных
- 6 новых таблиц через Drizzle ORM (как все существующие)
- `booking_config` — singleton с настройками
- `booking_slots` — слоты с поддержкой нескольких групп (booked_participants)
- `bookings` — бронирования с source (twa/widget/admin)
- `booking_schedule_overrides` — исключения из расписания
- `booking_shift_log` — история смещений (для Session 3)
- `booking_action_log` — лог действий (для Session 3)

### API
- Public endpoints: `/api/booking/*` — без авторизации
- TWA-брони: валидация Telegram initData
- Race condition protection: атомарное обновление booked_participants
- Auto-confirm: если настройка включена — статус сразу confirmed

### Widget
- Один Svelte-компонент `BookingWidget` с props `mode: 'twa' | 'standalone'`
- TWA mode: на главной под сторисами, telegram_user_id из SDK
- Standalone mode: отдельная страница `/booking`, без зависимости от Telegram
- Dark racing theme: чёрный фон, красные акценты, Unbounded + Inter

---

*Версия: 1.0 | 2026-02-10*
