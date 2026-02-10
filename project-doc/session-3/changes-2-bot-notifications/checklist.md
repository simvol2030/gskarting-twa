# Checklist: changes-2-bot-notifications

## Code
- [ ] `npm run build` backend — no errors
- [ ] `npm run build` frontend — no errors
- [ ] Existing bot commands (/start, /balance, /help) STILL WORK
- [ ] No debug code

## Notification Service
- [ ] TWA booking → bot sends confirmation to client
- [ ] Widget/manual booking (no TG ID) → NO notification
- [ ] Shift notification sent to affected clients
- [ ] Cancellation notification sent to client
- [ ] Admin notified about new bookings
- [ ] All notifications have correct format/text

## Inline Buttons
- [ ] Reminder has "Подтверждаю" / "Не подтверждаю" buttons
- [ ] "Подтверждаю" → booking status = confirmed, client gets ack
- [ ] "Не подтверждаю" → booking cancelled, slot freed, client gets ack
- [ ] Buttons removed after pressing (editMessageReplyMarkup)
- [ ] Repeat press handled gracefully
- [ ] Button press after booking time → "Заезд уже прошёл"

## Scheduler
- [ ] Scheduler runs every 15 minutes
- [ ] Finds bookings needing reminders (time window + status + has TG ID)
- [ ] Sends reminders and marks reminder_sent = true
- [ ] Skips already-sent and cancelled bookings

## Settings UI
- [ ] "Уведомления" section in settings page
- [ ] Toggle: reminders enabled/disabled
- [ ] Input: hours before reminder
- [ ] Input: shift notification threshold
- [ ] Toggle: admin notifications
- [ ] Settings saved via existing config API

## Edge Cases
- [ ] Bot blocked by user → error logged, no crash
- [ ] No telegram_user_id → skip silently
- [ ] Shift < threshold → no notification

**Total: 28 checks**
