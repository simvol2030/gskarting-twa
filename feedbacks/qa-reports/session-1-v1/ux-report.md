# UX Verification Report

**Page:** https://gsracing-twa.klik1.ru + https://gsracing-twa.klik1.ru/booking
**Date:** 2026-02-10
**Session:** session-1-v1
**Viewports Tested:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)
**Checklist:** Not provided (verified against design expectations from task description)

---

## Summary

| Category | Checked | Passed | Failed | Warnings |
|----------|---------|--------|--------|----------|
| Layout & Structure | 8 | 5 | 2 | 1 |
| Typography & Content | 7 | 5 | 1 | 1 |
| Images & Media | 5 | 2 | 3 | 0 |
| Responsive (Tablet) | 6 | 5 | 0 | 1 |
| Responsive (Mobile) | 8 | 5 | 2 | 1 |
| Interactions & Flow | 10 | 9 | 0 | 1 |
| Accessibility | 6 | 4 | 1 | 1 |
| **TOTAL** | **50** | **35** | **9** | **6** |

**Pass Rate:** 70%
**Verdict:** PASS WITH WARNINGS (9 issues found: 2 critical, 4 medium, 3 minor)

---

## Critical Issues

### C1: Broken Images on Main Page -- Product Cards and Promotion Banner

- **Viewport:** All (Desktop, Tablet, Mobile)
- **Location:** Main page (/) -- "Topovye uslugi" product cards and "Aktsii mesyatsa" promotion section
- **Expected:** Product images (Tandem kart, Detskiy kart, Vzroslyy kart) and promotion banner ("Budni -- vremya skorosti") should display correctly with actual photos
- **Actual:** All product card images show broken image icons (alt text placeholders visible). The promotion banner image also fails to load (HTTP error response from server for `/uploads/promotions/promotion_1768138410097_ill23o.webp` and `/placeholder.webp`).
- **Screenshot:** `screenshots/01-main-desktop-1920x1080-full.png`, `screenshots/09-main-mobile-375x812-full.png`
- **Impact:** Users see a degraded visual experience with broken image placeholders instead of actual karting photos. This significantly reduces trust and visual appeal. For an entertainment/booking service, images are critical for conversion.
- **Console evidence:** `Failed to load resource: the server responded with a status of...` for promotion and placeholder images.

### C2: Google Fonts Blocked -- Stylesheet Loading Error

- **Viewport:** All
- **Location:** Entire application
- **Expected:** Custom fonts (Unbounded for headings, Inter for body text) should load correctly from Google Fonts
- **Actual:** Console error: "Loading the stylesheet 'https://fonts.googleapis.com/...' has been blocked." The page falls back to system fonts.
- **Screenshot:** Visible in all screenshots -- text rendering uses fallback fonts instead of Unbounded/Inter
- **Impact:** The design specification calls for Unbounded headings and Inter body text. Without these fonts loading, the visual identity of the brand is not presented as designed. Text may appear in generic sans-serif fallback fonts.

---

## Medium Issues

### M1: Excessive Empty Black Space on /booking Page (Calendar Step)

- **Viewport:** Desktop (1920x1080), Tablet (768x1024)
- **Location:** /booking page, Step 1 (Calendar view)
- **Expected:** The page content should fill the available space reasonably, or the container should adapt to content height
- **Actual:** After the calendar grid and legend (Svobodno / Malo mest / Net mest), there is an enormous empty black area that takes up approximately 60% of the visible screen on desktop. The calendar content occupies only the top portion, with a vast dark void below before the footer and navigation bar.
- **Screenshot:** `screenshots/06-booking-desktop-step1-calendar.png`, `screenshots/07-main-tablet-768x1024-full.png`
- **Impact:** The page looks unfinished and wastes screen real estate. Users may think the page failed to load completely.

### M2: Bottom Navigation Bar Overlaps Content on Mobile

- **Viewport:** Mobile (375x812)
- **Location:** /booking page, Step 2 (Time slots view)
- **Expected:** The bottom navigation bar should not overlap page content; content should have sufficient bottom padding to remain fully visible above the fixed navigation
- **Actual:** The fixed bottom navigation bar (Glavnaya, Aktsii, Uslugi, Bonusy, Profil') covers time slot buttons in the area around 15:00. Users scrolling through time slots will find some slots partially hidden behind the navigation bar.
- **Screenshot:** `screenshots/08-booking-mobile-375x812-calendar.png`
- **Impact:** Users cannot easily tap on time slots that fall behind the navigation bar without additional scrolling effort. This creates friction in the booking flow.

### M3: Header Text Truncation on Mobile

- **Viewport:** Mobile (375x812)
- **Location:** Top header bar
- **Expected:** Brand name and subtitle should be fully visible or gracefully handled
- **Actual:** The header shows "GS Karting | Kartin..." with the subtitle "Karting klub" truncated. Additionally, in the bottom navigation, "Profil'" is truncated to "Prof..."
- **Screenshot:** `screenshots/09-main-mobile-375x812-full.png`
- **Impact:** Users see truncated text that looks unprofessional. The brand name is partially cut off.

### M4: "Zagrusska..." (Loading) Text Visible During Telegram Auth Timeout

- **Viewport:** All (when viewed outside Telegram)
- **Location:** Main page (/) -- booking widget section; /booking page initial load
- **Expected:** When the Telegram WebApp SDK times out (not running inside Telegram), the booking widget should either show the calendar immediately or display a meaningful fallback message
- **Actual:** The text "Zagrusska..." (Loading...) is visible for approximately 10 seconds while the app waits for Telegram user authentication to time out. On the main page, this appears in the "Zabronirovat' zaezd" section. On /booking, the entire page shows only "Zagrusska..." until the timeout completes.
- **Screenshot:** `screenshots/03-booking-desktop-loading.png`
- **Impact:** Users accessing the site outside of Telegram (via direct URL) experience a long loading state. This is particularly relevant since the booking page is a standalone URL that could be shared.

---

## Minor Issues

### m1: Footer Text "GS Racing Karting Center" Below Navigation on /booking

- **Viewport:** Desktop, Tablet
- **Location:** /booking page, below the bottom navigation bar
- **Expected:** Footer should be positioned properly within the page layout
- **Actual:** The text "GS Racing Karting Center" appears below the fixed bottom navigation, in a separate light-colored area. It looks disconnected from the main dark-themed content area.
- **Screenshot:** `screenshots/06-booking-desktop-step1-calendar.png`
- **Impact:** Minor cosmetic issue. The footer area looks slightly detached from the main page design.

### m2: Calendar Date 28 Shows Orange/Yellow Dot (Malo Mest) Without Context

- **Viewport:** All
- **Location:** /booking page and main page booking widget, calendar for Feb 28
- **Expected:** All dates should have a clear availability indicator (green for available, orange for low, gray for none)
- **Actual:** Feb 28 has an orange/yellow dot indicating "Malo mest" (few spots), while all other future dates show green ("Svobodno"). This is correct functionality but there is no way for users to know WHY that particular date has fewer spots without selecting it.
- **Screenshot:** `screenshots/06-booking-desktop-step1-calendar.png`
- **Impact:** Very minor -- informational. Users might wonder why one date differs.

### m3: Step Indicator Numbers Not Clearly Visible in Disabled State

- **Viewport:** All
- **Location:** /booking page, step indicator (circles 1-2-3-4) at the top
- **Expected:** Step numbers should be legible in all states (active, completed, disabled)
- **Actual:** The disabled step numbers (gray circles on dark background) have low contrast. The numbers 2, 3, 4 in their inactive state are barely visible against the dark gray circle background.
- **Screenshot:** `screenshots/06-booking-desktop-step1-calendar.png`
- **Impact:** Minor readability issue. Users can still understand the progression but the numbers are hard to read in the inactive state.

---

## Passed Checks

### Layout & Structure
- Page loads successfully at all three viewports
- Mobile-first layout correctly centered on larger viewports (expected for TWA)
- Booking widget is visible on the main page below the loyalty card section
- Bottom navigation bar is present and functional on all viewports
- Hamburger menu icon is present on all viewports and opens the sidebar menu
- Content follows single-column layout (appropriate for TWA)

### Typography & Content
- All text is in Russian as expected
- No Lorem ipsum or placeholder text found in any visible content
- Prices are formatted correctly with ruble symbol (800 rub, 1 100 rub, 1 300 rub, 1 700 rub, 1 800 rub)
- Phone number (+7 (925) 656-67-67) and address are displayed correctly
- Working hours format is correct: "Pn-Cht, Vs: 12:00-21:00 | Pt-Sb: 12:00-22:00"

### Booking Flow (User Flow Testing)
- Step 1 (Calendar): Date selection works correctly. Past dates are disabled (1-9 Feb). Future dates are clickable with availability indicators.
- Step 2 (Slots): Time slot grid displays correctly with "8 mest" for each slot. Adult/Child toggle is present. Weekday hours (11:00-21:45) differ from weekend hours (10:00-22:45) -- correct business logic.
- Step 3 (Details): Duration selector (10/15/20 min) works with dynamic pricing. Participant counter works (increment/decrement). Phone mask formats correctly. Required field validation present (rules checkbox marked with *).
- Step 4 (Confirmation): All entered data is summarized correctly. Payment method shown ("Oplata na meste").
- Step 5 (Success): Booking confirmation shows booking number, all details, arrival instructions, and "Book another" button that resets the flow.
- Back navigation works at each step
- "Book another" button correctly resets to Step 1

### Responsive Behavior
- Calendar grid adapts properly across viewports
- Time slot grid changes from 4 columns (desktop) to 3 columns (mobile)
- Form inputs are full-width on all viewports
- Bottom navigation text adapts (though "Profil'" truncates on mobile)

### Design Theme
- Dark racing theme is consistently applied: black/dark background with red accents
- Red accent color used for headings ("GS Racing"), active buttons, and CTAs
- Loyalty card section uses red gradient background
- Calendar uses dark theme with green/orange/gray availability dots
- Cards have rounded corners (matching ~16px border-radius expectation)

### Interactions
- Calendar date hover shows cursor:pointer on available dates
- Time slot buttons are interactive with cursor:pointer
- Duration buttons highlight the selected option in red
- Form inputs accept text correctly
- Phone mask auto-formats input
- Checkboxes toggle correctly
- "Dalee" (Next) button advances the flow
- "Nazad" (Back) button returns to previous step
- "Podtverdit' bron'" (Confirm booking) creates the booking

### Accessibility
- Page has meaningful heading hierarchy (h1: GS Racing, h2: section titles, h3: subsection titles)
- Buttons have accessible names
- Form inputs have placeholder labels
- Interactive elements have cursor:pointer
- Color coding supplemented by text labels (Svobodno, Malo mest, Net mest)

---

## Screenshots Index

| # | Filename | Description |
|---|----------|-------------|
| 1 | 01-main-desktop-1920x1080-full.png | Main page full view at desktop - shows loyalty card, booking widget, promotions, products |
| 2 | 02-main-desktop-viewport.png | Main page viewport at desktop - above-the-fold content |
| 3 | 03-booking-desktop-loading.png | Booking page during Telegram auth timeout - shows "Zagrusska..." state |
| 4 | 04-booking-desktop-step2-slots.png | Booking page Step 2 at desktop - time slot grid for Sunday |
| 5 | 05-booking-desktop-step3-details.png | Booking page Step 3 at desktop - details form with duration, participants, contacts |
| 6 | 06-booking-desktop-step1-calendar.png | Booking page Step 1 at desktop - calendar with empty space below |
| 7 | 07-main-tablet-768x1024-full.png | Booking page at tablet (768x1024) - calendar with large empty space |
| 8 | 08-booking-mobile-375x812-calendar.png | Booking page at mobile (375x812) - Step 2 slots with nav overlap |
| 9 | 09-main-mobile-375x812-full.png | Main page at mobile - full view showing broken images |
| 10 | 10-booking-desktop-step4-confirmation.png | Booking page Step 4 - confirmation summary |
| 11 | 11-booking-desktop-step5-success.png | Booking page Step 5 - success screen with booking details |

---

## Checklist Coverage

### Design Expectations (from task description)

| # | Check | Status |
|---|-------|--------|
| 1 | Dark racing theme: black background, red accents | PASS -- consistently applied |
| 2 | Fonts: Unbounded (headings) + Inter (text) | FAIL -- Google Fonts blocked (C2) |
| 3 | Rounded cards (border-radius ~16px) | PASS -- visible on product cards and sections |
| 4 | Mobile-first design | PASS -- layout designed for mobile, centered on larger screens |

### Booking Flow (/booking)

| # | Check | Status |
|---|-------|--------|
| 5 | Step 1: Calendar is usable, date selectable | PASS |
| 6 | Step 2: Adult/Child toggle works | PASS |
| 7 | Step 2: Slot grid with available spots | PASS |
| 8 | Step 3: Duration selection | PASS |
| 9 | Step 3: Participant counter | PASS |
| 10 | Step 3: Name and phone inputs | PASS |
| 11 | Step 3: Checkboxes present | PASS |
| 12 | Step 3: Price calculation updates | PASS |
| 13 | Step 4: Confirmation screen correct | PASS |
| 14 | Step 5: Success screen shown | PASS |

### Main Page Booking Widget

| # | Check | Status |
|---|-------|--------|
| 15 | Booking widget visible below stories/loyalty | PASS |
| 16 | Calendar functional in widget | PASS |

### Responsive

| # | Check | Status |
|---|-------|--------|
| 17 | Desktop (1920x1080) | PASS with warnings |
| 18 | Tablet (768x1024) | PASS with warnings |
| 19 | Mobile (375x812) | PASS with warnings |

### Content

| # | Check | Status |
|---|-------|--------|
| 20 | Labels in Russian | PASS |
| 21 | Text readable | PASS |
| 22 | No placeholder/lorem ipsum | PASS |
| 23 | Images display correctly | FAIL (C1) |

```
Total items: 23
Checked: 23
Passed: 19
Failed: 4
Coverage: 100%
Pass rate: 83%
```

---

## Recommendations Priority

### 1. Immediate (Critical -- blocks visual quality)
- **C1:** Fix broken images on the main page. The server is returning error responses for product images and promotion banners. Check that image files exist at the expected paths under `/uploads/` and that the backend serves them correctly. Also fix `/placeholder.webp` which returns a 404.
- **C2:** Resolve Google Fonts loading issue. The stylesheet from `fonts.googleapis.com` is being blocked. This may be a Content-Security-Policy (CSP) header issue, a CORS issue, or the fonts link may be malformed. Investigate the `<link>` tag in `app.html` and server headers.

### 2. Next (Medium -- degrades experience)
- **M1:** Reduce the empty black space on the /booking calendar page. Either set a `min-height` that matches content, or add additional content/CTA below the calendar (e.g., "Need help choosing? Call us" card).
- **M2:** Add `padding-bottom` to the booking content area on mobile to prevent the fixed bottom navigation from overlapping time slot buttons. A value of approximately 70-80px should suffice.
- **M3:** Consider hiding the subtitle "Karting klub" on small screens, or reducing the header text to just "GS" with the logo. Also ensure "Profil'" does not truncate in the bottom nav.
- **M4:** Reduce the Telegram auth timeout for non-Telegram browsers, or show the calendar immediately with a graceful fallback instead of "Zagrusska..." text.

### 3. Later (Minor -- cosmetic improvements)
- **m1:** Adjust footer positioning on /booking to sit within the dark content area.
- **m2:** No action needed -- informational observation.
- **m3:** Increase contrast on disabled step indicator numbers, either by making the circles lighter or the numbers bolder.
