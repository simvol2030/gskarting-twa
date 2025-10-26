# Monitoring & Metrics Plan - Desktop Cashier Application

**Version**: 1.0.0
**Date**: 2025-10-24
**Application**: Electron Desktop Cashier for Loyalty System
**Deployment**: 6 physical stores

---

## Table of Contents

1. [Overview](#overview)
2. [Monitoring Strategy](#monitoring-strategy)
3. [Key Metrics](#key-metrics)
4. [Logging Strategy](#logging-strategy)
5. [Alert Configuration](#alert-configuration)
6. [Dashboard Design](#dashboard-design)
7. [Incident Response](#incident-response)

---

## Overview

### Monitoring Objectives

1. **Operational Health**: Ensure 99.9% uptime for cashier operations
2. **Performance Tracking**: Monitor transaction speed and system resources
3. **Error Detection**: Identify and alert on issues before they impact customers
4. **Usage Analytics**: Understand transaction patterns and optimize accordingly
5. **Security Monitoring**: Detect and respond to security incidents

### Monitoring Scope

**In Scope**:
- Backend API performance and availability
- Database transaction success rates
- 1C integration health
- Cashier app performance (per store)
- Transaction metrics (volume, success rate, latency)
- Error rates and types
- Security events

**Out of Scope**:
- 1C ERP system internal monitoring (external dependency)
- Network infrastructure monitoring (separate system)
- Telegram Mini App monitoring (separate application)

---

## Monitoring Strategy

### Three-Tier Monitoring Approach

#### Tier 1: Application-Level Monitoring

**What**: Individual cashier app instances (6 stores)
**How**: Application logs, performance counters, crash reports
**Frequency**: Real-time
**Retention**: 30 days

#### Tier 2: Backend API Monitoring

**What**: Express.js REST API, database operations
**How**: Request/response logging, database query performance
**Frequency**: Real-time
**Retention**: 90 days

#### Tier 3: Business Metrics Monitoring

**What**: Transaction volumes, customer engagement, revenue impact
**How**: Aggregated database queries, daily/weekly reports
**Frequency**: Hourly aggregation, daily reports
**Retention**: 1 year

---

## Key Metrics

### 1. Availability Metrics

#### Backend API Uptime

**Metric**: `backend_api_uptime_percentage`
**Definition**: Percentage of time backend API responds to /api/health within 1 second
**Target**: ≥99.9% (max 43 minutes downtime per month)
**Collection Method**: Health check endpoint polling every 30 seconds
**Alert Threshold**: <99.5% over 5-minute window

**Query**:
```sql
SELECT
  (SUM(CASE WHEN response_time_ms < 1000 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS uptime_percentage
FROM health_checks
WHERE timestamp >= datetime('now', '-1 hour');
```

---

#### Cashier App Availability (Per Store)

**Metric**: `cashier_app_uptime_percentage_store_{ID}`
**Definition**: Percentage of time cashier app is running (process active)
**Target**: ≥99.9% during store hours
**Collection Method**: Heartbeat from app every 60 seconds
**Alert Threshold**: No heartbeat for 3 minutes

**Implementation** (app sends heartbeat):
```typescript
// In Electron main process
setInterval(() => {
  fetch(`${BACKEND_URL}/api/monitoring/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      store_id: STORE_ID,
      timestamp: new Date().toISOString(),
      app_version: '1.0.0'
    })
  });
}, 60000); // Every 60 seconds
```

---

### 2. Performance Metrics

#### Transaction API Latency

**Metric**: `transaction_api_latency_ms`
**Definition**: Time from API request to response for earn/redeem transactions
**Target**: p95 <1000ms, p99 <2000ms
**Collection Method**: Log request start/end timestamps
**Alert Threshold**: p95 >2000ms over 5-minute window

**Query**:
```sql
SELECT
  type,
  AVG(latency_ms) AS avg_latency,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99_latency
FROM api_requests
WHERE endpoint IN ('/api/cashier/earn', '/api/cashier/redeem')
  AND timestamp >= datetime('now', '-1 hour')
GROUP BY type;
```

---

#### Database Query Performance

**Metric**: `database_query_time_ms`
**Definition**: Time for database operations (select, insert, update)
**Target**: p95 <100ms, p99 <200ms
**Collection Method**: Log database query durations
**Alert Threshold**: p95 >500ms over 5-minute window

**Implementation** (backend logging):
```typescript
const startTime = Date.now();
const result = await queries.createCashierTransaction(data);
const duration = Date.now() - startTime;

logger.info('database_query', {
  query: 'createCashierTransaction',
  duration_ms: duration,
  store_id: data.store_id
});
```

---

#### QR Scan Response Time

**Metric**: `qr_scan_response_time_ms`
**Definition**: Time from QR scan to customer data display
**Target**: p95 <500ms
**Collection Method**: Client-side timing in app
**Alert Threshold**: p95 >1000ms

**Implementation** (app tracking):
```typescript
const scanStartTime = Date.now();
const parsed = await parseQRData(input);
const customer = data.customers.find(c => c.id === parsed.userId);
const scanDuration = Date.now() - scanStartTime;

// Send to monitoring endpoint
sendMetric('qr_scan_response_time_ms', scanDuration, { store_id: STORE_ID });
```

---

#### Memory Usage (Per Store)

**Metric**: `app_memory_usage_mb_store_{ID}`
**Definition**: Memory consumption of Electron app process
**Target**: <500MB
**Collection Method**: App reports memory usage every 5 minutes
**Alert Threshold**: >750MB sustained for 10 minutes

**Implementation**:
```typescript
// In Electron main process
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  sendMetric('app_memory_usage_mb', memoryUsage.heapUsed / 1024 / 1024, {
    store_id: STORE_ID,
    heap_total: memoryUsage.heapTotal / 1024 / 1024
  });
}, 300000); // Every 5 minutes
```

---

#### CPU Usage (Per Store)

**Metric**: `app_cpu_usage_percentage_store_{ID}`
**Definition**: CPU utilization of Electron app process
**Target**: <10% idle, <30% active
**Collection Method**: App reports CPU usage every 5 minutes
**Alert Threshold**: >50% sustained for 10 minutes

---

### 3. Transaction Metrics

#### Transaction Success Rate

**Metric**: `transaction_success_rate_percentage`
**Definition**: Percentage of transactions that complete successfully
**Target**: ≥99%
**Collection Method**: Count successful vs failed transactions in database
**Alert Threshold**: <95% over 5-minute window

**Query**:
```sql
SELECT
  store_id,
  COUNT(*) AS total_transactions,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successful,
  (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS success_rate
FROM cashier_transactions
WHERE created_at >= datetime('now', '-1 hour')
GROUP BY store_id;
```

---

#### Transaction Volume

**Metric**: `transaction_volume_per_hour`
**Definition**: Number of transactions per hour (per store and total)
**Target**: N/A (baseline tracking)
**Collection Method**: Count transactions per hour
**Alert Threshold**: <50% of baseline (indicates store may be closed or app not working)

**Query**:
```sql
SELECT
  strftime('%Y-%m-%d %H:00:00', created_at) AS hour,
  store_id,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN type='earn' THEN 1 ELSE 0 END) AS earn_count,
  SUM(CASE WHEN type='redeem' THEN 1 ELSE 0 END) AS redeem_count
FROM cashier_transactions
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY hour, store_id
ORDER BY hour DESC, store_id;
```

---

#### Average Transaction Amount

**Metric**: `average_transaction_amount_rub`
**Definition**: Average purchase amount for transactions
**Target**: N/A (baseline tracking for business analysis)
**Collection Method**: Calculate average from cashier_transactions table

**Query**:
```sql
SELECT
  store_id,
  AVG(purchase_amount) AS avg_purchase_amount,
  AVG(points_amount) AS avg_points_earned_or_redeemed,
  AVG(discount_amount) AS avg_discount_given
FROM cashier_transactions
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY store_id;
```

---

### 4. Error Metrics

#### Error Rate

**Metric**: `error_rate_percentage`
**Definition**: Percentage of API requests that return errors (4xx, 5xx)
**Target**: <1%
**Collection Method**: Log HTTP status codes
**Alert Threshold**: >5% over 5-minute window

**Query**:
```sql
SELECT
  store_id,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS errors,
  (SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS error_rate
FROM api_requests
WHERE timestamp >= datetime('now', '-1 hour')
GROUP BY store_id;
```

---

#### Error Types

**Metric**: `error_type_counts`
**Definition**: Count of each error type (by code: INVALID_CUSTOMER, INSUFFICIENT_BALANCE, etc.)
**Target**: N/A (tracking for analysis)
**Collection Method**: Log error codes

**Query**:
```sql
SELECT
  error_code,
  COUNT(*) AS error_count,
  MAX(timestamp) AS last_occurrence
FROM api_errors
WHERE timestamp >= datetime('now', '-24 hours')
GROUP BY error_code
ORDER BY error_count DESC;
```

---

### 5. Integration Metrics

#### 1C Integration Success Rate

**Metric**: `onec_integration_success_rate_percentage`
**Definition**: Percentage of 1C auto-fetch attempts that succeed
**Target**: ≥80% (if <80%, consider enabling ONEC_MOCK mode)
**Collection Method**: Log 1C API call results
**Alert Threshold**: <50% over 30-minute window

**Query**:
```sql
SELECT
  store_id,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successful,
  (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS success_rate
FROM onec_api_calls
WHERE timestamp >= datetime('now', '-1 hour')
GROUP BY store_id;
```

---

#### 1C API Latency

**Metric**: `onec_api_latency_ms`
**Definition**: Time for 1C getCurrentTransactionAmount API call
**Target**: p95 <3000ms (timeout is 3000ms)
**Collection Method**: Log 1C API call durations
**Alert Threshold**: p95 >2500ms

---

### 6. Security Metrics

#### Failed Authentication Attempts

**Metric**: `failed_auth_attempts_count`
**Definition**: Number of failed login attempts (if authentication added)
**Target**: <10 per hour per store
**Collection Method**: Log failed auth attempts
**Alert Threshold**: >50 per hour (potential brute force attack)

---

#### Suspicious Input Attempts

**Metric**: `suspicious_input_count`
**Definition**: Count of inputs flagged as potential SQL injection or XSS
**Target**: 0
**Collection Method**: Log validation failures with suspicious patterns
**Alert Threshold**: >5 per hour

**Implementation**:
```typescript
// Backend validation
if (containsSQLInjection(input) || containsXSS(input)) {
  logger.warn('suspicious_input', {
    input: sanitize(input),
    store_id: req.body.storeId,
    ip_address: req.ip,
    timestamp: new Date().toISOString()
  });
}
```

---

## Logging Strategy

### Log Levels

- **ERROR**: Application errors, unhandled exceptions, critical failures
- **WARN**: Recoverable errors, validation failures, performance degradation
- **INFO**: Transaction completions, API requests, significant events
- **DEBUG**: Detailed diagnostic information (development only)

### Log Format

**Standard JSON Log Format**:
```json
{
  "timestamp": "2025-10-24T10:15:30.000Z",
  "level": "INFO",
  "service": "cashier-backend",
  "component": "cashier_api",
  "event": "transaction_completed",
  "store_id": 1,
  "transaction_id": 12345,
  "type": "earn",
  "duration_ms": 234,
  "customer_id": 1,
  "points_amount": 40,
  "message": "Earn transaction completed successfully"
}
```

### Log Storage

#### Application Logs (Per Store App)

**Location**: `%APPDATA%\Касса {StoreName}\logs\app.log`
**Rotation**: Daily, keep 7 days
**Max Size**: 10MB per file
**Format**: JSON

**Implementation** (Electron app):
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join(app.getPath('userData'), 'logs', 'app.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 7
    })
  ]
});
```

---

#### Backend API Logs

**Location**: `/var/log/loyalty-backend/app.log`
**Rotation**: Daily, keep 90 days
**Max Size**: 100MB per file
**Format**: JSON

**Log Categories**:
- `api_request.log`: All API requests/responses
- `database.log`: Database query performance
- `error.log`: All errors and exceptions
- `security.log`: Authentication, validation failures
- `onec.log`: 1C integration calls

**Implementation** (backend):
```typescript
import winston from 'winston';
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: '/var/log/loyalty-backend/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',
      maxFiles: '90d'
    }),
    new winston.transports.DailyRotateFile({
      filename: '/var/log/loyalty-backend/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '50m',
      maxFiles: '90d'
    })
  ]
});
```

---

### Log Aggregation

**Recommended Tools**:
1. **ELK Stack** (Elasticsearch, Logstash, Kibana) - Open source
2. **Grafana Loki** - Lightweight, cost-effective
3. **Splunk** - Enterprise solution (if budget allows)

**Log Collection**:
- **Backend**: Centralized logging to aggregation service
- **Cashier Apps**: Batch upload logs to backend every hour

**Implementation** (app log upload):
```typescript
// In Electron app
async function uploadLogs() {
  const logFile = path.join(app.getPath('userData'), 'logs', 'app.log');
  const logs = fs.readFileSync(logFile, 'utf-8');

  await fetch(`${BACKEND_URL}/api/monitoring/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      store_id: STORE_ID,
      logs: logs.split('\n').filter(line => line.trim()),
      timestamp: new Date().toISOString()
    })
  });
}

// Upload logs every hour
setInterval(uploadLogs, 3600000);
```

---

## Alert Configuration

### Alert Severity Levels

#### P0 - Critical (Immediate Response)

**Response Time**: 15 minutes
**Notification**: Phone call + SMS + Email
**Escalation**: 30 minutes if not acknowledged

**Triggers**:
- Backend API down (no /api/health response for 3 minutes)
- Transaction success rate <80% over 5 minutes
- Database errors preventing writes
- Security breach detected

---

#### P1 - High (Urgent Response)

**Response Time**: 30 minutes
**Notification**: SMS + Email
**Escalation**: 1 hour if not acknowledged

**Triggers**:
- Transaction success rate <95% over 10 minutes
- API latency p95 >2000ms over 10 minutes
- Error rate >5% over 10 minutes
- Cashier app not responding (no heartbeat for 5 minutes during store hours)
- Memory usage >750MB sustained for 10 minutes

---

#### P2 - Medium (Business Hours Response)

**Response Time**: 2 hours
**Notification**: Email
**Escalation**: Next business day if not resolved

**Triggers**:
- Transaction success rate <99% over 1 hour
- 1C integration success rate <50% over 30 minutes
- Error rate >1% over 1 hour
- Suspicious input attempts >5 per hour

---

#### P3 - Low (Monitor and Review)

**Response Time**: Next business day
**Notification**: Email digest
**Escalation**: None

**Triggers**:
- Memory usage >500MB
- CPU usage >30% sustained
- Transaction volume <baseline (store may be closed)

---

### Alert Rules

#### Rule 1: Backend API Down

```yaml
alert: BackendAPIDown
severity: P0
condition: |
  health_check_failures >= 6 consecutive
  # (6 failures * 30s interval = 3 minutes downtime)
notification:
  - phone: [on_call_engineer]
  - sms: [on_call_engineer, deployment_lead]
  - email: [tech_team, management]
action:
  - execute: auto_restart_backend_service
  - escalate_after: 30_minutes
```

---

#### Rule 2: Transaction Success Rate Low

```yaml
alert: TransactionSuccessRateLow
severity: P1
condition: |
  (successful_transactions / total_transactions) < 0.95
  over: 10_minutes
  per_store: true
notification:
  - sms: [on_call_engineer]
  - email: [tech_team]
dashboard: highlight_affected_store
action:
  - log: detailed_error_analysis
  - escalate_after: 1_hour
```

---

#### Rule 3: High API Latency

```yaml
alert: HighAPILatency
severity: P1
condition: |
  p95(api_latency_ms) > 2000
  over: 10_minutes
notification:
  - email: [backend_team]
dashboard: show_latency_breakdown
action:
  - trigger: performance_profiling
  - escalate_after: 1_hour
```

---

#### Rule 4: Cashier App Not Responding

```yaml
alert: CashierAppNotResponding
severity: P1
condition: |
  no_heartbeat_for: 5_minutes
  during: store_hours
  per_store: true
notification:
  - sms: [store_manager, on_call_engineer]
  - email: [tech_support]
action:
  - execute: remote_app_restart (if possible)
  - escalate_to: on_site_support
```

---

#### Rule 5: 1C Integration Degraded

```yaml
alert: OneCIntegrationDegraded
severity: P2
condition: |
  (successful_onec_calls / total_onec_calls) < 0.50
  over: 30_minutes
  per_store: true
notification:
  - email: [tech_team, store_manager]
action:
  - fallback: enable_manual_input_mode
  - notify: onec_administrator
```

---

### Alert Channels

| Channel | Purpose | Recipient | Schedule |
|---------|---------|-----------|----------|
| Phone Call | P0 critical alerts | On-call engineer | 24/7 |
| SMS | P0/P1 urgent alerts | On-call engineer, Deployment Lead | 24/7 |
| Email | All alerts | Tech team, Management | 24/7 |
| Slack | Real-time monitoring | #loyalty-monitoring channel | 24/7 |
| Dashboard | Visual alerts | Operations team | Business hours |

---

## Dashboard Design

### Dashboard 1: Real-Time Operations

**Purpose**: Monitor current system health and active transactions
**Audience**: Operations team, Technical support
**Refresh**: Every 30 seconds

**Widgets**:

1. **System Status Panel**
   - Backend API: UP/DOWN (green/red indicator)
   - Each Store App: UP/DOWN (6 indicators)
   - Database: Connected/Disconnected
   - 1C Integration per Store: Working/Degraded/Down

2. **Transaction Volume (Last Hour)**
   - Line chart: Transactions per minute
   - Total: Combined all stores
   - Per Store: 6 separate lines (color-coded)

3. **Success Rate Gauges**
   - Earn Transactions: 99.2% (green if ≥99%, yellow if ≥95%, red if <95%)
   - Redeem Transactions: 98.8%
   - Overall: 99.0%

4. **Active Alerts**
   - List of current P0/P1 alerts
   - Time since alert triggered
   - Acknowledged status

5. **API Latency**
   - Real-time line chart (p95, p99)
   - Color-coded thresholds

6. **Store Heatmap**
   - 6 store tiles, color-coded by health:
     - Green: All systems operational
     - Yellow: Minor issues
     - Red: Critical issues

**Screenshot Description**:
```
[Dashboard Layout]
┌──────────────────────────────────────────────────────────────┐
│ Real-Time Operations Dashboard        Last Updated: 10:15:30 │
├──────────────────────────────────────────────────────────────┤
│ System Status                                                │
│ ┌────────────┬────────────┬────────────┬──────────────────┐ │
│ │ Backend API│ Database   │ Store Apps │ 1C Integration   │ │
│ │ ✅ UP      │ ✅ Connected│ 6/6 Online │ 5/6 Working      │ │
│ └────────────┴────────────┴────────────┴──────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ Transaction Volume (Last Hour)                               │
│ [Line Chart: 0-60 minutes, 0-50 transactions]               │
│ Total: 342 | Earn: 198 | Redeem: 144                        │
├──────────────────────────────────────────────────────────────┤
│ Success Rates                                                │
│ ┌──────────┬──────────┬──────────┐                         │
│ │  Earn    │  Redeem  │ Overall  │                         │
│ │ ⚫ 99.2%  │ ⚫ 98.8%  │ ⚫ 99.0% │                         │
│ └──────────┴──────────┴──────────┘                         │
├──────────────────────────────────────────────────────────────┤
│ Active Alerts (2)                                            │
│ ⚠️ P1: Store 3 - High API Latency (5 min ago)               │
│ ⚠️ P2: Store 6 - 1C Integration Degraded (12 min ago)       │
└──────────────────────────────────────────────────────────────┘
```

---

### Dashboard 2: Daily Summary

**Purpose**: Review daily performance and trends
**Audience**: Management, Store Managers
**Refresh**: Every 5 minutes

**Widgets**:

1. **Daily Transaction Summary**
   - Total transactions today: 1,234
   - Earn: 678 (54.9%)
   - Redeem: 556 (45.1%)
   - Success rate: 99.3%

2. **Per-Store Breakdown**
   - Table: Store | Transactions | Success Rate | Avg Latency
   - Sort by transaction volume

3. **Hourly Trends**
   - Bar chart: Transactions per hour (00:00 - current time)
   - Identify peak hours

4. **Top Errors**
   - Pie chart or table: Error types and counts
   - INSUFFICIENT_BALANCE: 12
   - INVALID_CUSTOMER: 5
   - NETWORK_ERROR: 3

5. **Customer Engagement**
   - Unique customers served: 456
   - Total points earned: 27,120
   - Total points redeemed: 18,900
   - Average discount per redemption: 34₽

6. **Performance Benchmarks**
   - API Latency: p50/p95/p99
   - QR Scan Speed: p50/p95/p99
   - Database Query Time: p50/p95/p99

---

### Dashboard 3: Weekly/Monthly Reports

**Purpose**: Business intelligence and long-term trends
**Audience**: Management, Business Analysts
**Refresh**: Daily

**Widgets**:

1. **Weekly Transaction Volume Trend**
   - Line chart: Last 4 weeks, transactions per day
   - Compare week-over-week growth

2. **Store Performance Comparison**
   - Bar chart: Transactions per store (weekly)
   - Identify high/low performers

3. **Customer Loyalty Metrics**
   - Active customers: 2,345
   - New customers this week: 89
   - Churn rate: 2.1%
   - Average customer lifetime value: 1,250₽

4. **Revenue Impact**
   - Total discounts given: 45,600₽
   - Total sales with loyalty: 1,234,500₽
   - Loyalty program cost: 3.7% of sales

5. **System Reliability**
   - Uptime this week: 99.95%
   - Total downtime: 21 minutes
   - MTBF (Mean Time Between Failures): 72 hours
   - MTTR (Mean Time To Repair): 15 minutes

---

## Incident Response

### Incident Response Workflow

```
1. Alert Triggered
   ↓
2. On-Call Engineer Notified (15 min SLA)
   ↓
3. Acknowledge Alert (log incident)
   ↓
4. Assess Severity
   ↓
5. Execute Runbook / Troubleshoot
   ↓
6. Resolve or Escalate
   ↓
7. Post-Incident Review (within 48 hours)
```

### Incident Severity Matrix

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| P0 - Critical | Complete service outage | 15 minutes | Backend API down |
| P1 - High | Partial service degradation | 30 minutes | Transaction success rate <95% |
| P2 - Medium | Minor issues, workaround available | 2 hours | 1C integration degraded |
| P3 - Low | Cosmetic or performance issues | Next day | Memory usage high but stable |

### Post-Incident Review (PIR) Template

```markdown
# Post-Incident Review

**Incident ID**: INC-2025-10-24-001
**Date**: 2025-10-24
**Severity**: P1
**Duration**: 45 minutes
**Services Affected**: Store 3 cashier app, backend API

## Summary
Brief description of what happened.

## Timeline
- 10:00 - Alert triggered: High API latency
- 10:05 - On-call engineer acknowledged
- 10:15 - Root cause identified: Database connection pool exhausted
- 10:30 - Fix applied: Increased connection pool size
- 10:45 - Service restored, monitoring continued

## Impact
- Transactions affected: 23
- Customers impacted: 15
- Revenue lost: ~500₽ (estimated)
- Store operations: Minimal disruption (manual fallback used)

## Root Cause
Database connection pool size (default 5) insufficient for peak load (10+ concurrent requests).

## Resolution
- Immediate: Restarted backend service to reset connections
- Permanent: Increased connection pool size to 20 in production config

## Prevention
1. Add monitoring for database connection pool utilization
2. Load test backend API under peak conditions
3. Document connection pool tuning in runbook

## Action Items
- [ ] Update backend config: connection_pool_size = 20 (Owner: Backend Team, Due: 2025-10-25)
- [ ] Add monitoring: db_connection_pool_usage (Owner: DevOps, Due: 2025-10-27)
- [ ] Run load test: 50 concurrent users (Owner: QA, Due: 2025-10-28)
- [ ] Update runbook: Database connection pool troubleshooting (Owner: Tech Lead, Due: 2025-10-30)

## Lessons Learned
- Connection pool defaults not suitable for production load
- Need better capacity planning and load testing
- Monitoring gaps: Should have caught this before it became P1

**Prepared By**: [On-Call Engineer]
**Reviewed By**: [Technical Lead, Deployment Lead]
**Date**: 2025-10-25
```

---

## Implementation Checklist

### Phase 1: Basic Monitoring (Week 1)

- [ ] Set up backend API logging (winston)
- [ ] Create /api/health endpoint
- [ ] Implement health check polling (every 30s)
- [ ] Create simple dashboard (Grafana or similar)
- [ ] Configure email alerts for P0/P1 events
- [ ] Document alert escalation procedures

### Phase 2: Enhanced Monitoring (Week 2-3)

- [ ] Add database query performance logging
- [ ] Implement cashier app heartbeat
- [ ] Add transaction metrics collection
- [ ] Create per-store monitoring dashboards
- [ ] Configure SMS alerts for P0 events
- [ ] Set up log aggregation (ELK or Loki)

### Phase 3: Advanced Monitoring (Week 4+)

- [ ] Add 1C integration monitoring
- [ ] Implement security event monitoring
- [ ] Create business intelligence dashboard
- [ ] Set up automated performance reports
- [ ] Implement predictive alerting (ML-based)
- [ ] Integrate with incident management tool (PagerDuty/Opsgenie)

---

## Monitoring Tools Recommendations

### Open Source (Budget-Friendly)

1. **Grafana + Prometheus**
   - Metrics visualization and alerting
   - Free, highly customizable
   - Large community support

2. **Grafana Loki**
   - Log aggregation
   - Lightweight alternative to ELK
   - Free

3. **Uptime Kuma**
   - Simple uptime monitoring
   - Self-hosted, free
   - Good for health checks

### Commercial (Enterprise)

1. **Datadog**
   - Full-stack monitoring
   - APM, logs, metrics, dashboards
   - Pricing: ~$15/host/month

2. **New Relic**
   - Application performance monitoring
   - Real-time insights
   - Pricing: ~$99/month base

3. **Splunk**
   - Enterprise log management
   - Advanced analytics
   - Pricing: ~$150/GB/month

### Hybrid Recommendation

**For this project**:
- **Grafana + Prometheus**: Metrics and dashboards (free)
- **Grafana Loki**: Log aggregation (free)
- **Email/SMS**: Alerting via Twilio or SNS (~$50/month)
- **Total Cost**: ~$50/month

---

## Appendix: Metric Collection API

### Backend Endpoint: POST /api/monitoring/metric

**Purpose**: Accept metrics from cashier apps

**Request**:
```json
{
  "metric_name": "qr_scan_response_time_ms",
  "value": 234,
  "tags": {
    "store_id": 1,
    "store_name": "Алмаз"
  },
  "timestamp": "2025-10-24T10:15:30.000Z"
}
```

**Response**:
```json
{
  "status": "ok",
  "metric_id": "12345"
}
```

**Implementation** (backend):
```typescript
app.post('/api/monitoring/metric', async (req, res) => {
  const { metric_name, value, tags, timestamp } = req.body;

  // Store in time-series database or log
  await storeMetric(metric_name, value, tags, timestamp);

  // Send to Prometheus/Grafana (if integrated)
  prometheusClient.gauge(metric_name, value, tags);

  res.json({ status: 'ok', metric_id: generateId() });
});
```

---

**End of Monitoring Plan**
