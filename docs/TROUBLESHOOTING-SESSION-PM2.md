# Troubleshooting: Session Decryption Error (PM2 + SvelteKit + Express)

## Problem Summary

**Symptom**: Admin panel pages return 500 error with message:
```
Decryption failed: Error: Unsupported state or unable to authenticate data
```

**Affected**: All pages requiring backend API calls (Clients, Products, Promotions, Stores, Statistics, Settings). Dashboard may partially work if it doesn't call backend.

## Root Cause

SvelteKit frontend and Express backend use **different SESSION_SECRET** values because:

1. **Backend** reads `SESSION_SECRET` from `.env` file via `dotenv` (loaded at startup)
2. **SvelteKit** in production mode uses `$env/dynamic/private` which reads from `process.env`
3. **PM2** does NOT automatically load `.env` files - it only passes environment variables explicitly defined in `ecosystem.config.js`

Result: Frontend uses fallback secret (`fallback-secret-change-in-production`, 36 chars), backend uses real secret from `.env` (44 chars). Different keys = decryption fails.

## Diagnosis

### Step 1: Check logs for secret hash mismatch

Add debug logging to both services:

**Backend** (`src/middleware/session-auth.ts`):
```typescript
import { createHash } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || '';
if (SESSION_SECRET) {
  const hash = createHash('md5').update(SESSION_SECRET).digest('hex').substring(0, 8);
  console.log(`[SESSION-AUTH] SECRET loaded, length: ${SESSION_SECRET.length}, hash: ${hash}...`);
}
```

**Frontend** (`src/lib/server/auth/crypto.ts` in encrypt/decrypt functions):
```typescript
const secretHash = createHash('md5').update(secret).digest('hex').substring(0, 8);
console.log(`[FRONTEND-CRYPTO] SECRET length: ${secret.length}, hash: ${secretHash}...`);
```

### Step 2: Compare hashes in PM2 logs

```bash
pm2 logs murzicoin-backend --lines 50 | grep "SESSION-AUTH"
pm2 logs murzicoin-frontend --lines 50 | grep "FRONTEND-CRYPTO"
```

**If hashes differ** - this is the problem!

Example of mismatch:
```
[SESSION-AUTH] SECRET loaded, length: 44, hash: 0fbf9885...      # Backend - correct
[FRONTEND-CRYPTO] SECRET length: 36, hash: 3a58dada...           # Frontend - WRONG (fallback)
```

## Solution

### Quick Fix: Add SESSION_SECRET to ecosystem.config.js

Edit `/opt/websites/murzicoin.murzico.ru/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'murzicoin-frontend',
      cwd: '/opt/websites/murzicoin.murzico.ru/frontend-sveltekit',
      script: 'build/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3009',
        ORIGIN: 'https://murzicoin.murzico.ru',
        SESSION_SECRET: '/h3mrzqmVEweenR+NiQV5CUWkhAcpEccOw+jorAhPgA='  // <-- ADD THIS
      },
      // ... other config
    },
    {
      name: 'murzicoin-backend',
      cwd: '/opt/websites/murzicoin.murzico.ru/backend-expressjs',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3015',
        SESSION_SECRET: '/h3mrzqmVEweenR+NiQV5CUWkhAcpEccOw+jorAhPgA='  // <-- ADD THIS
      },
      // ... other config
    }
  ]
};
```

### Apply Changes

**IMPORTANT**: `pm2 restart --update-env` often doesn't work reliably. Use delete + start:

```bash
cd /opt/websites/murzicoin.murzico.ru

# Delete and restart services
pm2 delete murzicoin-frontend murzicoin-backend
pm2 start ecosystem.config.js --only murzicoin-frontend,murzicoin-backend

# Verify hashes match
pm2 logs murzicoin-backend --lines 20 | grep "SESSION-AUTH"
pm2 logs murzicoin-frontend --lines 20 | grep "FRONTEND-CRYPTO"
```

Both should show:
```
[SESSION-AUTH] SECRET loaded, length: 44, hash: 0fbf9885...
[FRONTEND-CRYPTO] SECRET length: 44, hash: 0fbf9885...
```

### Verify Fix

1. Clear browser cookies or use incognito mode
2. Login to admin panel: https://murzicoin.murzico.ru/login
3. Navigate to Clients, Products, Settings - all should load without 500 errors

## Prevention Checklist

When deploying to production:

- [ ] Copy SESSION_SECRET from `.env` to `ecosystem.config.js` for both frontend and backend
- [ ] Ensure both services have IDENTICAL SESSION_SECRET values
- [ ] Use `pm2 delete` + `pm2 start` instead of `pm2 restart --update-env`
- [ ] Verify hash match in logs after deployment

## Key Files

| File | Purpose |
|------|---------|
| `/opt/websites/murzicoin.murzico.ru/ecosystem.config.js` | PM2 configuration with env variables |
| `/opt/websites/murzicoin.murzico.ru/frontend-sveltekit/.env` | Frontend env (NOT read by PM2) |
| `/opt/websites/murzicoin.murzico.ru/backend-expressjs/.env` | Backend env (loaded by dotenv) |
| `frontend-sveltekit/src/lib/server/auth/crypto.ts` | Session encryption/decryption |
| `backend-expressjs/src/middleware/session-auth.ts` | Session validation middleware |

## Technical Details

### Why 36 characters?

The fallback secret in `crypto.ts`:
```typescript
const secret = env.SESSION_SECRET || 'fallback-secret-change-in-production';
//                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                    This string is exactly 36 characters
```

### Why doesn't PM2 load .env files?

PM2 is a process manager, not an application framework. It doesn't know about `.env` files. Options:
1. Add env vars to `ecosystem.config.js` (recommended)
2. Use `pm2-runtime` with `--env` flag
3. Load dotenv in app entry point (risky for SvelteKit)

### Correct SECRET hash reference

For SESSION_SECRET = `/h3mrzqmVEweenR+NiQV5CUWkhAcpEccOw+jorAhPgA=`:
- Length: **44**
- MD5 hash (first 8 chars): **0fbf9885**

---

*Document created: 2025-11-23*
*Issue resolved: Session authentication between SvelteKit frontend and Express backend via PM2*
