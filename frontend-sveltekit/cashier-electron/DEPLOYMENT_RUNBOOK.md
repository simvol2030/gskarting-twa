# Deployment Runbook - Desktop Cashier Application

**Version**: 1.0.0
**Date**: 2025-10-24
**Application**: Electron Desktop Cashier for Loyalty System
**Target Stores**: 6 physical locations
**Deployment Type**: Sequential per-store rollout

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment](#pre-deployment)
3. [Deployment](#deployment)
4. [Post-Deployment](#post-deployment)
5. [Rollback Plan](#rollback-plan)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Deployment Strategy

**Type**: Sequential per-store rollout
**Duration**: 1-2 hours per store
**Schedule**: One store per day to allow monitoring
**Order**:
1. Store 1 (Алмаз) - Moscow - Pilot
2. Store 2 (Изумруд) - Moscow - Day 2
3. Store 3 (Сапфир) - St. Petersburg - Day 3
4. Store 4 (Рубин) - St. Petersburg - Day 4
5. Store 5 (Топаз) - Kazan - Day 5
6. Store 6 (Янтарь) - Kazan - Day 6

**Rationale**: Sequential rollout allows early detection of issues and minimizes impact

### Prerequisites

- Backend API deployed and accessible
- Database migration 002_loyalty_system.sql applied
- All 6 store installers built and tested
- Network infrastructure ready
- 1C integration tested (or mock mode enabled)

### Deployment Team

- **Deployment Lead**: Responsible for overall execution
- **Technical Support**: On-site at store for installation
- **Backend Engineer**: Available for API issues (remote)
- **QA Tester**: Runs smoke tests (remote or on-site)
- **Store Manager**: Coordinates store operations

---

## Pre-Deployment

### Phase 1: Infrastructure Preparation (1-2 weeks before)

#### 1.1 Backend Server Setup

**Location**: Central server (http://192.168.0.100:3000)

```bash
# 1. Deploy backend API
cd /opt/loyalty-backend
git pull origin main

# 2. Install dependencies
npm install --production

# 3. Run database migration
npm run migrate

# 4. Verify migration
sqlite3 /opt/loyalty-backend/data/app.db "SELECT name FROM sqlite_master WHERE type='table';"
# Expected: loyalty_users, stores, transactions, cashier_transactions

# 5. Seed store data
npm run seed:stores

# 6. Start backend service
sudo systemctl restart loyalty-backend

# 7. Verify backend health
curl http://192.168.0.100:3000/api/health
# Expected: { "status": "ok", "timestamp": "..." }
```

**Verification Checklist**:
- [ ] Backend API responds to /api/health
- [ ] Database tables created successfully
- [ ] 6 stores seeded (SELECT * FROM stores)
- [ ] Test loyalty users seeded
- [ ] Backend service auto-starts on reboot

---

#### 1.2 Network Configuration

**Per Store Configuration**:

```bash
# Firewall rules - allow backend access
sudo firewall-cmd --permanent --add-rich-rule='
  rule family="ipv4"
  source address="192.168.X.0/24"
  port protocol="tcp" port="3000"
  accept'
sudo firewall-cmd --reload

# Verify connectivity from each store
# Run from store network:
ping 192.168.0.100
curl http://192.168.0.100:3000/api/health
```

**Network Requirements**:

| Store | Store Network | Backend Access | 1C Server | Firewall Rules |
|-------|---------------|----------------|-----------|----------------|
| 1 (Алмаз) | 192.168.1.0/24 | ✅ | 192.168.1.10:8080 | Port 3000 open |
| 2 (Изумруд) | 192.168.2.0/24 | ✅ | 192.168.2.10:8080 | Port 3000 open |
| 3 (Сапфир) | 192.168.3.0/24 | ✅ | 192.168.3.10:8080 | Port 3000 open |
| 4 (Рубин) | 192.168.4.0/24 | ✅ | 192.168.4.10:8080 | Port 3000 open |
| 5 (Топаз) | 192.168.5.0/24 | ✅ | 192.168.5.10:8080 | Port 3000 open |
| 6 (Янтарь) | 192.168.6.0/24 | ✅ | 192.168.6.10:8080 | Port 3000 open |

**Verification Checklist**:
- [ ] All stores can ping backend server
- [ ] All stores can access port 3000
- [ ] Each store can access its own 1C server
- [ ] No cross-store 1C access

---

#### 1.3 SSL Certificate Setup (Optional, Recommended)

If using HTTPS for backend:

```bash
# 1. Generate or import SSL certificate
sudo certbot certonly --standalone -d loyalty-api.yourdomain.com

# 2. Update backend to use HTTPS
# Edit backend config to enable SSL

# 3. Update all .env files
# Change BACKEND_URL=https://loyalty-api.yourdomain.com:3000

# 4. Test SSL connection
curl https://loyalty-api.yourdomain.com:3000/api/health
```

**Verification Checklist**:
- [ ] SSL certificate valid and not expired
- [ ] Backend serves HTTPS correctly
- [ ] All stores can connect via HTTPS

---

#### 1.4 1C API Configuration

**Per Store**:

```bash
# 1. Verify 1C OData endpoint accessible
curl http://192.168.X.10:8080/odata/standard.odata/Document_CheckReceipt?$format=json

# 2. Test authentication
curl -u cashier_api:PASSWORD http://192.168.X.10:8080/odata/standard.odata/

# 3. Configure 1C to expose transaction amounts
# (Requires 1C administrator - out of scope)

# 4. Test mock mode (fallback)
# Set ONEC_MOCK=true in .env for testing
```

**1C Integration Checklist**:
- [ ] 1C OData endpoint accessible
- [ ] Authentication credentials valid
- [ ] Transaction data available via API
- [ ] Timeout settings configured (3 seconds)
- [ ] Mock mode works as fallback

**Note**: If 1C integration not ready, deploy with ONEC_MOCK=true

---

### Phase 2: Build Installers (3-5 days before)

#### 2.1 Build All Store Installers

**On Development Machine**:

```bash
cd /path/to/project/frontend-sveltekit/cashier-electron

# 1. Ensure SvelteKit build is up-to-date
cd ..
npm run build

# 2. Return to cashier-electron
cd cashier-electron

# 3. Generate all store configs (if not already done)
npm run config:generate

# 4. Set ONEC_PASSWORD for each store config
# Edit each configs/.env.storeX file
nano configs/.env.store1
# Set: ONEC_PASSWORD=actual_password_here
# Repeat for stores 2-6

# 5. Build all installers
npm run package:all-stores

# This will create:
# dist/Cashier-Алмаз-Store1-Setup-1.0.0.exe
# dist/Cashier-Изумруд-Store2-Setup-1.0.0.exe
# dist/Cashier-Сапфир-Store3-Setup-1.0.0.exe
# dist/Cashier-Рубин-Store4-Setup-1.0.0.exe
# dist/Cashier-Топаз-Store5-Setup-1.0.0.exe
# dist/Cashier-Янтарь-Store6-Setup-1.0.0.exe

# Estimated time: 15-20 minutes
```

**Build Verification Checklist**:
- [ ] All 6 installers created successfully
- [ ] Installer file sizes reasonable (50-100MB each)
- [ ] Installer names match store names
- [ ] .env files embedded correctly in each installer

---

#### 2.2 Test Installers Locally

**On Test Machine** (Windows 10/11):

```bash
# 1. Run installer for Store 1
Cashier-Алмаз-Store1-Setup-1.0.0.exe

# 2. Follow installation wizard
# Default path: C:\Program Files\Касса Алмаз

# 3. Launch app from desktop shortcut

# 4. Verify .env configuration
notepad "C:\Program Files\Касса Алмаз\.env"
# Check: STORE_ID=1, STORE_NAME=Алмаз

# 5. Test basic functionality
# - QR scan
# - F2 earn transaction
# - F3 redeem transaction
# - Esc reset

# 6. Uninstall
# Control Panel > Uninstall > Касса Алмаз

# 7. Repeat for at least 2 other stores
```

**Test Verification Checklist**:
- [ ] Installer runs without errors
- [ ] Desktop shortcut created
- [ ] Start Menu entry created
- [ ] .env file present with correct STORE_ID
- [ ] App launches and positions correctly
- [ ] Smoke tests pass (earn, redeem, reset)
- [ ] Uninstaller works cleanly

---

### Phase 3: Prepare Deployment Materials (2-3 days before)

#### 3.1 Create Deployment Package

**Per Store USB Drive**:

```
USB Drive Structure:
├── Cashier-{StoreName}-Store{ID}-Setup-1.0.0.exe
├── INSTALLATION_INSTRUCTIONS.pdf
├── QUICK_REFERENCE.pdf
├── SUPPORT_CONTACTS.txt
└── Test_Data/
    ├── test_qr_codes.pdf
    └── test_customer_data.xlsx
```

**Create USB drives**:

```bash
# 1. Format USB drives (one per store)
# Label: "Касса {StoreName}"

# 2. Copy installer
cp dist/Cashier-Алмаз-Store1-Setup-1.0.0.exe /media/usb1/

# 3. Copy documentation
cp INSTALLATION.md /media/usb1/INSTALLATION_INSTRUCTIONS.pdf
cp CASHIER_QUICK_REFERENCE.md /media/usb1/QUICK_REFERENCE.pdf
cp SUPPORT_CONTACTS.md /media/usb1/SUPPORT_CONTACTS.txt

# 4. Generate test QR codes
npm run generate:test-qr-codes
cp test_qr_codes.pdf /media/usb1/Test_Data/

# Repeat for all 6 stores
```

**Deployment Package Checklist**:
- [ ] 6 USB drives prepared and labeled
- [ ] Installers copied correctly
- [ ] Documentation included
- [ ] Test data available
- [ ] USB drives virus-scanned

---

#### 3.2 Schedule Deployment Windows

**Coordinate with Store Managers**:

| Store | Date | Time | Duration | On-Site Tech | Notes |
|-------|------|------|----------|--------------|-------|
| 1 (Алмаз) | 2025-10-25 | 10:00-12:00 | 2 hours | Tech A | Pilot - extra time |
| 2 (Изумруд) | 2025-10-26 | 10:00-11:30 | 1.5 hours | Tech A | Same city as Store 1 |
| 3 (Сапфир) | 2025-10-27 | 10:00-11:30 | 1.5 hours | Tech B | St. Petersburg |
| 4 (Рубин) | 2025-10-28 | 10:00-11:30 | 1.5 hours | Tech B | St. Petersburg |
| 5 (Топаз) | 2025-10-29 | 10:00-11:30 | 1.5 hours | Tech C | Kazan |
| 6 (Янтарь) | 2025-10-30 | 10:00-11:30 | 1.5 hours | Tech C | Kazan |

**Scheduling Checklist**:
- [ ] Store managers confirmed availability
- [ ] Deployment windows are off-peak hours
- [ ] On-site technicians assigned
- [ ] Remote support team on standby
- [ ] Rollback window reserved (4 hours after deployment)

---

## Deployment

### Phase 4: Per-Store Installation (1-2 hours per store)

#### 4.1 Pre-Installation Checks (15 minutes)

**On-Site at Store**:

```bash
# 1. Verify workstation specifications
systeminfo
# Check: OS (Windows 10/11), RAM (≥4GB), Screen (≥1920x1080)

# 2. Verify network connectivity
ping 192.168.0.100
curl http://192.168.0.100:3000/api/health

# 3. Verify 1C server connectivity (if applicable)
ping 192.168.X.10
curl http://192.168.X.10:8080/

# 4. Check existing software conflicts
tasklist | findstr "kaspersky\|avast\|norton"
# Temporarily disable antivirus if needed

# 5. Ensure workstation is backed up
# (If replacing existing software)
```

**Pre-Installation Checklist**:
- [ ] Workstation meets hardware requirements
- [ ] Network connectivity verified
- [ ] Backend API accessible
- [ ] 1C server accessible (or mock mode enabled)
- [ ] Antivirus temporarily disabled
- [ ] Backup completed (if applicable)

---

#### 4.2 Installation (15 minutes)

**Run Installer**:

```bash
# 1. Insert USB drive labeled "Касса {StoreName}"

# 2. Run installer as Administrator
# Right-click > Run as administrator
Cashier-{StoreName}-Store{ID}-Setup-1.0.0.exe

# 3. Follow installation wizard
# Accept license agreement
# Choose installation directory: C:\Program Files\Касса {StoreName}
# Create desktop shortcut: Yes
# Create Start Menu entry: Yes
# Install

# 4. Wait for installation to complete (2-3 minutes)

# 5. Click Finish (do NOT launch yet)
```

**Installation Checklist**:
- [ ] Installer completed without errors
- [ ] Desktop shortcut created
- [ ] Start Menu entry exists
- [ ] Installation directory contains files

---

#### 4.3 Configuration Verification (5 minutes)

**Verify Configuration**:

```bash
# 1. Navigate to installation directory
cd "C:\Program Files\Касса {StoreName}"

# 2. Verify .env file exists
dir .env

# 3. Open .env file
notepad .env

# 4. Verify settings:
# STORE_ID=X (correct store)
# STORE_NAME={StoreName}
# BACKEND_URL=http://192.168.0.100:3000
# ONEC_BASE_URL=http://192.168.X.10:8080
# ONEC_PASSWORD=*** (check not empty)

# 5. If corrections needed, edit and save
```

**Configuration Checklist**:
- [ ] .env file exists
- [ ] STORE_ID matches physical store
- [ ] STORE_NAME correct
- [ ] BACKEND_URL correct
- [ ] ONEC_BASE_URL correct for this store
- [ ] ONEC_PASSWORD set (not empty)
- [ ] NODE_ENV=production

---

#### 4.4 First Launch (5 minutes)

**Launch Application**:

```bash
# 1. Double-click desktop shortcut: "Касса {StoreName}"

# 2. Observe window behavior:
# - Window appears in bottom-left corner
# - Size: approximately 1/3 screen width x 1/3 screen height
# - Position: fixed, cannot move or resize
# - Title bar shows: "Касса {StoreName}"

# 3. Verify always-on-top:
# - Open another window (e.g., Notepad)
# - Cashier app should remain visible above it

# 4. Check initial state:
# - QR input field is focused (cursor blinking)
# - No customer selected
# - Empty purchase amount
# - Buttons visible: "Начислить бонусы", "Списать бонусы", "Поиск по карте"
```

**First Launch Checklist**:
- [ ] App launches without errors
- [ ] Window positioned bottom-left
- [ ] Window size correct (1/3 x 1/3)
- [ ] Window cannot be moved
- [ ] Window cannot be resized
- [ ] Always on top works
- [ ] QR input field auto-focused
- [ ] UI renders correctly

---

#### 4.5 Smoke Tests (20 minutes)

**Test 1: Valid QR Code Scan**

```
1. Focus on QR input field
2. Scan test QR code (loyalty user ID 1)
3. Expected: Customer "Иван Петров" selected, balance "1500 ₽" displayed
4. Result: [ ] Pass [ ] Fail
```

**Test 2: Earn Points Transaction**

```
1. With customer selected, press F2
2. Enter purchase amount: 1000
3. Observe calculated earn: 40 points (4%)
4. Press F2 again to confirm
5. Expected: Success message "✅ Начислено 40 бонусов", new balance "1540 ₽"
6. Result: [ ] Pass [ ] Fail
```

**Test 3: Redeem Points Transaction**

```
1. Select customer with balance ≥100
2. Press F3
3. Enter purchase amount: 500
4. Observe calculated redeem: 100 points (20% max or balance)
5. Press F3 again to confirm
6. Expected: Success message "✅ Списано X бонусов. Скидка: X ₽"
7. Result: [ ] Pass [ ] Fail
```

**Test 4: Hotkey Reset**

```
1. With transaction displayed, press Esc
2. Expected: Customer cleared, amount cleared, QR field focused
3. Result: [ ] Pass [ ] Fail
```

**Test 5: Invalid QR Code**

```
1. Enter invalid QR: "INVALID_TEST_123"
2. Wait 300ms (auto-scan)
3. Expected: Alert "Покупатель не найден. Проверьте QR-код."
4. Result: [ ] Pass [ ] Fail
```

**Test 6: Backend Connectivity**

```
1. Open browser on workstation
2. Navigate to: http://192.168.0.100:3000/api/health
3. Expected: { "status": "ok", "timestamp": "..." }
4. Result: [ ] Pass [ ] Fail
```

**Test 7: Database Record Verification**

```
1. After Test 2 (earn transaction), check database
2. SSH to backend server:
   sqlite3 /opt/loyalty-backend/data/app.db
   SELECT * FROM cashier_transactions ORDER BY created_at DESC LIMIT 1;
3. Expected: Record with store_id=X, type='earn', points_amount=40
4. Result: [ ] Pass [ ] Fail
```

**Smoke Tests Summary**:
- Total: 7 tests
- Passed: ___
- Failed: ___
- Status: [ ] All Pass [ ] Some Fail (document below)

**Failed Tests**: _______________________________________________

---

#### 4.6 Training (15-20 minutes)

**Train Cashiers**:

1. **Overview** (5 minutes)
   - Purpose: Loyalty program for customer rewards
   - Window always visible alongside 1C terminal
   - Use hotkeys for speed

2. **Basic Workflow** (10 minutes)
   - Customer presents QR code (on phone or card)
   - Scan QR → customer appears
   - F2 = Earn points (4% of purchase)
   - F3 = Redeem points (max 20% discount)
   - Esc = Reset to start new transaction

3. **Practice** (5 minutes)
   - Cashier performs 3 earn transactions
   - Cashier performs 2 redeem transactions
   - Cashier handles 1 invalid QR code

4. **Error Scenarios** (5 minutes)
   - "Покупатель не найден" → check QR code
   - "Ошибка сети" → retry or call support
   - "Недостаточно бонусов" → explain to customer

5. **Quick Reference** (handout)
   - Hotkeys: F2 (earn), F3 (redeem), Esc (reset)
   - Support contact: _______________
   - Common troubleshooting

**Training Checklist**:
- [ ] Cashier understands loyalty program purpose
- [ ] Cashier can scan QR codes
- [ ] Cashier can use F2/F3/Esc hotkeys
- [ ] Cashier knows how to handle errors
- [ ] Cashier has quick reference guide
- [ ] Cashier has support contact information

---

### Phase 5: Post-Installation (10-15 minutes)

#### 5.1 Documentation

**Create Installation Record**:

```
Store: {StoreName} (ID: {StoreID})
Date: {Date}
Time: {Time}
Installer: {TechnicianName}

Workstation Details:
- OS: Windows {Version}
- RAM: {Size}
- Screen: {Resolution}
- IP Address: {IP}

Installation Path: C:\Program Files\Касса {StoreName}

Configuration:
- STORE_ID: {ID}
- BACKEND_URL: {URL}
- ONEC_BASE_URL: {URL}
- ONEC_MOCK: {true/false}

Smoke Test Results:
- Test 1 (QR Scan): [ ] Pass [ ] Fail
- Test 2 (Earn): [ ] Pass [ ] Fail
- Test 3 (Redeem): [ ] Pass [ ] Fail
- Test 4 (Reset): [ ] Pass [ ] Fail
- Test 5 (Invalid QR): [ ] Pass [ ] Fail
- Test 6 (Backend): [ ] Pass [ ] Fail
- Test 7 (Database): [ ] Pass [ ] Fail

Training Completed: [ ] Yes [ ] No
Cashier Name: {Name}

Issues Encountered: {List any issues}

Sign-Off:
Technician: _________________ Date: _________
Store Manager: _________________ Date: _________
```

**Save to**: `/mnt/c/dev/loyalty_system_murzico/deployment_logs/store_{ID}_installation.txt`

---

#### 5.2 Enable Monitoring

**Set Up Monitoring** (if not already configured):

```bash
# On backend server, enable store-specific logging
sudo systemctl enable loyalty-backend-monitor@store{ID}

# Or configure log aggregation
tail -f /var/log/loyalty-backend/store{ID}.log
```

**Monitoring Checklist**:
- [ ] Backend logs capturing store transactions
- [ ] Error alerting enabled
- [ ] Performance metrics tracked
- [ ] Daily summary reports scheduled

---

## Post-Deployment

### Phase 6: Validation (First 24 Hours)

#### 6.1 Immediate Validation (First Hour)

**Monitor Closely**:

```bash
# 1. Watch backend logs
tail -f /var/log/loyalty-backend/app.log | grep "store_id: {ID}"

# 2. Check transaction success rate
sqlite3 /opt/loyalty-backend/data/app.db "
  SELECT
    COUNT(*) as total_transactions,
    store_id
  FROM cashier_transactions
  WHERE store_id = {ID}
    AND created_at > datetime('now', '-1 hour')
  GROUP BY store_id;
"

# 3. Monitor for errors
grep "ERROR" /var/log/loyalty-backend/app.log | grep "store_id: {ID}"

# 4. Check API response times
# (Use monitoring tool or check logs for latency)
```

**First Hour Checklist**:
- [ ] At least 5 transactions completed successfully
- [ ] No critical errors in logs
- [ ] Cashier comfortable using app
- [ ] No customer complaints
- [ ] App uptime 100%

**If Issues Arise**: Document and assess severity. Consider rollback if critical.

---

#### 6.2 First Day Validation (24 Hours)

**Daily Health Check**:

```bash
# 1. Transaction volume
sqlite3 /opt/loyalty-backend/data/app.db "
  SELECT
    store_id,
    COUNT(*) as total,
    SUM(CASE WHEN type='earn' THEN 1 ELSE 0 END) as earn_count,
    SUM(CASE WHEN type='redeem' THEN 1 ELSE 0 END) as redeem_count
  FROM cashier_transactions
  WHERE store_id = {ID}
    AND date(created_at) = date('now')
  GROUP BY store_id;
"

# 2. Error rate
SELECT
  COUNT(*) as error_count
FROM error_logs
WHERE store_id = {ID}
  AND date(created_at) = date('now');

# 3. Average transaction time
# (Requires application performance monitoring)

# 4. Cashier feedback
# Call store manager for verbal feedback
```

**First Day Checklist**:
- [ ] Transaction success rate ≥95%
- [ ] Error rate <5%
- [ ] Average transaction time <30 seconds
- [ ] No app crashes reported
- [ ] Cashier feedback positive (≥4/5)

---

### Phase 7: First Week Monitoring

**Daily Tasks** (Days 1-7):

| Day | Tasks | Responsible | Status |
|-----|-------|-------------|--------|
| 1 | Hourly health checks | Tech Support | [ ] |
| 1 | Cashier feedback call | Store Manager | [ ] |
| 1 | Evening summary report | Deployment Lead | [ ] |
| 2 | Morning health check | Tech Support | [ ] |
| 2 | Review overnight logs | Backend Engineer | [ ] |
| 3 | Mid-week performance review | Deployment Lead | [ ] |
| 3 | Identify optimization opportunities | Tech Support | [ ] |
| 7 | Weekly summary report | Deployment Lead | [ ] |
| 7 | Lessons learned document | Team | [ ] |

**Weekly Summary Template**:

```
Store: {StoreName} (ID: {StoreID})
Deployment Date: {Date}
Week: {StartDate} - {EndDate}

Metrics:
- Total Transactions: {Count}
- Earn Transactions: {Count}
- Redeem Transactions: {Count}
- Success Rate: {Percentage}%
- Error Rate: {Percentage}%
- Average Transaction Time: {Seconds}s
- App Uptime: {Percentage}%

Issues Encountered:
1. {Issue 1} - Severity: {P0/P1/P2/P3} - Status: {Open/Resolved}
2. {Issue 2} - Severity: {P0/P1/P2/P3} - Status: {Open/Resolved}

Cashier Feedback:
- Ease of Use: {Rating}/5
- Hotkey Convenience: {Rating}/5
- Error Message Clarity: {Rating}/5
- Overall Satisfaction: {Rating}/5
- Comments: {Text}

Recommendations:
1. {Recommendation 1}
2. {Recommendation 2}

Next Steps:
1. {Action 1}
2. {Action 2}

Prepared By: {Name}
Date: {Date}
```

---

## Rollback Plan

### When to Rollback

Initiate rollback immediately if:

1. **Critical (P0) Issues**:
   - App crashes more than 3 times in first hour
   - Data corruption detected in database
   - Security vulnerability discovered
   - More than 50% of transactions fail

2. **High Priority (P1) Issues**:
   - More than 20% of transactions fail
   - Store operations significantly disrupted
   - Cashiers cannot complete basic workflows
   - Customer complaints exceed threshold

3. **Business Impact**:
   - Store manager requests rollback
   - Revenue impact exceeds acceptable limit

**Decision Maker**: Deployment Lead (consult with Technical Lead and Store Manager)

---

### Rollback Procedure

#### Step 1: Stop Application (5 minutes)

```bash
# On store workstation:

# 1. Close application
# Click X button or Alt+F4

# 2. Verify app closed
tasklist | findstr "Касса"
# Should be empty

# 3. Kill process if necessary
taskkill /F /IM "Касса Алмаз.exe"
```

---

#### Step 2: Uninstall Application (10 minutes)

```bash
# Option 1: Use Control Panel
# 1. Open Control Panel
# 2. Programs and Features
# 3. Find "Касса {StoreName}"
# 4. Right-click > Uninstall
# 5. Follow uninstall wizard
# 6. Click Finish

# Option 2: Use command line (as Administrator)
wmic product where name="Касса {StoreName}" call uninstall

# 3. Verify uninstall complete
dir "C:\Program Files\Касса {StoreName}"
# Should not exist
```

---

#### Step 3: Database Cleanup (10 minutes)

```bash
# On backend server:

# 1. Mark store transactions as rolled back
sqlite3 /opt/loyalty-backend/data/app.db "
  UPDATE cashier_transactions
  SET metadata = json_set(metadata, '$.rolled_back', 1)
  WHERE store_id = {ID}
    AND date(created_at) >= date('{DeploymentDate}');
"

# 2. Revert customer balances (if needed)
# Review transactions and manually adjust balances
# This is complex - consider creating a revert script

# 3. Backup database before revert
cp /opt/loyalty-backend/data/app.db /opt/backups/app.db.pre_revert_{timestamp}

# 4. Run revert script (if available)
npm run revert:store -- --store-id={ID} --since={DeploymentDate}
```

**CRITICAL**: Database rollback is complex. Consult with Database Administrator before executing.

---

#### Step 4: Restore Previous State (15 minutes)

**If replacing existing system**:

```bash
# 1. Restore previous software from backup
# (Specific steps depend on what was replaced)

# 2. Verify previous software works
# Test basic functionality

# 3. Notify cashiers of reversion
# Resume normal operations with old system
```

**If new installation (no previous system)**:

```bash
# 1. No restoration needed
# 2. Cashiers revert to manual loyalty tracking
# 3. Notify customers of temporary issue
```

---

#### Step 5: Incident Report (30 minutes)

**Document Rollback**:

```
Rollback Incident Report

Store: {StoreName} (ID: {StoreID})
Deployment Date: {Date}
Rollback Date: {Date}
Rollback Time: {Time}

Reason for Rollback:
{Detailed description of issue}

Issues Encountered During Deployment:
1. {Issue 1} - Severity: {P0/P1/P2/P3}
2. {Issue 2} - Severity: {P0/P1/P2/P3}

Rollback Actions Taken:
1. Stopped application at {Time}
2. Uninstalled application at {Time}
3. Cleaned database at {Time}
4. Restored previous state at {Time}

Data Impact:
- Transactions during deployment: {Count}
- Transactions rolled back: {Count}
- Customer balances affected: {Count}
- Data integrity status: {OK/Issues}

Root Cause Analysis:
{Analysis of what went wrong}

Corrective Actions:
1. {Action 1}
2. {Action 2}

Preventive Measures:
1. {Measure 1}
2. {Measure 2}

Rescheduled Deployment:
- Date: {NewDate}
- Prerequisites: {List}

Prepared By: {Name}
Approved By: {Name}
Date: {Date}
```

---

#### Step 6: Communication

**Notify Stakeholders**:

1. **Store Manager**: Immediate phone call
2. **Deployment Team**: Email within 1 hour
3. **Backend Team**: Slack/email immediately
4. **Project Manager**: Email with incident report
5. **Other Stores**: If rollback affects planned deployments

**Communication Template**:

```
Subject: [URGENT] Rollback - Store {StoreName} Cashier App

Date: {Date}
Time: {Time}

We have rolled back the cashier application deployment at Store {StoreName} due to {brief reason}.

Status: Rollback complete. Store operations resumed.

Impact:
- Deployment: Rolled back
- Store Operations: Minimal disruption
- Customer Experience: No impact
- Data Integrity: {OK/Under Review}

Next Steps:
1. Root cause analysis (ETA: {Date})
2. Fix implementation (ETA: {Date})
3. Rescheduled deployment (ETA: {Date})

For questions, contact:
- Deployment Lead: {Name} - {Phone}
- Technical Support: {Name} - {Phone}

Incident Report: {Link}
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: App Won't Launch

**Symptoms**: Double-click shortcut, nothing happens

**Diagnosis**:
```bash
# 1. Check if process is running
tasklist | findstr "Касса"

# 2. Check error logs
notepad "%APPDATA%\Касса {StoreName}\logs\error.log"

# 3. Check Windows Event Viewer
eventvwr.msc
# Application logs for errors
```

**Solutions**:
- If process running but not visible: Kill and restart
- If antivirus blocking: Add exception for app
- If missing dependencies: Reinstall .NET Framework or Visual C++ Redistributables
- If .env file missing: Restore from backup or installer

---

#### Issue 2: Cannot Connect to Backend

**Symptoms**: "Ошибка сети. Проверьте подключение к серверу."

**Diagnosis**:
```bash
# 1. Test network connectivity
ping 192.168.0.100

# 2. Test backend API
curl http://192.168.0.100:3000/api/health

# 3. Check firewall
# Windows Firewall > Allow app through firewall
# Verify "Касса {StoreName}" is allowed

# 4. Check .env configuration
notepad "C:\Program Files\Касса {StoreName}\.env"
# Verify BACKEND_URL
```

**Solutions**:
- If ping fails: Network issue, contact IT
- If API fails: Backend down, contact Backend Engineer
- If firewall blocking: Add exception
- If wrong URL: Correct .env and restart app

---

#### Issue 3: 1C Auto-Fetch Not Working

**Symptoms**: "Не удалось загрузить сумму из 1С. Введите вручную."

**Diagnosis**:
```bash
# 1. Test 1C connectivity
ping 192.168.X.10

# 2. Test 1C API
curl http://192.168.X.10:8080/odata/standard.odata/

# 3. Check 1C credentials
notepad "C:\Program Files\Касса {StoreName}\.env"
# Verify ONEC_BASE_URL, ONEC_USERNAME, ONEC_PASSWORD

# 4. Check 1C logs
# (1C administrator assistance required)
```

**Solutions**:
- If 1C unreachable: Contact 1C administrator
- If credentials wrong: Update .env and restart
- If timeout too short: Increase ONEC_TIMEOUT in .env
- If integration not ready: Set ONEC_MOCK=true as workaround

---

#### Issue 4: Window Positioning Wrong

**Symptoms**: Window not in bottom-left corner or wrong size

**Diagnosis**:
```bash
# 1. Check screen resolution
wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution

# 2. Check if multi-monitor setup
wmic path Win32_DesktopMonitor get ScreenHeight,ScreenWidth

# 3. Review electron.js window settings
# (Requires access to app source code)
```

**Solutions**:
- If screen resolution <1920x1080: Upgrade monitor or adjust expectations
- If multi-monitor: Ensure primary monitor is correct
- If window off-screen: Close app, delete app data, relaunch
- If code issue: Report bug, request fix in next release

---

#### Issue 5: QR Scanner Not Working

**Symptoms**: Scanning QR code produces no input

**Diagnosis**:
```bash
# 1. Test scanner in Notepad
# Open Notepad, scan QR, verify text appears

# 2. Check scanner mode
# Ensure scanner is in keyboard emulation mode (not serial/USB HID)

# 3. Check QR input field focus
# Ensure field is focused (cursor blinking)

# 4. Test manual input
# Type QR code manually to rule out scanner issue
```

**Solutions**:
- If scanner works in Notepad but not in app: Focus issue, click QR field
- If scanner not in keyboard mode: Reconfigure scanner (consult scanner manual)
- If scanner faulty: Replace scanner hardware
- If QR format wrong: Verify QR code format matches expected

---

#### Issue 6: Transactions Fail with Database Error

**Symptoms**: "Произошла ошибка. Попробуйте снова." after transaction

**Diagnosis**:
```bash
# On backend server:

# 1. Check database file permissions
ls -l /opt/loyalty-backend/data/app.db

# 2. Check database locks
fuser /opt/loyalty-backend/data/app.db

# 3. Test database query
sqlite3 /opt/loyalty-backend/data/app.db "SELECT COUNT(*) FROM loyalty_users;"

# 4. Check backend logs
tail -f /var/log/loyalty-backend/app.log | grep "DATABASE"
```

**Solutions**:
- If permissions wrong: Fix with `chmod 660 app.db`
- If database locked: Identify and kill locking process
- If database corrupted: Restore from backup
- If backend error: Restart backend service

---

#### Issue 7: Hotkeys Not Responding

**Symptoms**: Pressing F2/F3/Esc does nothing

**Diagnosis**:
```bash
# 1. Check if app has focus
# Click on app window to give focus

# 2. Test in browser (development mode)
# F12 DevTools > Console > Check for key event listeners

# 3. Check keyboard
# Test F2/F3/Esc in other applications

# 4. Check for conflicting software
# Some apps (e.g., game overlays) intercept function keys
```

**Solutions**:
- If app not focused: Click app window
- If keyboard issue: Replace keyboard or use alternative keys
- If conflicting software: Close or configure to ignore F2/F3/Esc
- If code issue: Report bug, use mouse buttons as workaround

---

### Escalation Procedures

#### Level 1: On-Site Technician (0-30 minutes)

**Handles**:
- Installation issues
- Basic configuration
- Network connectivity
- Smoke test failures

**Escalate to Level 2 if**:
- Issue persists after 30 minutes
- Issue affects backend or database
- Issue is security-related

---

#### Level 2: Remote Technical Support (30 minutes - 2 hours)

**Handles**:
- Complex configuration issues
- Backend connectivity problems
- Database query issues
- Performance problems

**Escalate to Level 3 if**:
- Issue requires code changes
- Issue affects multiple stores
- Issue is critical (P0)

---

#### Level 3: Development Team (2+ hours)

**Handles**:
- Code bugs
- Architecture issues
- Critical security vulnerabilities
- Data corruption

**Escalate to Project Manager if**:
- Issue requires emergency patch
- Issue affects production rollout
- Issue requires management decision (e.g., rollback)

---

### Contact Information

| Role | Name | Phone | Email | Hours |
|------|------|-------|-------|-------|
| Deployment Lead | ___________ | ___________ | ___________ | 24/7 |
| Technical Support | ___________ | ___________ | ___________ | 8am-8pm |
| Backend Engineer | ___________ | ___________ | ___________ | 9am-6pm |
| Database Admin | ___________ | ___________ | ___________ | On-call |
| Security Team | ___________ | ___________ | ___________ | On-call |
| Project Manager | ___________ | ___________ | ___________ | 9am-6pm |

**Emergency Hotline**: ___________ (24/7)

---

## Post-Deployment Checklist

### Deployment Summary

| Store | Status | Date | Duration | Issues | Sign-Off |
|-------|--------|------|----------|--------|----------|
| 1 (Алмаз) | ☐ Complete ☐ Rolled Back | ____ | ____ | ____ | _______ |
| 2 (Изумруд) | ☐ Complete ☐ Rolled Back | ____ | ____ | ____ | _______ |
| 3 (Сапфир) | ☐ Complete ☐ Rolled Back | ____ | ____ | ____ | _______ |
| 4 (Рубин) | ☐ Complete ☐ Rolled Back | ____ | ____ | ____ | _______ |
| 5 (Топаз) | ☐ Complete ☐ Rolled Back | ____ | ____ | ____ | _______ |
| 6 (Янтарь) | ☐ Complete ☐ Rolled Back | ____ | ____ | ____ | _______ |

**Overall Status**: ☐ All Stores Deployed ☐ Partial Deployment ☐ Deployment Failed

---

### Lessons Learned

**What Went Well**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**What Could Be Improved**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Action Items for Next Deployment**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Final Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Deployment Lead | | | |
| Technical Lead | | | |
| Project Manager | | | |
| Operations Manager | | | |

---

**End of Deployment Runbook**
