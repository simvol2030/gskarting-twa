#!/bin/bash
# Telegram notification hook for Claude Code (Web & CLI)
# Проект: GS Racing TWA (gsracing-twa.klik1.ru)
# Работает автоматически при Stop и Notification событиях

EVENT_TYPE="${1:-completed}"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-7977874487:AAH4m0eIjHT3ToEbF5Z3rtPs0aDbLhC9wQQ}"
CHAT_ID="${TELEGRAM_CHAT_ID:-437633456}"

# Если токен не задан — выходим тихо
[ -z "$BOT_TOKEN" ] && exit 0

# Определяем окружение (Web или CLI)
if [ "$CLAUDE_CODE_REMOTE" = "true" ]; then
    ENV_ICON="WEB"
else
    ENV_ICON="CLI"
fi

# Получаем информацию о проекте
PROJECT=$(basename "$CLAUDE_PROJECT_DIR" 2>/dev/null || echo "unknown")
BRANCH=$(git -C "$CLAUDE_PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "-")

# Формируем сообщение в зависимости от события
case "$EVENT_TYPE" in
    "completed")
        EMOJI="DONE"
        TEXT="Задача завершена"
        ;;
    "awaiting")
        EMOJI="WAIT"
        TEXT="Ожидает ввода"
        ;;
    "phase")
        EMOJI="PHASE"
        TEXT="Фаза завершена"
        ;;
    "roadmap")
        EMOJI="ROADMAP"
        TEXT="Roadmap готов"
        ;;
    *)
        EMOJI="INFO"
        TEXT="$EVENT_TYPE"
        ;;
esac

# Формируем сообщение
MESSAGE="[${EMOJI}] [${ENV_ICON}]
Project: ${PROJECT}
Branch: ${BRANCH}
Status: ${TEXT}"

# Отправляем в Telegram (асинхронно, чтобы не блокировать)
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d chat_id="$CHAT_ID" \
    -d text="$MESSAGE" \
    > /dev/null 2>&1 &

exit 0
