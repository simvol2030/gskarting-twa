# Session 3 — Checklist (Session-Level)

**Source:** `.apf/sessions/session-3-booking-live/checklist.md` (51 check)
**Date:** 2026-02-10

---

## After ALL changes deployed — verify:

### Code
- [ ] `npm run build` backend — no errors
- [ ] `npm run build` frontend — no errors
- [ ] Existing bot commands (/start, /balance, /help) still work
- [ ] No debug code left

### Live Schedule Engine
- [ ] Shift button on timeline slot → modal opens
- [ ] Modal: minutes + reason + cascade toggle
- [ ] Preview shows affected slots + bookings count
- [ ] Confirm → slots shift, timeline updates
- [ ] Shifted slots show "+N min" badge
- [ ] Bulk shift "all from now" works
- [ ] Shift log page: date, slot, minutes, reason, admin

### Bot Notifications
- [ ] TWA booking → bot sends confirmation to client
- [ ] Widget/manual booking (no TG ID) → no notification
- [ ] Reminder sent N hours before (configurable)
- [ ] Reminder has inline buttons: Confirm / Decline
- [ ] "Confirm" → status=confirmed, client gets ack
- [ ] "Decline" → booking cancelled, slot freed
- [ ] Cascade shift → bot notifies affected clients
- [ ] New booking → bot notifies admin
- [ ] Admin settings: toggle reminders, hours before, shift threshold

### Action Log
- [ ] Created/confirmed/cancelled/shifted/edited actions logged
- [ ] Action log page in admin with filters

### Edge Cases
- [ ] Shift past working hours → warning
- [ ] Inline button pressed after booking time passed → handled
- [ ] Bot blocked by user → error logged, not crash
- [ ] Two admins shift simultaneously → no conflict
- [ ] Reminder for cancelled booking → not sent

**Total: 30 session-level checks**
