# Спецификация: Backend Admin Booking API

**Версия:** final
**Change:** changes-1-admin-api
**Session:** session-2

---

## Есть сейчас vs Должно быть

| Аспект | Есть | Должно быть |
|--------|------|-------------|
| Admin booking API | Нет admin endpoints для бронирований | 10 admin endpoints с JWT |
| Dashboard data | Нет агрегированных данных | Endpoint для статистики + слотов дня |
| Booking management | Только public API (создание/отмена) | Admin CRUD: подтверждение, редактирование, ручное создание |
| Slot management | Нет блокировки/разблокировки | Endpoint-ы для block/unblock/override |
| Config management | Нет admin доступа к настройкам | GET + PATCH для booking_config |
| Action logging | Таблица `booking_action_log` пустая | Каждое admin-действие логируется |

---

## Что на выходе

Полноценный Admin API для управления бронированиями:
- 10 endpoints защищённых JWT авторизацией
- Сервис `admin-booking.service.ts` с бизнес-логикой
- Роут `admin/booking.routes.ts` зарегистрированный в Express
- Логирование всех действий админа

---

## Endpoints

```
GET    /api/admin/booking/dashboard        — статистика + слоты дня
GET    /api/admin/booking/bookings         — список бронирований с фильтрами
POST   /api/admin/booking/bookings         — ручное создание (source=admin)
PATCH  /api/admin/booking/bookings/:id     — обновление статуса/деталей
GET    /api/admin/booking/slots?date=      — слоты на дату (для admin view)
POST   /api/admin/booking/slots/:id/block  — блокировка слота
POST   /api/admin/booking/slots/:id/unblock — разблокировка
POST   /api/admin/booking/schedule/override — исключение для дня
GET    /api/admin/booking/config           — чтение настроек
PATCH  /api/admin/booking/config           — обновление настроек
```

---

## Детали каждого endpoint

### GET /api/admin/booking/dashboard
**Query:** `?date=YYYY-MM-DD` (по умолчанию = сегодня)
**Response:**
```json
{
  "date": "2026-02-10",
  "stats": {
    "totalBookings": 12,
    "totalParticipants": 34,
    "totalRevenue": 27600,
    "occupancyPercent": 45
  },
  "slots": [/* массив слотов с бронированиями */]
}
```
- `occupancyPercent` = (общее booked_participants / общее max_participants) * 100
- `slots` включают вложенные бронирования для каждого слота

### GET /api/admin/booking/bookings
**Query params:**
- `date` — фильтр по дате (YYYY-MM-DD)
- `status` — фильтр по статусу (pending/confirmed/cancelled/completed/no_show)
- `participant_type` — adult/child
- `search` — поиск по contact_name или contact_phone (LIKE %search%)
- `page`, `limit` — пагинация (по умолчанию page=1, limit=20)

**Response:**
```json
{
  "bookings": [/* массив бронирований */],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

### POST /api/admin/booking/bookings
**Body:**
```json
{
  "date": "2026-02-15",
  "slot_id": 123,
  "duration": 15,
  "participant_type": "adult",
  "participant_count": 3,
  "contact_name": "Иван Петров",
  "contact_phone": "+79161234567",
  "notes": "По телефону"
}
```
- `source` = 'admin' (автоматически)
- `created_by_admin_id` из JWT
- Проверка доступности слота (атомарно)
- Запись в `booking_action_log` (action = 'created')

### PATCH /api/admin/booking/bookings/:id
**Body:**
```json
{
  "status": "confirmed",
  "admin_notes": "Подтверждено по звонку"
}
```
- Валидация переходов статусов:
  - pending -> confirmed, cancelled
  - confirmed -> cancelled, completed, no_show
  - cancelled -> (нельзя менять)
  - completed -> (нельзя менять)
  - no_show -> (нельзя менять)
- Запись в `booking_action_log` (action = 'confirmed'/'cancelled'/'edited')

### GET /api/admin/booking/slots
**Query:** `?date=YYYY-MM-DD`
**Response:** Массив слотов с подробной информацией (booked_participants, max_participants, блокировка, бронирования внутри)

### POST /api/admin/booking/slots/:id/block
**Body:**
```json
{
  "reason": "Техническая неисправность"
}
```
- `blocked_by_admin_id` из JWT
- Статус слота -> 'blocked'

### POST /api/admin/booking/slots/:id/unblock
- Убирает блокировку
- Пересчитывает статус (available/limited/booked)

### POST /api/admin/booking/schedule/override
**Body:**
```json
{
  "date": "2026-02-23",
  "is_closed": true,
  "reason": "Праздник"
}
```
или:
```json
{
  "date": "2026-02-23",
  "is_closed": false,
  "custom_open": "09:00",
  "custom_close": "20:00",
  "reason": "Укороченный день"
}
```

### GET /api/admin/booking/config
**Response:** Полный объект `booking_config`

### PATCH /api/admin/booking/config
**Body:** Частичное обновление полей `booking_config`
```json
{
  "slot_interval_minutes": 20,
  "auto_confirm": false,
  "pricing_adult": {"10": 900, "15": 1200, "20": 1500}
}
```

---

## Файлы

| Файл | Описание |
|------|----------|
| `backend-expressjs/src/routes/admin/booking.routes.ts` | Express роутер с 10 endpoints |
| `backend-expressjs/src/services/admin-booking.service.ts` | Бизнес-логика (dashboard, CRUD, slots) |

**Существующие файлы (НЕ трогать, но использовать):**
- `src/db/schema.ts` — таблицы уже есть
- `src/services/booking.service.ts` — можно переиспользовать calculatePrice
- `src/services/booking-slot.service.ts` — getSlotsForDate, getBookingConfig
- `src/middleware/auth.ts` — JWT middleware
- `src/routes/admin/*.ts` — паттерн для нового роута

**Регистрация роута:** Добавить в `src/index.ts` или `src/app.ts`:
```typescript
import bookingAdminRoutes from './routes/admin/booking.routes';
app.use('/api/admin/booking', authMiddleware, bookingAdminRoutes);
```

---

## Факторы реализации

- JWT middleware уже существует — использовать как в других admin routes
- `adminId` доступен через `req.user.id` после JWT проверки
- Таблицы в БД уже созданы (Session 1) — не нужно менять schema
- `booking_action_log` готова для записи — использовать при каждом действии
- Атомарность: использовать SQLite transactions для обновления слотов

---

## Критерии успеха

- [ ] Все 10 endpoints работают и возвращают корректные данные
- [ ] Все endpoints отдают 401 без JWT токена
- [ ] Dashboard агрегирует статистику корректно
- [ ] Ручное создание брони атомарно обновляет слот
- [ ] Переходы статусов валидируются (нельзя подтвердить отменённую)
- [ ] Каждое действие записывается в booking_action_log
- [ ] Блокировка слота делает его недоступным для бронирования
- [ ] `npm run build` без ошибок

---

## Чек-лист браузера

- [ ] AA-001..AA-011 из session-level checklist.md
