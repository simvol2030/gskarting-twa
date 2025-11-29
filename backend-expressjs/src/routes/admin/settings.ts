/**
 * Admin API: Settings Management
 */

import { Router } from 'express';
import { db } from '../../db/client';
import { admins, loyaltySettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { authenticateSession, requireRole } from '../../middleware/session-auth';
import { invalidateRetentionCache } from '../../utils/retention';
import { invalidateLoyaltySettingsCache } from '../../db/queries/loyaltySettings';

const router = Router();

// 🔒 SECURITY: All admin routes require authentication
router.use(authenticateSession);

/**
 * GET /api/admin/settings/admins - Список администраторов
 */
router.get('/admins', async (req, res) => {
	try {
		const allAdmins = await db.select().from(admins);

		const adminsData = allAdmins.map((a) => ({
			id: a.id,
			email: a.email,
			role: a.role,
			name: a.name,
			createdAt: a.created_at
		}));

		res.json({ success: true, data: { admins: adminsData } });
	} catch (error: any) {
		console.error('Error fetching admins:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * Validation helper for admin creation
 */
function validateAdminData(email: string, password: string, role: string, name: string): string | null {
	// Email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailRegex.test(email)) {
		return 'Invalid email format';
	}

	// Password validation (minimum 8 characters)
	if (!password || password.length < 8) {
		return 'Password must be at least 8 characters long';
	}

	// Role validation (whitelist)
	const validRoles = ['super-admin', 'editor', 'viewer'];
	if (!role || !validRoles.includes(role)) {
		return `Invalid role. Must be one of: ${validRoles.join(', ')}`;
	}

	// Name validation
	if (!name || name.trim().length < 2) {
		return 'Name must be at least 2 characters long';
	}

	return null; // No errors
}

/**
 * POST /api/admin/settings/admins - Создать администратора
 * ONLY: super-admin
 */
router.post('/admins', requireRole('super-admin'), async (req, res) => {
	try {
		const { email, password, role, name } = req.body;

		// Validate input data
		const validationError = validateAdminData(email, password, role || 'viewer', name);
		if (validationError) {
			return res.status(400).json({ success: false, error: validationError });
		}

		// Check for duplicate email
		const existingAdmin = await db.select().from(admins).where(eq(admins.email, email.toLowerCase())).limit(1);
		if (existingAdmin.length > 0) {
			return res.status(400).json({ success: false, error: 'Email already exists' });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		const result = await db
			.insert(admins)
			.values({
				email: email.toLowerCase(), // Store email in lowercase
				password: hashedPassword,
				role: role || 'viewer',
				name: name.trim()
			})
			.returning();

		const created = result[0];

		res.status(201).json({
			success: true,
			data: {
				id: created.id,
				email: created.email,
				role: created.role,
				name: created.name,
				createdAt: created.created_at
			}
		});
	} catch (error: any) {
		console.error('Error creating admin:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * DELETE /api/admin/settings/admins/:id - Удалить администратора
 * ONLY: super-admin
 */
router.delete('/admins/:id', requireRole('super-admin'), async (req, res) => {
	try {
		const adminId = parseInt(req.params.id);

		await db.delete(admins).where(eq(admins.id, adminId));

		res.json({ success: true, message: 'Администратор удален' });
	} catch (error: any) {
		console.error('Error deleting admin:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * Validation helper for loyalty settings
 */
function validateLoyaltySettings(data: any): string | null {
	if (data.earningPercent !== undefined) {
		if (data.earningPercent < 0.1 || data.earningPercent > 20) {
			return 'Процент начисления должен быть от 0.1% до 20%';
		}
	}

	if (data.maxDiscountPercent !== undefined) {
		if (data.maxDiscountPercent < 1 || data.maxDiscountPercent > 50) {
			return 'Максимальная скидка должна быть от 1% до 50%';
		}
	}

	// 🔒 BUSINESS RULE: Earning shouldn't exceed max discount
	if (data.earningPercent !== undefined && data.maxDiscountPercent !== undefined) {
		if (data.earningPercent > data.maxDiscountPercent) {
			return 'Процент начисления не должен превышать максимальную скидку';
		}
	}

	if (data.expiryDays !== undefined) {
		if (data.expiryDays < 1 || data.expiryDays > 365) {
			return 'Срок действия баллов должен быть от 1 до 365 дней';
		}
	}

	if (data.welcomeBonus !== undefined) {
		if (data.welcomeBonus < 0 || data.welcomeBonus > 2000) {
			return 'Приветственный бонус должен быть от 0 до 2000';
		}
	}

	if (data.birthdayBonus !== undefined) {
		if (data.birthdayBonus < 0 || data.birthdayBonus > 10000) {
			return 'Бонус на день рождения должен быть от 0 до 10000';
		}
	}

	if (data.minRedemptionAmount !== undefined) {
		if (data.minRedemptionAmount < 0 || data.minRedemptionAmount > 1000) {
			return 'Минимальная сумма для списания должна быть от 0 до 1000';
		}
	}

	if (data.pointsName !== undefined) {
		const cleaned = data.pointsName.trim();
		if (cleaned.length < 1 || cleaned.length > 50) {
			return 'Название баллов должно быть от 1 до 50 символов';
		}
		// 🔒 SECURITY: Prevent XSS - block ANY < or > characters
		// This prevents: <script>, <img src=x, incomplete tags, HTML entities
		if (/<|>/.test(cleaned)) {
			return 'Название баллов не может содержать символы < или >';
		}
	}

	if (data.supportEmail) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.supportEmail)) {
			return 'Неверный формат email поддержки';
		}
	}

	if (data.supportPhone) {
		const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
		if (!phoneRegex.test(data.supportPhone)) {
			return 'Неверный формат телефона поддержки';
		}
	}

	return null;
}

/**
 * GET /api/admin/settings/loyalty - Получить настройки программы лояльности
 */
router.get('/loyalty', async (req, res) => {
	try {
		const settings = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, 1)).limit(1);

		if (settings.length === 0) {
			return res.status(404).json({ success: false, error: 'Настройки лояльности не найдены' });
		}

		const s = settings[0];

		res.json({
			success: true,
			data: {
				earningPercent: s.earning_percent,
				maxDiscountPercent: s.max_discount_percent,
				expiryDays: s.expiry_days,
				welcomeBonus: s.welcome_bonus,
				birthdayBonus: s.birthday_bonus,
				minRedemptionAmount: s.min_redemption_amount,
				pointsName: s.points_name,
				supportEmail: s.support_email,
				supportPhone: s.support_phone,
				updatedAt: s.updated_at
			}
		});
	} catch (error: any) {
		console.error('Error fetching loyalty settings:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

/**
 * PUT /api/admin/settings/loyalty - Обновить настройки программы лояльности
 * ONLY: super-admin, editor
 * 🔒 SECURITY: This endpoint is called from SvelteKit which has CSRF protection in hooks.server.ts
 * Express backend trusts requests from authenticated sessions
 */
router.put('/loyalty', requireRole('super-admin', 'editor'), async (req, res) => {
	try {
		const { earningPercent, maxDiscountPercent, expiryDays, welcomeBonus, birthdayBonus, minRedemptionAmount, pointsName, supportEmail, supportPhone } = req.body;

		// Получить текущие настройки ДО валидации (для merge)
		let currentSettings = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, 1)).limit(1);

		// 🔒 SAFETY: Auto-create default settings if missing (edge case: fresh DB or accidental deletion)
		if (currentSettings.length === 0) {
			console.log('[LOYALTY SETTINGS] Creating default settings (missing row)');
			await db.insert(loyaltySettings).values({
				id: 1,
				earning_percent: 4.0,
				max_discount_percent: 20.0,
				expiry_days: 45,
				welcome_bonus: 500.0,
				birthday_bonus: 0.0,
				min_redemption_amount: 1.0,
				points_name: 'Мурзи-коины'
			});
			currentSettings = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, 1)).limit(1);
		}

		const current = currentSettings[0];

		// 🔒 SECURITY: Merge incoming data with current values for complete validation
		// This prevents partial update bypass of business rules
		const mergedData = {
			earningPercent: earningPercent !== undefined ? earningPercent : current.earning_percent,
			maxDiscountPercent: maxDiscountPercent !== undefined ? maxDiscountPercent : current.max_discount_percent,
			expiryDays: expiryDays !== undefined ? expiryDays : current.expiry_days,
			welcomeBonus: welcomeBonus !== undefined ? welcomeBonus : current.welcome_bonus,
			birthdayBonus: birthdayBonus !== undefined ? birthdayBonus : current.birthday_bonus,
			minRedemptionAmount: minRedemptionAmount !== undefined ? minRedemptionAmount : current.min_redemption_amount,
			pointsName: pointsName !== undefined ? pointsName : current.points_name,
			supportEmail: supportEmail !== undefined ? supportEmail : current.support_email,
			supportPhone: supportPhone !== undefined ? supportPhone : current.support_phone
		};

		// Validate merged data (not just req.body!)
		const validationError = validateLoyaltySettings(mergedData);
		if (validationError) {
			return res.status(400).json({ success: false, error: validationError });
		}

		// Подготовить обновления
		const updates: any = {
			updated_at: new Date().toISOString()
		};

		if (earningPercent !== undefined) updates.earning_percent = earningPercent;
		if (maxDiscountPercent !== undefined) updates.max_discount_percent = maxDiscountPercent;
		if (expiryDays !== undefined) updates.expiry_days = expiryDays;
		if (welcomeBonus !== undefined) updates.welcome_bonus = welcomeBonus;
		if (birthdayBonus !== undefined) updates.birthday_bonus = birthdayBonus;
		if (minRedemptionAmount !== undefined) updates.min_redemption_amount = minRedemptionAmount;
		if (pointsName !== undefined) updates.points_name = pointsName;
		if (supportEmail !== undefined) updates.support_email = supportEmail;
		if (supportPhone !== undefined) updates.support_phone = supportPhone;

		// Обновить настройки (single update is already atomic in SQLite)
		await db.update(loyaltySettings).set(updates).where(eq(loyaltySettings.id, 1));

		// 🔴 FIX: Invalidate loyalty settings cache IMMEDIATELY so new settings take effect
		invalidateLoyaltySettingsCache();
		console.log('[LOYALTY SETTINGS] Settings cache invalidated - new values effective immediately');

		// Invalidate retention cache if expiry_days was updated
		if (expiryDays !== undefined) {
			invalidateRetentionCache();
			console.log('[LOYALTY SETTINGS] Retention cache invalidated (expiry_days changed)');
		}

		// Логирование изменений
		const adminName = (req as any).user?.name || 'Unknown Admin';
		const adminId = (req as any).user?.id || 0;

		console.log(`[LOYALTY SETTINGS UPDATE] Admin ID=${adminId} (${adminName}) updated settings:`, updates);

		// Получить обновленные настройки
		const updated = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, 1)).limit(1);
		const s = updated[0];

		res.json({
			success: true,
			data: {
				earningPercent: s.earning_percent,
				maxDiscountPercent: s.max_discount_percent,
				expiryDays: s.expiry_days,
				welcomeBonus: s.welcome_bonus,
				birthdayBonus: s.birthday_bonus,
				minRedemptionAmount: s.min_redemption_amount,
				pointsName: s.points_name,
				supportEmail: s.support_email,
				supportPhone: s.support_phone,
				updatedAt: s.updated_at
			}
		});
	} catch (error: any) {
		console.error('Error updating loyalty settings:', error);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
});

export default router;
