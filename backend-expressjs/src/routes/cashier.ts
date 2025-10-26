import { Router } from 'express';
import { queries } from '../db/database';
import { db } from '../db/client';
import { validateId, validatePurchaseAmount, validatePointsToRedeem, validateTransactionMetadata } from '../utils/validation';

const router = Router();

/**
 * POST /api/cashier/earn
 * Начислить баллы за покупку
 */
router.post('/earn', async (req, res) => {
	const { customerId, storeId, purchaseAmount, metadata } = req.body;

	try {
		// 1. Validate customerId
		const customerIdValidation = validateId(customerId?.toString());
		if (!customerIdValidation.valid) {
			return res.status(400).json({
				success: false,
				error: customerIdValidation.error,
				code: 'INVALID_CUSTOMER'
			});
		}

		// 2. Validate storeId
		const storeIdValidation = validateId(storeId?.toString());
		if (!storeIdValidation.valid) {
			return res.status(400).json({
				success: false,
				error: storeIdValidation.error,
				code: 'INVALID_STORE'
			});
		}

		// 3. Validate purchaseAmount
		const amountValidation = validatePurchaseAmount(purchaseAmount);
		if (!amountValidation.valid) {
			return res.status(400).json({
				success: false,
				error: amountValidation.error,
				code: 'INVALID_AMOUNT'
			});
		}

		// 4. Validate metadata (optional)
		const metadataValidation = validateTransactionMetadata(metadata);
		if (!metadataValidation.valid) {
			return res.status(400).json({
				success: false,
				error: metadataValidation.error,
				code: 'INVALID_METADATA'
			});
		}

		const customerIdNum = parseInt(customerId.toString());
		const storeIdNum = parseInt(storeId.toString());

		// 5. Check customer exists
		const customer = await queries.getLoyaltyUserById(customerIdNum);
		if (!customer) {
			return res.status(404).json({
				success: false,
				error: 'Покупатель не найден',
				code: 'INVALID_CUSTOMER'
			});
		}

		if (!customer.is_active) {
			return res.status(400).json({
				success: false,
				error: 'Аккаунт покупателя неактивен',
				code: 'INVALID_CUSTOMER'
			});
		}

		// 6. Check store exists
		const store = await queries.getStoreById(storeIdNum);
		if (!store) {
			return res.status(404).json({
				success: false,
				error: 'Магазин не найден',
				code: 'INVALID_STORE'
			});
		}

		// 7. Calculate points earned (5% cashback based on user requirement)
		const pointsEarned = Math.floor(purchaseAmount * 0.05);

		// 8. Execute operations (note: Drizzle SQLite doesn't support nested transactions)
		// 8a. Update customer balance
		const updatedCustomer = await queries.updateLoyaltyUserBalance(customerIdNum, pointsEarned);
		if (!updatedCustomer) {
			return res.status(500).json({
				success: false,
				error: 'Не удалось обновить баланс покупателя',
				code: 'INTERNAL_ERROR'
			});
		}

		// 8b. Update customer stats
		await queries.updateLoyaltyUserStats(customerIdNum, {
			total_purchases: customer.total_purchases + 1
		});

		// 8c. Create cashier transaction record
		const cashierTx = await queries.createCashierTransaction({
			customer_id: customerIdNum,
			store_id: storeIdNum,
			type: 'earn',
			purchase_amount: purchaseAmount,
			points_amount: pointsEarned,
			discount_amount: 0,
			metadata: metadata ? JSON.stringify(metadata) : null,
			synced_with_1c: false
		});

		// 8d. Create global transaction record
		await queries.createTransaction({
			loyalty_user_id: customerIdNum,
			store_id: storeIdNum,
			title: 'Начисление за покупку',
			amount: pointsEarned,
			type: 'earn',
			spent: null,
			store_name: store.name
		});

		const result = {
			cashierTx,
			newBalance: updatedCustomer.current_balance
		};

		// 9. Log transaction
		console.log('✅ Cashier earn transaction completed:', {
			customerId: customerIdNum,
			storeId: storeIdNum,
			pointsEarned,
			purchaseAmount,
			newBalance: result.newBalance
		});

		// 10. Return success response
		res.json({
			success: true,
			transaction: {
				id: result.cashierTx.id,
				customerId: customerIdNum,
				pointsEarned,
				newBalance: result.newBalance,
				purchaseAmount,
				createdAt: result.cashierTx.created_at
			}
		});
	} catch (error: any) {
		console.error('❌ Cashier earn transaction error:', error);
		res.status(500).json({
			success: false,
			error: 'Произошла ошибка при начислении баллов. Попробуйте снова.',
			code: 'INTERNAL_ERROR'
		});
	}
});

/**
 * POST /api/cashier/redeem
 * Списать баллы за скидку
 */
router.post('/redeem', async (req, res) => {
	const { customerId, storeId, purchaseAmount, pointsToRedeem, metadata } = req.body;

	try {
		// 1. Validate customerId
		const customerIdValidation = validateId(customerId?.toString());
		if (!customerIdValidation.valid) {
			return res.status(400).json({
				success: false,
				error: customerIdValidation.error,
				code: 'INVALID_CUSTOMER'
			});
		}

		// 2. Validate storeId
		const storeIdValidation = validateId(storeId?.toString());
		if (!storeIdValidation.valid) {
			return res.status(400).json({
				success: false,
				error: storeIdValidation.error,
				code: 'INVALID_STORE'
			});
		}

		// 3. Validate purchaseAmount
		const amountValidation = validatePurchaseAmount(purchaseAmount);
		if (!amountValidation.valid) {
			return res.status(400).json({
				success: false,
				error: amountValidation.error,
				code: 'INVALID_AMOUNT'
			});
		}

		// 4. Validate metadata (optional)
		const metadataValidation = validateTransactionMetadata(metadata);
		if (!metadataValidation.valid) {
			return res.status(400).json({
				success: false,
				error: metadataValidation.error,
				code: 'INVALID_METADATA'
			});
		}

		const customerIdNum = parseInt(customerId.toString());
		const storeIdNum = parseInt(storeId.toString());

		// 5. Check customer exists
		const customer = await queries.getLoyaltyUserById(customerIdNum);
		if (!customer) {
			return res.status(404).json({
				success: false,
				error: 'Покупатель не найден',
				code: 'INVALID_CUSTOMER'
			});
		}

		if (!customer.is_active) {
			return res.status(400).json({
				success: false,
				error: 'Аккаунт покупателя неактивен',
				code: 'INVALID_CUSTOMER'
			});
		}

		// 6. Validate pointsToRedeem against customer balance and purchase amount
		const pointsValidation = validatePointsToRedeem(
			pointsToRedeem,
			customer.current_balance,
			purchaseAmount
		);
		if (!pointsValidation.valid) {
			const errorMessage = pointsValidation.error ?? 'Ошибка валидации баллов';
			return res.status(400).json({
				success: false,
				error: errorMessage,
				code: errorMessage.includes('Недостаточно баллов')
					? 'INSUFFICIENT_BALANCE'
					: 'MAX_DISCOUNT_EXCEEDED'
			});
		}

		// 7. Check store exists
		const store = await queries.getStoreById(storeIdNum);
		if (!store) {
			return res.status(404).json({
				success: false,
				error: 'Магазин не найден',
				code: 'INVALID_STORE'
			});
		}

		// 8. Calculate discount (1 point = 1 ruble)
		const discountAmount = pointsToRedeem;
		const finalAmount = purchaseAmount - discountAmount;

		// 9. Execute operations
		// 9a. Update customer balance (negative delta for spending)
		const updatedCustomer = await queries.updateLoyaltyUserBalance(
			customerIdNum,
			-pointsToRedeem
		);
		if (!updatedCustomer) {
			return res.status(500).json({
				success: false,
				error: 'Не удалось обновить баланс покупателя',
				code: 'INTERNAL_ERROR'
			});
		}

		// 9b. Update customer stats
		await queries.updateLoyaltyUserStats(customerIdNum, {
			total_saved: customer.total_saved + discountAmount
		});

		// 9c. Create cashier transaction record
		const cashierTx = await queries.createCashierTransaction({
			customer_id: customerIdNum,
			store_id: storeIdNum,
			type: 'redeem',
			purchase_amount: purchaseAmount,
			points_amount: pointsToRedeem,
			discount_amount: discountAmount,
			metadata: metadata ? JSON.stringify(metadata) : null,
			synced_with_1c: false
		});

		// 9d. Create global transaction record
		await queries.createTransaction({
			loyalty_user_id: customerIdNum,
			store_id: storeIdNum,
			title: 'Списание за покупку',
			amount: pointsToRedeem,
			type: 'spend',
			spent: `${discountAmount} ₽`,
			store_name: store.name
		});

		const result = {
			cashierTx,
			newBalance: updatedCustomer.current_balance
		};

		// 10. Log transaction
		console.log('✅ Cashier redeem transaction completed:', {
			customerId: customerIdNum,
			storeId: storeIdNum,
			pointsRedeemed: pointsToRedeem,
			discountAmount,
			finalAmount,
			newBalance: result.newBalance
		});

		// 11. Return success response
		res.json({
			success: true,
			transaction: {
				id: result.cashierTx.id,
				customerId: customerIdNum,
				pointsRedeemed: pointsToRedeem,
				discountAmount,
				finalAmount,
				newBalance: result.newBalance,
				createdAt: result.cashierTx.created_at
			}
		});
	} catch (error: any) {
		console.error('❌ Cashier redeem transaction error:', error);

		// Check if it's a balance error
		if (error.message && error.message.includes('Недостаточно баллов')) {
			return res.status(400).json({
				success: false,
				error: error.message,
				code: 'INSUFFICIENT_BALANCE'
			});
		}

		res.status(500).json({
			success: false,
			error: 'Произошла ошибка при списании баллов. Попробуйте снова.',
			code: 'INTERNAL_ERROR'
		});
	}
});

export default router;
