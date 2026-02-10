# Checklist: changes-1-live-schedule

## Code
- [ ] `npm run build` backend — no errors
- [ ] `npm run build` frontend — no errors
- [ ] No debug code

## Shift API
- [ ] POST /api/admin/booking/slots/:id/shift — works (preview + apply)
- [ ] POST /api/admin/booking/slots/bulk-shift — works
- [ ] Cascade shifts ALL subsequent slots on same date
- [ ] Preview returns correct count of affected slots + bookings
- [ ] Warning if shifted slots exceed working hours
- [ ] Shift recorded in action log

## Shift UI
- [ ] "Сместить" button visible on timeline slots
- [ ] ShiftModal: minutes input + reason dropdown + cascade toggle
- [ ] Preview shows affected slots list (old time → new time)
- [ ] Confirm → shifts applied, timeline updates without reload
- [ ] Shifted slots show "+N мин" badge
- [ ] "Сместить все" bulk button works

## Action Log
- [ ] GET /api/admin/booking/action-log — returns log entries
- [ ] "Лог" tab visible in bookings navigation
- [ ] Log page shows: date, admin, action, entity, details
- [ ] Filters: by admin, by action, by date
- [ ] All booking actions (create/confirm/cancel/shift/edit) logged

**Total: 20 checks**
