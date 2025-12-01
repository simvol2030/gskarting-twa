#!/bin/bash
# deploy.sh - Безопасный деплой на продакшен
# Автор: Claude Code
# Дата: 2025-12-01

set -e  # Остановить при любой ошибке

echo "🚀 Starting deployment to production..."
echo ""

# ===== STEP 1: Проверка ecosystem.config.js =====
echo "✅ STEP 1: Checking ecosystem.config.js..."
if ! grep -q "PUBLIC_BACKEND_URL.*murzicoin.murzico.ru" ../ecosystem.config.js; then
    echo "❌ ERROR: ecosystem.config.js missing PUBLIC_BACKEND_URL!"
    echo "   Add: PUBLIC_BACKEND_URL: 'https://murzicoin.murzico.ru'"
    exit 1
fi

if grep -q "localhost:3015" ../ecosystem.config.js | grep -v "fallback"; then
    echo "⚠️  WARNING: Found localhost:3015 in ecosystem.config.js"
fi

echo "   ✓ ecosystem.config.js looks good"
echo ""

# ===== STEP 2: Проверка импортов в коде =====
echo "✅ STEP 2: Checking code for correct imports..."
cd frontend-sveltekit

if grep -r "import.meta.env.PUBLIC_" src/lib/api/ 2>/dev/null; then
    echo "❌ ERROR: Found import.meta.env in src/lib/api/"
    echo "   Use: import { PUBLIC_BACKEND_URL } from '\$env/static/public'"
    exit 1
fi

echo "   ✓ Code imports look good"
echo ""

# ===== STEP 3: Build frontend с правильными env =====
echo "✅ STEP 3: Building frontend..."
echo "   Using env: PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru"
PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru \
NODE_ENV=production \
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Frontend build failed!"
    exit 1
fi
echo "   ✓ Frontend built successfully"
echo ""

# ===== STEP 4: Build backend =====
echo "✅ STEP 4: Building backend..."
cd ../backend-expressjs
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Backend build failed!"
    exit 1
fi
echo "   ✓ Backend built successfully"
echo ""

# ===== STEP 5: Проверка билда на localhost:3000 =====
echo "✅ STEP 5: Checking build for localhost:3000..."
cd ../frontend-sveltekit
if grep -r "localhost:3000" build/client/_app/immutable/nodes/ 2>/dev/null; then
    echo "⚠️  WARNING: Found localhost:3000 in client build!"
    echo "   This may indicate PUBLIC_BACKEND_URL wasn't properly injected"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "   ✓ No localhost:3000 found in client build"
fi
echo ""

# ===== STEP 6: Копируем на сервер =====
echo "✅ STEP 6: Copying to production server..."

# Копируем ecosystem.config.js
echo "   → Copying ecosystem.config.js..."
scp ../ecosystem.config.js webmaster@46.8.19.26:/opt/websites/murzicoin.murzico.ru/

# Копируем frontend build
echo "   → Copying frontend build..."
ssh webmaster@46.8.19.26 "mkdir -p /opt/websites/murzicoin.murzico.ru/frontend-sveltekit/build"
scp -r build/* webmaster@46.8.19.26:/opt/websites/murzicoin.murzico.ru/frontend-sveltekit/build/

# Копируем backend dist
echo "   → Copying backend dist..."
cd ../backend-expressjs
ssh webmaster@46.8.19.26 "mkdir -p /opt/websites/murzicoin.murzico.ru/backend-expressjs/dist"
scp -r dist/* webmaster@46.8.19.26:/opt/websites/murzicoin.murzico.ru/backend-expressjs/dist/

echo "   ✓ Files copied to production"
echo ""

# ===== STEP 7: Рестартуем PM2 =====
echo "✅ STEP 7: Restarting PM2..."
ssh webmaster@46.8.19.26 "cd /opt/websites/murzicoin.murzico.ru && /home/webmaster/.nvm/versions/node/v22.15.0/bin/pm2 delete murzicoin-frontend murzicoin-backend && /home/webmaster/.nvm/versions/node/v22.15.0/bin/pm2 start ecosystem.config.js"

echo "   ✓ PM2 restarted"
echo ""

# ===== STEP 8: Финальная проверка =====
echo "✅ STEP 8: Final verification..."
echo "   Checking PM2 env vars..."
ssh webmaster@46.8.19.26 "/home/webmaster/.nvm/versions/node/v22.15.0/bin/pm2 env murzicoin-frontend | grep PUBLIC_BACKEND_URL"

echo ""
echo "✅ ✅ ✅ Deployment complete! ✅ ✅ ✅"
echo ""
echo "Next steps:"
echo "1. Test cashier: https://murzicoin.murzico.ru/cashier?storeId=1"
echo "2. Test card: 633456"
echo "3. Check logs: ssh webmaster@46.8.19.26 'tail -f /opt/websites/murzicoin.murzico.ru/logs/frontend-out.log'"
echo ""
