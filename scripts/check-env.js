#!/usr/bin/env node
/**
 * check-env.js - Проверка конфигурации перед деплоем
 * Автор: Claude Code
 * Дата: 2025-12-01
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment configuration...\n');

let hasErrors = false;

// ===== 1. Проверка ecosystem.config.js =====
console.log('✅ Checking ecosystem.config.js...');
const ecosystemPath = path.join(__dirname, '../ecosystem.config.js');

if (!fs.existsSync(ecosystemPath)) {
    console.error('❌ ERROR: ecosystem.config.js not found!');
    hasErrors = true;
} else {
    const ecosystemConfig = fs.readFileSync(ecosystemPath, 'utf8');

    // Проверка PUBLIC_BACKEND_URL
    if (!ecosystemConfig.includes('PUBLIC_BACKEND_URL')) {
        console.error('❌ ERROR: ecosystem.config.js missing PUBLIC_BACKEND_URL');
        console.error('   Add to frontend env: PUBLIC_BACKEND_URL: "https://murzicoin.murzico.ru"');
        hasErrors = true;
    } else {
        console.log('   ✓ PUBLIC_BACKEND_URL present');
    }

    // Проверка SESSION_SECRET
    if (!ecosystemConfig.includes('SESSION_SECRET')) {
        console.error('❌ ERROR: ecosystem.config.js missing SESSION_SECRET');
        hasErrors = true;
    } else {
        console.log('   ✓ SESSION_SECRET present');
    }

    // Проверка на localhost URLs в production
    if (ecosystemConfig.includes('localhost:3000') || ecosystemConfig.includes('localhost:3015')) {
        // Разрешаем только в fallback значениях
        const lines = ecosystemConfig.split('\n').filter(l =>
            (l.includes('localhost:3000') || l.includes('localhost:3015')) &&
            !l.includes('fallback') &&
            !l.includes('//')
        );
        if (lines.length > 0) {
            console.error('⚠️  WARNING: ecosystem.config.js contains localhost URLs:');
            lines.forEach(l => console.error('   ' + l.trim()));
        }
    }
}

console.log('');

// ===== 2. Проверка кода =====
console.log('✅ Checking code for correct imports...');
const cashierApiPath = path.join(__dirname, '../frontend-sveltekit/src/lib/api/cashier.ts');

if (!fs.existsSync(cashierApiPath)) {
    console.error('❌ ERROR: cashier.ts not found!');
    hasErrors = true;
} else {
    const cashierCode = fs.readFileSync(cashierApiPath, 'utf8');

    // Проверка на неправильный импорт
    if (cashierCode.includes('import.meta.env.PUBLIC_BACKEND_URL')) {
        console.error('❌ ERROR: cashier.ts uses import.meta.env instead of $env/static/public');
        console.error('   Change to: import { PUBLIC_BACKEND_URL } from "$env/static/public"');
        hasErrors = true;
    } else {
        console.log('   ✓ cashier.ts uses correct SvelteKit import');
    }

    // Проверка наличия правильного импорта
    if (!cashierCode.includes("from '$env/static/public'")) {
        console.error('⚠️  WARNING: cashier.ts may not be importing from $env/static/public');
    }
}

console.log('');

// ===== 3. Проверка .env файлов =====
console.log('✅ Checking .env files...');
const frontendEnvPath = path.join(__dirname, '../frontend-sveltekit/.env');

if (fs.existsSync(frontendEnvPath)) {
    const envContent = fs.readFileSync(frontendEnvPath, 'utf8');

    // Проверка NODE_ENV
    if (envContent.includes('NODE_ENV=development')) {
        console.error('⚠️  WARNING: .env has NODE_ENV=development');
        console.error('   For production build, use: NODE_ENV=production');
    }

    // Проверка PUBLIC_BACKEND_URL
    if (envContent.includes('PUBLIC_BACKEND_URL=http://localhost')) {
        console.error('⚠️  WARNING: .env has localhost URL for PUBLIC_BACKEND_URL');
        console.error('   Remember: PM2 uses ecosystem.config.js, not .env!');
    }

    console.log('   ✓ .env file checked');
} else {
    console.log('   ℹ️  No .env file found (this is OK for PM2 deployment)');
}

console.log('');

// ===== 4. Проверка package.json scripts =====
console.log('✅ Checking package.json scripts...');
const frontendPkgPath = path.join(__dirname, '../frontend-sveltekit/package.json');

if (fs.existsSync(frontendPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));

    if (!pkg.scripts['deploy:check']) {
        console.log('   ℹ️  Add "deploy:check": "node ../scripts/check-env.js" to package.json');
    }

    if (!pkg.scripts['deploy:build']) {
        console.log('   ℹ️  Add "deploy:build": "PUBLIC_BACKEND_URL=https://murzicoin.murzico.ru NODE_ENV=production npm run build"');
    }
}

console.log('');

// ===== ИТОГ =====
if (hasErrors) {
    console.error('❌ ❌ ❌ Configuration check FAILED ❌ ❌ ❌');
    console.error('');
    console.error('Fix the errors above before deploying!');
    process.exit(1);
} else {
    console.log('✅ ✅ ✅ All checks passed! ✅ ✅ ✅');
    console.log('');
    console.log('Safe to deploy! Run: bash deploy.sh');
    process.exit(0);
}
