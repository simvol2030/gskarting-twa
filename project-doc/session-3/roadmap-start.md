# Session 3: Live Schedule + Bot Notifications + Action Log

**Status:** IN_PROGRESS
**Dependencies:** Session 1 (Core) + Session 2 (Admin) — deployed
**APF Source:** `.apf/sessions/session-3-booking-live/`

---

## Overview

"Живая" часть системы бронирования. Два параллельных трека:

1. **changes-1-live-schedule** (Developer 1): Live Schedule Engine + Shift UI + Action Log
2. **changes-2-bot-notifications** (Developer 2): Telegram bot notifications + inline buttons + scheduler

---

## Architecture Decisions

### Разделение файлов между Девелоперами

Чтобы два Девелопера работали параллельно без конфликтов:

**Developer 1 (Live Schedule) работает с:**
- `backend-expressjs/src/services/booking-shift.service.ts` (NEW)
- `backend-expressjs/src/routes/admin/booking.ts` (ADD shift + action-log endpoints В КОНЕЦ файла)
- `frontend-sveltekit/src/lib/api/admin/booking.ts` (ADD shift + log API functions В КОНЕЦ файла)
- `frontend-sveltekit/src/routes/(admin)/bookings/+page.svelte` (UPDATE: add shift button to timeline slots)
- `frontend-sveltekit/src/routes/(admin)/bookings/+layout.svelte` (ADD tab "Лог")
- `frontend-sveltekit/src/routes/(admin)/bookings/log/+page.svelte` (NEW — action log page)

**Developer 2 (Bot Notifications) работает с:**
- `backend-expressjs/src/services/booking-notification.service.ts` (NEW)
- `backend-expressjs/src/services/booking-scheduler.service.ts` (NEW)
- `backend-expressjs/src/routes/bot/booking.ts` (NEW — отдельный файл для bot endpoints!)
- `telegram-bot/src/` (UPDATE: add booking callback handlers)
- `frontend-sveltekit/src/routes/(admin)/bookings/settings/+page.svelte` (UPDATE: add notification settings section)

### Ключевое правило: Минимизация конфликтов

- Developer 1 НЕ трогает: `telegram-bot/`, `settings/+page.svelte`
- Developer 2 НЕ трогает: dashboard `+page.svelte`, `+layout.svelte`, `log/` directory
- Если оба добавляют в `admin/booking.ts` — Developer 1 в конец, Developer 2 в НОВЫЙ файл `bot/booking.ts`
- Если оба добавляют в `lib/api/admin/booking.ts` — Developer 1 в конец, Developer 2 создаёт `lib/api/admin/booking-notifications.ts`

---

## Dependencies

```
changes-1 (Live Schedule):
  Task 1 (Shift API) → Task 2 (Shift UI)
  Task 7 (Action Log) — independent

changes-2 (Bot Notifications):
  Task 3 (Bot notifications) → Task 4 (Inline buttons)
  Task 5 (Admin notifications) — independent
  Task 6 (Settings UI) — independent
  Task 8 (Scheduler) → depends on Tasks 3 + 4
```

changes-1 и changes-2 — ПОЛНОСТЬЮ ПАРАЛЛЕЛЬНЫ, нет зависимостей друг от друга.

---

*Version: 1.0 | 2026-02-10*
