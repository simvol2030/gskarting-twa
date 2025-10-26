# Test Execution Checklist - Desktop Cashier Application

**Version**: 1.0.0
**Date**: 2025-10-24
**Application**: Electron Desktop Cashier for Loyalty System
**Store**: _______________ (Fill in store name)
**Store ID**: _______________ (Fill in: 1-6)
**Tester**: _______________ (Fill in name)
**Test Date**: _______________ (Fill in date)

---

## Instructions

1. **Before Testing**: Complete Pre-Deployment Checklist
2. **During Testing**: Mark each test as ✅ Pass, ❌ Fail, or ⚠️ Partial
3. **After Testing**: Complete Post-Deployment Checklist and sign off
4. **Bug Reporting**: Document all failures in Notes column with bug ID

**Pass Criteria**: All Critical tests must pass. ≥95% of High priority tests must pass.

---

## Pre-Deployment Checklist

### Environment Setup

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Backend API accessible at http://192.168.0.100:3000 | ☐ | Response: ___ |
| 2 | Backend /api/health endpoint responds | ☐ | Status: ___ |
| 3 | 1C Server accessible at store-specific URL | ☐ | URL: ___ |
| 4 | Database migration 002_loyalty_system.sql applied | ☐ | Version: ___ |
| 5 | Test data seeded (3+ loyalty users) | ☐ | User IDs: ___ |
| 6 | .env file configured for this store | ☐ | STORE_ID: ___ |
| 7 | Installer built for this store | ☐ | File: ___ |
| 8 | Test workstation meets requirements | ☐ | OS/RAM/Screen: ___ |
| 9 | Barcode scanner connected (if applicable) | ☐ | Model: ___ |
| 10 | Network connectivity verified | ☐ | Ping test: ___ |

**Sign-Off**: _________________ Date: _________

---

## Critical Tests (Must Pass 100%)

### Customer Identification

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-001 | Valid QR code scan (<500ms) | ☐ | | |
| TC-002 | Invalid QR code shows error | ☐ | | |
| TC-004 | Malformed JSON QR handled | ☐ | | |

### Earn Points Workflow

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-010 | Earn points - manual amount | ☐ | | |
| TC-012 | Earn points - zero amount rejected | ☐ | | |
| TC-013 | Earn points - negative amount rejected | ☐ | | |

### Redeem Points Workflow

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-020 | Redeem points - valid amount | ☐ | | |
| TC-021 | Insufficient balance prevented | ☐ | | |
| TC-024 | Redeem points - zero amount rejected | ☐ | | |

### Hotkey Functionality

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-030 | F2 key activates earn mode | ☐ | | |
| TC-031 | F3 key activates redeem mode | ☐ | | |
| TC-032 | Esc key resets transaction | ☐ | | |

### UI/UX Behavior

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-050 | Window positioned bottom-left | ☐ | Position: ___ | |
| TC-051 | Window cannot be moved | ☐ | | |
| TC-052 | Window cannot be resized | ☐ | Size: ___ | |
| TC-053 | Always on top behavior works | ☐ | | |
| TC-055 | QR input auto-focused on launch | ☐ | | |

### Multi-Store Isolation

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-070 | Store ID validated correctly | ☐ | Recorded ID: ___ | |

### Security

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-090 | SQL injection prevented | ☐ | | |
| TC-093 | Store ID cannot be spoofed | ☐ | | |

**Critical Tests Summary**:
- Total Tests: 19
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- **Result**: ☐ PASS (100% required) ☐ FAIL

---

## High Priority Tests (≥95% Pass Rate Required)

### Customer Identification

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-003 | Card number search works | ☐ | Duration: ___ | |

### Earn Points Workflow

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-011 | 1C auto-fetch amount works | ☐ | Fetched: ___ | |

### Redeem Points Workflow

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-022 | Redeem exact balance | ☐ | Final balance: ___ | |
| TC-023 | 20% max discount enforced | ☐ | | |

### 1C Integration

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-040 | 1C auto-fetch success (<3s) | ☐ | Duration: ___ | |
| TC-041 | 1C timeout fallback works | ☐ | | |
| TC-043 | 1C mock mode works | ☐ | | |

### UI/UX Behavior

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-058 | Error messages user-friendly | ☐ | | |

### Network Failure Scenarios

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-060 | Backend offline error handled | ☐ | | |
| TC-061 | Slow response timeout handled | ☐ | Timeout: ___ | |
| TC-062 | 1C offline fallback works | ☐ | | |

### Multi-Store Isolation

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-071 | Cross-store access prevented | ☐ | | |
| TC-072 | Store-specific 1C connection | ☐ | Connected to: ___ | |

### Performance

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-080 | App launch time <3s | ☐ | Actual: ___ | |
| TC-081 | QR scan response <500ms | ☐ | Actual: ___ | |
| TC-082 | API latency <1s | ☐ | Actual: ___ | |

### Security

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-091 | XSS attack prevented | ☐ | | |
| TC-092 | Environment vars secured | ☐ | | |

**High Priority Tests Summary**:
- Total Tests: 17
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- **Result**: ☐ PASS (≥95% required) ☐ FAIL

---

## Medium Priority Tests (≥80% Pass Rate Recommended)

### Earn Points Workflow

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-014 | Very large amount handled | ☐ | | |

### Hotkey Functionality

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-033 | Hotkeys during processing | ☐ | | |

### 1C Integration

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-042 | Invalid 1C response handled | ☐ | | |

### UI/UX Behavior

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-054 | Multi-monitor support | ☐ | Monitors: ___ | |
| TC-056 | Loading state prevents errors | ☐ | | |

### Network Failure Scenarios

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-063 | Database locked handled | ☐ | | |

### Performance

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-083 | Memory usage <500MB (idle) | ☐ | Actual: ___ | |
| TC-084 | Memory usage <500MB (active) | ☐ | Actual: ___ | |

### Edge Cases

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-100 | Concurrent transactions handled | ☐ | | |
| TC-101 | Transaction during restart | ☐ | | |
| TC-102 | Zero balance handled | ☐ | | |
| TC-104 | Rapid hotkey presses stable | ☐ | | |

**Medium Priority Tests Summary**:
- Total Tests: 12
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- **Result**: ☐ PASS (≥80% recommended) ☐ ACCEPTABLE

---

## Low Priority Tests (Optional)

### UI/UX Behavior

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-057 | Success animation smooth | ☐ | | |

### Performance

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-085 | CPU usage <10% (idle) | ☐ | Actual: ___ | |
| TC-086 | CPU usage <30% (active) | ☐ | Actual: ___ | |

### Edge Cases

| Test ID | Description | Pass/Fail | Actual Result | Notes |
|---------|-------------|-----------|---------------|-------|
| TC-103 | Large balance displayed correctly | ☐ | | |

**Low Priority Tests Summary**:
- Total Tests: 4
- Passed: ___
- Failed: ___
- Pass Rate: ___%

---

## User Acceptance Testing (UAT)

### Cashier Workflow Testing

| # | Scenario | Pass/Fail | Duration | Notes |
|---|----------|-----------|----------|-------|
| 1 | Complete 5 consecutive earn transactions | ☐ | ___ min | |
| 2 | Complete 5 consecutive redeem transactions | ☐ | ___ min | |
| 3 | Handle 3 invalid QR codes | ☐ | ___ min | |
| 4 | Use only F2/F3/Esc hotkeys (no mouse) | ☐ | ___ min | |
| 5 | Recover from network error | ☐ | ___ min | |
| 6 | Work alongside 1C terminal for 30 minutes | ☐ | ___ min | |

### Cashier Feedback

| Question | Rating (1-5) | Comments |
|----------|-------------|----------|
| Is the window position convenient? | ☐ 1 ☐ 2 ☐ 3 ☐ 4 ☐ 5 | |
| Are hotkeys easy to remember? | ☐ 1 ☐ 2 ☐ 3 ☐ 4 ☐ 5 | |
| Is the QR scanning fast enough? | ☐ 1 ☐ 2 ☐ 3 ☐ 4 ☐ 5 | |
| Are error messages helpful? | ☐ 1 ☐ 2 ☐ 3 ☐ 4 ☐ 5 | |
| Is the app easy to use? | ☐ 1 ☐ 2 ☐ 3 ☐ 4 ☐ 5 | |
| Would you use this app daily? | ☐ Yes ☐ No | |

**Average Rating**: ___ / 5.0

**Overall Feedback**: _______________________________________________
___________________________________________________________________
___________________________________________________________________

---

## Post-Deployment Checklist

### Installation Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Installer runs without errors | ☐ | |
| 2 | Desktop shortcut created | ☐ | |
| 3 | Start Menu entry created | ☐ | Location: ___ |
| 4 | .env file present in install directory | ☐ | Path: ___ |
| 5 | STORE_ID correct in .env | ☐ | Value: ___ |
| 6 | App launches on double-click | ☐ | |
| 7 | App appears in Task Manager | ☐ | Process name: ___ |
| 8 | Auto-start configured (if required) | ☐ | |

### Connectivity Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Backend API health check succeeds | ☐ | URL: ___ |
| 2 | First transaction completes successfully | ☐ | TX ID: ___ |
| 3 | Database record created | ☐ | Record ID: ___ |
| 4 | 1C integration works or fallback available | ☐ | Mode: ___ |
| 5 | Store ID correctly recorded in transactions | ☐ | Store: ___ |

### Training Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Cashier trained on QR scanning | ☐ | Trainer: ___ |
| 2 | Cashier trained on F2/F3/Esc hotkeys | ☐ | Trainer: ___ |
| 3 | Cashier trained on error recovery | ☐ | Trainer: ___ |
| 4 | Quick reference guide provided | ☐ | Location: ___ |
| 5 | Support contact information shared | ☐ | Contact: ___ |

### Documentation

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Installation notes recorded | ☐ | File: ___ |
| 2 | Configuration settings documented | ☐ | File: ___ |
| 3 | Known issues documented | ☐ | Count: ___ |
| 4 | Workarounds documented | ☐ | |
| 5 | Escalation contacts documented | ☐ | |

**Sign-Off**: _________________ Date: _________

---

## Bug Report Summary

### Critical Bugs (P0)

| Bug ID | Description | Steps to Reproduce | Workaround | Status |
|--------|-------------|-------------------|------------|--------|
| BUG-001 | | | | |
| BUG-002 | | | | |

### High Priority Bugs (P1)

| Bug ID | Description | Steps to Reproduce | Workaround | Status |
|--------|-------------|-------------------|------------|--------|
| BUG-101 | | | | |
| BUG-102 | | | | |

### Medium Priority Bugs (P2)

| Bug ID | Description | Steps to Reproduce | Workaround | Status |
|--------|-------------|-------------------|------------|--------|
| BUG-201 | | | | |
| BUG-202 | | | | |

### Low Priority Bugs (P3)

| Bug ID | Description | Steps to Reproduce | Workaround | Status |
|--------|-------------|-------------------|------------|--------|
| BUG-301 | | | | |
| BUG-302 | | | | |

**Total Bugs**: ___ (P0: ___, P1: ___, P2: ___, P3: ___)

---

## Overall Test Summary

### Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Tests Executed | ___ | 52 | ☐ |
| Critical Tests Passed | ___ / 19 | 100% | ☐ |
| High Priority Tests Passed | ___ / 17 | ≥95% | ☐ |
| Medium Priority Tests Passed | ___ / 12 | ≥80% | ☐ |
| Low Priority Tests Passed | ___ / 4 | N/A | ☐ |
| Critical Bugs Found | ___ | 0 | ☐ |
| High Priority Bugs Found | ___ | ≤2 | ☐ |
| User Satisfaction Score | ___ / 5.0 | ≥4.0 | ☐ |

### Deployment Decision

Based on test results, the deployment decision is:

☐ **APPROVED FOR PRODUCTION**
   - All critical tests passed
   - ≥95% high priority tests passed
   - No critical bugs
   - User satisfaction ≥4.0

☐ **APPROVED WITH CONDITIONS**
   - Minor issues documented
   - Workarounds available
   - Non-blocking bugs will be fixed in next release
   - Conditions: _________________________________

☐ **NOT APPROVED - REQUIRES FIXES**
   - Critical tests failed: ___
   - Critical bugs found: ___
   - Must fix before deployment
   - Re-test required: ☐ Yes ☐ No

### Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Tester | | | |
| Technical Lead | | | |
| Store Manager | | | |
| Project Manager | | | |

---

## Rollback Criteria

If any of the following occur in production, initiate rollback:

1. ☐ App crashes more than 3 times in first hour
2. ☐ More than 10% of transactions fail
3. ☐ Data corruption detected
4. ☐ Security vulnerability discovered
5. ☐ Store operations significantly disrupted
6. ☐ Cashiers unable to complete basic workflows

**Rollback Contact**: _____________________
**Rollback Procedure**: See DEPLOYMENT_RUNBOOK.md Section 5

---

## Monitoring Setup

### First Week Monitoring Checklist

| Day | Tasks | Completed | Notes |
|-----|-------|-----------|-------|
| Day 1 | Check transaction success rate (every hour) | ☐ | |
| Day 1 | Monitor error logs | ☐ | |
| Day 1 | Collect cashier feedback | ☐ | |
| Day 3 | Review transaction volume | ☐ | |
| Day 3 | Check performance metrics | ☐ | |
| Day 7 | Weekly summary report | ☐ | |
| Day 7 | Identify optimization opportunities | ☐ | |

### Key Metrics to Monitor

| Metric | Target | Day 1 | Day 3 | Day 7 |
|--------|--------|-------|-------|-------|
| Transaction Success Rate | ≥99% | ___% | ___% | ___% |
| Average Transaction Time | <30s | ___s | ___s | ___s |
| App Uptime | ≥99.9% | ___% | ___% | ___% |
| Error Rate | <1% | ___% | ___% | ___% |
| User Satisfaction | ≥4.0/5 | ___ | ___ | ___ |

---

## Additional Notes

Use this section for any additional observations, recommendations, or issues:

___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

**Test Execution Complete**: ☐ Yes ☐ No
**Deployment Recommendation**: ☐ Approve ☐ Approve with Conditions ☐ Reject

**Lead QA Tester**: _________________ Date: _________
**Technical Lead**: _________________ Date: _________

---

**End of Test Checklist**
