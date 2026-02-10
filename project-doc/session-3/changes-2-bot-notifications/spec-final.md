# changes-2: Telegram Bot Notifications + Scheduler

**Developer 2 track**
**APF Tasks:** 3 (Bot notifications) + 4 (Inline buttons) + 5 (Admin notifications) + 6 (Settings UI) + 8 (Scheduler)

---

## Есть сейчас vs Должно быть

| Аспект | Есть | Должно быть |
|--------|------|-------------|
| При создании TWA-брони | Ничего | Бот отправляет подтверждение клиенту |
| Напоминание перед заездом | Нет | За N часов бот отправляет с inline-кнопками "Подтверждаю"/"Не подтверждаю" |
| При смещении расписания | Ничего | Бот уведомляет затронутых клиентов о новом времени |
| При отмене админом | Ничего | Бот уведомляет клиента |
| Уведомления админу | Нет | Бот отправляет админу "Новая бронь: [детали]" |
| Настройки уведомлений | Нет | Toggle + hours before + shift threshold в админке |
| Scheduler | Нет | Cron-задача проверяет и отправляет напоминания |

---

## КРИТИЧЕСКИ ВАЖНО

> **Существующий бот (@gskarting_bot) обслуживает систему лояльности!**
> Команды /start, /balance, /help — НЕ ТРОГАТЬ.
> Grammy framework. Webhook. Добавляем НОВЫЕ handlers, не меняем старые.
> **Принцип: минимальное вмешательство в существующий код бота.**

---

## Часть 1: Backend — Notification Service

### Новый сервис

**Файл:** `backend-expressjs/src/services/booking-notification.service.ts`

```typescript
export class BookingNotificationService {
  // При создании TWA-брони
  async sendBookingConfirmation(booking: Booking): Promise<void>

  // Напоминание перед заездом (с inline-кнопками)
  async sendReminder(booking: Booking): Promise<void>

  // При смещении
  async sendShiftNotification(booking: Booking, oldTime: string, newTime: string, reason: string): Promise<void>

  // При отмене
  async sendCancellationNotification(booking: Booking, reason: string): Promise<void>

  // Новая бронь → админу
  async notifyAdmin(booking: Booking): Promise<void>
}
```

### Формат сообщений

**1. Подтверждение бронирования:**
```
✅ Вы записаны на заезд!

📅 Дата: 15 февраля 2026
🕐 Время: 14:30
👤 Участников: 3
💰 Стоимость: 2400 ₽ (оплата на месте)

Номер брони: #1234

ℹ️ Приезжайте за 15 минут для инструктажа.
Время заезда может сместиться на ±15 мин.
```

**2. Напоминание (с inline-кнопками):**
```
🏎 Напоминание о заезде!

📅 Завтра, 15 февраля в 14:30
👤 Участников: 3

Подтверждаете участие?

[✅ Подтверждаю] [❌ Не подтверждаю]
```

**3. Уведомление о смещении:**
```
⚠️ Изменение времени заезда

Ваш заезд сдвинут:
🕐 Было: 14:30
🕐 Стало: 14:37

Причина: задержка предыдущего заезда

Номер брони: #1234
```

**4. Уведомление об отмене:**
```
❌ Бронирование отменено

Ваш заезд на 15 февраля в 14:30 был отменён.
Причина: [причина]

Номер брони: #1234
```

**5. Уведомление админу:**
```
🆕 Новая бронь

👤 Иван Петров
📅 15 февраля 14:30
👥 3 участника
💰 2400 ₽
📱 Источник: TWA
```

---

## Часть 2: Backend — Inline Buttons (Grammy)

### Callback handlers

**Файл:** `telegram-bot/src/handlers/booking.ts` (NEW — отдельный файл!)

```typescript
// Grammy inline keyboard
import { InlineKeyboard } from "grammy";

// При отправке напоминания:
const keyboard = new InlineKeyboard()
  .text("✅ Подтверждаю", `booking_confirm_${bookingId}`)
  .text("❌ Не подтверждаю", `booking_decline_${bookingId}`);

// Callback handler:
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("booking_confirm_")) {
    const bookingId = parseInt(data.replace("booking_confirm_", ""));
    // → API: PATCH /api/admin/booking/bookings/:id status=confirmed
    // → answerCallbackQuery("Заезд подтверждён!")
    // → editMessageReplyMarkup (убрать кнопки)
  }

  if (data.startsWith("booking_decline_")) {
    const bookingId = parseInt(data.replace("booking_decline_", ""));
    // → API: PATCH /api/admin/booking/bookings/:id status=cancelled
    // → answerCallbackQuery("Бронирование отменено")
    // → editMessageReplyMarkup (убрать кнопки)
  }
});
```

**Обязательно:**
- `answerCallbackQuery()` — иначе кнопка "зависает"
- `editMessageReplyMarkup()` — убрать кнопки после нажатия
- Try-catch — если бот заблокирован, логировать ошибку, не крашить

### API endpoints для бота

**Файл:** `backend-expressjs/src/routes/bot/booking.ts` (NEW — отдельный от admin!)

```
POST /api/bot/booking/confirm    — callback "Подтверждаю"
POST /api/bot/booking/decline    — callback "Не подтверждаю"
```

> НЕ добавляй эти endpoints в `admin/booking.ts` — там работает Developer 1!

---

## Часть 3: Backend — Scheduler

**Файл:** `backend-expressjs/src/services/booking-scheduler.service.ts`

```typescript
export class BookingSchedulerService {
  // Запуск периодической проверки
  start(intervalMinutes: number = 15): void

  // Одна итерация: найти брони для напоминания → отправить
  async checkAndSendReminders(): Promise<void>

  // Остановка
  stop(): void
}
```

**Логика:**
1. Каждые 15 минут (node-cron или setInterval)
2. SELECT bookings WHERE:
   - start_time BETWEEN now AND now + reminder_hours_before
   - status IN ('pending', 'confirmed')
   - telegram_user_id IS NOT NULL
   - reminder_sent = false
3. Для каждой такой брони → `sendReminder()` → UPDATE reminder_sent = true
4. Логировать количество отправленных

**Интеграция:** Запуск scheduler при старте Express-сервера (в `index.ts`).

Рекомендуется `node-cron`:
```typescript
import cron from 'node-cron';
cron.schedule('*/15 * * * *', () => scheduler.checkAndSendReminders());
```

---

## Часть 4: Frontend — Notification Settings

### Обновить `/bookings/settings/+page.svelte`

Добавить секцию "Уведомления" в конец формы настроек:

```
## Уведомления

[ ] Напоминания включены (toggle/checkbox)
    За сколько часов: [__] (number input, default: 3)

[ ] Уведомления о смещении (toggle/checkbox)
    Мин. смещение для уведомления: [__] мин (number input, default: 5)

[ ] Уведомления админу о новых бронях (toggle/checkbox)
    Telegram chat_id админа: [__________] (text input)
```

### Поля в booking_config (проверить — могут уже быть)

- `reminder_enabled` (boolean)
- `reminder_hours_before` (number, default: 3)
- `shift_notification_threshold` (number, default: 5)
- `admin_notification_enabled` (boolean)
- `admin_telegram_chat_id` (text)

> Если полей нет в booking_config — добавить в schema + API config endpoint.

### API клиент

**Файл:** `frontend-sveltekit/src/lib/api/admin/booking-notifications.ts` (NEW — отдельный файл!)

НЕ добавлять в `booking.ts` — там работает Developer 1.

---

## Edge Cases

- [ ] Bot blocked by user → log error, don't crash process
- [ ] Inline button pressed after booking time → "Заезд уже прошёл"
- [ ] Reminder for cancelled booking → skip, don't send
- [ ] Two reminders for same booking → reminder_sent flag prevents
- [ ] Shift notification only if shift >= threshold (default 5 min)
- [ ] No telegram_user_id (widget/manual booking) → skip notification

---

## Критерии успеха

- [ ] TWA-бронь → бот отправляет подтверждение клиенту
- [ ] Напоминание с inline-кнопками отправляется за N часов
- [ ] "Подтверждаю" → status=confirmed
- [ ] "Не подтверждаю" → бронь отменена, слот освобождён
- [ ] Новая бронь → бот уведомляет админа
- [ ] Scheduler работает (каждые 15 мин проверяет)
- [ ] Настройки уведомлений в админке
- [ ] Существующие команды бота (/start, /balance, /help) НЕ СЛОМАНЫ
- [ ] `npm run build` — backend + frontend без ошибок

---

## Файлы которые НЕЛЬЗЯ трогать (работает Developer 1)

- `frontend-sveltekit/src/routes/(admin)/bookings/+page.svelte` (dashboard) — NOT YOURS
- `frontend-sveltekit/src/routes/(admin)/bookings/+layout.svelte` — NOT YOURS
- `frontend-sveltekit/src/routes/(admin)/bookings/log/` — NOT YOURS
- НЕ создавать `booking-shift.service.ts` — NOT YOURS
- НЕ добавлять в `backend-expressjs/src/routes/admin/booking.ts` — NOT YOURS
  (создай отдельный `bot/booking.ts` для своих endpoints)
- НЕ добавлять в `frontend-sveltekit/src/lib/api/admin/booking.ts` — NOT YOURS
  (создай отдельный `booking-notifications.ts`)

---

*Version: 1.0 | 2026-02-10*
