PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO admins VALUES(1,'admin@example.com','$2b$10$78OBJd/13.iZh0WxnAhZxeuKjGr8KlElOw5VMXD4tCE3cF.UIhMim','super-admin','Super Admin','2025-10-24 08:01:14');
CREATE TABLE loyalty_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  telegram_user_id INTEGER NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  language_code TEXT,
  current_balance REAL DEFAULT 500 NOT NULL,
  total_purchases INTEGER DEFAULT 0 NOT NULL,
  total_saved REAL DEFAULT 0 NOT NULL,
  store_id INTEGER,
  first_login_bonus_claimed INTEGER DEFAULT 0 NOT NULL,
  registration_date TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
  chat_id INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL
, card_number TEXT);
INSERT INTO loyalty_users VALUES(1,123456789,'Иван','Петров','ivan_petrov','ru',780.0,5,250.0,1,1,'2025-10-24 08:04:09','2025-10-24 08:04:09',123456789,1,'456789');
INSERT INTO loyalty_users VALUES(2,987654321,'Мария','Сидорова','maria_sidorova','ru',80.0,13,600.0,1,1,'2025-10-24 08:04:09','2025-10-29T13:04:23.498Z',987654321,1,'654321');
INSERT INTO loyalty_users VALUES(3,555555555,'Алексей','Иванов','alex_ivanov','ru',800.0,3,100.0,1,1,'2025-10-24 08:04:09','2025-10-24 08:04:09',555555555,1,'555555');
CREATE TABLE offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  icon_color TEXT NOT NULL,
  deadline TEXT NOT NULL,
  deadline_class TEXT NOT NULL,
  details TEXT NOT NULL,
  conditions TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL
, image TEXT, show_on_home INTEGER NOT NULL DEFAULT 0);
INSERT INTO offers VALUES(1,'Корма для кошек','Скидка до 30% на премиум корма','🐱','green','30 ноября','orange','Акция распространяется на корма брендов Royal Canin, Pro Plan, Hill''s и Brit. Скидка действует на упаковки от 1,5 кг. Не суммируется с другими акциями.','["Минимальная покупка: 1 упаковка от 1,5 кг","Максимальная скидка: 30%","Участвующие бренды: Royal Canin, Pro Plan, Hill''s, Brit"]',1,NULL,0);
INSERT INTO offers VALUES(2,'Аксессуары для собак','2+1 на поводки и ошейники','🐶','orange','Весь ноябрь','','При покупке двух поводков или ошейников третий товар дешевле в подарок. Акция действует на все товары категории "Поводки и ошейники".','["Купите 2 любых поводка/ошейника","Получите 3-й товар (дешевле) бесплатно","Действует на весь ассортимент категории"]',1,NULL,0);
INSERT INTO offers VALUES(3,'Товары для птиц','Клетки и аксессуары -20%','🐦','blue','15 ноября','orange','Скидка 20% на все клетки, кормушки, игрушки и другие аксессуары для птиц. Создайте комфортный дом для вашего пернатого друга!','["Скидка: 20% на весь ассортимент","Категории: клетки, кормушки, игрушки, жердочки","Можно комбинировать с Мурзи-коинами"]',1,NULL,0);
INSERT INTO offers VALUES(4,'Витамины и лакомства','При покупке на 2000₽ - подарок','💊','purple','До конца месяца','orange','Соберите корзину витаминов и лакомств на сумму от 2000 рублей и получите в подарок упаковку лакомств для вашего питомца!','["Минимальная сумма покупки: 2000₽","Подарок: упаковка лакомств (ассортимент зависит от наличия)","Один подарок на один чек"]',1,NULL,0);
INSERT INTO offers VALUES(5,'Игрушки для кошек','Три игрушки по цене двух','🎾','pink','Постоянная акция','','Постоянная акция! Купите две любые игрушки для кошек и получите третью бесплатно. Разнообразьте досуг вашего питомца!','["Купите 2 игрушки для кошек","3-я игрушка (дешевле) бесплатно","Акция постоянная, без ограничений по срокам"]',1,NULL,0);
INSERT INTO offers VALUES(6,'Тестовая акция','Описание тестовой акции','🎁','#10b981','До конца недели','soon','Полное описание акции с деталями и условиями участия','["Условие 1","Условие 2"]',1,NULL,0);
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO users VALUES(1,'Alice Johnson','alice@example.com','2025-10-24 08:01:14');
INSERT INTO users VALUES(2,'Bob Smith','bob@example.com','2025-10-24 08:01:14');
INSERT INTO users VALUES(3,'Charlie Brown','charlie@example.com','2025-10-24 08:01:14');
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO posts VALUES(1,1,'Getting Started with SvelteKit','SvelteKit is an amazing framework for building web applications.',1,'2025-10-24 08:01:14');
INSERT INTO posts VALUES(2,1,'SQLite with WAL Mode','Write-Ahead Logging provides better concurrency and performance.',1,'2025-10-24 08:01:14');
INSERT INTO posts VALUES(3,2,'Building Modern Web Apps','Modern web development is exciting with tools like Svelte.',1,'2025-10-24 08:01:14');
INSERT INTO posts VALUES(4,3,'Draft Post','This is a draft post, not yet published.',0,'2025-10-24 08:01:14');
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  old_price REAL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL
, description TEXT, quantity_info TEXT, show_on_home INTEGER NOT NULL DEFAULT 0, is_recommendation INTEGER NOT NULL DEFAULT 0);
INSERT INTO products VALUES(2,'Pro Plan для собак',4200.0,5100.0,'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=300&h=300&fit=crop','Корма',1,NULL,NULL,0,0);
INSERT INTO products VALUES(3,'Игрушка "Мышка-пищалка"',890.0,1200.0,'https://images.unsplash.com/photo-1591160690555-5debfba289f0?w=300&h=300&fit=crop','Игрушки',0,NULL,NULL,0,0);
INSERT INTO products VALUES(4,'Наполнитель Cat Step',1340.0,1560.0,'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=300&h=300&fit=crop','Гигиена',1,NULL,NULL,0,0);
INSERT INTO products VALUES(5,'Whiskas паучи 12шт',680.0,850.0,'./whiskas-pauch-pileshko-meso-1000x1000.jpg','Корма',1,NULL,NULL,0,0);
INSERT INTO products VALUES(6,'Когтеточка "Столбик"',2450.0,3100.0,'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=300&fit=crop','Аксессуары',1,NULL,NULL,0,0);
INSERT INTO products VALUES(7,'Лакомства для кошек',350.0,480.0,'https://images.unsplash.com/photo-1611003228941-98852ba62227?w=300&h=300&fit=crop','Лакомства',1,NULL,NULL,0,0);
INSERT INTO products VALUES(8,'Миска керамическая',450.0,650.0,'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=300&h=300&fit=crop','Посуда',1,NULL,NULL,0,0);
INSERT INTO products VALUES(9,'Игрушка "Мячик-погремушка"',560.0,780.0,'https://img.freepik.com/free-photo/dog-toy-ball-isolated-white_144627-10984.jpg','Игрушки',0,NULL,NULL,0,0);
INSERT INTO products VALUES(10,'Ошейник с GPS',2890.0,3650.0,'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=300&fit=crop','Аксессуары',1,NULL,NULL,0,0);
CREATE TABLE recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  loyalty_user_id INTEGER,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  FOREIGN KEY (loyalty_user_id) REFERENCES loyalty_users(id) ON DELETE CASCADE
);
INSERT INTO recommendations VALUES(1,NULL,'Витамины для шерсти','Для здоровья и блеска',890.0,'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop',1);
INSERT INTO recommendations VALUES(2,NULL,'Антипаразитарные капли','Защита на 30 дней',1250.0,'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&h=300&fit=crop',1);
INSERT INTO recommendations VALUES(3,NULL,'Зубная паста для кошек','Свежее дыхание',380.0,'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=300&h=300&fit=crop',1);
INSERT INTO recommendations VALUES(4,NULL,'Шампунь гипоаллергенный','Для чувствительной кожи',650.0,'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop',1);
CREATE TABLE stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  features TEXT NOT NULL,
  icon_color TEXT NOT NULL,
  coords_lat REAL NOT NULL,
  coords_lng REAL NOT NULL,
  status TEXT NOT NULL,
  distance TEXT NOT NULL,
  closed INTEGER DEFAULT 0 NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL
, city TEXT);
INSERT INTO stores VALUES(1,'Murzico - Ашукино','Ашукино','+7 (495) 123-45-67','Пн-Вс: 09:00-21:00','["Wi-Fi", "Парковка", "Доставка"]','#667eea',55.7558000000000006,37.6173000000000001,'Открыт','1.2 км',0,1,'Ашукино');
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  loyalty_user_id INTEGER NOT NULL,
  store_id INTEGER,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  spent TEXT,
  store_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, check_amount REAL, points_redeemed REAL, cashback_earned REAL,
  FOREIGN KEY (loyalty_user_id) REFERENCES loyalty_users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
);
INSERT INTO transactions VALUES(1,2,1,'Списание: -200₽, Начисление: +40₽',-200.0,'spend','Оплата покупки',NULL,'2025-11-04 09:33:36',NULL,NULL,NULL);
INSERT INTO transactions VALUES(2,2,1,'Списание: -200₽, Начисление: +40₽',-200.0,'spend','Оплата покупки',NULL,'2025-11-04 09:45:34',NULL,NULL,NULL);
INSERT INTO transactions VALUES(3,2,1,'Начисление: +40₽',40.0,'earn',NULL,NULL,'2025-11-04 09:45:52',NULL,NULL,NULL);
INSERT INTO transactions VALUES(4,2,1,'Списание: -200₽, Начисление: +40₽',-200.0,'spend','Оплата покупки',NULL,'2025-11-04 11:58:46',NULL,NULL,NULL);
INSERT INTO transactions VALUES(5,2,1,'Начисление: +40₽',40.0,'earn',NULL,NULL,'2025-11-04 11:59:04',NULL,NULL,NULL);
INSERT INTO transactions VALUES(6,2,1,'Списание: -200₽, Начисление: +40₽',-200.0,'spend','Оплата покупки',NULL,'2025-11-04 14:32:29',NULL,NULL,NULL);
INSERT INTO transactions VALUES(7,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 14:32:49',NULL,NULL,NULL);
INSERT INTO transactions VALUES(8,2,1,'Списание: -600₽, Начисление: +120₽',-600.0,'spend','Оплата покупки',NULL,'2025-11-04 14:36:46',NULL,NULL,NULL);
INSERT INTO transactions VALUES(9,2,1,'Начисление: +120₽',120.0,'earn',NULL,NULL,'2025-11-04 14:37:02',NULL,NULL,NULL);
INSERT INTO transactions VALUES(10,2,1,'Списание: -400₽, Начисление: +80₽',-400.0,'spend','Оплата покупки',NULL,'2025-11-04 14:59:15',2000.0,400.0,80.0);
INSERT INTO transactions VALUES(11,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 14:59:28',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(12,1,1,'Списание: -400₽, Начисление: +80₽',-400.0,'spend','Оплата покупки',NULL,'2025-11-04 15:01:24',2000.0,400.0,80.0);
INSERT INTO transactions VALUES(13,2,1,'Списание: -400₽, Начисление: +80₽',-400.0,'spend','Оплата покупки',NULL,'2025-11-04 15:43:37',2000.0,400.0,80.0);
INSERT INTO transactions VALUES(14,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 15:44:47',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(15,2,1,'Списание: -400₽, Начисление: +80₽',-400.0,'spend','Оплата покупки',NULL,'2025-11-04 16:06:59',2000.0,400.0,80.0);
INSERT INTO transactions VALUES(16,2,1,'Списание: -400₽, Начисление: +80₽',-400.0,'spend','Оплата покупки',NULL,'2025-11-04 16:10:27',2000.0,400.0,80.0);
INSERT INTO transactions VALUES(17,2,1,'Списание: -250₽, Начисление: +80₽',-250.0,'spend','Оплата покупки',NULL,'2025-11-04 16:30:43',2000.0,250.0,80.0);
INSERT INTO transactions VALUES(18,2,1,'Списание: -80₽, Начисление: +80₽',-80.0,'spend','Оплата покупки',NULL,'2025-11-04 16:31:02',2000.0,80.0,80.0);
INSERT INTO transactions VALUES(19,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 16:41:24',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(20,2,1,'Списание: -160₽, Начисление: +80₽',-160.0,'spend','Оплата покупки',NULL,'2025-11-04 16:42:19',2000.0,160.0,80.0);
INSERT INTO transactions VALUES(21,2,1,'Списание: -80₽, Начисление: +80₽',-80.0,'spend','Оплата покупки',NULL,'2025-11-04 16:42:24',2000.0,80.0,80.0);
INSERT INTO transactions VALUES(22,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 16:42:30',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(23,2,1,'Списание: -160₽, Начисление: +80₽',-160.0,'spend','Оплата покупки',NULL,'2025-11-04 16:42:41',2000.0,160.0,80.0);
INSERT INTO transactions VALUES(24,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 16:42:58',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(25,2,1,'Списание: -160₽, Начисление: +80₽',-160.0,'spend','Оплата покупки',NULL,'2025-11-04 16:49:02',2000.0,160.0,80.0);
INSERT INTO transactions VALUES(26,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 16:52:37',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(27,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 16:52:45',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(28,2,1,'Начисление: +80₽',80.0,'earn',NULL,NULL,'2025-11-04 16:52:55',2000.0,0.0,80.0);
INSERT INTO transactions VALUES(29,2,1,'Списание: -320₽, Начисление: +80₽',-320.0,'spend','Оплата покупки',NULL,'2025-11-04 16:53:04',2000.0,320.0,80.0);
INSERT INTO transactions VALUES(30,2,1,'Списание: -80₽, Начисление: +80₽',-80.0,'spend','Оплата покупки',NULL,'2025-11-04 17:13:07',2000.0,80.0,80.0);
INSERT INTO transactions VALUES(31,1,1,'Списание: -500₽, Начисление: +100₽',-500.0,'spend','Оплата покупки',NULL,'2025-11-05 11:04:11',2500.0,500.0,100.0);
CREATE TABLE cashier_transactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				customer_id INTEGER NOT NULL,
				store_id INTEGER NOT NULL,
				type TEXT NOT NULL,
				purchase_amount REAL NOT NULL,
				points_amount INTEGER NOT NULL,
				discount_amount REAL DEFAULT 0 NOT NULL,
				metadata TEXT,
				synced_with_1c INTEGER DEFAULT 0 NOT NULL,
				synced_at TEXT,
				onec_transaction_id TEXT,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
				FOREIGN KEY (customer_id) REFERENCES loyalty_users(id) ON DELETE CASCADE,
				FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
			);
INSERT INTO cashier_transactions VALUES(1,2,1,'redeem',1500.0,60,150.0,'{"paidAmount":1350,"confirmedAt":"2025-10-29T13:04:23.482Z"}',1,'2025-10-29T13:04:23.482Z',NULL,'2025-10-29 13:03:46','2025-10-29 13:03:46');
INSERT INTO cashier_transactions VALUES(2,1,1,'redeem',2000.0,80,200.0,'{"cardNumber":"99456789","cashierName":"Кассир","terminalId":"STORE_1","paymentMethod":"mixed"}',0,NULL,NULL,'2025-10-29 13:04:03','2025-10-29 13:04:03');
CREATE TABLE pending_discounts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
				transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
				discount_amount REAL NOT NULL,
				status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'applied', 'failed', 'expired')),
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				applied_at TEXT,
				expires_at TEXT NOT NULL,
				error_message TEXT
			);
INSERT INTO pending_discounts VALUES(1,1,29,320.0,'failed','2025-11-04 16:53:04','2025-11-04T16:53:07.624Z','2025-11-04T16:53:34.190Z','1C did not process discount.json within 3 seconds');
INSERT INTO pending_discounts VALUES(2,1,30,80.0,'failed','2025-11-04 17:13:07','2025-11-04T17:13:10.777Z','2025-11-04T17:13:37.334Z','1C did not process discount.txt within 3 seconds');
INSERT INTO pending_discounts VALUES(3,1,31,500.0,'pending','2025-11-05 11:04:12',NULL,'2025-11-05T11:04:42.059Z',NULL);
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			);
CREATE TABLE loyalty_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  earning_percent REAL NOT NULL DEFAULT 4.0,
  max_discount_percent REAL NOT NULL DEFAULT 20.0,
  expiry_days INTEGER NOT NULL DEFAULT 45,
  welcome_bonus REAL NOT NULL DEFAULT 500.0,
  birthday_bonus REAL NOT NULL DEFAULT 0.0,
  min_redemption_amount REAL NOT NULL DEFAULT 1.0,
  points_name TEXT NOT NULL DEFAULT 'Мурзи-коины',
  support_email TEXT,
  support_phone TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO loyalty_settings VALUES(1,4.0,20.0,45,500.0,0.0,1.0,'Мурзи-коины',NULL,NULL,'2025-11-20 12:08:45');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',3);
INSERT INTO sqlite_sequence VALUES('posts',4);
INSERT INTO sqlite_sequence VALUES('admins',1);
INSERT INTO sqlite_sequence VALUES('stores',1);
INSERT INTO sqlite_sequence VALUES('loyalty_users',3);
INSERT INTO sqlite_sequence VALUES('products',10);
INSERT INTO sqlite_sequence VALUES('offers',6);
INSERT INTO sqlite_sequence VALUES('recommendations',4);
INSERT INTO sqlite_sequence VALUES('cashier_transactions',2);
INSERT INTO sqlite_sequence VALUES('transactions',31);
INSERT INTO sqlite_sequence VALUES('pending_discounts',3);
CREATE UNIQUE INDEX loyalty_users_card_number_unique ON loyalty_users(card_number);
CREATE INDEX idx_cashier_tx_store ON cashier_transactions(store_id);
CREATE INDEX idx_cashier_tx_customer ON cashier_transactions(customer_id);
CREATE INDEX idx_cashier_tx_created ON cashier_transactions(created_at);
CREATE INDEX idx_pending_store_status ON pending_discounts(store_id, status);
CREATE INDEX idx_pending_expires ON pending_discounts(expires_at);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_date ON transactions(loyalty_user_id, created_at DESC);
COMMIT;
