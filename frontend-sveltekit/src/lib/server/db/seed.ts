import { db } from './client';
import { products, offers, recommendations } from './schema';

/**
 * Database Seed Script
 * Restores homepage content: products, offers, and recommendations
 * Data extracted from old project: sistemloyal_v2/app.js
 *
 * Run with: npx tsx src/lib/server/db/seed.ts
 */

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Seed products (9 items)
    console.log('📦 Seeding products...');
    await db.insert(products).values([
      {
        id: 2,
        name: 'Pro Plan для собак',
        price: 4200,
        old_price: 5100,
        image: 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=300&h=300&fit=crop',
        category: 'Корма',
        is_active: true
      },
      {
        id: 3,
        name: 'Игрушка "Мышка-пищалка"',
        price: 890,
        old_price: 1200,
        image: 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?w=300&h=300&fit=crop',
        category: 'Игрушки',
        is_active: true
      },
      {
        id: 4,
        name: 'Наполнитель Cat Step',
        price: 1340,
        old_price: 1560,
        image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=300&h=300&fit=crop',
        category: 'Гигиена',
        is_active: true
      },
      {
        id: 5,
        name: 'Whiskas паучи 12шт',
        price: 680,
        old_price: 850,
        image: './whiskas-pauch-pileshko-meso-1000x1000.jpg',
        category: 'Корма',
        is_active: true
      },
      {
        id: 6,
        name: 'Когтеточка "Столбик"',
        price: 2450,
        old_price: 3100,
        image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=300&fit=crop',
        category: 'Аксессуары',
        is_active: true
      },
      {
        id: 7,
        name: 'Лакомства для кошек',
        price: 350,
        old_price: 480,
        image: 'https://images.unsplash.com/photo-1611003228941-98852ba62227?w=300&h=300&fit=crop',
        category: 'Лакомства',
        is_active: true
      },
      {
        id: 8,
        name: 'Миска керамическая',
        price: 450,
        old_price: 650,
        image: 'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=300&h=300&fit=crop',
        category: 'Посуда',
        is_active: true
      },
      {
        id: 9,
        name: 'Игрушка "Мячик-погремушка"',
        price: 560,
        old_price: 780,
        image: 'https://img.freepik.com/free-photo/dog-toy-ball-isolated-white_144627-10984.jpg',
        category: 'Игрушки',
        is_active: true
      },
      {
        id: 10,
        name: 'Ошейник с GPS',
        price: 2890,
        old_price: 3650,
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=300&fit=crop',
        category: 'Аксессуары',
        is_active: true
      }
    ]);
    console.log('✅ Products seeded: 9 items');

    // Seed offers (5 items)
    console.log('🎁 Seeding offers...');
    await db.insert(offers).values([
      {
        id: 1,
        title: 'Корма для кошек',
        description: 'Скидка до 30% на премиум корма',
        icon: '🐱',
        icon_color: 'green',
        deadline: '30 ноября',
        deadline_class: 'orange',
        details: 'Акция распространяется на корма брендов Royal Canin, Pro Plan, Hill\'s и Brit. Скидка действует на упаковки от 1,5 кг. Не суммируется с другими акциями.',
        conditions: JSON.stringify([
          'Минимальная покупка: 1 упаковка от 1,5 кг',
          'Максимальная скидка: 30%',
          'Участвующие бренды: Royal Canin, Pro Plan, Hill\'s, Brit'
        ]),
        is_active: true
      },
      {
        id: 2,
        title: 'Аксессуары для собак',
        description: '2+1 на поводки и ошейники',
        icon: '🐶',
        icon_color: 'orange',
        deadline: 'Весь ноябрь',
        deadline_class: '',
        details: 'При покупке двух поводков или ошейников третий товар дешевле в подарок. Акция действует на все товары категории "Поводки и ошейники".',
        conditions: JSON.stringify([
          'Купите 2 любых поводка/ошейника',
          'Получите 3-й товар (дешевле) бесплатно',
          'Действует на весь ассортимент категории'
        ]),
        is_active: true
      },
      {
        id: 3,
        title: 'Товары для птиц',
        description: 'Клетки и аксессуары -20%',
        icon: '🐦',
        icon_color: 'blue',
        deadline: '15 ноября',
        deadline_class: 'orange',
        details: 'Скидка 20% на все клетки, кормушки, игрушки и другие аксессуары для птиц. Создайте комфортный дом для вашего пернатого друга!',
        conditions: JSON.stringify([
          'Скидка: 20% на весь ассортимент',
          'Категории: клетки, кормушки, игрушки, жердочки',
          'Можно комбинировать с Мурзи-коинами'
        ]),
        is_active: true
      },
      {
        id: 4,
        title: 'Витамины и лакомства',
        description: 'При покупке на 2000₽ - подарок',
        icon: '💊',
        icon_color: 'purple',
        deadline: 'До конца месяца',
        deadline_class: 'orange',
        details: 'Соберите корзину витаминов и лакомств на сумму от 2000 рублей и получите в подарок упаковку лакомств для вашего питомца!',
        conditions: JSON.stringify([
          'Минимальная сумма покупки: 2000₽',
          'Подарок: упаковка лакомств (ассортимент зависит от наличия)',
          'Один подарок на один чек'
        ]),
        is_active: true
      },
      {
        id: 5,
        title: 'Игрушки для кошек',
        description: 'Три игрушки по цене двух',
        icon: '🎾',
        icon_color: 'pink',
        deadline: 'Постоянная акция',
        deadline_class: '',
        details: 'Постоянная акция! Купите две любые игрушки для кошек и получите третью бесплатно. Разнообразьте досуг вашего питомца!',
        conditions: JSON.stringify([
          'Купите 2 игрушки для кошек',
          '3-я игрушка (дешевле) бесплатно',
          'Акция постоянная, без ограничений по срокам'
        ]),
        is_active: true
      }
    ]);
    console.log('✅ Offers seeded: 5 items');

    // Seed recommendations (4 items, not tied to specific user)
    console.log('💡 Seeding recommendations...');
    await db.insert(recommendations).values([
      {
        id: 1,
        loyalty_user_id: null, // General recommendations not tied to specific user
        name: 'Витамины для шерсти',
        description: 'Для здоровья и блеска',
        price: 890,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop',
        is_active: true
      },
      {
        id: 2,
        loyalty_user_id: null,
        name: 'Антипаразитарные капли',
        description: 'Защита на 30 дней',
        price: 1250,
        image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&h=300&fit=crop',
        is_active: true
      },
      {
        id: 3,
        loyalty_user_id: null,
        name: 'Зубная паста для кошек',
        description: 'Свежее дыхание',
        price: 380,
        image: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=300&h=300&fit=crop',
        is_active: true
      },
      {
        id: 4,
        loyalty_user_id: null,
        name: 'Шампунь гипоаллергенный',
        description: 'Для чувствительной кожи',
        price: 650,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop',
        is_active: true
      }
    ]);
    console.log('✅ Recommendations seeded: 4 items');

    console.log('');
    console.log('🎉 Database seed completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Products: 9 items (id 2-10)');
    console.log('   - Offers: 5 items');
    console.log('   - Recommendations: 4 items');
    console.log('');
    console.log('✅ Homepage content restored!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
