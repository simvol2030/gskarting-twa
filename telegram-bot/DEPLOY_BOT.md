# Deployment: Telegram Bot для Мурзи-Коин

---

## ШАГ 1: Создание .env файла

```bash
cd telegram-bot
nano .env
```

Вставить:
```
BOT_TOKEN=8182226460:AAHzGWQoqPhb2dYJ4D9ORzmHzHW7G8S_JzM
WEB_APP_URL=https://murzicoin.murzico.ru
WEBHOOK_PORT=3001
```

Сохранить: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## ШАГ 2: Загрузка на сервер (WinSCP)

**Локально**: `C:\dev\loyalty_system_murzico\telegram-bot\`

**На сервер**: `/opt/websites/murzicoin.murzico.ru/telegram-bot/`

Загрузить:
- `src/` (папка с кодом)
- `package.json`
- `tsconfig.json`
- `.env`

---

## ШАГ 3: Установка на сервере (SSH)

```bash
cd /opt/websites/murzicoin.murzico.ru/telegram-bot

# Установка зависимостей
npm install

# Сборка TypeScript
npm run build

# Проверка
ls -la dist/
# Должен быть: index.js
```

---

## ШАГ 4: Настройка systemd

```bash
# Копируем service файл
sudo cp deploy/murzicoin-bot.service /etc/systemd/system/

# Перезагружаем systemd
sudo systemctl daemon-reload

# Включаем автозапуск
sudo systemctl enable murzicoin-bot

# Запускаем
sudo systemctl start murzicoin-bot

# Проверяем статус
sudo systemctl status murzicoin-bot --no-pager
```

Ожидаемо: `Active: active (running)` ✅

---

## ШАГ 5: Проверка логов

```bash
# Логи в реальном времени
sudo journalctl -u murzicoin-bot -f

# Последние 30 строк
sudo journalctl -u murzicoin-bot -n 30
```

Ожидаемо:
```
✅ Telegram bot started successfully!
🤖 Bot: Murzicoin Loyalty Bot
🌐 Web App URL: https://murzicoin.murzico.ru
📡 Webhook port: 3001
```

---

## ШАГ 6: Тестирование

1. Открыть Telegram
2. Найти бота (по токену можно узнать username через @BotFather)
3. Нажать `/start`
4. Должно прийти 3 сообщения:
   - Приветствие
   - Начисление 500 баллов
   - Правила программы

---

## Обновление бота

```bash
# WinSCP: загрузить обновлённый src/

# SSH:
cd /opt/websites/murzicoin.murzico.ru/telegram-bot
npm run build
sudo systemctl restart murzicoin-bot
sudo systemctl status murzicoin-bot --no-pager
```

---

## Управление сервисом

```bash
# Статус
sudo systemctl status murzicoin-bot

# Запуск
sudo systemctl start murzicoin-bot

# Остановка
sudo systemctl stop murzicoin-bot

# Перезапуск
sudo systemctl restart murzicoin-bot

# Логи
sudo journalctl -u murzicoin-bot -f
```

---

## Интеграция с backend

Backend должен вызывать webhook при создании транзакции:

```typescript
// В backend после создания cashier_transaction:
await fetch('http://localhost:3001/notify-transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    telegramUserId: customer.telegram_user_id,
    type: 'redeem',
    purchaseAmount: 1500,
    pointsEarned: 60,
    pointsRedeemed: 150,
    discountAmount: 150,
    newBalance: 410,
    storeName: 'Ашукино'
  })
});
```

---

**Готово! Бот работает 24/7** 🎉
