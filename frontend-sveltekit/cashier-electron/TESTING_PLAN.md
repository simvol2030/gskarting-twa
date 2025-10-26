# E2E Testing Plan - Desktop Cashier Application

**Version**: 1.0.0
**Date**: 2025-10-24
**Status**: Stage 7 - Testing & Deployment
**Application**: Electron Desktop Cashier for Loyalty System

---

## Table of Contents

1. [Overview](#overview)
2. [Test Objectives](#test-objectives)
3. [Test Scope](#test-scope)
4. [Test Categories](#test-categories)
5. [Test Environment](#test-environment)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Test Scenarios](#test-scenarios)

---

## Overview

This document defines the comprehensive end-to-end testing strategy for the desktop cashier application deployed across 6 physical store locations. The application integrates with:
- Backend API (Express.js on port 3000)
- 1C ERP system (OData integration)
- SQLite database (loyalty_users, stores, transactions, cashier_transactions)
- Telegram Mini App (shared customer data)

---

## Test Objectives

1. **Functional Correctness**: All features work as designed
2. **Integration Reliability**: Backend API and 1C connectivity are stable
3. **User Experience**: Cashiers can complete transactions in <30 seconds
4. **Security**: No unauthorized access, data validation enforced
5. **Performance**: App responds within acceptable time limits
6. **Multi-Store Isolation**: Each store operates independently with correct data

---

## Test Scope

### In Scope

- Customer identification (QR code scan, card number search)
- Transaction workflows (earn points, redeem points)
- 1C integration (auto-fetch transaction amounts, fallback to manual input)
- Electron window behavior (position, size, always-on-top)
- Hotkey functionality (F2, F3, Esc)
- Backend API connectivity
- Database transactions (earn/redeem)
- Multi-store configuration (6 stores)
- Error handling and recovery
- Network failure scenarios
- UI/UX validation

### Out of Scope

- Backend API development testing (already tested separately)
- Database performance tuning
- 1C ERP system testing (external dependency)
- Telegram Mini App testing
- Automated UI test scripts (manual testing only)

---

## Test Categories

### 1. Functional Testing

**Priority**: Critical
**Tester**: QA Team + Store Manager
**Duration**: 4-6 hours per store

#### Test Areas:
- Customer identification (QR code, card number)
- Transaction processing (earn, redeem)
- Balance calculation and updates
- Success/error message display
- Transaction history logging
- Reset functionality

### 2. Integration Testing

**Priority**: Critical
**Tester**: Technical Team
**Duration**: 2-3 hours

#### Test Areas:
- Backend API connectivity (POST /api/cashier/earn, /api/cashier/redeem)
- 1C OData integration (getCurrentTransactionAmount)
- Database transactions (ACID properties)
- Store ID validation
- Multi-store data isolation

### 3. UI/UX Testing

**Priority**: High
**Tester**: Cashiers + UX Reviewer
**Duration**: 2-3 hours

#### Test Areas:
- Window positioning (bottom-left, 1/3 screen)
- Always-on-top behavior
- Cannot move/resize window
- Hotkey responsiveness (F2, F3, Esc)
- Loading states
- Error states
- Success animations
- Responsive design (1920x1080 minimum)

### 4. Performance Testing

**Priority**: High
**Tester**: Technical Team
**Duration**: 1-2 hours

#### Test Areas:
- App launch time (<3 seconds)
- QR scan response time (<500ms)
- API call latency (<1 second)
- Memory usage (<500MB)
- CPU usage (<10% idle, <30% active)

### 5. Security Testing

**Priority**: Critical
**Tester**: Security Reviewer
**Duration**: 2-3 hours

#### Test Areas:
- HTTPS backend connectivity (if enabled)
- Environment variable encryption
- Input validation (SQL injection, XSS)
- Session management
- Store ID authorization (prevent cross-store access)

### 6. Compatibility Testing

**Priority**: Medium
**Tester**: Technical Team
**Duration**: 2-3 hours

#### Test Areas:
- Windows 10 (64-bit)
- Windows 11 (64-bit)
- Different screen resolutions (1920x1080, 2560x1440, 3840x2160)
- Multi-monitor setups
- Barcode scanners (keyboard emulation)

---

## Test Environment

### Hardware Requirements

- **CPU**: Intel Core i3 or equivalent (minimum)
- **RAM**: 4GB (minimum), 8GB (recommended)
- **Screen**: 1920x1080 (minimum resolution)
- **Network**: 100 Mbps LAN connection
- **Barcode Scanner**: USB or PS/2 keyboard emulation scanner

### Software Requirements

- **OS**: Windows 10/11 (64-bit)
- **Backend API**: Running on http://192.168.0.100:3000
- **1C Server**: Running on store-specific IP (e.g., http://192.168.1.10:8080)
- **Database**: SQLite at backend location

### Network Requirements

- **Backend Connectivity**: TCP port 3000 accessible
- **1C Connectivity**: TCP port 8080 accessible (store-specific)
- **Internet**: Not required (local network only)

### Test Data

- **Test Customers**: 3+ loyalty users with varying balances (low, medium, high)
- **Test Store**: Store ID configured correctly in .env
- **Test Transactions**: Mix of earn and redeem scenarios

---

## Acceptance Criteria

### Critical (Must Pass)

1. ✅ Customer QR code scan succeeds in <500ms
2. ✅ Earn points transaction completes successfully
3. ✅ Redeem points transaction completes with balance validation
4. ✅ Backend API connectivity is stable (99%+ uptime during test)
5. ✅ Window positioning is correct (bottom-left, 1/3 screen)
6. ✅ Always-on-top behavior works consistently
7. ✅ F2 hotkey activates earn mode
8. ✅ F3 hotkey activates redeem mode
9. ✅ Esc hotkey resets transaction
10. ✅ Incorrect QR codes display error messages
11. ✅ Insufficient balance prevents redemption
12. ✅ Multi-store isolation: Store 1 cannot access Store 2 data

### High Priority (Should Pass)

1. ⚠️ 1C auto-fetch works OR fallback to manual input succeeds
2. ⚠️ App launch time <3 seconds
3. ⚠️ Memory usage <500MB
4. ⚠️ Card number search works correctly
5. ⚠️ Success messages display for 2 seconds
6. ⚠️ Transaction history is logged to database

### Medium Priority (Nice to Have)

1. 🔵 Multi-monitor support works
2. 🔵 Different screen resolutions work
3. 🔵 Barcode scanner input works without configuration

---

## Test Scenarios

### Scenario Group 1: Customer Identification

#### TC-001: Valid QR Code Scan

**Priority**: Critical
**Prerequisites**: App launched, no customer selected

**Steps**:
1. Focus on QR input field (should be auto-focused)
2. Scan valid customer QR code (e.g., loyalty user ID 1)
3. Observe customer information display

**Expected Result**:
- Customer name appears: "Иван Петров"
- Current balance displays: "1500 ₽"
- QR input field clears automatically
- No error messages displayed

**Pass Criteria**: Customer selected within 500ms of scan

---

#### TC-002: Invalid QR Code Scan

**Priority**: Critical
**Prerequisites**: App launched, no customer selected

**Steps**:
1. Focus on QR input field
2. Enter invalid QR data: "INVALID_CODE_123"
3. Wait for auto-scan (300ms debounce)

**Expected Result**:
- Alert displays: "Покупатель не найден. Проверьте QR-код."
- QR input field clears
- No customer selected

**Pass Criteria**: Error message appears immediately, field clears

---

#### TC-003: Card Number Search

**Priority**: High
**Prerequisites**: App launched, no customer selected

**Steps**:
1. Enter customer card number: "1234 5678 9012" (format with spaces)
2. Click "Поиск по карте" button
3. Observe customer information display

**Expected Result**:
- Customer data loads if card exists
- Balance displays correctly
- Search field clears

**Pass Criteria**: Search completes within 200ms

---

#### TC-004: Malformed JSON QR Code

**Priority**: High
**Prerequisites**: App launched, no customer selected

**Steps**:
1. Scan QR with malformed JSON: `{"userId":1,invalid}`
2. Observe error handling

**Expected Result**:
- Alert displays: "Ошибка QR-кода: [error message]"
- QR input field clears
- No customer selected

**Pass Criteria**: Graceful error handling, no app crash

---

### Scenario Group 2: Earn Points Workflow

#### TC-010: Earn Points - Manual Amount

**Priority**: Critical
**Prerequisites**: Customer selected (ID: 1, Balance: 1500)

**Steps**:
1. Press F2 key (or click "Начислить бонусы" button)
2. Enter purchase amount: "1000" (1000 roubles)
3. Observe calculated earn amount: 40 points (4% of 1000)
4. Press F2 again to confirm
5. Wait for API response

**Expected Result**:
- Success message: "✅ Начислено 40 бонусов"
- New balance: 1540 (1500 + 40)
- Transaction resets after 2 seconds
- Database record created:
  - cashier_transactions: type='earn', points_amount=40, purchase_amount=1000
  - transactions: type='earn', amount=40
  - loyalty_users: current_balance=1540, total_purchases=+1

**Pass Criteria**: Transaction completes in <1 second

---

#### TC-011: Earn Points - 1C Auto-Fetch Amount

**Priority**: High
**Prerequisites**: Customer selected, 1C integration enabled

**Steps**:
1. Press F2 key
2. Observe auto-fetch indicator: "Загрузка суммы из 1С..."
3. Wait for 1C API response
4. Verify purchase amount auto-populated
5. Press F2 again to confirm

**Expected Result**:
- Purchase amount fetched from 1C (e.g., 2500)
- Earn amount calculated: 100 points (4% of 2500)
- Success message appears
- New balance updated correctly

**Pass Criteria**: 1C fetch completes in <3 seconds OR fallback to manual input

---

#### TC-012: Earn Points - Zero Amount

**Priority**: High
**Prerequisites**: Customer selected

**Steps**:
1. Press F2 key
2. Leave purchase amount empty or enter "0"
3. Press F2 again to confirm

**Expected Result**:
- Alert displays: "Введите сумму покупки"
- No API call made
- Transaction not created

**Pass Criteria**: Validation prevents invalid transaction

---

#### TC-013: Earn Points - Negative Amount

**Priority**: High
**Prerequisites**: Customer selected

**Steps**:
1. Press F2 key
2. Enter purchase amount: "-500"
3. Press F2 again to confirm

**Expected Result**:
- Alert displays: "Введите сумму покупки" or "Сумма должна быть положительной"
- No API call made
- Transaction not created

**Pass Criteria**: Validation prevents invalid transaction

---

#### TC-014: Earn Points - Very Large Amount

**Priority**: Medium
**Prerequisites**: Customer selected

**Steps**:
1. Press F2 key
2. Enter purchase amount: "999999999"
3. Press F2 again to confirm

**Expected Result**:
- Either succeeds with large points earned
- Or displays validation error if amount exceeds limit
- No app crash

**Pass Criteria**: App handles edge case gracefully

---

### Scenario Group 3: Redeem Points Workflow

#### TC-020: Redeem Points - Valid Amount

**Priority**: Critical
**Prerequisites**: Customer selected (ID: 1, Balance: 1500)

**Steps**:
1. Press F3 key (or click "Списать бонусы" button)
2. Enter purchase amount: "1000"
3. Observe calculated redeem amount: 200 points (20% max of 1000)
4. Observe available balance: 1500 (sufficient)
5. Press F3 again to confirm
6. Wait for API response

**Expected Result**:
- Success message: "✅ Списано 200 бонусов. Скидка: 200 ₽"
- New balance: 1300 (1500 - 200)
- Final amount: 800 (1000 - 200 discount)
- Transaction resets after 2 seconds
- Database record created:
  - cashier_transactions: type='redeem', points_amount=200, discount_amount=200
  - transactions: type='spend', amount=200
  - loyalty_users: current_balance=1300, total_saved=+200

**Pass Criteria**: Transaction completes in <1 second

---

#### TC-021: Redeem Points - Insufficient Balance

**Priority**: Critical
**Prerequisites**: Customer selected (ID: 3, Balance: 50)

**Steps**:
1. Press F3 key
2. Enter purchase amount: "1000"
3. Observe calculated redeem amount: 200 points (20% max)
4. Observe available balance: 50 (insufficient)
5. Press F3 again to confirm

**Expected Result**:
- Alert displays: "Списание невозможно (недостаточно бонусов или сумма покупки слишком мала)"
- No API call made
- Balance unchanged

**Pass Criteria**: Validation prevents overdraft

---

#### TC-022: Redeem Points - Exact Balance

**Priority**: High
**Prerequisites**: Customer selected (ID: 2, Balance: 100)

**Steps**:
1. Press F3 key
2. Enter purchase amount: "500"
3. Observe calculated redeem amount: 100 points (min of 20% of 500 and balance)
4. Press F3 again to confirm

**Expected Result**:
- Success message: "✅ Списано 100 бонусов. Скидка: 100 ₽"
- New balance: 0
- Final amount: 400 (500 - 100)

**Pass Criteria**: Customer can redeem entire balance

---

#### TC-023: Redeem Points - Small Purchase (Below 20% Threshold)

**Priority**: High
**Prerequisites**: Customer selected (Balance: 1500)

**Steps**:
1. Press F3 key
2. Enter purchase amount: "100"
3. Observe calculated redeem amount: 20 points (20% of 100)
4. Observe available balance: 1500 (sufficient)
5. Press F3 again to confirm

**Expected Result**:
- Success message: "✅ Списано 20 бонусов. Скидка: 20 ₽"
- New balance: 1480
- Final amount: 80

**Pass Criteria**: 20% max discount rule enforced

---

#### TC-024: Redeem Points - Zero Amount

**Priority**: High
**Prerequisites**: Customer selected

**Steps**:
1. Press F3 key
2. Leave purchase amount empty
3. Press F3 again to confirm

**Expected Result**:
- Alert displays: "Введите сумму покупки"
- No API call made

**Pass Criteria**: Validation prevents invalid transaction

---

### Scenario Group 4: Hotkey Functionality

#### TC-030: F2 Hotkey - Earn Mode Activation

**Priority**: Critical
**Prerequisites**: Customer selected, purchase amount entered

**Steps**:
1. Press F2 key (keyboard hotkey)
2. Observe UI changes

**Expected Result**:
- Earn mode activated
- "Начислить бонусы" button highlights or activates
- Earn amount calculation displays

**Pass Criteria**: Hotkey responds within 100ms

---

#### TC-031: F3 Hotkey - Redeem Mode Activation

**Priority**: Critical
**Prerequisites**: Customer selected, purchase amount entered

**Steps**:
1. Press F3 key (keyboard hotkey)
2. Observe UI changes

**Expected Result**:
- Redeem mode activated
- "Списать бонусы" button highlights or activates
- Redeem amount calculation displays

**Pass Criteria**: Hotkey responds within 100ms

---

#### TC-032: Esc Hotkey - Reset Transaction

**Priority**: Critical
**Prerequisites**: Customer selected, purchase amount entered, success message displayed

**Steps**:
1. Press Esc key (keyboard hotkey)
2. Observe UI reset

**Expected Result**:
- Customer selection cleared
- Purchase amount cleared
- Success message hidden
- QR input field focused
- App returns to initial state

**Pass Criteria**: Reset completes within 200ms

---

#### TC-033: Hotkey - While Processing Transaction

**Priority**: Medium
**Prerequisites**: Transaction in progress (isProcessing=true)

**Steps**:
1. Start earn/redeem transaction
2. Press F2, F3, or Esc while API call is pending

**Expected Result**:
- Hotkeys ignored during processing
- Or UI displays "Обработка..." message
- No duplicate transactions

**Pass Criteria**: No race conditions or duplicate API calls

---

### Scenario Group 5: 1C Integration

#### TC-040: 1C Auto-Fetch - Success

**Priority**: High
**Prerequisites**: 1C server accessible (ONEC_BASE_URL reachable)

**Steps**:
1. Press F2 to activate earn mode
2. Observe auto-fetch attempt
3. Wait for 1C API response

**Expected Result**:
- Loading indicator displays: "Загрузка суммы из 1С..."
- Purchase amount auto-populated (e.g., 1500)
- Loading indicator disappears
- Amount field becomes read-only or editable based on config

**Pass Criteria**: Fetch completes in <3 seconds

---

#### TC-041: 1C Auto-Fetch - Timeout

**Priority**: High
**Prerequisites**: 1C server slow or unreachable

**Steps**:
1. Press F2 to activate earn mode
2. Observe auto-fetch attempt
3. Wait for timeout (ONEC_TIMEOUT=3000ms)

**Expected Result**:
- Loading indicator displays for 3 seconds
- Error message: "Не удалось загрузить сумму из 1С. Введите вручную."
- Purchase amount field becomes editable
- Cashier can manually input amount

**Pass Criteria**: Graceful fallback to manual input

---

#### TC-042: 1C Auto-Fetch - Invalid Response

**Priority**: Medium
**Prerequisites**: 1C server returns invalid data

**Steps**:
1. Press F2 to activate earn mode
2. 1C returns malformed JSON or missing fields
3. Observe error handling

**Expected Result**:
- Error message: "Ошибка данных из 1С. Введите вручную."
- Purchase amount field editable
- No app crash

**Pass Criteria**: Robust error handling

---

#### TC-043: 1C Mock Mode

**Priority**: High
**Prerequisites**: ONEC_MOCK=true in .env

**Steps**:
1. Press F2 to activate earn mode
2. Observe mock amount populated

**Expected Result**:
- Mock amount appears instantly (e.g., 1500)
- No actual 1C API call made
- Transaction proceeds normally

**Pass Criteria**: Mock mode works for offline testing

---

### Scenario Group 6: UI/UX Behavior

#### TC-050: Window Positioning on Launch

**Priority**: Critical
**Prerequisites**: App not running

**Steps**:
1. Launch application from Start Menu
2. Observe window position and size

**Expected Result**:
- Window appears in bottom-left corner
- Width: 1/3 of screen width
- Height: 1/3 of screen height
- Position: (0, 2/3 screen height from top)
- Always on top of other windows (including 1C)

**Pass Criteria**: Position matches specification exactly

---

#### TC-051: Window Cannot Be Moved

**Priority**: Critical
**Prerequisites**: App running

**Steps**:
1. Attempt to drag window by title bar
2. Try moving to different screen position

**Expected Result**:
- Window does not move
- Cursor may show "not allowed" icon
- Window stays at fixed position

**Pass Criteria**: Window is immovable

---

#### TC-052: Window Cannot Be Resized

**Priority**: Critical
**Prerequisites**: App running

**Steps**:
1. Attempt to resize window by dragging edges/corners
2. Try maximize button (if visible)

**Expected Result**:
- Window size remains fixed
- Resize cursors do not appear on edges
- Maximize button disabled or hidden

**Pass Criteria**: Window is not resizable

---

#### TC-053: Always On Top Behavior

**Priority**: Critical
**Prerequisites**: App running, 1C terminal open

**Steps**:
1. Open 1C terminal application
2. Click on 1C window to bring to front
3. Observe cashier app window

**Expected Result**:
- Cashier app remains visible above 1C window
- Always on top behavior persists
- Can still interact with cashier app

**Pass Criteria**: Window stays above all other applications

---

#### TC-054: Multi-Monitor Support

**Priority**: Medium
**Prerequisites**: Multi-monitor setup

**Steps**:
1. Launch app on primary monitor
2. Move other windows to secondary monitor
3. Observe app behavior

**Expected Result**:
- App positions correctly on primary monitor
- Does not span multiple monitors
- Always on top works across monitors

**Pass Criteria**: Works correctly in multi-monitor setup

---

#### TC-055: QR Input Auto-Focus

**Priority**: High
**Prerequisites**: App launched

**Steps**:
1. Launch application
2. Do not click anywhere
3. Scan QR code or type immediately

**Expected Result**:
- QR input field is auto-focused on launch
- Scanner input goes directly to field
- No need to click field first

**Pass Criteria**: Auto-focus works consistently

---

#### TC-056: Loading State - API Call

**Priority**: Medium
**Prerequisites**: Customer selected, about to submit transaction

**Steps**:
1. Press F2 to earn points
2. Observe UI during API call (1-2 seconds)

**Expected Result**:
- Loading indicator appears (e.g., "Обработка...")
- Buttons become disabled
- No duplicate submissions possible
- Spinner or progress indicator visible

**Pass Criteria**: Loading state prevents user errors

---

#### TC-057: Success Animation

**Priority**: Low
**Prerequisites**: Transaction completed successfully

**Steps**:
1. Complete earn or redeem transaction
2. Observe success message

**Expected Result**:
- Success message displays: "✅ Начислено X бонусов"
- Message visible for 2 seconds
- Then auto-resets to initial state
- Smooth transition

**Pass Criteria**: Success feedback is clear and timely

---

#### TC-058: Error Message Display

**Priority**: High
**Prerequisites**: Invalid transaction attempt

**Steps**:
1. Trigger validation error (e.g., no customer selected)
2. Observe error message

**Expected Result**:
- Alert or error message displays clearly
- Error text is descriptive and actionable
- User can dismiss error
- App remains functional after error

**Pass Criteria**: Error messages are user-friendly

---

### Scenario Group 7: Network Failure Scenarios

#### TC-060: Backend API Offline

**Priority**: Critical
**Prerequisites**: Backend server stopped

**Steps**:
1. Stop backend API (systemctl stop backend or equivalent)
2. Attempt earn/redeem transaction
3. Observe error handling

**Expected Result**:
- Error message: "Ошибка сети. Проверьте подключение к серверу."
- Transaction not completed
- App remains responsive
- User can retry after backend restarts

**Pass Criteria**: Graceful degradation, clear error message

---

#### TC-061: Backend API Slow Response

**Priority**: High
**Prerequisites**: Backend API response delayed (simulate with network throttling)

**Steps**:
1. Simulate slow network (e.g., 5-second delay)
2. Attempt earn/redeem transaction
3. Observe timeout handling

**Expected Result**:
- Loading indicator displays for duration
- Transaction completes if response arrives
- Or timeout error after reasonable duration (e.g., 10 seconds)

**Pass Criteria**: No app freeze, timeout handled gracefully

---

#### TC-062: 1C Server Offline

**Priority**: High
**Prerequisites**: 1C server stopped or unreachable

**Steps**:
1. Stop 1C server or disconnect network to 1C
2. Press F2 to activate earn mode
3. Observe auto-fetch failure

**Expected Result**:
- Error message: "Не удалось загрузить сумму из 1С. Введите вручную."
- Purchase amount field becomes editable
- Transaction can proceed with manual input

**Pass Criteria**: Fallback to manual input works

---

#### TC-063: Database Locked

**Priority**: Medium
**Prerequisites**: Database locked by another process

**Steps**:
1. Simulate database lock (e.g., long-running query)
2. Attempt transaction
3. Observe error handling

**Expected Result**:
- Error message: "Произошла ошибка. Попробуйте снова."
- Transaction not completed
- Database unlocks after timeout
- Retry succeeds

**Pass Criteria**: No data corruption, retry mechanism works

---

### Scenario Group 8: Multi-Store Isolation

#### TC-070: Store ID Validation

**Priority**: Critical
**Prerequisites**: App configured for Store 1 (STORE_ID=1)

**Steps**:
1. Select customer from Store 1
2. Complete transaction
3. Verify database record

**Expected Result**:
- cashier_transactions.store_id = 1
- transactions.store_id = 1
- No cross-contamination with other stores

**Pass Criteria**: Store ID correctly recorded in all tables

---

#### TC-071: Cross-Store Data Access Prevention

**Priority**: Critical
**Prerequisites**: Store 1 and Store 2 apps running simultaneously

**Steps**:
1. Open Store 1 app, select customer ID 1
2. Open Store 2 app, search for same customer ID 1
3. Complete transactions in both stores
4. Verify data isolation

**Expected Result**:
- Each transaction tagged with correct store_id
- Store 1 transactions do not appear in Store 2 queries
- Customer balance updated globally (shared across stores)

**Pass Criteria**: Data isolation maintained, balance synchronized

---

#### TC-072: Store-Specific 1C Connection

**Priority**: High
**Prerequisites**: Store 1 and Store 2 with different ONEC_BASE_URL

**Steps**:
1. Launch Store 1 app (ONEC_BASE_URL=http://192.168.1.10:8080)
2. Launch Store 2 app (ONEC_BASE_URL=http://192.168.2.10:8080)
3. Trigger 1C auto-fetch in both
4. Verify each connects to correct 1C server

**Expected Result**:
- Store 1 connects to 192.168.1.10:8080
- Store 2 connects to 192.168.2.10:8080
- No cross-connection issues

**Pass Criteria**: Each store connects to its own 1C server

---

### Scenario Group 9: Performance Testing

#### TC-080: App Launch Time

**Priority**: High
**Prerequisites**: App closed

**Steps**:
1. Record timestamp
2. Launch app from Start Menu
3. Record timestamp when window appears and is interactive
4. Calculate duration

**Expected Result**:
- Launch time <3 seconds
- Window appears quickly
- UI is immediately responsive

**Pass Criteria**: Launch time ≤ 3 seconds

---

#### TC-081: QR Scan Response Time

**Priority**: High
**Prerequisites**: App running, ready to scan

**Steps**:
1. Record timestamp
2. Scan valid QR code
3. Record timestamp when customer data displays
4. Calculate duration

**Expected Result**:
- Response time <500ms
- Customer data loads instantly
- No perceived lag

**Pass Criteria**: Response time ≤ 500ms

---

#### TC-082: API Call Latency

**Priority**: High
**Prerequisites**: Backend API running on local network

**Steps**:
1. Record timestamp
2. Submit earn/redeem transaction
3. Record timestamp when success message appears
4. Calculate duration

**Expected Result**:
- API latency <1 second
- Success message appears quickly
- No noticeable delay

**Pass Criteria**: API latency ≤ 1 second

---

#### TC-083: Memory Usage - Idle

**Priority**: Medium
**Prerequisites**: App running, no activity

**Steps**:
1. Launch app and wait 5 minutes
2. Open Task Manager
3. Check memory usage for "Касса Лояльность" process

**Expected Result**:
- Memory usage <500MB
- No memory leaks over time
- Stable memory consumption

**Pass Criteria**: Memory ≤ 500MB

---

#### TC-084: Memory Usage - Active

**Priority**: Medium
**Prerequisites**: App running

**Steps**:
1. Perform 50 consecutive transactions (earn/redeem)
2. Check memory usage after each batch of 10
3. Verify no memory leaks

**Expected Result**:
- Memory usage remains <500MB
- No significant increase over time
- Garbage collection working

**Pass Criteria**: Memory stays below 500MB

---

#### TC-085: CPU Usage - Idle

**Priority**: Low
**Prerequisites**: App running, no activity

**Steps**:
1. Launch app and wait 5 minutes
2. Open Task Manager
3. Check CPU usage for app process

**Expected Result**:
- CPU usage <10%
- No unnecessary background processing
- Efficient idle state

**Pass Criteria**: CPU ≤ 10% idle

---

#### TC-086: CPU Usage - Active

**Priority**: Low
**Prerequisites**: App running, performing transactions

**Steps**:
1. Perform rapid transactions (one every 5 seconds)
2. Monitor CPU usage during activity

**Expected Result**:
- CPU usage <30% during transactions
- Returns to idle <10% after activity
- No CPU spikes

**Pass Criteria**: CPU ≤ 30% active

---

### Scenario Group 10: Security Testing

#### TC-090: Input Validation - SQL Injection

**Priority**: Critical
**Prerequisites**: App running

**Steps**:
1. In QR input field, enter: `1'; DROP TABLE loyalty_users; --`
2. Attempt to scan/search
3. Verify no database changes

**Expected Result**:
- Input rejected or sanitized
- No SQL execution
- Database intact
- Error message: "Покупатель не найден"

**Pass Criteria**: SQL injection prevented

---

#### TC-091: Input Validation - XSS Attempt

**Priority**: High
**Prerequisites**: App running

**Steps**:
1. In QR input field, enter: `<script>alert('XSS')</script>`
2. Attempt to scan
3. Verify no script execution

**Expected Result**:
- Input sanitized
- No alert popup
- No code execution
- Error message displayed

**Pass Criteria**: XSS attack prevented

---

#### TC-092: Environment Variable Exposure

**Priority**: High
**Prerequisites**: Installer deployed

**Steps**:
1. Open app installation directory
2. Check if .env file exists
3. Verify sensitive data (ONEC_PASSWORD) is not plain text

**Expected Result**:
- .env file permissions restricted (read-only to app)
- Passwords encrypted or hashed
- Or passwords not stored in .env (retrieved securely)

**Pass Criteria**: No plain text passwords exposed

---

#### TC-093: Store ID Authorization

**Priority**: Critical
**Prerequisites**: Store 1 app running

**Steps**:
1. Intercept API request (using browser DevTools or proxy)
2. Modify storeId in request body to different store (e.g., 2)
3. Submit transaction

**Expected Result**:
- Backend validates store_id matches authorized store
- Or transaction tagged with correct store_id from session
- Unauthorized modification rejected

**Pass Criteria**: Store ID cannot be spoofed

---

### Scenario Group 11: Edge Cases

#### TC-100: Concurrent Transactions - Same Customer

**Priority**: High
**Prerequisites**: Two cashiers with same customer QR code

**Steps**:
1. Cashier 1 scans customer, starts earn transaction
2. Cashier 2 scans same customer simultaneously, starts redeem transaction
3. Both submit at nearly same time
4. Verify data consistency

**Expected Result**:
- Database handles concurrent writes correctly
- Final balance reflects both transactions
- No lost updates
- Transactions logged separately

**Pass Criteria**: ACID properties maintained

---

#### TC-101: Transaction During App Restart

**Priority**: Medium
**Prerequisites**: Transaction in progress

**Steps**:
1. Start earn/redeem transaction
2. Close app while API call is pending
3. Relaunch app
4. Verify transaction state

**Expected Result**:
- Either transaction completes before close
- Or transaction rolls back
- No partial transactions
- Customer balance consistent

**Pass Criteria**: No data corruption

---

#### TC-102: Customer with Zero Balance

**Priority**: Medium
**Prerequisites**: Customer with 0 balance

**Steps**:
1. Select customer with 0 balance
2. Attempt redeem transaction
3. Observe error handling

**Expected Result**:
- Error message: "Списание невозможно (недостаточно бонусов...)"
- Transaction prevented
- Earn transaction still works

**Pass Criteria**: Zero balance handled gracefully

---

#### TC-103: Customer with Very Large Balance

**Priority**: Low
**Prerequisites**: Customer with balance > 1,000,000

**Steps**:
1. Select customer with large balance
2. Perform redeem transaction
3. Verify UI displays correctly

**Expected Result**:
- Balance displays without overflow
- UI formatting correct (e.g., "1,000,000 ₽")
- Transaction processes normally

**Pass Criteria**: Large numbers handled correctly

---

#### TC-104: Rapid Hotkey Presses

**Priority**: Medium
**Prerequisites**: Customer selected

**Steps**:
1. Press F2, F3, Esc rapidly in succession (5 times each)
2. Observe UI stability

**Expected Result**:
- UI updates correctly to last pressed key
- No race conditions
- No app freeze
- State remains consistent

**Pass Criteria**: No crashes or inconsistent state

---

## Test Execution Strategy

### Pre-Testing

1. Prepare test environment (hardware, network, data)
2. Build installers for all 6 stores
3. Install on test machines
4. Verify backend and 1C connectivity
5. Create test data (customers with varying balances)

### Testing Phases

**Phase 1: Critical Path (2 hours)**
- Run all Critical priority tests
- Focus on happy path scenarios
- Must pass 100% to proceed

**Phase 2: Integration (1 hour)**
- Run all integration tests
- Verify backend/1C connectivity
- Test multi-store isolation

**Phase 3: Comprehensive (3 hours)**
- Run High and Medium priority tests
- Cover edge cases and error scenarios
- Performance testing

**Phase 4: User Acceptance (1 hour per store)**
- Train cashiers
- Observe real workflow
- Gather feedback

### Post-Testing

1. Document all bugs and issues
2. Prioritize fixes (Critical → High → Medium → Low)
3. Retest failed scenarios after fixes
4. Sign-off from store managers
5. Proceed to production deployment

---

## Bug Severity Levels

### Critical (P0)
- App crashes
- Data corruption
- Security vulnerabilities
- Cannot complete basic transactions

**Action**: Fix immediately, block deployment

### High (P1)
- Feature not working as designed
- Performance issues
- Poor error handling

**Action**: Fix before deployment

### Medium (P2)
- UI/UX issues
- Non-critical errors
- Minor performance degradation

**Action**: Fix in next release

### Low (P3)
- Cosmetic issues
- Nice-to-have features
- Documentation errors

**Action**: Backlog

---

## Test Metrics

Track the following metrics:

1. **Test Coverage**: % of test cases executed
2. **Pass Rate**: % of tests passed
3. **Defect Density**: # bugs per test category
4. **Critical Defects**: # of P0/P1 bugs found
5. **Performance Metrics**: Average latency, memory, CPU
6. **User Satisfaction**: Cashier feedback score (1-5)

**Target Goals**:
- Test Coverage: 100% of Critical tests
- Pass Rate: ≥95% for Critical tests
- Critical Defects: 0 before deployment
- User Satisfaction: ≥4.0/5.0

---

## Test Sign-Off

**QA Team Lead**: ___________________ Date: ___________
**Technical Lead**: ___________________ Date: ___________
**Store Manager**: ___________________ Date: ___________
**Project Manager**: ___________________ Date: ___________

---

**End of Testing Plan**
