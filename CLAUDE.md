# GS Racing TWA — Codebase Context

**URL:** https://gsracing-twa.klik1.ru
**Тип:** Telegram Mini App для картинг-центра GS Racing — система лояльности, каталог товаров, заказы, POS-интерфейс кассира
**Workflow Developer:** см. `CLAUDE.web.md` (в этой директории)
**Workflow CLI:** см. `../CLAUDE.local.md` (в parent директории)

---

## КРИТИЧЕСКИЕ ПРАВИЛА БЕЗОПАСНОСТИ

### Правило 1: НЕ ТРОГАТЬ ЧУЖИЕ ПОРТЫ

> **ЗАПРЕЩЕНО:** Использовать порты, занятые другими проектами на production сервере!
> При развёртывании с нуля — СНАЧАЛА проверить свободные порты:
> ```bash
> ss -tlnp | grep -E ":[0-9]+" | sort
> ```
> Выбрать СВОБОДНЫЕ порты, не занятые другими проектами.

**Порты ЭТОГО проекта на production:** 3006 (frontend), 3007 (backend).

### Правило 2: НЕ УБИВАТЬ ЧУЖИЕ PM2 ПРОЦЕССЫ

> **ЗАПРЕЩЕНО:** `pm2 kill`, `pm2 delete all`, `pm2 stop all`, `pm2 restart all`!
> На сервере работают 10+ PM2 процессов разных проектов.
> Работать ТОЛЬКО с процессами ЭТОГО проекта:
> ```bash
> pm2 restart gskarting-frontend gskarting-backend
> ```

---

## Структура проекта

```
gsracing-twa/
├── frontend-sveltekit/        # SvelteKit 2.x + Svelte 5
│   ├── src/routes/            # Страницы (admin, cashier, feed, products, ...)
│   │   ├── (admin)/           # Защищённые admin-маршруты
│   │   ├── cashier/           # POS-интерфейс кассира
│   │   ├── feed/              # Лента новостей
│   │   ├── products/          # Каталог товаров
│   │   ├── profile/           # Профиль пользователя
│   │   ├── stores/            # Магазины/точки
│   │   ├── offers/            # Акции
│   │   ├── history/           # История транзакций
│   │   ├── my-orders/         # Заказы пользователя
│   │   ├── checkout/          # Оформление заказа
│   │   ├── seller/            # Интерфейс продавца
│   │   └── api/               # Server-side API routes
│   └── src/lib/               # Компоненты, stores, утилиты
├── backend-expressjs/         # Express.js 5.x REST API
│   ├── src/routes/            # API endpoints
│   │   ├── admin/             # Admin API (dashboard, categories, products, ...)
│   │   ├── bot/               # Telegram bot handlers
│   │   ├── auth.ts            # Аутентификация
│   │   ├── cashier.ts         # Кассир API
│   │   ├── transactions.ts    # Транзакции лояльности
│   │   ├── feed.ts            # Лента
│   │   └── ...
│   ├── src/db/                # Drizzle ORM schema + queries
│   │   ├── schema.ts          # 40 таблиц (SQLite)
│   │   └── queries/           # Подготовленные запросы
│   └── src/services/          # Бизнес-логика
├── telegram-bot/              # Grammy bot (@gskarting_bot)
│   └── src/index.ts           # Bot handlers
├── electron/                  # Electron wrapper для POS-киоска
├── data/
│   ├── db/sqlite/             # SQLite БД
│   ├── logs/                  # Логи приложения
│   └── media/                 # Загруженные файлы
├── project-doc/               # Документация сессий
├── feedbacks/                 # Feedback для Developer
├── scripts/                   # Утилиты (check-env, seed)
├── .claude/                   # Hooks для Telegram уведомлений
└── ecosystem.config.js        # PM2 конфигурация
```

---

## Tech Stack

| Компонент | Технологии |
|-----------|------------|
| **Frontend** | SvelteKit 2.x, Svelte 5, TypeScript, Telegram WebApp SDK |
| **Backend** | Express.js 5.x, TypeScript, Drizzle ORM, JWT |
| **Database** | SQLite (better-sqlite3), Drizzle ORM |
| **Bot** | Grammy (@gskarting_bot) |
| **DevOps** | PM2, Nginx, Let's Encrypt SSL |
| **POS** | Cashier interface (desktop), Virtual Keyboard, Electron wrapper |

---

## База данных (основные таблицы)

| Таблица | Описание |
|---------|----------|
| `users` | Публичные пользователи |
| `admins` | Админы (super-admin, editor, viewer) |
| `loyalty_users` | Пользователи программы лояльности (Telegram) |
| `stores` | Магазины/точки продаж |
| `transactions` | Транзакции лояльности (начисление/списание) |
| `cashier_transactions` | Транзакции кассира |
| `categories` | Категории товаров |
| `products` | Товары/блюда |
| `product_variations` | Вариации товаров |
| `orders` | Заказы |
| `order_items` | Элементы заказа |
| `cart_items` | Корзина |
| `offers` | Акции/предложения |
| `campaigns` | Маркетинговые кампании |
| `campaign_recipients` | Получатели кампаний |
| `sellers` | Продавцы |
| `pending_discounts` | Ожидающие скидки |
| `feed_posts` | Посты ленты |
| `stories_highlights` | Stories (highlights) |
| `stories_items` | Элементы stories |
| `welcome_messages` | Приветственные сообщения |
| `app_customization` | Кастомизация интерфейса |
| `shop_settings` | Настройки магазина |
| `delivery_locations` | Зоны доставки |
| `loyalty_settings` | Настройки лояльности |

*Полная схема: `backend-expressjs/src/db/schema.ts` (40 таблиц)*

---

## .gitignore (важное)

```gitignore
# Build
node_modules/
frontend-sveltekit/.svelte-kit/
frontend-sveltekit/build/
backend-expressjs/dist/

# Database
data/db/sqlite/*.db
data/db/sqlite/*.db-shm
data/db/sqlite/*.db-wal

# Media & Uploads
data/media/images/*
data/media/video/*
backend-expressjs/uploads/
frontend-sveltekit/static/logo.png
frontend-sveltekit/static/logo.webp

# Backups
*.tar.gz

# Env
.env
.env.local
```

---

## API Endpoints (основные)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/login` | Авторизация (JWT) |
| POST | `/api/auth/telegram` | Telegram WebApp auth |
| GET | `/api/products` | Каталог товаров |
| GET | `/api/categories` | Категории |
| POST | `/api/orders` | Создать заказ |
| GET | `/api/user/balance` | Баланс баллов |
| POST | `/api/transactions` | Начисление/списание баллов |
| GET | `/api/stores` | Список магазинов |
| GET | `/api/feed` | Лента новостей |
| GET | `/api/stories` | Stories |
| GET | `/api/offers` | Акции |
| POST | `/api/cashier/*` | Кассир API |
| GET | `/api/admin/*` | Admin panel API |

---

## Telegram Bot

**Bot:** @gskarting_bot
**Token:** `7977874487:AAH4m0eIjHT3ToEbF5Z3rtPs0aDbLhC9wQQ`

**Команды:**
- `/start` — Регистрация в системе лояльности
- `/balance` — Проверить баланс
- `/help` — Помощь

---

## Бизнес-логика (лояльность)

| Правило | Значение |
|---------|----------|
| Кэшбек | 4% от суммы покупки (округление вниз) |
| Макс. скидка | 20% от суммы чека |
| 1 балл | 1 рубль |
| Бонус регистрации | 500 баллов |
| QR-формат | `99` + 6 цифр (напр. `99421856`) |

---

## Доступы

**Admin Panel:** https://gsracing-twa.klik1.ru/login
- Email: `admin@example.com`
- Password: `Admin123!@#$`

**Database:** SQLite, путь: `data/db/sqlite/app.db`

---

## НЕ ПУТАТЬ

| Этот проект | Другой проект |
|-------------|---------------|
| gsracing-twa.klik1.ru | gsracing.klik1.ru |
| gskarting-twa (GitHub) | gskarting (другой GitHub) |
| PM2: `gskarting-frontend/backend` | PM2: `gsracing-frontend/backend` |
| Порты: 3006, 3007 | Порты: 3008, 3009 |

---

*Версия: 1.0 | 2026-02-09*
*Tech: Express.js 5.x + SvelteKit 2.x + Svelte 5 + SQLite + Grammy*
