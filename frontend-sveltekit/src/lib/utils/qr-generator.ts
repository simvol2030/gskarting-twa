import QRCode from 'qrcode';

/**
 * Генерация данных для QR-кода (цифровой формат)
 * Формат: 99421856 (префикс 99 + 6-значный номер карты)
 * Работает на ЛЮБОЙ раскладке клавиатуры (только цифры 0-9)
 * Префикс 99 = специальный код программы лояльности Мурзико
 */
export async function generateQRData(cardNumber: string): Promise<string> {
	const cardNumberClean = cardNumber.replace(/\s/g, '');

	// Формат: 99 (префикс) + cardNumber (6 цифр) = 8 цифр
	return `99${cardNumberClean}`;
}

/**
 * Парсинг и валидация QR-кода (цифровой формат)
 * Формат: 99421856 (8 цифр: префикс 99 + 6-значный номер карты)
 * Также поддерживает прямой ввод 6-значного номера без префикса
 */
export async function parseQRData(qrString: string): Promise<{
	valid: boolean;
	cardNumber?: string;
	error?: string;
}> {
	try {
		const trimmed = qrString.trim();

		// Проверяем что только цифры
		if (!/^\d+$/.test(trimmed)) {
			return {
				valid: false,
				error: 'Должны быть только цифры'
			};
		}

		let cardNumberClean: string;

		// Вариант 1: QR-код с префиксом 99 (8 цифр)
		if (trimmed.length === 8 && trimmed.startsWith('99')) {
			cardNumberClean = trimmed.substring(2); // цифры 3-8
		}
		// Вариант 2: Прямой ввод номера карты (6 цифр)
		else if (trimmed.length === 6) {
			cardNumberClean = trimmed;
		}
		// Неверный формат
		else {
			return {
				valid: false,
				error: 'Неверный формат. Введите 6-значный номер карты или отсканируйте QR-код'
			};
		}

		// НЕ форматируем номер карты с пробелом - backend ожидает без пробелов
		// const cardNumberFormatted = cardNumberClean.replace(/(\d{3})(\d{3})/, '$1 $2');

		return {
			valid: true,
			cardNumber: cardNumberClean  // Возвращаем без пробелов!
		};
	} catch (error) {
		return { valid: false, error: 'Ошибка при разборе QR-кода' };
	}
}

/**
 * Генерация QR-кода как Data URL
 */
export async function generateQRCodeImage(cardNumber: string): Promise<string> {
	const qrData = await generateQRData(cardNumber);

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
