/**
 * Script to add card_number field to loyalty_users table
 * and generate card numbers for existing users
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/db/sqlite/app.db');

async function addCardNumbers() {
	console.log('Opening database:', DB_PATH);
	const db = new Database(DB_PATH);

	try {
		// Step 1: Check if card_number column already exists
		const tableInfo = db.pragma('table_info(loyalty_users)');
		const hasCardNumber = tableInfo.some(
			(col: any) => col.name === 'card_number'
		);

		if (!hasCardNumber) {
			console.log('Adding card_number column to loyalty_users table...');
			// Add column without UNIQUE constraint first
			db.exec('ALTER TABLE loyalty_users ADD COLUMN card_number TEXT');
			console.log('✓ Column added successfully');
		} else {
			console.log('✓ card_number column already exists');
		}

		// Step 2: Get all loyalty users without card numbers
		const users = db
			.prepare(
				'SELECT id, telegram_user_id, card_number FROM loyalty_users WHERE card_number IS NULL'
			)
			.all();

		console.log(`\nFound ${users.length} users without card numbers`);

		// Step 3: Generate and update card numbers
		const updateStmt = db.prepare(
			'UPDATE loyalty_users SET card_number = ? WHERE id = ?'
		);

		for (const user of users as any[]) {
			// Generate 6-digit card number from telegram_user_id
			// Take last 6 digits of telegram_user_id
			const telegramId = user.telegram_user_id.toString();
			const cardNumber = telegramId.slice(-6).padStart(6, '0');

			console.log(
				`User ID ${user.id}: telegram_user_id=${user.telegram_user_id} → card_number=${cardNumber}`
			);

			try {
				updateStmt.run(cardNumber, user.id);
				console.log(`  ✓ Updated user ${user.id} with card_number ${cardNumber}`);
			} catch (error: any) {
				if (error.message.includes('UNIQUE constraint failed')) {
					// Card number already exists, try with prefix
					const altCardNumber = '99' + cardNumber;
					console.log(
						`  ! Collision detected, trying ${altCardNumber} instead`
					);
					updateStmt.run(altCardNumber, user.id);
					console.log(`  ✓ Updated user ${user.id} with card_number ${altCardNumber}`);
				} else {
					throw error;
				}
			}
		}

		// Step 4: Create UNIQUE index on card_number
		console.log('\nCreating UNIQUE index on card_number...');
		try {
			db.exec(
				'CREATE UNIQUE INDEX IF NOT EXISTS loyalty_users_card_number_unique ON loyalty_users(card_number)'
			);
			console.log('✓ UNIQUE index created successfully');
		} catch (error: any) {
			console.log('! Index might already exist:', error.message);
		}

		// Step 5: Verify updates
		const allUsers = db
			.prepare(
				'SELECT id, telegram_user_id, card_number, first_name FROM loyalty_users'
			)
			.all();

		console.log('\n=== Final Loyalty Users ===');
		console.table(allUsers);

		console.log('\n✓ Migration completed successfully!');
	} catch (error) {
		console.error('Error during migration:', error);
		throw error;
	} finally {
		db.close();
	}
}

addCardNumbers().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});
