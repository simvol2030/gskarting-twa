/**
 * Example transaction history for demonstration purposes
 * Shown to new users to illustrate how the transaction history will look
 */

import type { Transaction } from '$lib/types/loyalty';

export const EXAMPLE_TRANSACTIONS: Transaction[] = [
	{
		id: 'example-1',
		title: 'Покупка корма Royal Canin',
		date: '12 октября, 14:32',
		amount: 125,
		spent: 'Потрачено: 3 120 ₽',
		type: 'earn',
		storeName: 'Магазин на Зеленоградской'
	},
	{
		id: 'example-2',
		title: 'Игрушки для кота',
		date: '8 октября, 16:15',
		amount: 71,
		spent: 'Потрачено: 1 780 ₽',
		type: 'earn',
		storeName: 'Магазин в Софрино'
	},
	{
		id: 'example-3',
		title: 'Списание Мурзи-коинов',
		date: '5 октября, 11:20',
		amount: -200,
		spent: 'Оплата части покупки',
		type: 'spend'
	},
	{
		id: 'example-4',
		title: 'Бонус за день рождения',
		date: '1 октября, 00:00',
		amount: 200,
		spent: 'Поздравляем с днём рождения!',
		type: 'earn'
	}
];
