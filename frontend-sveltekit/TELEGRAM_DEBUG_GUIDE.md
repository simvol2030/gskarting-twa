# 🔧 Telegram Web App Debug Guide

**Дата**: 2025-10-23
**Статус**: Исправлено

---

## ✅ Что было исправлено

### 1. **Telegram Web App SDK не был подключен**

**Проблема**: В `app.html` отсутствовал скрипт Telegram SDK

**Решение**: Добавлен в `src/app.html`:
```html
<!-- Telegram Web App SDK -->
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 2. **Дубликат SDK в +layout.svelte**

**Проблема**: SDK подключался дважды (в app.html и +layout.svelte)

**Решение**: Удален дубликат из `+layout.svelte`

### 3. **Маппинг данных в ProfileCard**

**Проблема**: Не обновлялся `cardNumber` из Telegram user ID

**Решение**: Добавлена строка:
```typescript
cardNumber: result.user.telegram_user_id?.toString() || user.cardNumber,
```

---

## 🧪 Как тестировать

### Тест 1: Проверка подключения бота

```bash
curl https://murzicoin.murzico.ru/api/telegram/welcome
```

**Ожидаемый ответ**:
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

### Тест 2: Инициализация пользователя

```bash
curl -X POST https://murzicoin.murzico.ru/api/telegram/init \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_user_id": 123456789,
    "first_name": "Иван",
    "last_name": "Петров",
    "username": "ivan_petrov",
    "language_code": "ru",
    "chat_id": 123456789,
    "store_id": 1
  }'
```

**Ожидаемый ответ (новый пользователь)**:
```json
{
  "success": true,
  "isNewUser": true,
  "user": {
    "telegram_user_id": 123456789,
    "first_name": "Иван",
    "last_name": "Петров",
    "username": "ivan_petrov",
    "current_balance": 500,
    "store_id": 1,
    "first_login_bonus_claimed": true
  },
  "message": "Welcome! 500 Murzikoyns awarded"
}
```

**Ожидаемый ответ (существующий пользователь)**:
```json
{
  "success": true,
  "isNewUser": false,
  "user": {
    "telegram_user_id": 123456789,
    "first_name": "Иван",
    "last_name": "Петров",
    "username": "ivan_petrov",
    "current_balance": 500,
    "store_id": 1,
    "first_login_bonus_claimed": true
  },
  "message": "Welcome back!"
}
```

### Тест 3: Отправка приветственного сообщения

```bash
curl -X POST https://murzicoin.murzico.ru/api/telegram/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": 123456789,
    "first_name": "Иван",
    "bonus_amount": 500
  }'
```

**Ожидаемый ответ**:
```json
{
  "success": true,
  "message": "Welcome message sent successfully",
  "telegram_response": {
    "ok": true,
    "result": {
      "message_id": 123,
      "date": 1698765432,
      "text": "Здравствуйте, Иван!\n\nВам начислено 500 бонусных мурзикойнов! 🎉\n\nВы можете потратить их при покупках в нашей сети магазинов.\n\nСпасибо, что выбрали нас! 🐾"
    }
  }
}
```

---

## 🔍 Отладка в браузере

### 1. Проверка наличия Telegram SDK

Открой DevTools (F12) → Console:

```javascript
// Проверка наличия SDK
console.log('Telegram SDK:', window.Telegram);

// Проверка WebApp
console.log('WebApp:', window.Telegram?.WebApp);

// Проверка данных пользователя
console.log('User:', window.Telegram?.WebApp?.initDataUnsafe?.user);
```

**Ожидаемый результат в Telegram Web App**:
```javascript
{
  id: 123456789,
  first_name: "Иван",
  last_name: "Петров",
  username: "ivan_petrov",
  language_code: "ru"
}
```

**Ожидаемый результат НЕ в Telegram (браузер)**:
```javascript
undefined
```

### 2. Проверка логов ProfileCard

В консоли браузера должны появиться логи:

```
[ProfileCard] Mounting component...
[ProfileCard] Telegram user from SDK: { id: 123456789, first_name: "Иван", ... }
[ProfileCard] Running in Telegram Web App mode
[ProfileCard] Calling initializeUser()...
[ProfileCard] initializeUser() result: { success: true, isNewUser: true, ... }
[ProfileCard] Updating displayUser with name: Иван Петров balance: 500
[ProfileCard] Telegram user initialized: { isNewUser: true, bonus: "500 Murzikoyns awarded", ... }
[ProfileCard] Mount complete. Final displayUser: Иван Петров
```

### 3. Проверка сетевых запросов

DevTools → Network → фильтр "Fetch/XHR":

1. **POST /api/telegram/init**
   - Payload: `{ telegram_user_id, first_name, last_name, ... }`
   - Response: `{ success: true, isNewUser: true/false, ... }`

2. **POST /api/telegram/welcome** (только для новых пользователей)
   - Payload: `{ chat_id, first_name, bonus_amount: 500 }`
   - Response: `{ success: true, message: "Welcome message sent successfully" }`

---

## 🚨 Типичные проблемы и решения

### Проблема 1: "Сергей Мурзин" вместо реального имени

**Причина**: Telegram SDK не загружен или приложение открыто не через Telegram

**Решение**:
1. Убедись, что открываешь через Telegram (t.me/YourBot/app)
2. Проверь консоль: `window.Telegram?.WebApp?.initDataUnsafe?.user`
3. Если `undefined` → SDK не загружен, проверь `app.html`

### Проблема 2: Приветственное сообщение не приходит

**Причина 1**: Бот не имеет доступа к чату пользователя

**Решение**: Пользователь должен сначала нажать "Start" в боте

**Причина 2**: Неверный `chat_id`

**Решение**: Проверь, что `chat_id === telegram_user_id` для приватных чатов

**Причина 3**: Неверный токен бота

**Решение**: Проверь `TELEGRAM_BOT_TOKEN` в `.env` или `welcome/+server.ts:42`

### Проблема 3: Баланс не обновляется

**Причина**: `users_state.json` не создается или недоступен для записи

**Решение**:
```bash
# Проверь права на запись
chmod 666 src/lib/data/loyalty/users_state.json

# Проверь существование файла
cat src/lib/data/loyalty/users_state.json
```

### Проблема 4: CORS ошибка при обращении к API

**Причина**: SvelteKit dev server не пробрасывает internal fetch

**Решение**: В `api/telegram/init/+server.ts` используется `{ fetch }` parameter - это правильно

---

## 📊 Структура данных

### users_state.json

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
      "store_id": 1,
      "first_login_bonus_claimed": true,
      "registration_date": "2025-10-23T10:30:00.000Z",
      "last_activity": "2025-10-23T10:30:00.000Z",
      "chat_id": 123456789
    }
  ]
}
```

---

## 🔐 Безопасность

### Production Checklist

- [ ] Переместить `TELEGRAM_BOT_TOKEN` в переменную окружения `.env`
- [ ] Добавить валидацию Telegram Web App data (hash verification)
- [ ] Добавить rate limiting на `/api/telegram/init`
- [ ] Логировать все попытки инициализации
- [ ] Добавить мониторинг отправки сообщений через бота

### Валидация Telegram Data

Добавь в `api/telegram/init/+server.ts`:

```typescript
import crypto from 'crypto';

function validateTelegramWebAppData(initData: string, botToken: string): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

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

---

## 📚 Дополнительные ресурсы

- [Telegram Web App Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - миграция на БД
- [TELEGRAM_INTEGRATION.md](./TELEGRAM_INTEGRATION.md) - полная документация

---

**Версия**: 1.1
**Последнее обновление**: 2025-10-23
**Статус**: ✅ Все исправлено
