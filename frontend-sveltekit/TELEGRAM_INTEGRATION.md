# 📱 Telegram Web App Integration Guide

**Version**: 1.0
**Date**: 2025-10-23
**Status**: Implemented (JSON Storage), Ready for Database Migration

---

## 🎯 Overview

This loyalty system integrates with Telegram Web App API to:

1. **Authenticate users** via Telegram (no passwords needed)
2. **Award welcome bonus** of 500 Murzikoyns on first login
3. **Send notifications** via Telegram Bot to user's personal chat
4. **Track store associations** - which of 6 stores user registered from
5. **Store user IDs** for future bulk messaging campaigns

---

## 🏗️ Architecture

### Current Implementation (JSON Storage)

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Web App                          │
│                 (https://murzicoin.murzico.ru)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ 1. User opens app
                        │    via Telegram
                        ▼
            ┌──────────────────────┐
            │  initTelegramWebApp() │
            │  - Extract user data  │
            │  - Call initializeUser()│
            └──────────┬─────────────┘
                       │
                       │ 2. POST /api/telegram/init
                       ▼
        ┌────────────────────────────────────┐
        │  API: /api/telegram/init           │
        │  - Check if user exists            │
        │  - Award 500 coins if new          │
        │  - Track store_id (QR code)        │
        │  - Save to users_state.json        │
        └──────────┬─────────────────────────┘
                   │
                   │ 3. If new user
                   ▼
        ┌────────────────────────────────────┐
        │  API: /api/telegram/welcome        │
        │  - Send message via Bot API        │
        │  - "Здравствуйте, вам начислено..." │
        └────────────────────────────────────┘
                   │
                   │ 4. Return user data
                   ▼
        ┌────────────────────────────────────┐
        │  ProfileCard Component             │
        │  - Display real name               │
        │  - Display real balance (500)      │
        │  - Merge with demo stats           │
        └────────────────────────────────────┘
```

---

## 📁 File Structure

```
frontend-sveltekit/
├── src/
│   ├── lib/
│   │   ├── telegram.ts                      # Telegram SDK integration
│   │   ├── data/loyalty/
│   │   │   └── users_state.json             # Temporary user storage (JSON)
│   │   └── components/loyalty/ui/
│   │       └── ProfileCard.svelte           # Displays Telegram user data
│   │
│   └── routes/
│       ├── +layout.server.ts                # Root loader (demo fallback)
│       └── api/telegram/
│           ├── init/+server.ts              # User initialization endpoint
│           └── welcome/+server.ts           # Bot notification endpoint
│
├── DATABASE_SCHEMA.md                       # Database migration guide
└── TELEGRAM_INTEGRATION.md                  # This file
```

---

## 🔑 Configuration

### Bot Token

**Token**: `8182226460:AAHzGWQoqPhb2dYJ4D9ORzmHzHW7G8S_JzM`

**IMPORTANT**: In production, store in environment variable:

```bash
# .env
TELEGRAM_BOT_TOKEN=8182226460:AAHzGWQoqPhb2dYJ4D9ORzmHzHW7G8S_JzM
```

Update `src/routes/api/telegram/welcome/+server.ts`:
```typescript
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
```

### Deployment URLs

- **Frontend**: `https://murzicoin.murzico.ru`
- **Backend API**: `https://murzicoin.murzico.ru/api`

---

## 🚀 How It Works

### 1. User Opens Web App

User clicks Telegram bot link or QR code → Telegram opens web app → `index.html` loads → `initTelegramWebApp()` runs

### 2. Extract User Data

```typescript
// src/lib/telegram.ts
const telegramUser = getTelegramUser();
// Returns: { id, first_name, last_name, username, language_code }
```

### 3. Initialize User

```typescript
// ProfileCard.svelte onMount()
const result = await initializeUser(storeId);
// Makes POST request to /api/telegram/init
```

### 4. Backend Checks User

```typescript
// src/routes/api/telegram/init/+server.ts

// Read users_state.json
const existingUser = users.find(u => u.telegram_user_id === userData.telegram_user_id);

if (!existingUser) {
  // New user: award 500 coins
  const newUser = {
    telegram_user_id: userData.telegram_user_id,
    first_name: userData.first_name,
    current_balance: 500.00, // Welcome bonus
    store_id: userData.store_id, // CRITICAL: Track store
    first_login_bonus_claimed: true,
    registration_date: new Date().toISOString(),
    chat_id: userData.chat_id
  };

  users.push(newUser);
  writeFileSync(usersStatePath, JSON.stringify(usersData, null, 2));

  // Send welcome message
  await fetch('/api/telegram/welcome', {
    method: 'POST',
    body: JSON.stringify({
      chat_id: userData.chat_id,
      first_name: userData.first_name,
      bonus_amount: 500
    })
  });
}
```

### 5. Send Welcome Message

```typescript
// src/routes/api/telegram/welcome/+server.ts

const message = `Здравствуйте, ${first_name}!

Вам начислено ${bonus_amount} бонусных мурзикойнов! 🎉

Вы можете потратить их при покупках в нашей сети магазинов.

Спасибо, что выбрали нас! 🐾`;

await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  body: JSON.stringify({
    chat_id,
    text: message,
    parse_mode: 'HTML'
  })
});
```

### 6. Display in ProfileCard

```svelte
<!-- ProfileCard.svelte -->
<script lang="ts">
  let displayUser = $state<User>(user);

  onMount(async () => {
    const result = await initializeUser();
    if (result && result.success) {
      displayUser = {
        ...user,
        name: `${result.user.first_name} ${result.user.last_name || ''}`,
        currentBalance: result.user.current_balance // 500 for new users
      };
    }
  });
</script>

<h2 class="profile-name">{displayUser.name}</h2>
<!-- Shows: "Иван Петров" instead of "Сергей Мурзин" -->
```

---

## 🏪 Store Association Tracking

### Why It's Critical

The system has **6 physical stores**. Tracking which store user came from enables:

1. **Store-specific analytics** - Which stores attract more users
2. **Targeted campaigns** - Send offers only to users of specific stores
3. **Purchase attribution** - Track sales by store
4. **Inventory management** - Stock popular items at high-traffic stores

### How It Works (QR Code System)

Each store has unique QR codes:

```
Store 1: https://t.me/YourBot?start=store1
Store 2: https://t.me/YourBot?start=store2
Store 3: https://t.me/YourBot?start=store3
Store 4: https://t.me/YourBot?start=store4
Store 5: https://t.me/YourBot?start=store5
Store 6: https://t.me/YourBot?start=store6
```

Extract store_id from URL parameter:

```typescript
// ProfileCard.svelte (TODO: Implement)
const urlParams = new URLSearchParams(window.location.search);
const storeId = parseInt(urlParams.get('store') || '0');

const result = await initializeUser(storeId);
```

Store in `users_state.json`:

```json
{
  "users": [
    {
      "telegram_user_id": 123456789,
      "first_name": "Иван",
      "store_id": 3, // User registered via Store 3 QR code
      "current_balance": 500.00
    }
  ]
}
```

### Database Schema

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  store_id INT NOT NULL, -- FOREIGN KEY to stores.id
  current_balance DECIMAL(10,2) DEFAULT 500.00,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Query users by store
SELECT * FROM users WHERE store_id = 3;

-- Count users per store
SELECT store_id, COUNT(*) as user_count
FROM users
GROUP BY store_id
ORDER BY user_count DESC;
```

---

## 📊 Data Storage

### Current: JSON Files

**File**: `src/lib/data/loyalty/users_state.json`

```json
{
  "users": [
    {
      "telegram_user_id": 123456789,
      "first_name": "Иван",
      "last_name": "Петров",
      "username": "ivan_petrov",
      "language_code": "ru",
      "current_balance": 500.00,
      "store_id": 3,
      "first_login_bonus_claimed": true,
      "registration_date": "2025-10-23T10:30:00.000Z",
      "last_activity": "2025-10-23T10:30:00.000Z",
      "chat_id": 123456789
    }
  ],
  "_metadata": {
    "description": "Temporary storage for Telegram Web App users",
    "database_migration_notes": {
      "table_name": "users",
      "indexes": [
        "CREATE INDEX idx_telegram_user_id ON users(telegram_user_id)",
        "CREATE INDEX idx_store_id ON users(store_id)"
      ]
    }
  }
}
```

---

## 🗄️ Database Migration Guide

### Step 1: Create Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  username VARCHAR(255),
  language_code VARCHAR(10),
  current_balance DECIMAL(10,2) DEFAULT 500.00,
  store_id INT NOT NULL,
  first_login_bonus_claimed BOOLEAN DEFAULT TRUE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP,
  chat_id BIGINT NOT NULL,

  FOREIGN KEY (store_id) REFERENCES stores(id),
  INDEX idx_telegram_user_id (telegram_user_id),
  INDEX idx_store_id (store_id),
  INDEX idx_registration_date (registration_date DESC)
);
```

### Step 2: Migrate JSON to Database

```typescript
// scripts/migrate-users.ts
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsers() {
  const usersStateJson = JSON.parse(
    readFileSync('src/lib/data/loyalty/users_state.json', 'utf-8')
  );

  for (const user of usersStateJson.users) {
    await prisma.user.create({
      data: {
        telegram_user_id: user.telegram_user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
        current_balance: user.current_balance,
        store_id: user.store_id,
        first_login_bonus_claimed: user.first_login_bonus_claimed,
        registration_date: new Date(user.registration_date),
        last_activity: user.last_activity ? new Date(user.last_activity) : null,
        chat_id: user.chat_id
      }
    });
  }

  console.log(`Migrated ${usersStateJson.users.length} users to database`);
}

migrateUsers();
```

### Step 3: Update API Endpoints

**Before (JSON)**:
```typescript
// src/routes/api/telegram/init/+server.ts
const usersStatePath = join(process.cwd(), 'src/lib/data/loyalty/users_state.json');
let usersData = JSON.parse(readFileSync(usersStatePath, 'utf-8'));
```

**After (Database)**:
```typescript
// src/routes/api/telegram/init/+server.ts
import { prisma } from '$lib/server/prisma';

export const POST: RequestHandler = async ({ request }) => {
  const userData = await request.json();

  // Upsert user (create or update)
  const user = await prisma.user.upsert({
    where: { telegram_user_id: userData.telegram_user_id },
    update: { last_activity: new Date() },
    create: {
      telegram_user_id: userData.telegram_user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      language_code: userData.language_code,
      current_balance: 500.00, // Welcome bonus
      store_id: userData.store_id,
      first_login_bonus_claimed: true,
      registration_date: new Date(),
      chat_id: userData.chat_id
    }
  });

  // If new user, award bonus transaction
  if (user.first_login_bonus_claimed && user.registration_date === new Date()) {
    await prisma.transaction.create({
      data: {
        user_id: user.id,
        title: 'Приветственный бонус',
        amount: 500.00,
        type: 'earn',
        store_id: userData.store_id
      }
    });

    // Send welcome message
    await fetch('/api/telegram/welcome', {
      method: 'POST',
      body: JSON.stringify({
        chat_id: userData.chat_id,
        first_name: userData.first_name,
        bonus_amount: 500
      })
    });
  }

  return json({ success: true, isNewUser: false, user });
};
```

---

## 🔐 Security Considerations

### 1. Bot Token Protection

**Current**: Hardcoded in source (temporary)
**Production**: MUST use environment variable

```bash
# .env (NEVER commit this file!)
TELEGRAM_BOT_TOKEN=8182226460:AAHzGWQoqPhb2dYJ4D9ORzmHzHW7G8S_JzM
```

### 2. Validate Telegram Data

Telegram Web App data can be validated using hash:

```typescript
// src/lib/telegram-validation.ts
import crypto from 'crypto';

export function validateTelegramWebAppData(
  initData: string,
  botToken: string
): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  // Sort params alphabetically
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}
```

### 3. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// src/routes/api/telegram/init/+server.ts
import { rateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();

  if (!rateLimit.check(clientIP)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }

  // ... rest of handler
};
```

---

## 📝 Future Enhancements

### 1. QR Code System Implementation

Generate unique QR codes for each store:

```typescript
// scripts/generate-store-qr.ts
import QRCode from 'qrcode';

const stores = [
  { id: 1, name: 'Магазин на Ленина' },
  { id: 2, name: 'Магазин на Гагарина' },
  // ... 4 more stores
];

for (const store of stores) {
  const url = `https://t.me/YourBot?start=store${store.id}`;
  await QRCode.toFile(`qr-codes/store-${store.id}.png`, url);
  console.log(`Generated QR for ${store.name}`);
}
```

### 2. Bulk Messaging Campaigns

Send targeted messages to users:

```typescript
// src/routes/api/telegram/broadcast/+server.ts
import { prisma } from '$lib/server/prisma';

export const POST: RequestHandler = async ({ request }) => {
  const { message, storeId } = await request.json();

  // Get all users from specific store (or all stores if storeId is null)
  const users = await prisma.user.findMany({
    where: storeId ? { store_id: storeId } : undefined,
    select: { chat_id: true, first_name: true }
  });

  // Send message to all users (use queue in production!)
  for (const user of users) {
    await fetch('/api/telegram/send', {
      method: 'POST',
      body: JSON.stringify({
        chat_id: user.chat_id,
        text: message.replace('{name}', user.first_name)
      })
    });

    // Add delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return json({ success: true, sent: users.length });
};
```

### 3. User Analytics Dashboard

Track user activity by store:

```sql
-- Users registered per store
SELECT
  s.name as store_name,
  COUNT(u.id) as user_count,
  SUM(u.current_balance) as total_balance
FROM stores s
LEFT JOIN users u ON u.store_id = s.id
GROUP BY s.id, s.name
ORDER BY user_count DESC;

-- New users per week
SELECT
  DATE(registration_date) as date,
  COUNT(*) as new_users
FROM users
WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(registration_date)
ORDER BY date;
```

---

## 🧪 Testing

### Test Bot Connection

```bash
curl https://murzicoin.murzico.ru/api/telegram/welcome
```

Expected response:
```json
{
  "success": true,
  "message": "Bot connection successful",
  "bot_info": {
    "id": 8182226460,
    "is_bot": true,
    "first_name": "MurziKoin Bot",
    "username": "murzikoin_bot"
  }
}
```

### Test User Initialization

```bash
curl -X POST https://murzicoin.murzico.ru/api/telegram/init \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_user_id": 999999999,
    "first_name": "Тест",
    "last_name": "Тестов",
    "username": "test_user",
    "language_code": "ru",
    "chat_id": 999999999,
    "store_id": 1
  }'
```

Expected response:
```json
{
  "success": true,
  "isNewUser": true,
  "user": {
    "telegram_user_id": 999999999,
    "first_name": "Тест",
    "last_name": "Тестов",
    "current_balance": 500,
    "store_id": 1,
    "first_login_bonus_claimed": true
  },
  "message": "Welcome! 500 Murzikoyns awarded"
}
```

### Test Welcome Message

Check that user receives message in Telegram:
- Open Telegram
- Start conversation with bot
- Should see: "Здравствуйте, Тест! Вам начислено 500 бонусных мурзикойнов! 🎉"

---

## 📚 References

- [Telegram Web App Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Full database migration guide

---

**Version**: 1.0
**Last Updated**: 2025-10-23
**Status**: ✅ Implemented & Ready for Production (after DB migration)
