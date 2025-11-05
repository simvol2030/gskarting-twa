/**
 * API layer для интеграции с 1С
 *
 * Сценарий работы:
 * 1. 1С → POST /api/1c/set-check-amount (устанавливает сумму предчека)
 * 2. Loyalty → GET /api/1c/check-amount (получает сумму предчека)
 * 3. Loyalty → POST /api/1c/apply-discount (применяет скидку)
 * 4. Loyalty → POST /api/1c/confirm (подтверждает транзакцию)
 */

// URL Express backend
// Используем относительные пути - SvelteKit проксирует на backend
const BACKEND_URL = '';

// ===== Интерфейсы =====

export interface PreCheckData {
	checkAmount: number;
	storeId: number;
	timestamp: string;
}

export interface ApplyDiscountRequest {
	cardNumber: string;
	checkAmount: number;
	discountAmount: number;
	earnPoints: number;
	storeId: number;
}

export interface ApplyDiscountResponse {
	success: boolean;
	transactionId: number;
	finalAmount: number;
	customerId: number;
	error?: string; // 🔴 FIX: Добавляем error поле
}

export interface ConfirmTransactionRequest {
	transactionId: number;
	checkNumber?: string;
	paidAmount?: number;
	onecTransactionId?: string;
}

export interface ConfirmTransactionResponse {
	success: boolean;
}

// ===== API функции =====

/**
 * Получить сумму предчека из 1С
 *
 * GET /api/1c/check-amount?storeId=1
 *
 * Returns: { checkAmount: 1500.00, storeId: 1, timestamp: "..." }
 */
export async function getPreCheckFromOnec(storeId: number): Promise<PreCheckData | null> {
	try {
		const response = await fetch(`${BACKEND_URL}/api/1c/check-amount?storeId=${storeId}`);

		if (!response.ok) {
			console.error('[1C API] Failed to get pre-check amount:', response.statusText);
			return null;
		}

		const data: PreCheckData = await response.json();

		// Если checkAmount === 0, значит нет активного предчека
		if (data.checkAmount === 0) {
			return null;
		}

		console.log('[1C API] Pre-check received:', data);
		return data;

	} catch (error) {
		console.error('[1C API] Error getting pre-check amount:', error);
		return null;
	}
}

/**
 * Применить скидку лояльности к чеку (отправить в 1С)
 *
 * POST /api/1c/apply-discount
 *
 * Body: {
 *   cardNumber: "12345678",
 *   checkAmount: 1500.00,
 *   discountAmount: 150.00,
 *   earnPoints: 75.00,
 *   storeId: 1
 * }
 *
 * Returns: { success: true, transactionId: 42, finalAmount: 1350.00 }
 */
export async function applyDiscountToOnec(
	request: ApplyDiscountRequest
): Promise<ApplyDiscountResponse> { // 🔴 FIX: Убираем | null, всегда возвращаем объект
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 🔴 FIX: Таймаут 10 сек

	try {
		const response = await fetch(`${BACKEND_URL}/api/1c/apply-discount`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: response.statusText }));
			console.error('[1C API] Failed to apply discount:', errorData);
			return {
				success: false,
				transactionId: 0,
				finalAmount: 0,
				customerId: 0,
				error: errorData.error || response.statusText
			};
		}

		const data = await response.json();
		console.log('[1C API] Discount applied:', data);
		return { ...data, success: true };

	} catch (error) {
		clearTimeout(timeoutId);
		const errorMessage = error instanceof Error ? error.message : 'Network error';
		console.error('[1C API] Error applying discount:', errorMessage);

		return {
			success: false,
			transactionId: 0,
			finalAmount: 0,
			customerId: 0,
			error: errorMessage
		};
	}
}

/**
 * Подтвердить транзакцию (чек пробит в 1С)
 *
 * POST /api/1c/confirm
 *
 * Body: {
 *   transactionId: 42,
 *   checkNumber: "ЧЕК-0001234",
 *   paidAmount: 1350.00,
 *   onecTransactionId: "1C-TXN-123456"
 * }
 *
 * Returns: { success: true }
 */
export async function confirmOnecTransaction(
	request: ConfirmTransactionRequest
): Promise<ConfirmTransactionResponse | null> {
	try {
		const response = await fetch(`${BACKEND_URL}/api/1c/confirm`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request)
		});

		if (!response.ok) {
			console.error('[1C API] Failed to confirm transaction:', response.statusText);
			return null;
		}

		const data: ConfirmTransactionResponse = await response.json();
		console.log('[1C API] Transaction confirmed:', data);
		return data;

	} catch (error) {
		console.error('[1C API] Error confirming transaction:', error);
		return null;
	}
}

/**
 * Health check для проверки доступности 1C API
 */
export async function checkOnecApiHealth(): Promise<boolean> {
	try {
		const response = await fetch(`${BACKEND_URL}/api/1c/health`);
		const data = await response.json();
		return data.status === 'ok';
	} catch (error) {
		console.error('[1C API] Health check failed:', error);
		return false;
	}
}
