#!/bin/bash
# Восстановление production БД с примененной миграцией 0003
# Нужно скопировать /tmp/app-after-checkpoint.db с сервера

echo "Этот скрипт нужно запустить после копирования БД с сервера"
echo "scp webmaster@murzicoin.murzico.ru:/tmp/app-after-checkpoint.db ./app.db"
