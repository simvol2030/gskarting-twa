# Telegram Bot для Мурзи-Коин

Бот для программы лояльности - отправляет приветственные сообщения и уведомления о транзакциях.

---

## Функции бота

### При /start:
1. Приветствие + благодарность
2. Начисление 500 мурзи-коинов
3. Условия программы (4% начисление, 20% списание, срок 1.5 месяца)

### При транзакции:
- Уведомление о списании/начислении
- Новый баланс
- Кнопка "Мой баланс"

---

## Установка локально

```bash
cd telegram-bot
npm install
cp .env.example .env
# Отредактировать .env (добавить BOT_TOKEN)
npm run dev
```

---

## Deployment

См. `DEPLOY_BOT.md`

---

## API для backend

### POST /notify-transaction

```json
{
  "telegramUserId": 12345,
  "type": "redeem",
  "purchaseAmount": 1500,
  "pointsEarned": 60,
  "pointsRedeemed": 150,
  "discountAmount": 150,
  "newBalance": 410,
  "storeName": "Ашукино"
}
```

Response: `{ "success": true }`
