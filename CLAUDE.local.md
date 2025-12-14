# CLAUDE.local.md - Универсальный Алгоритм Работы

**Назначение:** Воспроизводимый workflow для работы Claude Code CLI с Claude Code Web в итеративном режиме.

**Применимость:** Любой проект с Git, TypeScript/JavaScript, удаленным сервером и CI/CD.

**Версия:** 1.0
**Последнее обновление:** 2025-12-12

---

## 📋 Оглавление

1. [Основной Алгоритм (7 Шагов)](#основной-алгоритм-7-шагов)
2. [Правила Использования Инструментов](#правила-использования-инструментов)
3. [Проактивное Исправление Ошибок](#проактивное-исправление-ошибок)
4. [Чеклисты Проверки](#чеклисты-проверки)
5. [Шаблоны Команд](#шаблоны-команд)
6. [Типичные Ошибки и Решения](#типичные-ошибки-и-решения)
7. [Принципы Эффективной Работы](#принципы-эффективной-работы)
8. [Адаптация Под Другие Проекты](#адаптация-под-другие-проекты)

---

## 🔄 Основной Алгоритм (7 Шагов)

### Общая Схема

```
Claude Code Web (GitHub)
    ↓ [commit создан]
    → Шаг 1: Fetch from GitHub
    → Шаг 2: Merge в dev
    → Шаг 3: Build Verification
    → Шаг 4: Deploy на Dev Server
    → Шаг 5: Проверка Deployment
    → Шаг 6: Отчет пользователю
    → Шаг 7: [REPEAT для следующего коммита]
```

---

### Шаг 1: Fetch Изменений с GitHub

**Цель:** Получить последние изменения из удаленного репозитория.

**Команды:**
```bash
cd <LOCAL_PROJECT_DIR>
git fetch --all
```

**Проверка:**
```bash
# Посмотреть доступные remote ветки
git branch -r | grep origin/

# Посмотреть последние коммиты в feature ветке
git log origin/<feature-branch> --oneline -5
```

**Когда выполнять:**
- После получения сообщения от Claude Code Web о готовности feature
- В начале каждой итерации
- Перед началом merge

**Что может пойти не так:**
- ❌ Нет интернет-соединения → сообщить пользователю
- ❌ Remote branch не существует → уточнить название ветки
- ❌ Authentication failed → проверить SSH ключи / credentials

---

### Шаг 2: Merge в Development Branch

**Цель:** Интегрировать изменения из feature ветки в основную ветку разработки.

**Команды:**
```bash
git checkout dev  # или main, в зависимости от проекта
git pull origin dev

# Merge с сохранением истории (--no-ff)
git merge origin/<feature-branch> --no-ff

# Если есть конфликты:
git status  # посмотреть конфликтующие файлы
# [решить конфликты вручную]
git add .
git commit -m "chore: merge <feature-branch> from Claude Code Web"
```

**Важно:**
- ✅ Всегда использовать `--no-ff` для сохранения истории
- ✅ Pull dev перед merge чтобы избежать конфликтов
- ✅ Проверить `git status` после merge

**Commit Message Format:**
```bash
git commit -m "chore: merge <feature-name> from Claude Code Web

Merged branch: origin/<feature-branch>
Commit: <commit-hash>

Changes:
- [список основных изменений]

Resolved conflicts:
- [файлы с конфликтами, если были]
"
```

**Решение Конфликтов:**
- Прочитать конфликтующие файлы используя `Read` tool
- Проанализировать изменения
- Выбрать правильную версию или объединить обе
- Никогда не использовать автоматические sed команды без проверки

---

### Шаг 3: Build Verification (Проверка Компиляции)

**Цель:** Убедиться что код компилируется без ошибок перед deployment.

**Команды:**
```bash
# Backend (если TypeScript/Node.js)
cd backend-expressjs  # адаптировать под ваш проект
npm install
npm run build

# Frontend (если SvelteKit/React/Vue)
cd frontend-sveltekit  # адаптировать под ваш проект
npm install
npm run build

# Другие части проекта (bot, worker, etc.)
cd telegram-bot  # адаптировать
npm install
npm run build
```

**Проверка:**
- ✅ Build завершился без ошибок (exit code 0)
- ✅ Нет TypeScript compilation errors
- ✅ Нет ESLint critical errors (если настроен)

**Типичные Ошибки:**

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `error TS2300: Duplicate identifier` | Duplicate type exports после merge | Удалить дубликаты |
| `error TS7022: implicitly has type 'any'` | Circular reference в схеме | Упростить reference |
| `error TS2769: No overload matches` | Type mismatch | Добавить type assertion |
| `error TS18046: 'x' is of type 'unknown'` | Missing type annotation | Добавить `as Type` |

**Что делать при ошибках:**
1. Прочитать ошибку полностью
2. Найти файл и строку с проблемой
3. Использовать `Read` tool для чтения файла
4. Исправить проблему используя `Edit` tool
5. Повторить `npm run build`
6. Если исправили → продолжить; если не можете → сообщить пользователю

**ВАЖНО:** НЕ переходить к Шагу 4 пока build не успешен!

---

### Шаг 4: Deploy на Dev Server

**Цель:** Развернуть изменения на development сервере для тестирования.

**КРИТИЧЕСКИ ВАЖНО:** Использовать **MCP SSH tool** (`mcp__ssh-mcp__exec`), НЕ обычный `ssh`.

**Последовательность команд:**

#### 4.1 Push в Git
```bash
git push origin dev
```

#### 4.2 Deployment на Server

**Backend Deploy:**
```typescript
mcp__ssh-mcp__exec({
  command: `cd /opt/websites/granat.klik1.ru/backend-expressjs && \\
    git pull origin dev && \\
    npm install && \\
    npm run build`
});
```

**Frontend Deploy:**
```typescript
mcp__ssh-mcp__exec({
  command: `cd /opt/websites/granat.klik1.ru/frontend-sveltekit && \\
    git pull origin dev && \\
    npm install && \\
    npm run build`
});
```

**Bot/Other Services Deploy (если нужно):**
```typescript
mcp__ssh-mcp__exec({
  command: `cd /opt/websites/granat.klik1.ru/telegram-bot && \\
    git pull origin dev && \\
    npm install && \\
    npm run build`
});
```

#### 4.3 Restart Services (PM2)
```typescript
mcp__ssh-mcp__exec({
  command: "pm2 restart sl-backend-dev sl-frontend-dev sl-bot-dev"
});
```

**Что развертывать:**

| Изменения в | Deploy Backend | Deploy Frontend | Deploy Bot | Restart Services |
|-------------|----------------|-----------------|------------|------------------|
| Backend API | ✅ | ❌ | ❌ | Backend + Frontend |
| Frontend UI | ❌ | ✅ | ❌ | Frontend |
| Database Schema | ✅ | ❌ | ❌ | Backend + Frontend |
| Bot Logic | ❌ | ❌ | ✅ | Bot |
| Shared Types | ✅ | ✅ | ❌ | Backend + Frontend |

**Database Migrations (если есть):**
```typescript
// Применить SQL миграцию
mcp__ssh-mcp__exec({
  command: `sqlite3 /opt/websites/granat.klik1.ru/data/db/sqlite/app.db < /opt/websites/granat.klik1.ru/backend-expressjs/migrations/XXX_migration.sql`
});

// Проверить результат
mcp__ssh-mcp__exec({
  command: `sqlite3 /opt/websites/granat.klik1.ru/data/db/sqlite/app.db "SELECT * FROM table_name LIMIT 5"`
});
```

---

### Шаг 5: Проверка Deployment

**Цель:** Убедиться что deployment прошел успешно и сервисы работают.

**Проверки:**

#### 5.1 PM2 Status
```typescript
mcp__ssh-mcp__exec({
  command: "pm2 status"
});
```

**Ожидаемый результат:**
- Все процессы в статусе `online`
- Uptime > 0s (показывает что перезапуск произошел)
- CPU/Memory использование в норме

#### 5.2 Backend Logs
```typescript
mcp__ssh-mcp__exec({
  command: "pm2 logs sl-backend-dev --lines 50 --nostream"
});
```

**На что обратить внимание:**
- ❌ `Error:` / `ERROR` — критические ошибки
- ⚠️ `Warning:` / `WARN` — предупреждения (обычно не критично)
- ✅ `Server listening on port XXX` — успешный запуск
- ❌ `EADDRINUSE` — порт уже занят
- ❌ `Cannot find module` — проблемы с зависимостями

#### 5.3 Frontend Logs
```typescript
mcp__ssh-mcp__exec({
  command: "pm2 logs sl-frontend-dev --lines 50 --nostream"
});
```

**На что обратить внимание:**
- ✅ `Listening on 0.0.0.0:XXXX` — успешный запуск
- ❌ `ERR_MODULE_NOT_FOUND` — проблемы с модулями
- ❌ Build errors — проблемы с production build

#### 5.4 Database Check (если были изменения)
```typescript
mcp__ssh-mcp__exec({
  command: `sqlite3 /opt/websites/granat.klik1.ru/data/db/sqlite/app.db ".tables"`
});
```

**Проверки:**
- Новые таблицы созданы
- Колонки добавлены (если ALTER TABLE)
- Данные сохранились (если UPDATE/INSERT)

---

### Шаг 6: Отчет Пользователю

**Цель:** Сообщить пользователю о завершении и готовности к тестированию.

**Формат Отчета:**

```markdown
✅ **Deployment завершен успешно**

**Merged:** origin/<feature-branch> → dev
**Commit:** <commit-hash>

**Changes deployed:**
- Backend: [список изменений]
- Frontend: [список изменений]
- Database: [миграции, если были]

**Services restarted:**
- ✅ sl-backend-dev (uptime: Xs)
- ✅ sl-frontend-dev (uptime: Xs)
- ✅ sl-bot-dev (uptime: Xs) [если был перезапущен]

**Ready for testing:** https://granat.klik1.ru

**Key endpoints to test:**
- [список ключевых страниц/API endpoints]

**No errors found in logs.** ✅
```

**Если были проблемы:**
```markdown
⚠️ **Deployment завершен с предупреждениями**

**Warning:** [описание предупреждения]

**Actions taken:** [что было сделано для решения]

**Status:** [работает ли приложение]

**Recommendation:** [что стоит проверить пользователю]
```

**Если deployment failed:**
```markdown
❌ **Deployment failed**

**Error:** [точное описание ошибки]

**Failed at:** [на каком шаге]

**Logs:**
```
[релевантные логи]
```

**Possible solutions:**
1. [решение 1]
2. [решение 2]

**Rollback performed:** [да/нет, если да — до какого коммита]
```

---

### Шаг 7: Следующая Итерация

**Когда пользователь говорит:**
- "Повтори для [следующий коммит]"
- "Сделай то же самое для [feature]"
- "Бери следующий из GH"

→ **Вернуться к Шагу 1**

---

## 🛠️ Правила Использования Инструментов

### Git Operations

**✅ ИСПОЛЬЗОВАТЬ:**
- `Bash` tool для git команд (fetch, merge, commit, push)
- `Read` tool для чтения файлов перед edit
- `Edit` tool для исправления конфликтов/ошибок

**❌ НЕ ИСПОЛЬЗОВАТЬ:**
- `Bash` tool для чтения файлов (использовать `Read`)
- `Bash` tool для редактирования файлов (использовать `Edit`)
- `Write` tool для существующих файлов (использовать `Edit`)

### SSH Operations

**✅ КРИТИЧЕСКИ ВАЖНО:** Использовать **MCP SSH tool**
```typescript
mcp__ssh-mcp__exec({ command: "your-command" })
```

**❌ НИКОГДА НЕ ИСПОЛЬЗОВАТЬ:**
```bash
ssh user@server "command"  # ❌ НЕ РАБОТАЕТ
ssh -i key user@server     # ❌ НЕ РАБОТАЕТ
```

**Почему:** MCP SSH tool настроен на правильный сервер с правильными credentials. Обычный SSH будет timeout или connection refused.

### File Operations

**Чтение файлов:**
```typescript
Read({ file_path: "/absolute/path/to/file" })
```

**Редактирование существующих файлов:**
```typescript
Edit({
  file_path: "/path/to/file",
  old_string: "точная строка для замены",
  new_string: "новая строка"
})
```

**Создание новых файлов:**
```typescript
Write({
  file_path: "/path/to/new/file",
  content: "полное содержимое файла"
})
```

**❌ НИКОГДА:**
- Не использовать `cat`, `head`, `tail` через Bash для чтения файлов
- Не использовать `sed`, `awk` через Bash для редактирования
- Не использовать `echo >` через Bash для создания файлов

### Build Operations

**Компиляция:**
```typescript
Bash({
  command: "cd /path/to/project && npm run build",
  description: "Build TypeScript project"
})
```

**Установка зависимостей:**
```typescript
Bash({
  command: "cd /path/to/project && npm install",
  description: "Install npm dependencies"
})
```

---

## 🔧 Проактивное Исправление Ошибок

### Принцип

**НЕ спрашивать пользователя** если ошибка типична и решение очевидно. Исправить сразу.

### Категории Ошибок

#### 1. TypeScript Compilation Errors (Исправлять Сразу)

| Ошибка | Решение | Пример |
|--------|---------|--------|
| Duplicate identifier | Удалить дубликат | `export type Foo` появляется дважды → удалить один |
| Circular reference | Упростить reference | `references(() => table.id)` → `integer('id')` |
| Type mismatch | Добавить type assertion | `status as string` → `status as 'open' \| 'closed'` |
| Type 'unknown' | Добавить type annotation | `const x = await fetch()` → `const x = await fetch() as Response` |

**Процесс:**
1. Прочитать файл с ошибкой
2. Найти проблемную строку
3. Исправить используя Edit tool
4. Повторить build
5. Сообщить пользователю что было исправлено

#### 2. Merge Conflicts (Анализировать и Решать)

**НЕ использовать автоматический sed!**

**Правильный процесс:**
1. `git status` → найти конфликтующие файлы
2. `Read` каждый файл
3. Проанализировать:
   - Что изменил HEAD (текущая ветка)
   - Что изменила incoming ветка
   - Что нужно оставить
4. Выбрать правильное решение:
   - Оставить HEAD версию
   - Оставить incoming версию
   - Объединить обе версии
5. Использовать `Edit` для удаления conflict markers и применения решения
6. `git add` и `git commit`

**Типичные Конфликты:**

**Schema.ts (Database):**
- **Проблема:** Неполные определения таблиц, обрезанные на середине
- **Решение:** Восстановить полное определение из Claude Code Web intent

**+layout.svelte (SvelteKit):**
- **Проблема:** Конфликт в списке исключений маршрутов
- **Решение:** Объединить оба списка, удалить дубликаты

**Package.json:**
- **Проблема:** Разные версии зависимостей
- **Решение:** Оставить более новую версию (обычно incoming)

#### 3. Runtime Errors (Сообщить Пользователю)

**НЕ исправлять без контекста:**
- Database errors (SQLITE_ERROR, CONSTRAINT failed)
- Network errors (ECONNREFUSED, ETIMEDOUT)
- Business logic errors

**Что делать:**
1. Собрать информацию (логи, stack trace)
2. Проанализировать причину
3. Предложить решение
4. **Спросить пользователя** перед исправлением

---

## ✅ Чеклисты Проверки

### Перед Merge

- [ ] `git fetch --all` выполнен
- [ ] Feature branch существует
- [ ] `git status` показывает clean working tree
- [ ] `git pull origin dev` выполнен

### После Merge

- [ ] Конфликты решены (если были)
- [ ] `git status` показывает "nothing to commit"
- [ ] Commit message информативен

### Перед Deploy

- [ ] Backend build успешен (если были изменения)
- [ ] Frontend build успешен (если были изменения)
- [ ] Bot build успешен (если были изменения)
- [ ] Нет TypeScript errors
- [ ] Нет ESLint critical errors

### После Deploy

- [ ] `git push origin dev` успешен
- [ ] PM2 статус: все процессы `online`
- [ ] Backend logs: нет ошибок
- [ ] Frontend logs: нет ошибок
- [ ] Database: миграции применены (если были)
- [ ] Dev server доступен (https://...)

### Перед Отчетом Пользователю

- [ ] Все сервисы перезапущены
- [ ] Логи проверены на ошибки
- [ ] Список изменений подготовлен
- [ ] Ключевые endpoints для тестирования перечислены

---

## 📝 Шаблоны Команд

### Template 1: Полный Цикл (Backend + Frontend)

```bash
# Локально
cd /mnt/c/dev/loyalty-system-universal/project
git fetch --all
git checkout dev
git pull origin dev
git merge origin/<feature-branch> --no-ff
git push origin dev

# Build verification
cd backend-expressjs && npm install && npm run build
cd ../frontend-sveltekit && npm install && npm run build

# Deploy (через MCP SSH)
mcp__ssh-mcp__exec({
  command: `cd /opt/websites/granat.klik1.ru/backend-expressjs && \\
    git pull origin dev && npm install && npm run build`
});

mcp__ssh-mcp__exec({
  command: `cd /opt/websites/granat.klik1.ru/frontend-sveltekit && \\
    git pull origin dev && npm install && npm run build`
});

mcp__ssh-mcp__exec({
  command: "pm2 restart sl-backend-dev sl-frontend-dev"
});

mcp__ssh-mcp__exec({
  command: "pm2 status"
});
```

### Template 2: Frontend Only

```bash
# Локально
cd /mnt/c/dev/loyalty-system-universal/project
git fetch --all
git checkout dev
git pull origin dev
git merge origin/<feature-branch> --no-ff
git push origin dev

# Build verification
cd frontend-sveltekit && npm install && npm run build

# Deploy
mcp__ssh-mcp__exec({
  command: `cd /opt/websites/granat.klik1.ru/frontend-sveltekit && \\
    git pull origin dev && npm install && npm run build`
});

mcp__ssh-mcp__exec({
  command: "pm2 restart sl-frontend-dev"
});
```

### Template 3: Database Migration

```bash
# Локально - создать миграцию
cd /mnt/c/dev/loyalty-system-universal/project/backend-expressjs/migrations
# Создать файл XXX_migration_name.sql

# Deploy миграции
mcp__ssh-mcp__exec({
  command: `cd /opt/websites/granat.klik1.ru && git pull origin dev`
});

mcp__ssh-mcp__exec({
  command: `sqlite3 /opt/websites/granat.klik1.ru/data/db/sqlite/app.db < /opt/websites/granat.klik1.ru/backend-expressjs/migrations/XXX_migration.sql`
});

# Проверить
mcp__ssh-mcp__exec({
  command: `sqlite3 /opt/websites/granat.klik1.ru/data/db/sqlite/app.db ".schema table_name"`
});
```

---

## 🐛 Типичные Ошибки и Решения

### Ошибка 1: "Duplicate identifier 'TypeName'"

**Симптом:**
```
error TS2300: Duplicate identifier 'NewOrderItem'.
```

**Причина:** После merge появились дублирующиеся export statements.

**Решение:**
1. Найти все объявления типа в файле
2. Удалить дубликаты
3. Оставить только одно объявление

**Пример:**
```typescript
// BEFORE (с ошибкой):
export type NewOrderItem = typeof orderItems.$inferInsert;
// ... другой код ...
export type NewOrderItem = typeof orderItems.$inferInsert; // ❌ ДУБЛИКАТ

// AFTER (исправлено):
export type NewOrderItem = typeof orderItems.$inferInsert; // ✅ ОДИН
```

### Ошибка 2: "implicitly has type 'any'"

**Симптом:**
```
error TS7022: 'categories' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
```

**Причина:** Circular reference в Drizzle schema (self-referencing foreign key).

**Решение:** Упростить reference, убрать функцию callback.

**Пример:**
```typescript
// BEFORE (с ошибкой):
export const categories = sqliteTable('categories', {
  parent_id: integer('parent_id').references((): ReturnType<typeof integer> => categories.id)
});

// AFTER (исправлено):
export const categories = sqliteTable('categories', {
  parent_id: integer('parent_id')  // Убрали self-reference
});
```

### Ошибка 3: "Type 'string' is not assignable to parameter"

**Симптом:**
```
error TS2769: Argument of type 'string' is not assignable to parameter of type '"open" | "closed"'.
```

**Причина:** TypeScript не может infer точный literal type.

**Решение:** Добавить type assertion с union type.

**Пример:**
```typescript
// BEFORE (с ошибкой):
const status = req.query.status as string;
conditions.push(eq(orders.status, status));

// AFTER (исправлено):
const status = req.query.status as 'open' | 'closed' | 'processing';
conditions.push(eq(orders.status, status));
```

### Ошибка 4: "'result' is of type 'unknown'"

**Симптом:**
```
error TS18046: 'result' is of type 'unknown'.
```

**Причина:** `.json()` возвращает `unknown` type, нужна аннотация.

**Решение:** Добавить type assertion.

**Пример:**
```typescript
// BEFORE (с ошибкой):
const result = await response.json();
if (result.ok) { ... }

// AFTER (исправлено):
const result = await response.json() as { ok: boolean; description?: string };
if (result.ok) { ... }
```

### Ошибка 5: Video Upload Response Parsing

**Симптом:** Загруженные видео исчезают, `result.url` = `undefined`.

**Причина:** XHR возвращает response с вложенным data:
```json
{
  "data": { "url": "/uploads/..." }
}
```

**Решение:**
```typescript
// BEFORE (с ошибкой):
xhr.onload = () => {
  const response = JSON.parse(xhr.responseText);
  resolve(response); // ❌ Возвращает { data: { url: ... } }
};

// AFTER (исправлено):
xhr.onload = () => {
  const response = JSON.parse(xhr.responseText);
  resolve(response.data); // ✅ Возвращает { url: ... }
};
```

### Ошибка 6: Svelte Effect Loop

**Симптом:** Svelte компонент зацикливается, не переходит к следующему story.

**Причина:**
1. `startProgress()` вызывается из нескольких мест
2. `$effect` триггерится на каждый render
3. State сбрасывается в неправильные моменты

**Решение:**
```typescript
// BEFORE (с ошибкой):
function handleVideoLoadedMetadata(e: Event) {
  actualVideoDuration = video.duration;
  startProgress(); // ❌ Дублирует вызов
}

$effect(() => {
  actualVideoDuration = null; // ❌ Сбрасывает на каждый render
});

// AFTER (исправлено):
function handleVideoLoadedMetadata(e: Event) {
  actualVideoDuration = video.duration; // ✅ Только установка
}

// $effect удален - не нужен

let prevHighlightIndex = activeHighlightIndex;
$effect(() => {
  if (activeHighlightIndex !== prevHighlightIndex) { // ✅ Только при реальном изменении
    startProgress();
    prevHighlightIndex = activeHighlightIndex;
  }
});
```

---

## 💡 Принципы Эффективной Работы

### 1. Итеративность

**Правило:** Один feature = один цикл = один deployment.

**Почему:**
- Легче отследить проблемы
- Проще откатить если что-то сломалось
- Пользователь может тестировать инкрементально

**НЕ делать:** Мерджить 5 feature веток сразу → deploy all → "разбирайся сам что сломалось"

**Делать:** Feature A → merge → deploy → test → Feature B → merge → deploy → test

### 2. Безопасность

**Правило:** Всегда сохранять историю, всегда проверять перед действием.

**Что НЕ делать:**
- ❌ `git push --force`
- ❌ `git reset --hard` без backup
- ❌ Удалять код без чтения
- ❌ Применять sed без проверки

**Что делать:**
- ✅ `git merge --no-ff` (сохраняет историю)
- ✅ Читать файл перед редактированием
- ✅ Build check перед deploy
- ✅ PM2 logs check после deploy

### 3. Проактивность

**Правило:** Исправлять типичные ошибки сразу, не спрашивая.

**Когда исправлять сразу:**
- TypeScript compilation errors (duplicate, type mismatch)
- Merge conflicts (очевидные)
- Missing imports
- Syntax errors

**Когда спрашивать:**
- Business logic изменения
- Database schema breaking changes
- API contract изменения
- Неочевидные ошибки

### 4. Полнота

**Правило:** Доводить каждую итерацию до конца.

**Каждый цикл должен завершаться:**
1. ✅ Build успешен
2. ✅ Deployment выполнен
3. ✅ Services перезапущены
4. ✅ Logs проверены
5. ✅ Отчет пользователю предоставлен

**НЕ оставлять "висячие" состояния:**
- ❌ Merged but not deployed
- ❌ Deployed but not restarted
- ❌ Restarted but errors in logs
- ❌ Everything done but no report

### 5. Коммуникация

**Правило:** Пользователь всегда должен знать что происходит.

**Формат коммуникации:**
```markdown
🔄 [Этап]: [Описание действия]
✅ [Этап]: [Результат успешен]
⚠️ [Этап]: [Предупреждение]
❌ [Этап]: [Ошибка]
```

**Пример:**
```
🔄 Merge: Merging origin/add-stories-feature into dev
✅ Merge: Completed successfully, no conflicts
🔄 Build: Building backend and frontend
✅ Build: Both builds successful
🔄 Deploy: Deploying to granat.klik1.ru
✅ Deploy: All services restarted, no errors
📊 Status: Ready for testing at https://granat.klik1.ru
```

---

## 🎯 Адаптация Под Другие Проекты

### Что нужно изменить в алгоритме

#### 1. Пути и Директории

**В этом проекте:**
```bash
LOCAL_DIR=/mnt/c/dev/loyalty-system-universal/project
SERVER_DIR=/opt/websites/granat.klik1.ru
```

**Для вашего проекта:**
```bash
LOCAL_DIR=/path/to/your/project
SERVER_DIR=/path/on/server
```

**Где изменить:**
- Шаг 1: `cd <LOCAL_DIR>`
- Шаг 4: `cd <SERVER_DIR>/backend`
- Все MCP SSH команды

#### 2. Ветки

**В этом проекте:**
```bash
MAIN_BRANCH=dev
PRODUCTION_BRANCH=main
```

**Для вашего проекта:**
```bash
MAIN_BRANCH=develop  # или master, main, staging
PRODUCTION_BRANCH=production  # или main, master
```

**Где изменить:**
- Шаг 2: `git checkout <MAIN_BRANCH>`
- Все merge команды

#### 3. Структура Проекта

**В этом проекте:**
```
project/
  backend-expressjs/
  frontend-sveltekit/
  telegram-bot/
```

**Для вашего проекта:**
```
your-project/
  api/
  web/
  mobile/
```

**Где изменить:**
- Шаг 3: Build commands
- Шаг 4: Deploy paths

#### 4. Process Manager

**В этом проекте:** PM2
```bash
pm2 restart sl-backend-dev sl-frontend-dev
pm2 status
pm2 logs sl-backend-dev
```

**Для вашего проекта (systemd):**
```bash
systemctl restart myapp-backend myapp-frontend
systemctl status myapp-backend
journalctl -u myapp-backend -n 50
```

**Для вашего проекта (Docker):**
```bash
docker-compose restart backend frontend
docker-compose ps
docker-compose logs backend --tail=50
```

**Где изменить:**
- Шаг 4: Restart commands
- Шаг 5: Status check commands

#### 5. Build Tool

**В этом проекте:** npm + TypeScript
```bash
npm install
npm run build
```

**Для Python проекта:**
```bash
pip install -r requirements.txt
python manage.py collectstatic
```

**Для Go проекта:**
```bash
go mod download
go build -o app ./cmd/server
```

**Где изменить:**
- Шаг 3: Build commands
- Шаг 4: Deploy build commands

#### 6. Database

**В этом проекте:** SQLite + Drizzle ORM
```bash
sqlite3 /path/to/app.db < migration.sql
```

**Для PostgreSQL:**
```bash
psql -U user -d database -f migration.sql
```

**Для MySQL:**
```bash
mysql -u user -p database < migration.sql
```

**Где изменить:**
- Шаг 4: Migration application
- Шаг 5: Database checks

### Checklist Адаптации

- [ ] Обновить LOCAL_DIR в Шаге 1
- [ ] Обновить SERVER_DIR в Шаге 4
- [ ] Обновить MAIN_BRANCH в Шаге 2
- [ ] Обновить структуру проекта в Шаге 3
- [ ] Обновить build команды в Шаге 3
- [ ] Обновить deploy команды в Шаге 4
- [ ] Обновить process manager команды в Шагах 4-5
- [ ] Обновить database команды (если есть)
- [ ] Обновить URL dev сервера в Шаге 6
- [ ] Протестировать весь цикл на тестовом feature

---

## 📚 Дополнительные Ресурсы

**Для этого проекта:**
- `CLAUDE.md` - основной workflow документ
- `BRANCH_PROTECTION.md` - git workflow
- `GIT_WORKFLOW.md` - детальный git guide
- `DEPLOYMENT-CHECKLIST.md` - deployment чеклист

**Универсальные ресурсы:**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎓 Примеры Использования

### Пример 1: Простой Feature

**Пользователь:** "Claude Code Web добавил кнопку logout, коммит abc123. Задеплой на dev."

**Действия:**
```bash
# Шаг 1: Fetch
git fetch --all

# Шаг 2: Merge
git checkout dev
git pull origin dev
git merge origin/add-logout-button --no-ff
git push origin dev

# Шаг 3: Build
cd frontend-sveltekit && npm install && npm run build

# Шаг 4: Deploy
mcp__ssh-mcp__exec({
  command: "cd /opt/websites/granat.klik1.ru/frontend-sveltekit && git pull origin dev && npm install && npm run build"
});
mcp__ssh-mcp__exec({ command: "pm2 restart sl-frontend-dev" });

# Шаг 5: Verify
mcp__ssh-mcp__exec({ command: "pm2 status" });
mcp__ssh-mcp__exec({ command: "pm2 logs sl-frontend-dev --lines 30 --nostream" });

# Шаг 6: Report
"✅ Logout button deployed successfully. Test at https://granat.klik1.ru/profile"
```

### Пример 2: Feature с Database Migration

**Пользователь:** "Claude Code Web добавил таблицу user_sessions, коммит def456. Задеплой."

**Действия:**
```bash
# Шаги 1-3 аналогично...

# Шаг 4: Deploy + Migration
mcp__ssh-mcp__exec({
  command: "cd /opt/websites/granat.klik1.ru && git pull origin dev"
});

mcp__ssh-mcp__exec({
  command: "sqlite3 /opt/websites/granat.klik1.ru/data/db/sqlite/app.db < /opt/websites/granat.klik1.ru/backend-expressjs/migrations/005_user_sessions.sql"
});

mcp__ssh-mcp__exec({
  command: "cd /opt/websites/granat.klik1.ru/backend-expressjs && npm install && npm run build"
});

mcp__ssh-mcp__exec({ command: "pm2 restart sl-backend-dev sl-frontend-dev" });

# Шаг 5: Verify + Database Check
mcp__ssh-mcp__exec({
  command: "sqlite3 /opt/websites/granat.klik1.ru/data/db/sqlite/app.db '.schema user_sessions'"
});

# Шаг 6: Report
"✅ User sessions feature deployed. Migration applied: user_sessions table created."
```

### Пример 3: TypeScript Error Fix

**Ситуация:** После merge build failed с duplicate type error.

**Действия:**
```bash
# Шаг 3: Build failed
cd backend-expressjs && npm run build
# ERROR: Duplicate identifier 'NewOrderItem'

# Проактивное исправление:
Read backend-expressjs/src/db/schema.ts
# Найдены duplicate exports на строках 797 и 919

Edit:
  file_path: backend-expressjs/src/db/schema.ts
  old_string: "export type NewOrderItem = typeof orderItems.$inferInsert;\nexport type ShopSettings..."
  new_string: "// Duplicate exports removed - see line 797"

# Повторить build
npm run build
# ✅ Build successful

# Продолжить с Шага 4...

# В отчете указать:
"⚠️ Fixed TypeScript error: removed duplicate type exports in schema.ts:919"
```

---

**Конец документа**

**Версия:** 1.0
**Дата:** 2025-12-12
**Автор:** Claude Code CLI
**Применимость:** Universal (любые Git-based проекты)
