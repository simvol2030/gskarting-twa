# Deployment Checklist - Murzicoin Loyalty System

> **Версия:** 2.0
> **Дата:** 2025-12-01
> **Автор:** Claude Code

Этот чеклист предотвращает повторение проблемы с `localhost:3000` в кассире и других подобных ошибок деплоя.

---

## 🚨 КРИТИЧЕСКАЯ ПРОБЛЕМА (РЕШЕНА)

**Проблема:** После деплоя кассир не мог найти клиентов - делал запросы на `localhost:3000` вместо продакшен API.

**Корневая причина:**
1. PM2 **НЕ** загружает `.env` файлы автоматически
2. `cashier.ts` использовал `import.meta.env` (Vite) вместо SvelteKit `$env/static/public`
3. Env переменные не попадали в билд → срабатывал fallback `localhost:3015`

**Решение:**
1. ✅ Добавлен `PUBLIC_BACKEND_URL` в `ecosystem.config.js`
2. ✅ Исправлен импорт в `cashier.ts`: `import { PUBLIC_BACKEND_URL } from '$env/static/public'`
3. ✅ Билд делается с правильными env: `PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru npm run build`

---

## ⚠️ КРИТИЧЕСКИЕ ПРАВИЛА (ЧТОБЫ НЕ ПОВТОРИЛОСЬ)

### 1. PM2 + Environment Variables

```bash
❌ НЕПРАВИЛЬНО:
- Полагаться на .env файлы с PM2
- Использовать pm2 restart --update-env

✅ ПРАВИЛЬНО:
- ВСЕ env переменные ТОЛЬКО в ecosystem.config.js
- pm2 delete <name> && pm2 start ecosystem.config.js
```

### 2. SvelteKit Environment Variables

```typescript
❌ НЕПРАВИЛЬНО:
import.meta.env.PUBLIC_BACKEND_URL  // Это Vite, НЕ работает в SvelteKit!

✅ ПРАВИЛЬНО:
import { PUBLIC_BACKEND_URL } from '$env/static/public'
```

### 3. Build Process

```bash
❌ НЕПРАВИЛЬНО:
npm run build  # БЕЗ env переменных

✅ ПРАВИЛЬНО:
PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru NODE_ENV=production npm run build
```

---

## 📋 ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ

### A. Проверка конфигурации

```bash
# Автоматическая проверка
node scripts/check-env.js
```

Или вручную:

- [ ] `ecosystem.config.js` содержит `PUBLIC_BACKEND_URL` для frontend
- [ ] `ecosystem.config.js` содержит `SESSION_SECRET` для frontend и backend
- [ ] НЕТ `localhost:3000` или `localhost:3015` в production значениях (только fallback)
- [ ] Все файлы `src/lib/api/*.ts` используют `$env/static/public`, НЕ `import.meta.env`

### B. Build процесс

```bash
# Запустить автоматический деплой
bash deploy.sh
```

Или вручную:

```bash
# 1. Frontend build
cd frontend-sveltekit
PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru \
NODE_ENV=production \
npm run build

# 2. Backend build
cd ../backend-expressjs
npm run build

# 3. Проверка билда
cd ../frontend-sveltekit
grep -r "localhost:3000" build/client/_app/immutable/nodes/
# Должен вернуть: 0 результатов

# 4. Копирование на сервер
scp ../ecosystem.config.js webmaster@46.8.19.26:/opt/websites/murzicoin.murzico.ru/
scp -r build/* webmaster@46.8.19.26:/opt/websites/murzicoin.murzico.ru/frontend-sveltekit/build/
scp -r ../backend-expressjs/dist/* webmaster@46.8.19.26:/opt/websites/murzicoin.murzico.ru/backend-expressjs/dist/

# 5. Перезапуск PM2
ssh webmaster@46.8.19.26 "cd /opt/websites/murzicoin.murzico.ru && \
/home/webmaster/.nvm/versions/node/v22.15.0/bin/pm2 delete murzicoin-frontend murzicoin-backend && \
/home/webmaster/.nvm/versions/node/v22.15.0/bin/pm2 start ecosystem.config.js"
```

### C. Проверка после деплоя

- [ ] `pm2 env <id>` показывает правильные env переменные
- [ ] Logs не содержат ошибок: `tail -f logs/frontend-out.log`
- [ ] Тест кассира: https://murzicoin.murzico.ru/cashier?storeId=1
  - Ввод карты: `633456`
  - Клиент найден: SOLO8, баланс 147 ₽
  - Console НЕ показывает `localhost:3000`
- [ ] Тест админки: https://murzicoin.murzico.ru/admin/dashboard
- [ ] Тест TWA: https://t.me/murzicoin_loyalty_bot/app

---

## 🛠️ НОВЫЕ ИНСТРУМЕНТЫ

### 1. Автоматическая проверка

```bash
npm run deploy:check
```

Проверяет:
- ✅ ecosystem.config.js содержит нужные env
- ✅ код использует правильные импорты
- ✅ .env файлы не конфликтуют

### 2. Безопасный билд

```bash
npm run deploy:build
```

Билдит с правильными env переменными автоматически.

### 3. Полный деплой

```bash
bash deploy.sh
```

Выполняет все шаги:
1. ✅ Проверка конфигурации
2. ✅ Билд frontend + backend
3. ✅ Проверка билда на localhost
4. ✅ Копирование на сервер
5. ✅ Перезапуск PM2
6. ✅ Проверка env после деплоя

---

## 📝 ПРИМЕРЫ ПРАВИЛЬНОЙ КОНФИГУРАЦИИ

### ecosystem.config.js (production)

```javascript
module.exports = {
  apps: [
    {
      name: 'murzicoin-frontend',
      cwd: '/opt/websites/murzicoin.murzico.ru/frontend-sveltekit',
      script: 'build/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3009',
        ORIGIN: 'https://murzicoin.murzico.ru',
        SESSION_SECRET: '/h3mrzqmVEweenR+NiQV5CUWkhAcpEccOw+jorAhPgA=',
        PUBLIC_BACKEND_URL: 'https://murzicoin.murzico.ru'  // ← КРИТИЧНО!
      }
    },
    {
      name: 'murzicoin-backend',
      cwd: '/opt/websites/murzicoin.murzico.ru/backend-expressjs',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3015',
        SESSION_SECRET: '/h3mrzqmVEweenR+NiQV5CUWkhAcpEccOw+jorAhPgA='  // ← КРИТИЧНО!
      }
    }
  ]
};
```

### cashier.ts (правильный импорт)

```typescript
import { PUBLIC_BACKEND_URL } from '$env/static/public';

// ✅ ПРАВИЛЬНО: SvelteKit static import
const BACKEND_URL = typeof window === 'undefined'
  ? (PUBLIC_BACKEND_URL || 'http://localhost:3015')
  : ''; // Empty string = relative URLs for browser
```

---

## 🐛 TROUBLESHOOTING

### Проблема: Кассир не находит клиентов

**Симптомы:**
- Console: `[findCustomer] Fetching: http://localhost:3000/api/customers/search?card=633456`
- Ошибка: "Refused to connect"

**Диагностика:**
```bash
# 1. Проверь env в PM2
ssh webmaster@46.8.19.26 "/home/webmaster/.nvm/versions/node/v22.15.0/bin/pm2 env murzicoin-frontend | grep PUBLIC_BACKEND_URL"
# Должен показать: PUBLIC_BACKEND_URL: 'https://murzicoin.murzico.ru'

# 2. Проверь билд
grep -r "localhost:3000" build/client/_app/immutable/nodes/
# Должен вернуть: 0 результатов
```

**Решение:**
```bash
# 1. Исправь ecosystem.config.js (добавь PUBLIC_BACKEND_URL)
# 2. Пересобери frontend с env
PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru NODE_ENV=production npm run build
# 3. Передеплой
bash deploy.sh
```

### Проблема: Билд содержит localhost:3000

**Причина:** Не передали env переменные при билде

**Решение:**
```bash
# ВСЕГДА передавай PUBLIC_BACKEND_URL при билде:
PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru npm run build
```

### Проблема: import.meta.env возвращает undefined

**Причина:** Используешь Vite синтаксис в SvelteKit

**Решение:**
```typescript
// Замени ВСЕ:
import.meta.env.PUBLIC_BACKEND_URL

// На:
import { PUBLIC_BACKEND_URL } from '$env/static/public'
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- **PM2 Env Documentation:** https://pm2.keymetrics.io/docs/usage/application-declaration/#environment-variables
- **SvelteKit Env Variables:** https://kit.svelte.dev/docs/modules#$env-static-public
- **Troubleshooting Guide:** `docs/TROUBLESHOOTING-SESSION-PM2.md`

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

Перед КАЖДЫМ деплоем:

- [ ] Запустил `node scripts/check-env.js` - 0 ошибок
- [ ] Запустил `bash deploy.sh` - деплой прошел успешно
- [ ] Проверил кассира в браузере - клиент находится
- [ ] Проверил console - НЕТ `localhost:3000`
- [ ] Проверил PM2 logs - НЕТ ошибок

**Если все ✅ - деплой безопасен!**

---

**Дата последнего обновления:** 2025-12-01
**Версия:** 2.0
**Проверено на:** Murzicoin Loyalty System v3
