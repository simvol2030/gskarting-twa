# Backend Security Test Plan

This document provides a comprehensive testing plan for all security features implemented in the backend Express.js API.

## Test Credentials

- **Email**: admin@example.com
- **Password**: Admin123!@#$

## 1. Bcrypt Password Hashing

### Test 1.1: Verify Password Hashing on Startup
**Steps**:
1. Delete the existing database: `rm ../data/db/sqlite/app.db`
2. Start the backend: `npm run dev`
3. Check console output for: "Password is securely hashed with bcrypt"

**Expected Result**: Console should show bcrypt confirmation message.

### Test 1.2: Verify Login with Correct Password
**Steps**:
1. POST to `/api/auth/login`
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#$"}'
```

**Expected Result**:
- Status: 200
- Response contains `token` and `user` object

### Test 1.3: Verify Login Fails with Wrong Password
**Steps**:
1. POST to `/api/auth/login` with wrong password
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"wrongpassword"}'
```

**Expected Result**:
- Status: 401
- Response: `{"error":"Invalid credentials"}`

### Test 1.4: Verify Timing Attack Protection
**Steps**:
1. Time the response for non-existent email
2. Time the response for wrong password with existing email
3. Compare response times

**Expected Result**: Response times should be similar (both use bcrypt comparison)

## 2. Input Validation

### Test 2.1: Email Validation

**Test 2.1.1: Invalid Email Format**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"Admin123!@#$"}'
```
**Expected**: Status 400, error: "Invalid email format"

**Test 2.1.2: Email Too Long (>254 chars)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"'$(printf 'a%.0s' {1..260})'@example.com","password":"Admin123!@#$"}'
```
**Expected**: Status 400, error: "Email is too long"

**Test 2.1.3: SQL Injection in Email**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com'\''; DROP TABLE admins;--","password":"Admin123!@#$"}'
```
**Expected**: Status 400, error: "Email contains invalid characters"

### Test 2.2: Password Validation

**Test 2.2.1: Password Too Short (<12 chars)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"short"}'
```
**Expected**: Status 400, error: "Password must be at least 12 characters long"

**Test 2.2.2: Password Insufficient Complexity**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"alllowercase123"}'
```
**Expected**: Status 400, error about password complexity

### Test 2.3: ID Validation

**Test 2.3.1: Invalid ID (SQL Injection Attempt)**
```bash
TOKEN="<your-token-here>"
curl -X GET "http://localhost:3000/api/users/1' OR '1'='1" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: Status 400, error: "ID must be a positive integer"

**Test 2.3.2: Negative ID**
```bash
curl -X GET http://localhost:3000/api/users/-1 \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: Status 400, error: "Invalid ID value"

### Test 2.4: Name Validation (XSS Prevention)

**Test 2.4.1: XSS Attempt in Name**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"XSS\")</script>","email":"test@example.com"}'
```
**Expected**: Status 400, error: "Name contains invalid characters"

### Test 2.5: Title and Content Validation

**Test 2.5.1: Title Too Short (<3 chars)**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"1","title":"AB","content":"Valid content"}'
```
**Expected**: Status 400, error: "Title must be at least 3 characters"

**Test 2.5.2: Content Too Long (>50000 chars)**
```bash
LONG_CONTENT=$(printf 'a%.0s' {1..50001})
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"1\",\"title\":\"Test\",\"content\":\"$LONG_CONTENT\"}"
```
**Expected**: Status 400, error: "Content is too long"

## 3. Rate Limiting

### Test 3.1: Verify Rate Limit Enforcement

**Steps**:
1. Make 6 failed login attempts within 15 minutes
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"wrongpassword"}'
  echo "\n--- Attempt $i ---"
done
```

**Expected Result**:
- First 5 attempts: Status 401, "Invalid credentials"
- 6th attempt: Status 429, "Too many failed attempts. Account temporarily locked for X seconds"

### Test 3.2: Verify Rate Limit Reset on Success

**Steps**:
1. Make 3 failed login attempts
2. Make 1 successful login
3. Make 3 more failed attempts

**Expected Result**: Rate limit counter should reset after successful login, allowing another 5 attempts

### Test 3.3: Verify Rate Limit Block Duration

**Steps**:
1. Trigger rate limit (6 failed attempts)
2. Wait for the block duration to expire
3. Try logging in again

**Expected Result**: After block expires, login attempts should work again

## 4. Security Headers

### Test 4.1: Verify All Security Headers

```bash
curl -I http://localhost:3000/
```

**Expected Headers**:
- `Content-Security-Policy`: Should contain directives like `default-src 'self'`
- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `X-XSS-Protection`: 1; mode=block
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: Should restrict camera, microphone, etc.
- `Strict-Transport-Security`: (Only in production) max-age=31536000

### Test 4.2: Verify HSTS Only in Production

**Steps**:
1. Check headers in development (NODE_ENV=development)
2. Check headers in production (NODE_ENV=production)

**Expected Result**: HSTS header should only appear in production

## 5. Authentication & Authorization

### Test 5.1: Verify JWT Token Required

```bash
curl -X GET http://localhost:3000/api/users
```
**Expected**: Status 401, error: "Access token required"

### Test 5.2: Verify Invalid Token Rejected

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer invalid-token-here"
```
**Expected**: Status 403, error: "Invalid or expired token"

### Test 5.3: Verify Role-Based Access Control

**Test 5.3.1: Super-Admin Can Delete**
```bash
# Login as super-admin, get token
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN"
```
**Expected**: Status 200, success message

**Test 5.3.2: Editor Cannot Delete**
```bash
# Would need to create editor account first
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer $EDITOR_TOKEN"
```
**Expected**: Status 403, "Insufficient permissions"

## 6. Database Security

### Test 6.1: Verify Prepared Statements (SQL Injection Prevention)

**Steps**:
1. Attempt SQL injection in various endpoints
```bash
# Try in POST body
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com'\''; DROP TABLE users;--"}'

# Try in URL parameter
curl -X GET "http://localhost:3000/api/users/1; DROP TABLE users;--" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result**: All attempts should fail validation or return 400/404, database should remain intact

### Test 6.2: Verify Password Never Returned

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#$"}'
```

**Expected Result**: Response should contain user object WITHOUT password field

## 7. CORS Security

### Test 7.1: Verify CORS Restrictions

```bash
curl -X OPTIONS http://localhost:3000/api/users \
  -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: GET"
```

**Expected Result**: Should only allow `http://localhost:5173` origin

## Summary Checklist

- [ ] All tests in section 1 (Bcrypt) pass
- [ ] All tests in section 2 (Validation) pass
- [ ] All tests in section 3 (Rate Limiting) pass
- [ ] All tests in section 4 (Security Headers) pass
- [ ] All tests in section 5 (Auth/Authz) pass
- [ ] All tests in section 6 (Database Security) pass
- [ ] All tests in section 7 (CORS) pass

## Notes for User

To run these tests effectively:

1. **Install curl** or use Postman/Insomnia for API testing
2. **Get a valid JWT token first**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Admin123!@#$"}' | jq -r '.token'
   ```
3. **Replace `$TOKEN`** in test commands with your actual token
4. **Use fresh database** for testing (delete and restart to reset rate limits)
5. **Test in both development and production modes** where applicable

## Automated Testing Script

Create a file `test-security.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
API_URL="http://localhost:3000"

echo "=== Backend Security Test Suite ==="
echo ""

# Test 1: Login with correct credentials
echo "Test 1: Login with correct credentials..."
RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#$"}')

if echo "$RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ PASSED${NC}"
  TOKEN=$(echo "$RESPONSE" | jq -r '.token')
else
  echo -e "${RED}✗ FAILED${NC}"
fi

# Test 2: Login with wrong password
echo "Test 2: Login with wrong password..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"wrongpassword"}')

if echo "$RESPONSE" | tail -1 | grep -q "401"; then
  echo -e "${GREEN}✓ PASSED${NC}"
else
  echo -e "${RED}✗ FAILED${NC}"
fi

# Test 3: Invalid email format
echo "Test 3: Invalid email format..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"Admin123!@#$"}')

if echo "$RESPONSE" | tail -1 | grep -q "400"; then
  echo -e "${GREEN}✓ PASSED${NC}"
else
  echo -e "${RED}✗ FAILED${NC}"
fi

# Test 4: Security headers present
echo "Test 4: Security headers present..."
HEADERS=$(curl -s -I $API_URL/)

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  echo -e "${GREEN}✓ PASSED${NC}"
else
  echo -e "${RED}✗ FAILED${NC}"
fi

# Add more tests as needed...

echo ""
echo "=== Test Suite Complete ==="
```

Run with: `chmod +x test-security.sh && ./test-security.sh`
