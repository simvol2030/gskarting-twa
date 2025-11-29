#!/bin/bash
# Восстановление мигрированной production БД
# Запустить из директории: project-box-v3-orm/backend-expressjs

echo "Восстановление production БД с миграцией 0003..."
sqlite3 ../data/db/sqlite/app.db < ../data/db/sqlite/migrated-production-dump.sql
echo "Done! Проверка данных..."
sqlite3 ../data/db/sqlite/app.db "SELECT COUNT(*) || ' пользователей' FROM loyalty_users; SELECT COUNT(*) || ' магазинов' FROM stores; SELECT '✅ loyalty_settings' FROM loyalty_settings LIMIT 1;"
