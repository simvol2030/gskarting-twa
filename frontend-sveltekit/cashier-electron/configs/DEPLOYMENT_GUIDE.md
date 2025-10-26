# Deployment Guide for 6 Stores

## Generated Configurations

### Store 1: Алмаз
- **Location**: ул. Советская, 15, Москва
- **Terminal**: TERM_ALMAS_001
- **Config**: `configs/.env.store1`
- **1C Server**: http://192.168.1.10:8080

### Store 2: Изумруд
- **Location**: пр. Ленина, 42, Москва
- **Terminal**: TERM_IZUMRUD_001
- **Config**: `configs/.env.store2`
- **1C Server**: http://192.168.2.10:8080

### Store 3: Сапфир
- **Location**: ул. Мира, 7, Санкт-Петербург
- **Terminal**: TERM_SAPFIR_001
- **Config**: `configs/.env.store3`
- **1C Server**: http://192.168.3.10:8080

### Store 4: Рубин
- **Location**: ул. Гагарина, 23, Санкт-Петербург
- **Terminal**: TERM_RUBIN_001
- **Config**: `configs/.env.store4`
- **1C Server**: http://192.168.4.10:8080

### Store 5: Топаз
- **Location**: ул. Победы, 56, Казань
- **Terminal**: TERM_TOPAZ_001
- **Config**: `configs/.env.store5`
- **1C Server**: http://192.168.5.10:8080

### Store 6: Янтарь
- **Location**: ул. Садовая, 89, Казань
- **Terminal**: TERM_YANTAR_001
- **Config**: `configs/.env.store6`
- **1C Server**: http://192.168.6.10:8080


## Deployment Steps

### Option 1: Manual Configuration (Recommended)

For each store:

1. **Install Electron App**:
   ```bash
   # Run installer on cashier workstation
   ./Cashier-Loyalty-Setup-1.0.0.exe
   ```

2. **Configure Store**:
   ```bash
   # Copy appropriate config
   cd "C:\Program Files\Cashier Loyalty"
   copy configs\.env.store1 .env

   # Edit .env and set ONEC_PASSWORD
   notepad .env
   ```

3. **Test**:
   - Launch app
   - Verify window position (bottom-left)
   - Test QR scan
   - Test F2 (earn) and F3 (redeem)

### Option 2: Automated Deployment Script

Create `deploy-to-store.bat`:

```batch
@echo off
SET STORE_ID=%1

IF "%STORE_ID%"=="" (
    echo Usage: deploy-to-store.bat [store_id]
    echo Example: deploy-to-store.bat 1
    exit /b 1
)

echo Deploying to Store %STORE_ID%...
copy configs\.env.store%STORE_ID% .env
echo Configuration deployed!
echo Please edit .env and set ONEC_PASSWORD before starting the app.
pause
```

**Usage**:
```bash
deploy-to-store.bat 1  # For Store 1: Алмаз
deploy-to-store.bat 2  # For Store 2: Изумруд
# etc.
```

## Pre-Deployment Checklist

- [ ] Backend server deployed and accessible at http://192.168.0.100:3000
- [ ] Database populated with store and customer data
- [ ] 1C OData API accessible from each store location
- [ ] ONEC_PASSWORD set for each store
- [ ] Network connectivity tested
- [ ] Firewall rules configured
- [ ] Icon updated (if using custom branding)

## Security Notes

⚠️ **IMPORTANT**: Never commit .env files with passwords to version control!

- Passwords should be set manually on each workstation
- Use different passwords per store if possible
- Rotate passwords regularly
- Monitor access logs

## Testing Matrix

| Store | Config | Backend | 1C | QR Scan | Earn | Redeem |
|-------|--------|---------|----|---------| -----|--------|
| 1. Алмаз | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2. Изумруд | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3. Сапфир | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4. Рубин | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5. Топаз | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6. Янтарь | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## Support

For issues, check:
1. `logs/` directory for error messages
2. Network connectivity to backend and 1C
3. .env configuration correctness
4. Windows Event Viewer for system errors
