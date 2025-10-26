# 1C OData Integration Documentation

## Overview

This document describes the 1C:Управление Торговлей integration layer for the cashier interface. The integration enables automatic fetching of transaction amounts from 1C terminals, with graceful fallback to manual input.

## Architecture

### Key Components

1. **1C OData Client** (`src/lib/services/onec-client.ts`)
   - HTTP client for 1C OData API
   - Graceful error handling (returns `null` on failure)
   - Mock mode for development/testing
   - 3-second timeout for responsive UI

2. **Store Configuration** (`src/lib/config/stores.ts`)
   - Configuration for 6 physical stores
   - Store-specific 1C endpoint overrides
   - Terminal ID mapping

3. **Cashier UI** (`src/routes/cashier/+page.svelte`)
   - Auto-fetch on customer selection
   - Loading state with spinner
   - Success state with amount display
   - Error state with manual input fallback
   - Refresh button for retry
   - Clear button to switch to manual mode

4. **Type Definitions** (`src/lib/types/loyalty.ts`)
   - `OneCTransaction`: 1C transaction data structure
   - `OneCConfig`: 1C connection configuration
   - `TransactionFetchState`: UI state management

## Configuration

### Environment Variables

All configuration is done via environment variables in `.env`:

```bash
# 1C OData Base URL (default for all stores)
ONEC_BASE_URL=http://localhost:8080

# 1C API Credentials
ONEC_USERNAME=cashier_api
ONEC_PASSWORD=secure_password_here

# Request Timeout (milliseconds)
ONEC_TIMEOUT=3000

# Mock Mode (true = fake data, false = real 1C)
ONEC_MOCK=true

# Store-specific overrides (optional)
STORE_1_ONEC_URL=http://1c-almas.local:8080
STORE_2_ONEC_URL=http://1c-izumrud.local:8080
# ... etc for stores 3-6
```

### Store List

| Store ID | Name | Address | Terminal ID |
|----------|------|---------|-------------|
| 1 | Алмаз | ул. Советская, 15 | TERM_ALMAS_001 |
| 2 | Изумруд | пр. Ленина, 42 | TERM_IZUMRUD_002 |
| 3 | Сапфир | ул. Мира, 7 | TERM_SAPFIR_003 |
| 4 | Рубин | ул. Гагарина, 23 | TERM_RUBIN_004 |
| 5 | Топаз | ул. Победы, 56 | TERM_TOPAZ_005 |
| 6 | Янтарь | ул. Садовая, 89 | TERM_YANTAR_006 |

## 1C API Specification

### Assumed Endpoint Structure

**Base URL**: `{ONEC_BASE_URL}/odata/standard.odata`

**Endpoint**: `/Catalog_Transactions`

**Query Parameters**:
- `$filter`: `StoreId eq {store_id} and Status eq 'Active'`
- `$orderby`: `CreatedAt desc`
- `$top`: `1`

**Authentication**: HTTP Basic Auth

**Example Request**:
```http
GET /odata/standard.odata/Catalog_Transactions?$filter=StoreId%20eq%201%20and%20Status%20eq%20'Active'&$orderby=CreatedAt%20desc&$top=1
Authorization: Basic Y2FzaGllcl9hcGk6cGFzc3dvcmQ=
Accept: application/json
```

**Example Response**:
```json
{
  "value": [
    {
      "Ref_Key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "Amount": 1250.00,
      "StoreId": 1,
      "Status": "Active",
      "CreatedAt": "2025-10-24T10:30:00Z"
    }
  ]
}
```

**Response Fields**:
- `Ref_Key`: UUID of the transaction
- `Amount`: Purchase amount in rubles (number)
- `StoreId`: Store identifier (1-6)
- `Status`: Transaction status (`Active`, `Completed`, `Cancelled`)
- `CreatedAt`: ISO 8601 timestamp

## Usage

### Development Mode (Mock)

1. Set `ONEC_MOCK=true` in `.env`
2. Start development server: `npm run dev`
3. Navigate to `/cashier?store_id=1`
4. Scan customer QR code
5. **Auto-fetch will generate random amount (500-5000 rubles) after 500ms**

### Production Mode (Real 1C)

1. Set `ONEC_MOCK=false` in `.env`
2. Configure `ONEC_BASE_URL`, `ONEC_USERNAME`, `ONEC_PASSWORD`
3. Optionally configure store-specific URLs
4. Deploy application
5. **Auto-fetch will query real 1C terminal**

### UI Flow

#### Success Flow
1. Customer QR code scanned
2. Loading indicator appears: "Получение суммы из кассы..."
3. Amount fetched successfully
4. Green display shows: "💰 Сумма из кассы: 1,250.00 ₽"
5. Amount auto-populated in purchase field
6. Cashier can proceed with earn/redeem

#### Fallback Flow
1. Customer QR code scanned
2. Loading indicator appears
3. **1C returns null or timeout occurs**
4. Manual input field appears: "Введите сумму вручную..."
5. Optional warning: "⚠️ Не удалось получить сумму из кассы. Введите сумму вручную."
6. Cashier enters amount manually
7. Proceeds with earn/redeem

#### Manual Override
1. Amount auto-fetched and displayed
2. Cashier clicks "✏️ Ввести вручную"
3. Display clears, manual input appears
4. Cashier enters different amount

#### Refresh
1. Amount auto-fetched and displayed
2. Cashier clicks "🔄 Обновить"
3. New fetch initiated
4. Amount updates with latest 1C data

## Error Handling

### Client-Side (onec-client.ts)

**Principle**: **Never throw exceptions, always return `null`**

All errors are handled gracefully:
- Network errors → `null`
- Timeout (>3s) → `null`
- HTTP errors (4xx, 5xx) → `null`
- Invalid JSON → `null`
- Missing/invalid amount → `null`

**Logging**: All errors logged to console (server-side only)

### UI-Side (+page.svelte)

**Principle**: **Always show manual input as fallback**

When fetch fails:
- No error alert shown to user
- Optional warning hint displayed
- Manual input field shown
- Cashier can continue workflow

### Security

1. **No credentials in code**: All auth from environment variables
2. **HTTPS in production**: Ensure 1C endpoints use HTTPS
3. **Basic Auth**: Credentials sent in Authorization header
4. **Read-only user**: 1C API user should have minimal permissions
5. **No PII logged**: Transaction amounts logged, no customer data

## Testing

### Unit Testing (Future)

```typescript
import { getCurrentTransactionAmount } from '$lib/services/onec-client';

test('should return mock amount when ONEC_MOCK=true', async () => {
  const amount = await getCurrentTransactionAmount(1);
  expect(amount).toBeGreaterThanOrEqual(500);
  expect(amount).toBeLessThanOrEqual(5000);
});

test('should return null on timeout', async () => {
  const amount = await getCurrentTransactionAmount(1, { timeout: 1 });
  expect(amount).toBeNull();
});
```

### Manual Testing Checklist

- [ ] Mock mode generates random amounts
- [ ] Loading spinner appears during fetch
- [ ] Success state displays amount correctly
- [ ] Manual input shown on fetch failure
- [ ] Refresh button fetches new amount
- [ ] Clear button switches to manual mode
- [ ] Purchase amount auto-populated
- [ ] Earn/redeem calculations work with fetched amount
- [ ] Responsive design on mobile
- [ ] Works for all 6 stores

## Monitoring

### Logs to Watch

**Development** (`NODE_ENV=development`):
```
[1C Mock] Generated transaction amount: 2450
✅ 1C transaction fetched: 2450
```

**Production**:
```
[1C] Fetching transaction: http://1c-server:8080/odata/...
[1C] Transaction found: { id: 'uuid', amount: 1250, status: 'Active' }
✅ 1C transaction fetched: 1250
```

**Errors**:
```
[1C] HTTP error: 500 Internal Server Error
[1C] Request timeout after 3000 ms
[1C] Fetch error: Network request failed
⚠️ 1C transaction not available, using manual input
```

### Metrics to Track

1. **Fetch success rate**: % of successful fetches
2. **Average fetch time**: Time to get amount from 1C
3. **Timeout rate**: % of requests exceeding 3s
4. **Manual input rate**: % of transactions using manual entry
5. **Fetch retries**: Number of refresh button clicks

## Troubleshooting

### Problem: Always shows manual input

**Symptoms**: Loading spinner appears briefly, then manual input

**Possible Causes**:
1. `ONEC_MOCK=false` but 1C URL unreachable
2. 1C credentials incorrect
3. 1C API endpoint changed
4. Network firewall blocking requests

**Solutions**:
1. Check `ONEC_BASE_URL` is accessible: `curl -u username:password $ONEC_BASE_URL`
2. Verify credentials in `.env`
3. Check 1C logs for authentication failures
4. Test with `ONEC_MOCK=true` to isolate issue

### Problem: Slow fetch (>3s timeout)

**Symptoms**: Always times out, manual input appears

**Possible Causes**:
1. 1C server overloaded
2. Network latency
3. Complex OData query

**Solutions**:
1. Increase `ONEC_TIMEOUT` (e.g., 5000ms)
2. Optimize 1C query/indexes
3. Use store-specific URLs for load balancing
4. Check network path to 1C server

### Problem: Wrong amount fetched

**Symptoms**: Amount doesn't match POS terminal

**Possible Causes**:
1. Multiple active transactions for store
2. Wrong `StoreId` in query
3. Status filter incorrect

**Solutions**:
1. Add `TerminalId` filter to query
2. Verify store ID mapping in `stores.ts`
3. Check 1C transaction status logic
4. Review OData query logic in `onec-client.ts`

## Future Enhancements

### Phase 2: Order Push
- Push completed transactions to 1C
- Bidirectional sync
- Order status tracking

### Phase 3: Real-time Updates
- WebSocket/SSE for live transaction updates
- No manual refresh needed
- Transaction status notifications

### Phase 4: Advanced Features
- Multi-terminal support per store
- Transaction history sync
- Customer purchase history from 1C
- Inventory sync for product availability

## API Reference

### `getCurrentTransactionAmount(storeId, config?)`

Fetch current active transaction amount from 1C terminal.

**Parameters**:
- `storeId: number` - Store identifier (1-6)
- `config?: Partial<OneCConfig>` - Optional configuration override

**Returns**: `Promise<number | null>`
- `number`: Transaction amount in rubles
- `null`: Transaction not available or error occurred

**Example**:
```typescript
const amount = await getCurrentTransactionAmount(1);
if (amount !== null) {
  console.log(`Transaction amount: ${amount} ₽`);
} else {
  console.log('Using manual input');
}
```

### `testOneCConnection(storeId, config?)`

Test 1C connection for a store.

**Parameters**:
- `storeId: number` - Store identifier
- `config?: Partial<OneCConfig>` - Optional configuration

**Returns**: `Promise<boolean>`
- `true`: Connection successful
- `false`: Connection failed

### `getOneCStatus()`

Get current 1C configuration status.

**Returns**: `{ mockMode: boolean, config: OneCConfig }`

**Example**:
```typescript
const status = getOneCStatus();
console.log('Mock mode:', status.mockMode);
console.log('Base URL:', status.config.baseUrl);
```

## Contact

For 1C integration issues:
- Check 1C server logs
- Review OData service configuration
- Verify API user permissions
- Contact 1C system administrator

For application issues:
- Check browser console logs
- Review server logs
- Test with mock mode enabled
- Check environment variables

---

**Version**: 1.0.0
**Last Updated**: 2025-10-24
**Integration Type**: 1C:Управление Торговлей OData
**Status**: Production Ready
