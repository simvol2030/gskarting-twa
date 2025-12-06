import { Router } from 'express';
import bcrypt from 'bcrypt';
import { queries } from '../../db/database';

const router = Router();
const SALT_ROUNDS = 10;

/**
 * GET /api/admin/sellers - получить список всех продавцов
 */
router.get('/', async (req, res) => {
	try {
		const sellers = await queries.getAllSellers();
		res.json({ sellers });
	} catch (error) {
		console.error('Error fetching sellers:', error);
		res.status(500).json({ error: 'Ошибка получения списка продавцов' });
	}
});

/**
 * GET /api/admin/sellers/:id - получить продавца по ID
 */
router.get('/:id', async (req, res) => {
	const id = parseInt(req.params.id);

	if (isNaN(id)) {
		return res.status(400).json({ error: 'Некорректный ID' });
	}

	try {
		const seller = await queries.getSellerById(id);

		if (!seller) {
			return res.status(404).json({ error: 'Продавец не найден' });
		}

		// Возвращаем без PIN
		res.json({
			seller: {
				id: seller.id,
				name: seller.name,
				is_active: seller.is_active,
				created_at: seller.created_at
			}
		});
	} catch (error) {
		console.error('Error fetching seller:', error);
		res.status(500).json({ error: 'Ошибка получения продавца' });
	}
});

/**
 * POST /api/admin/sellers - создать нового продавца
 */
router.post('/', async (req, res) => {
	const { name, pin } = req.body;

	// Валидация
	if (!name || typeof name !== 'string' || name.trim().length < 2) {
		return res.status(400).json({ error: 'Имя должно содержать минимум 2 символа' });
	}

	if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
		return res.status(400).json({ error: 'PIN должен быть 4-значным числом' });
	}

	try {
		// Проверяем уникальность PIN (проверяем все существующие хэши)
		const { db } = await import('../../db/client');
		const { sellers } = await import('../../db/schema');
		const existingSellers = await db.select().from(sellers);

		for (const seller of existingSellers) {
			const isMatch = await bcrypt.compare(pin, seller.pin);
			if (isMatch) {
				return res.status(400).json({ error: 'Этот PIN-код уже используется' });
			}
		}

		// Хэшируем PIN
		const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);

		// Создаём продавца
		const newSeller = await queries.createSeller({
			name: name.trim(),
			pin: hashedPin
		});

		res.status(201).json({
			success: true,
			seller: {
				id: newSeller.id,
				name: newSeller.name,
				is_active: newSeller.is_active,
				created_at: newSeller.created_at
			}
		});
	} catch (error) {
		console.error('Error creating seller:', error);
		res.status(500).json({ error: 'Ошибка создания продавца' });
	}
});

/**
 * PUT /api/admin/sellers/:id - обновить продавца
 */
router.put('/:id', async (req, res) => {
	const id = parseInt(req.params.id);
	const { name, pin, is_active } = req.body;

	if (isNaN(id)) {
		return res.status(400).json({ error: 'Некорректный ID' });
	}

	try {
		const existingSeller = await queries.getSellerById(id);
		if (!existingSeller) {
			return res.status(404).json({ error: 'Продавец не найден' });
		}

		const updateData: { name?: string; pin?: string; is_active?: boolean } = {};

		// Валидация имени
		if (name !== undefined) {
			if (typeof name !== 'string' || name.trim().length < 2) {
				return res.status(400).json({ error: 'Имя должно содержать минимум 2 символа' });
			}
			updateData.name = name.trim();
		}

		// Валидация и хэширование нового PIN
		if (pin !== undefined && pin !== '') {
			if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
				return res.status(400).json({ error: 'PIN должен быть 4-значным числом' });
			}

			// Проверяем уникальность нового PIN
			const { db } = await import('../../db/client');
			const { sellers } = await import('../../db/schema');
			const existingSellers = await db.select().from(sellers);

			for (const seller of existingSellers) {
				if (seller.id === id) continue; // Пропускаем текущего продавца
				const isMatch = await bcrypt.compare(pin, seller.pin);
				if (isMatch) {
					return res.status(400).json({ error: 'Этот PIN-код уже используется' });
				}
			}

			updateData.pin = await bcrypt.hash(pin, SALT_ROUNDS);
		}

		// Валидация статуса
		if (is_active !== undefined) {
			if (typeof is_active !== 'boolean') {
				return res.status(400).json({ error: 'Некорректное значение статуса' });
			}
			updateData.is_active = is_active;
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({ error: 'Нет данных для обновления' });
		}

		const updatedSeller = await queries.updateSeller(id, updateData);

		res.json({
			success: true,
			seller: {
				id: updatedSeller!.id,
				name: updatedSeller!.name,
				is_active: updatedSeller!.is_active,
				created_at: updatedSeller!.created_at
			}
		});
	} catch (error) {
		console.error('Error updating seller:', error);
		res.status(500).json({ error: 'Ошибка обновления продавца' });
	}
});

/**
 * DELETE /api/admin/sellers/:id - удалить продавца
 */
router.delete('/:id', async (req, res) => {
	const id = parseInt(req.params.id);

	if (isNaN(id)) {
		return res.status(400).json({ error: 'Некорректный ID' });
	}

	try {
		const existingSeller = await queries.getSellerById(id);
		if (!existingSeller) {
			return res.status(404).json({ error: 'Продавец не найден' });
		}

		await queries.deleteSeller(id);

		res.json({ success: true, message: 'Продавец удалён' });
	} catch (error) {
		console.error('Error deleting seller:', error);
		res.status(500).json({ error: 'Ошибка удаления продавца' });
	}
});

export default router;
