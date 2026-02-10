# Technical Validation Report

**Page:** https://gsracing-twa.klik1.ru + https://gsracing-twa.klik1.ru/booking
**Admin:** https://gsracing-twa.klik1.ru/login (not tested in this session)
**Date:** 2026-02-10 10:05
**Session:** session-1-v1
**Checklist:** None provided (task-specific items from user request)

---

## Summary

| Category | Status | Critical | Warnings |
|----------|--------|----------|----------|
| Console | WARNING | 0 | 3 |
| Network | WARNING | 0 | 3 |
| Functionality | PASS | 0 | 1 |
| API/Backend | PASS | 0 | 0 |
| Error Handling | PASS | 0 | 1 |
| Performance | PASS | 0 | 0 |

**Overall Status:** WARNING (0 critical issues, 7 warnings)

---

## Critical Issues (Must Fix)

_No critical issues found. All core booking functionality works._

---

## Warnings (Should Fix)

### WARN-1: [Network] Google Fonts blocked by CSP policy
- **Category:** Network / Console
- **Step found:** 2, 3
- **Description:** The stylesheet from `fonts.googleapis.com` is blocked by Content Security Policy. The CSP directive `style-src 'self' 'unsafe-inline'` does not allow loading external stylesheets from `fonts.googleapis.com`.
- **Evidence:** Console error: `Loading the stylesheet 'https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Inter:wght@400;500;600;700&display=swap' violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline'"`
- **Impact:** The fonts Unbounded and Inter are not loading. The page falls back to system fonts. This affects visual design but not functionality.
- **Present on:** Every page (main, /booking, /nonexistent-page-test-404)

### WARN-2: [Network] Missing promotion image (404)
- **Category:** Network
- **Step found:** 3
- **Description:** Promotion image returns 404.
- **Evidence:** `GET https://gsracing-twa.klik1.ru/api/uploads/promotions/promotion_1768138410097_ill23o.webp => [404]`
- **Impact:** One promotion card image is broken on the main page. Visually the image area appears blank/broken.
- **Present on:** Main page (/)

### WARN-3: [Network] Missing placeholder image (404)
- **Category:** Network
- **Step found:** 3
- **Description:** Placeholder image returns 404.
- **Evidence:** `GET https://gsracing-twa.klik1.ru/placeholder.webp => [404]`
- **Impact:** Fallback placeholder image is missing. When product images fail to load, no fallback is shown.
- **Present on:** Main page (/)

### WARN-4: [Console] Telegram user initialization warnings (expected outside TG)
- **Category:** Console
- **Step found:** 2
- **Description:** When running outside of Telegram, the app continuously polls for Telegram user data (every ~200ms for 30+ seconds) before timing out. Then logs `[initializeUser] CRITICAL: Telegram user data not available`.
- **Evidence:** 100+ repeated log entries `[waitForTelegramUser] Waiting for initDataUnsafe...`, followed by `[initializeUser] CRITICAL: Telegram user data not available` and `Diagnostic info: {hasTelegram: true, hasWebApp: true, hasInitData: true, hasUser: false}`
- **Impact:** This is expected behavior when running outside Telegram (the app is a Telegram Mini App). The app gracefully falls back to "Demo" mode showing "Demo Пользователь" with 500 points. Not a bug, but the polling generates excessive console noise and the timeout (30s) is very long.
- **Present on:** All pages when accessed outside Telegram

### WARN-5: [Console] Deprecated meta tag warning
- **Category:** Console
- **Step found:** 2
- **Description:** The meta tag `apple-mobile-web-app-capable` generates a deprecation warning.
- **Evidence:** `<meta name="apple-mobile-web-app-capable" content="yes">`
- **Impact:** Minimal. Deprecation warning, does not affect functionality.
- **Present on:** All pages

### WARN-6: [Functionality] Booking widget on main page shows "Загрузка..." initially
- **Category:** Functionality
- **Step found:** 1, 4
- **Description:** The booking widget section on the main page initially renders with text "Загрузка..." (Loading...) while the calendar and config data are being fetched from the API.
- **Impact:** Users see a loading state briefly before the calendar appears. The calendar does load successfully after the API responses arrive. This is minor but could be improved with a skeleton loader.
- **Present on:** Main page (/) only

### WARN-7: [Error Handling] 404 page is functional but minimal
- **Category:** Error Handling
- **Step found:** 6
- **Description:** The 404 page shows just "404 / Not Found" with no helpful guidance or link back to the home page (beyond the standard navigation).
- **Impact:** Users who reach a non-existent URL see a very sparse page. A more user-friendly 404 with a "Return to home" button and helpful text would improve UX.
- **Screenshot:** step6-404-page.png

---

## Passed Checks

### Booking Page (/booking)
- The /booking page loads correctly with title "Бронирование заезда -- GS Racing"
- 4-step booking wizard UI is present and visible (steps 1-2-3-4 at top)
- Step 1 (Date selection): Calendar for February 2026 displays correctly with past dates disabled (1-9) and future dates clickable (10-28)
- Step 1: Date availability indicators work (green dots for available, legend shows "Свободно / Мало мест / Нет мест")
- Step 2 (Time slot selection): Clicking a date transitions to time slot view with heading showing date and day of week
- Step 2: Participant type tabs work ("Взрослые (от 14)" / "Дети (6-13)")
- Step 2: Time slots display correctly from 10:00 to 22:45 with available spots count
- Step 2: "Назад" (Back) button returns to calendar
- Step 3 (Details): Clicking a time slot transitions to booking details form
- Step 3: Duration selection works (10/15/20 мин buttons)
- Step 3: Participant counter works (+/- buttons, shows available spots)
- Step 3: Price calculation updates dynamically (tested: 10 min = 800 RUB/person, 15 min = 1100 RUB/person, 2 people = 2x price)
- Step 3: Contact form fields present (Name, Phone with mask, Email, Comment)
- Step 3: Required checkboxes present (rules acceptance, time shift agreement)
- Step 3: "Далее" (Next) button present

### Booking Widget on Main Page
- The "Забронировать заезд" section exists on the main page below the loyalty card
- Calendar widget loads and displays with correct month/year
- Date availability data loads from API

### API Endpoints
- `GET /api/booking/config` -- 200 OK, returns valid JSON with slot_durations, pricing_adult, pricing_child, working_hours, max_participants, group_discount settings
- `GET /api/booking/schedule/2026-02-15` -- 200 OK, returns 52 available slots from 10:00 to 22:45, each with 8 available spots
- `GET /api/booking/schedule/range?from=2026-02-10&to=2026-03-10` -- 200 OK, returns date availability for 29 days with total_spots and booked_spots per day
- `POST /api/booking/calculate-price` with `{participant_type:"adult",duration:10,participant_count:3}` -- 200 OK, returns correct calculation: 800 RUB/person, subtotal 2400, total 2400, no group discount (below threshold of 5)
- All API responses include `success: true` wrapper with `data` payload

### Network (Booking-specific)
- `/api/booking/config` -- 200 OK
- `/api/booking/schedule/range?from=2026-02-01&to=2026-02-28` -- 200 OK
- `/api/booking/schedule/2026-02-12` -- 200 OK (loaded on date click)
- `/api/cart` -- 200 OK
- `/api/loyalty/settings` -- 200 OK
- All JS/CSS assets loaded successfully with 200 status

### Performance
- Page load time: 198ms (excellent, well under 3s target)
- DOM content loaded: 180ms
- Total resources: 49 requests
- No slow requests (all under 200ms)
- No large unoptimized assets detected
- Total transfer size is minimal (assets are served compressed/cached)

### Error Handling
- 404 page exists and renders correctly (does not crash, shows "404 Not Found")
- Navigation remains functional on 404 page

---

## Task-Specific Checklist Verification

| # | Checklist Item | Status | Notes |
|---|---------------|--------|-------|
| 1 | Main page has booking widget section below stories | PASS | Section exists with heading "Забронировать заезд" and functional calendar |
| 2 | /booking page loads and works | PASS | Loads with title "Бронирование заезда -- GS Racing", 4-step wizard functional |
| 3a | GET /api/booking/config returns config JSON | PASS | 200 OK, valid JSON with pricing, durations, working hours |
| 3b | GET /api/booking/schedule/2026-02-15 returns slots | PASS | 200 OK, 52 slots from 10:00-22:45, all available with 8 spots each |
| 3c | GET /api/booking/schedule/range returns date availability | PASS | 200 OK, 29 dates with status "available" and correct total_spots |
| 3d | POST /api/booking/calculate-price works | PASS | 200 OK, correct calculation: 3 adults x 10 min = 2400 RUB |
| 4 | Console errors on main page | WARNING | 5 errors: CSP font block, 2 missing images (404), 2 Telegram user init errors (expected outside TG) |
| 4 | Console errors on /booking | WARNING | 1 error: CSP font block (same as main page). Much cleaner than main page. |
| 5 | Network failed requests | WARNING | 2 CSP-blocked font requests, 2 image 404s on main page. No failures on /booking page. |
| 6 | Booking flow: date -> slots -> details | PASS | Full flow works: calendar -> date selection -> time slots -> details form with pricing |

---

## Raw Data

<details>
<summary>Console Errors (full log)</summary>

```
=== MAIN PAGE (/) ===

[ERROR] Loading the stylesheet 'https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Inter:wght@400;500;600;700&display=swap' violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline'". Note that 'style-src-elem' was not explicitly set, so 'style-src' is used as a fallback.

[ERROR] Failed to load resource: the server responded with a status of 404 ()
  URL: https://gsracing-twa.klik1.ru/api/uploads/promotions/promotion_1768138410097_ill23o.webp

[ERROR] Failed to load resource: the server responded with a status of 404 ()
  URL: https://gsracing-twa.klik1.ru/placeholder.webp

[ERROR] [initializeUser] CRITICAL: Telegram user data not available
  (Expected when running outside Telegram)

[ERROR] [initializeUser] Diagnostic info: {hasTelegram: true, hasWebApp: true, hasInitData: true, hasUser: false}
  (Expected when running outside Telegram)

[WARNING] [waitForTelegramUser] Timeout: SDK initDataUnsafe empty (x2)
[WARNING] [+layout] User initialization returned null
[WARNING] [+layout] Check browser console for errors
[WARNING] <meta name="apple-mobile-web-app-capable" content="yes"> (deprecation)

=== BOOKING PAGE (/booking) ===

[ERROR] Loading the stylesheet 'https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Inter:wght@400;500;600;700&display=swap' violates CSP

[WARNING] <meta name="apple-mobile-web-app-capable" content="yes"> (deprecation)
```

</details>

<details>
<summary>Network Requests (failed only)</summary>

```
=== MAIN PAGE (/) ===
[GET] https://gsracing-twa.klik1.ru/api/uploads/promotions/promotion_1768138410097_ill23o.webp => [404]
[GET] https://gsracing-twa.klik1.ru/placeholder.webp => [404]
[GET] https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Inter:wght@400;500;600;700&display=swap => [FAILED] csp (x2)

=== BOOKING PAGE (/booking) ===
[GET] https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Inter:wght@400;500;600;700&display=swap => [FAILED] csp (x2)
```

</details>

<details>
<summary>Performance Metrics (/booking page)</summary>

```
Page load time: 198ms
DOM content loaded: 180ms
Total requests: 49
Total transfer size: ~10KB (compressed/cached, most assets served from cache)
Largest assets:
  1. /api/booking/schedule/2026-02-12 - 8370 bytes (118ms)
  2. logo.png - 300 bytes (cached)
  3. /api/cart - 300 bytes (125ms)
  4. /api/booking/config - 300 bytes (126ms)
  5. /api/booking/schedule/range - 300 bytes (195ms)
No assets > 500KB
No requests > 3s
```

</details>

<details>
<summary>API Endpoint Responses</summary>

```
=== GET /api/booking/config ===
Status: 200
Response: {
  success: true,
  data: {
    slot_durations: [10, 15, 20],
    default_duration: 10,
    max_participants: 8,
    pricing_adult: { "10": 800, "15": 1100, "20": 1400 },
    pricing_child: { "10": 600, "15": 850, "20": 1100 },
    currency: "RUB",
    group_discount_min: 5,
    group_discount_percent: 10,
    adult_min_age: 14,
    child_min_age: 6,
    child_max_age: 13,
    booking_horizon_days: 90,
    working_hours: { 0: {open:"10:00",close:"23:00"}, 1-5: {open:"11:00",close:"22:00"}, 6: {open:"10:00",close:"23:00"} }
  }
}

=== GET /api/booking/schedule/2026-02-15 ===
Status: 200
Response: {
  success: true,
  data: {
    date: "2026-02-15",
    is_closed: false,
    slots: [52 slots from 10:00 to 22:45, each with max_participants: 8, booked_participants: 0, status: "available"]
  }
}

=== GET /api/booking/schedule/range?from=2026-02-10&to=2026-03-10 ===
Status: 200
Response: {
  success: true,
  data: {
    dates: { [29 entries, each with status: "available", total_spots: 352 or 416 (weekends), booked_spots: 0] }
  }
}

=== POST /api/booking/calculate-price ===
Body: {participant_type:"adult", duration:10, participant_count:3}
Status: 200
Response: {
  success: true,
  data: {
    price_per_person: 800,
    subtotal: 2400,
    group_discount_applied: false,
    discount_percent: 0,
    discount_amount: 0,
    total: 2400,
    currency: "RUB"
  }
}
```

</details>

---

## Screenshots Taken

| File | Description |
|------|-------------|
| step1-main-page-initial.png | Main page viewport on load |
| step1-main-page-full.png | Main page full page scroll |
| step4-booking-page-initial.png | /booking page with calendar |
| step4-booking-slots.png | Step 2 - time slot selection |
| step4-booking-details.png | Step 3 - booking details form with pricing |
| step6-404-page.png | 404 error page |
