import QRCode from 'qrcode';

/**
 * Генерация данных для QR-кода (цифровой формат)
 * Формат: 991421856 (префикс 99 + userId + cardNumber)
 * Работает на ЛЮБОЙ раскладке клавиатуры (только цифры 0-9)
 * Префикс 99 = специальный код программы лояльности Мурзико
 */
export async function generateQRData(userId: number, cardNumber: string): Promise<string> {
	const cardNumberClean = cardNumber.replace(/\s/g, '');

	// Формат: 99 (префикс) + userId (1 цифра) + cardNumber (6 цифр) = 9 цифр
	return `99${userId}${cardNumberClean}`;
}

/**
 * Парсинг и валидация QR-кода (цифровой формат)
 * Формат: 991421856 (9 цифр: префикс 99 + userId + cardNumber)
 */
export async function parseQRData(qrString: string): Promise<{
	valid: boolean;
	userId?: number;
	cardNumber?: string;
	error?: string;
}> {
	try {
		const trimmed = qrString.trim();

		// Проверяем что только цифры
		if (!/^\d+$/.test(trimmed)) {
			return {
				valid: false,
				error: 'Это не QR-код программы лояльности (должны быть только цифры)'
			};
		}

		// Проверяем длину (должно быть 9 цифр)
		if (trimmed.length !== 9) {
			return {
				valid: false,
				error: 'Неверная длина QR-кода (ожидается 9 цифр)'
			};
		}

		// Проверяем префикс 99
		if (!trimmed.startsWith('99')) {
			return {
				valid: false,
				error: 'Это не QR-код программы лояльности Мурзико (неверный префикс)'
			};
		}

		// Парсим: 99 (префикс) + 1 цифра (userId) + 6 цифр (cardNumber)
		const userId = parseInt(trimmed.charAt(2)); // 3-я цифра
		const cardNumberClean = trimmed.substring(3); // цифры 4-9

		// Форматируем номер карты с пробелом (XXX XXX)
		const cardNumberFormatted = cardNumberClean.replace(/(\d{3})(\d{3})/, '$1 $2');

		return {
			valid: true,
			userId: userId,
			cardNumber: cardNumberFormatted
		};
	} catch (error) {
		return { valid: false, error: 'Ошибка при разборе QR-кода' };
	}
}

/**
 * Генерация QR-кода как Data URL
 */
export async function generateQRCodeImage(
	userId: number,
	cardNumber: string
): Promise<string> {
	const qrData = await generateQRData(userId, cardNumber);

	// Генерируем QR-код с настройками
	const qrCodeDataURL = await QRCode.toDataURL(qrData, {
		width: 300,
		margin: 2,
		color: {
			dark: '#000000',
			light: '#FFFFFF'
		},
		errorCorrectionLevel: 'M'
	});

	return qrCodeDataURL;
}
