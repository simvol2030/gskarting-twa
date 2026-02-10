# Plan: changes-2-booking-widget — Widget + TWA + Standalone

**Дата:** 2026-02-10
**Источник:** spec-final.md
**Зависимости:** changes-1-db-api (API должен работать)

---

## Задачи

| # | Задача | DoD | Файлы |
|---|--------|-----|-------|
| 1 | TypeScript типы + API-клиент | Типы для booking данных, функции для API вызовов | types/booking.ts, api/booking.ts |
| 2 | BookingCalendar (Шаг 1) | Календарь с индикацией, навигация, горизонт 90 дней | BookingCalendar.svelte |
| 3 | BookingSlots (Шаг 2) | Toggle типов, сетка слотов с местами | BookingSlots.svelte |
| 4 | BookingDetails (Шаг 3) | Форма с валидацией, расчёт цены | BookingDetails.svelte |
| 5 | BookingConfirm + BookingSuccess (Шаг 4-5) | Сводка, создание, экран успеха | BookingConfirm.svelte, BookingSuccess.svelte |
| 6 | BookingWidget (объединение) | 5 шагов, mode prop, переходы | BookingWidget.svelte |
| 7 | Интеграция на главную TWA | Виджет под сторисами | +page.svelte (главная) |
| 8 | Standalone-страница | /booking, iframe-ready | routes/booking/+page.svelte |

---

## Задача 1: TypeScript типы + API-клиент

**DoD:**
- [ ] Типы: BookingConfig, TimeSlot, DaySchedule, Booking, CreateBookingRequest, PriceCalculation
- [ ] API-клиент: getConfig, getSchedule, getScheduleRange, createBooking, getBooking, cancelBooking, calculatePrice
- [ ] Следует паттерну существующих API-клиентов в проекте

**Как делать:**
1. Найти существующие типы и API-клиенты в `src/lib/` — использовать как образец
2. Определить типы на основе API response из spec-final
3. Создать функции-обёртки для fetch

---

## Задача 2: BookingCalendar (Шаг 1)

**DoD:**
- [ ] Месячный календарь с навигацией (← →)
- [ ] Индикация загруженности: зелёный (available), жёлтый (limited), красный (booked), серый (closed)
- [ ] Прошедшие даты серые и неактивные
- [ ] Горизонт: сегодня + booking_horizon_days
- [ ] Выбор даты → emit event с выбранной датой
- [ ] Загрузка данных через API (schedule/range)
- [ ] Loading state при загрузке

**Дизайн:**
- Dark theme: фон #1a1a1a, текст #ffffff
- Текущий день подсвечен
- Выбранный день — красная обводка (#ff1744)
- Дни с индикацией: маленькая точка внизу числа

---

## Задача 3: BookingSlots (Шаг 2)

**DoD:**
- [ ] Toggle: Взрослые / Дети (если разные типы слотов)
- [ ] Сетка слотов: время, тип, свободные места
- [ ] Цвета: зелёный (>50%), жёлтый (<=50%), серый (0 мест, disabled)
- [ ] Смещённые слоты: badge "+N мин"
- [ ] Предупреждение внизу: "Время может сместиться"
- [ ] Выбор слота → emit event
- [ ] Загрузка через API (schedule/:date)

**Дизайн:**
- Слоты как карточки или кнопки в сетке (3-4 колонки на мобильном)
- Каждый слот: время (крупно), свободно X мест (мелко)

---

## Задача 4: BookingDetails (Шаг 3)

**DoD:**
- [ ] Выбор длительности (radio/select)
- [ ] Counter участников (±, ограничен доступными местами)
- [ ] Форма: имя, телефон (маска +7), email, комментарий
- [ ] Чекбоксы: правила, смещение
- [ ] Расчёт стоимости (обновляется при изменениях)
- [ ] Валидация: обязательные поля, формат телефона
- [ ] Кнопка "Далее" disabled при невалидной форме

**Дизайн:**
- Инпуты: фон #2a2a2a, border #444, focus border #ff1744
- Ошибки валидации: красный текст под полем

**Маска телефона:**
- Формат: +7 (XXX) XXX-XX-XX
- Можно использовать простую маску без библиотек или svelte-input-mask

---

## Задача 5: BookingConfirm + BookingSuccess

**DoD:**
- [ ] BookingConfirm: сводка всех данных, кнопка "Подтвердить"
- [ ] При клике — POST /api/booking/bookings
- [ ] Loading state при отправке
- [ ] Ошибка (нет мест и т.д.) — показать сообщение, дать вернуться
- [ ] BookingSuccess: номер брони, данные, инструкции, кнопка "Вернуться"

---

## Задача 6: BookingWidget (объединение)

**DoD:**
- [ ] Все 5 шагов работают как единый компонент
- [ ] Props: mode, telegramUserId, compact
- [ ] Навигация между шагами (вперёд/назад)
- [ ] Прогресс-бар или индикатор шагов (1-2-3-4-5)
- [ ] Анимации переходов (slide или fade)
- [ ] Состояние сохраняется при навигации назад

**State management:**
```svelte
let step = $state(1);
let selectedDate = $state('');
let selectedSlot = $state(null);
let bookingDetails = $state({...});
let booking = $state(null); // результат
```

---

## Задача 7: Интеграция на главную TWA

**DoD:**
- [ ] BookingWidget отображается на главной ПОД сторисами
- [ ] telegram_user_id передаётся из TWA контекста
- [ ] Заголовок секции (например "Забронировать заезд")
- [ ] Не ломает существующий layout

**Как делать:**
1. Найти главную страницу (route `/`)
2. Найти компонент/секцию сторис
3. Добавить BookingWidget после сторис
4. Передать telegramUserId из Telegram WebApp SDK

---

## Задача 8: Standalone-страница

**DoD:**
- [ ] Маршрут /booking
- [ ] BookingWidget в mode='standalone'
- [ ] Без навигации TWA, без Telegram SDK
- [ ] Мета-теги (title, description)
- [ ] Адаптивность: mobile + tablet + desktop
- [ ] Iframe-ready (проверить headers)

**Как делать:**
1. Создать `routes/booking/+page.svelte`
2. Минимальный layout: только BookingWidget
3. Заголовок, фон, возможно лого
4. Проверить SvelteKit CSP/headers для iframe

---

## Зависимости

```
Задача 1 (типы+API) → Задачи 2-5 (компоненты, параллельно) → Задача 6 (объединение) → Задачи 7, 8 (интеграция)
```

---

*Plan подготовлен CLI (Планировщиком). Developer: проведи аудит плана и скорректируй при необходимости.*
