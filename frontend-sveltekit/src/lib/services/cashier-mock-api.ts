/**
 * Mock API для кассира
 * Используется для разработки и тестирования интерфейса
 * без необходимости подключения к реальному backend
 */

// Mock данные магазинов
export const MOCK_STORES = [
  {
    id: 1,
    name: 'Магазин на Зеленоградской',
    address: 'ул. Зеленоградская, 12А'
  },
  {
    id: 2,
    name: 'Магазин в Ашукино',
    address: 'пос. Ашукино, ул. Центральная, 25'
  },
  {
    id: 3,
    name: 'Магазин на Советской',
    address: 'ул. Советская, 45'
  }
];

// Mock данные покупателей
const MOCK_CUSTOMERS = [
  {
    id: 123,
    firstName: 'Иван',
    lastName: 'Петров',
    cardNumber: '654321',
    balance: 1250.0,
    isActive: true
  },
  {
    id: 456,
    firstName: 'Мария',
    lastName: 'Сидорова',
    cardNumber: '123456',
    balance: 3500.0,
    isActive: true
  },
  {
    id: 789,
    firstName: 'Алексей',
    lastName: 'Иванов',
    cardNumber: '789012',
    balance: 50.0,
    isActive: true
  }
];

// Mock данные транзакций из 1С
const MOCK_TRANSACTIONS = [
  {
    transactionId: 'TXN-12345',
    amount: 5000.0,
    currency: 'RUB',
    status: 'Draft',
    items: [
      { name: 'Pro Plan для собак', price: 4200 },
      { name: 'Игрушка мышка', price: 800 }
    ]
  },
  {
    transactionId: 'TXN-12346',
    amount: 2500.0,
    currency: 'RUB',
    status: 'Draft',
    items: [{ name: 'Whiskas паучи 12шт', price: 2500 }]
  }
];

/**
 * Mock: Поиск покупателя по QR-коду или номеру карты
 */
export async function mockIdentifyCustomer(qrData: string): Promise<any> {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Пробуем распарсить как JSON (QR-код)
  try {
    const parsed = JSON.parse(atob(qrData));
    const customer = MOCK_CUSTOMERS.find((c) => c.id === parsed.userId);

    if (customer) {
      return {
        success: true,
        customer
      };
    }
  } catch (e) {
    // Не JSON - пробуем как номер карты
    const customer = MOCK_CUSTOMERS.find((c) => c.cardNumber === qrData);
    if (customer) {
      return {
        success: true,
        customer
      };
    }
  }

  return {
    success: false,
    error: 'Карта не найдена в системе'
  };
}

/**
 * Mock: Получить сумму текущей транзакции из 1С
 */
export async function mockGetTransactionAmount(storeId: number): Promise<any> {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Случайно возвращаем success/error для тестирования
  const shouldSucceed = Math.random() > 0.2; // 80% успеха

  if (shouldSucceed) {
    // Возвращаем случайную транзакцию
    const transaction = MOCK_TRANSACTIONS[Math.floor(Math.random() * MOCK_TRANSACTIONS.length)];

    return {
      success: true,
      transaction
    };
  } else {
    return {
      success: false,
      error: 'Тайм-аут: 1С не отвечает'
    };
  }
}

/**
 * Mock: Начислить баллы
 */
export async function mockEarnPoints(data: {
  userId: number;
  storeId: number;
  purchaseAmount: number;
  earnAmount: number;
}): Promise<any> {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 600));

  const customer = MOCK_CUSTOMERS.find((c) => c.id === data.userId);

  if (!customer) {
    return {
      success: false,
      error: 'Покупатель не найден'
    };
  }

  // Обновляем баланс (в реальности это сделает БД)
  customer.balance += data.earnAmount;

  return {
    success: true,
    newBalance: customer.balance,
    earned: data.earnAmount
  };
}

/**
 * Mock: Списать баллы + начислить кешбэк
 */
export async function mockRedeemAndEarn(data: {
  userId: number;
  storeId: number;
  purchaseAmount: number;
  redeemAmount: number;
  earnAmount: number;
  transactionId: string;
}): Promise<any> {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 800));

  const customer = MOCK_CUSTOMERS.find((c) => c.id === data.userId);

  if (!customer) {
    return {
      success: false,
      error: 'Покупатель не найден'
    };
  }

  if (customer.balance < data.redeemAmount) {
    return {
      success: false,
      error: 'Недостаточно баллов'
    };
  }

  // Имитация ответа от 1С (80% успеха)
  const onecSuccess = Math.random() > 0.2;

  if (!onecSuccess) {
    return {
      success: false,
      error: 'Тайм-аут: 1С не подтвердил скидку',
      requireManualConfirmation: true
    };
  }

  // Списываем и начисляем
  customer.balance = customer.balance - data.redeemAmount + data.earnAmount;

  return {
    success: true,
    newBalance: customer.balance,
    redeemed: data.redeemAmount,
    earned: data.earnAmount,
    onecConfirmed: true
  };
}

/**
 * Mock: Принудительное подтверждение транзакции (без ответа 1С)
 */
export async function mockForceConfirm(data: {
  userId: number;
  redeemAmount: number;
  earnAmount: number;
}): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const customer = MOCK_CUSTOMERS.find((c) => c.id === data.userId);

  if (!customer) {
    return { success: false, error: 'Покупатель не найден' };
  }

  customer.balance = customer.balance - data.redeemAmount + data.earnAmount;

  return {
    success: true,
    newBalance: customer.balance,
    redeemed: data.redeemAmount,
    earned: data.earnAmount,
    onecConfirmed: false,
    warning: 'Скидка не применена в 1С автоматически'
  };
}

/**
 * Генератор mock QR-кода для тестирования
 */
export function generateMockQR(userId: number): string {
  const qrData = {
    userId,
    timestamp: Date.now(),
    signature: 'mock_signature'
  };
  return btoa(JSON.stringify(qrData));
}

/**
 * Mock: Быстрые кнопки для тестирования
 */
export const MOCK_QUICK_TESTS = {
  // QR-код Ивана Петрова (баланс 1,250)
  ivan: generateMockQR(123),
  // QR-код Марии Сидоровой (баланс 3,500)
  maria: generateMockQR(456),
  // QR-код Алексея Иванова (баланс 50)
  alex: generateMockQR(789),
  // Номера карт для ручного ввода
  cardIvan: '654321',
  cardMaria: '123456',
  cardAlex: '789012'
};
