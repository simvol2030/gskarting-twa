# Руководство по миграции на PostgreSQL

Проект **Project Box v2** теперь использует **Drizzle ORM** в качестве слоя абстракции базы данных. Это позволяет легко переключаться между **SQLite** (для разработки) и **PostgreSQL** (для production) без изменения кода.

## 📋 Текущее состояние

- ✅ Drizzle ORM установлен и настроен
- ✅ Единая схема БД для frontend и backend
- ✅ Queries мигрированы на Drizzle
- ✅ TypeScript типизация настроена
- ✅ Drizzle Kit настроен для миграций
- 🔜 PostgreSQL готов к подключению (пока не активен)

## 🔧 Переключение на PostgreSQL

### Шаг 1: Установить PostgreSQL

```bash
# Для Windows (WSL2)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запустить PostgreSQL
sudo service postgresql start
```

### Шаг 2: Создать базу данных

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE projectbox;
CREATE USER projectbox_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE projectbox TO projectbox_user;
\q
```

### Шаг 3: Настроить переменные окружения

**Frontend (.env в `frontend-sveltekit/`):**

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://projectbox_user:your_secure_password@localhost:5432/projectbox
```

**Backend (.env в `backend-expressjs/`):**

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://projectbox_user:your_secure_password@localhost:5432/projectbox
```

### Шаг 4: Применить миграции

```bash
# В frontend
cd frontend-sveltekit
npm run db:push  # Создаёт таблицы в PostgreSQL

# В backend
cd backend-expressjs
npm run db:push  # Создаёт таблицы в PostgreSQL
```

### Шаг 5: Запустить приложения

```bash
# Terminal 1: Frontend
cd frontend-sveltekit
npm run dev

# Terminal 2: Backend
cd backend-expressjs
npm run dev
```

## 📊 Команды Drizzle Kit

### Frontend и Backend (одинаковые команды)

```bash
# Генерация миграций из схемы
npm run db:generate

# Применение миграций к БД
npm run db:migrate

# Push схемы напрямую в БД (без создания файлов миграций)
npm run db:push

# Запуск Drizzle Studio (GUI для работы с БД)
npm run db:studio
```

## 📁 Структура слоя абстракции

```
frontend-sveltekit/src/lib/server/db/
├── schema.ts          # Определение таблиц (users, posts, admins)
├── client.ts          # Drizzle клиент с переключением SQLite/PostgreSQL
├── init.ts            # Инициализация и seed данных
├── queries/
│   ├── users.ts       # Готовые функции для работы с users
│   ├── posts.ts       # Готовые функции для работы с posts
│   ├── admins.ts      # Готовые функции для работы с admins
│   └── index.ts       # Экспорт всех queries
└── database.ts        # Обратная совместимость, экспорт всего

backend-expressjs/src/db/
├── schema.ts          # Идентичная схема как во frontend
├── client.ts          # Drizzle клиент
├── init.ts            # Инициализация и seed
├── queries/
│   ├── users.ts
│   ├── posts.ts
│   ├── admins.ts
│   └── index.ts
└── database.ts        # Обратная совместимость
```

## 🔄 Как работает переключение БД

**В `client.ts`:**

```typescript
const DATABASE_TYPE = (process.env.DATABASE_TYPE || 'sqlite') as 'sqlite' | 'postgres';

function initializeDrizzle() {
	if (DATABASE_TYPE === 'postgres') {
		// Использовать PostgreSQL
		return drizzlePostgres(pool, { schema });
	} else {
		// Использовать SQLite
		return drizzleSQLite(sqlite, { schema });
	}
}
```

Все queries используют единый `db` клиент, который автоматически работает с активной БД.

## 💡 Примеры использования

### Чтение данных

```typescript
import { queries } from './db/database';

// Получить всех пользователей
const users = await queries.getAllUsers();

// Получить пост по ID с информацией об авторе
const post = await queries.getPostById(1);

// Получить админа по email
const admin = await queries.getAdminByEmail('admin@example.com');
```

### Запись данных

```typescript
// Создать пользователя
const newUser = await queries.createUser({
	name: 'John Doe',
	email: 'john@example.com'
});

// Обновить пост
const updatedPost = await queries.updatePost(1, {
	title: 'Updated Title',
	published: true
});

// Удалить админа
await queries.deleteAdmin(5);
```

### Прямое использование Drizzle

```typescript
import { db } from './db/client';
import { users, posts } from './db/schema';
import { eq, and, like } from 'drizzle-orm';

// Продвинутый запрос с условиями
const filteredUsers = await db
	.select()
	.from(users)
	.where(like(users.email, '%@example.com'))
	.limit(10);

// Join запрос
const postsWithAuthors = await db
	.select()
	.from(posts)
	.innerJoin(users, eq(posts.user_id, users.id))
	.where(eq(posts.published, true));
```

## ⚡ Производительность

Drizzle ORM был выбран за минимальный overhead:

- **Benchmark**: ~2-5% медленнее raw SQL
- **Сравнение с Prisma**: Drizzle в 2-3 раза быстрее
- **Сравнение с TypeORM**: Drizzle в 1.5-2 раза быстрее

Для городского агрегатора эта производительность идеальна.

## 🐘 PostgreSQL vs SQLite

### SQLite (текущее использование)
- ✅ Простота настройки (файл базы данных)
- ✅ Идеально для разработки
- ✅ Низкие требования к ресурсам
- ❌ Проблемы с конкурентностью при высокой нагрузке
- ❌ Ограничения в production среде

### PostgreSQL (готово к миграции)
- ✅ Отличная производительность при конкурентных запросах
- ✅ Поддержка индексов, транзакций, репликации
- ✅ Scalability для production
- ✅ Полноценная СУБД
- ❌ Требует запущенного сервера БД

## 🔐 Безопасность

**Важно**: После миграции на PostgreSQL:

1. Используйте сильные пароли для БД
2. Ограничьте доступ к PostgreSQL через firewall
3. Используйте SSL для подключения в production
4. Регулярно делайте backup базы данных
5. Храните `DATABASE_URL` в `.env` (не коммитить!)

## 📝 Миграция существующих данных

Если у вас уже есть данные в SQLite:

```bash
# 1. Экспорт из SQLite
sqlite3 data/db/sqlite/app.db .dump > backup.sql

# 2. Импорт в PostgreSQL (с адаптацией синтаксиса)
# Потребуется ручная адаптация SQL команд
psql -U projectbox_user -d projectbox < adapted_backup.sql
```

Или использовать Drizzle Studio для копирования данных вручную.

## 🎯 Следующие шаги

1. ✅ **ЗАВЕРШЕНО**: Настроить Drizzle ORM
2. 🔜 Протестировать подключение к PostgreSQL
3. 🔜 Провести нагрузочное тестирование
4. 🔜 Настроить CI/CD для миграций
5. 🔜 Документировать процесс backup/restore

---

**Создано**: 2025-10-19
**Версия Drizzle ORM**: 0.44.6
**Версия Drizzle Kit**: 0.31.5
