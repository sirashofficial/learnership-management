# Production Testing Checklist

## Phase 4: Testing & Documentation - Complete Verification Guide

---

## 1. AUTHENTICATION & AUTHORIZATION TESTING ✓

### 1.1 Token Generation & Validation
- [ ] JWT token generated with correct payload (userId, role, email)
- [ ] Token expires in 24 hours
- [ ] Expired tokens return 401 Unauthorized
- [ ] Invalid/malformed tokens return 401
- [ ] Tokens work in Authorization header: `Bearer <token>`
- [ ] Tokens work in auth_token cookie
- [ ] Token verification on all protected routes
- [ ] Admin operations require admin role

**Test Command:**
```bash
# Generate token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123"}'

# Use token
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer <token>"
```

**Expected Results:**
- ✓ Login returns token with claim data
- ✓ GET /students returns 200 with data
- ✓ Without token: 401 Unauthorized
- ✓ With invalid token: 401 Unauthorized

---

## 2. VALIDATION TESTING ✓

### 2.1 Field-Level Validation

#### Email Validation
- [ ] Valid emails accepted: john@example.com, user+tag@example.com
- [ ] Invalid emails rejected: invalid, @example.com, user@.com
- [ ] Local domain emails rejected: user@local
- [ ] Email field required on registration
- [ ] Returns 422 with field-specific error message

**Test:**
```bash
POST /api/auth/register
{
  "email": "user@local",
  "password": "Secure123"
}
# Expected: 422 with error "Invalid email format"
```

#### Password Validation
- [ ] Min 8 characters enforced
- [ ] Requires at least 1 uppercase letter
- [ ] Requires at least 1 lowercase letter
- [ ] Requires at least 1 number
- [ ] Rejects weak passwords: "password", "Weak123" (but usually ok)
- [ ] Change password requires old password
- [ ] Confirmation password must match

**Test:**
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "weak"
}
# Expected: 422 with error about password requirements
```

#### Phone Validation (if applicable)
- [ ] International format supported: +27721234567
- [ ] Local format supported: 0721234567
- [ ] Invalid formats rejected
- [ ] Field optional but validated if provided

#### UUID Validation
- [ ] Valid UUIDs accepted in ID fields
- [ ] Invalid UUIDs rejected with 422
- [ ] Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

---

### 2.2 Data Constraints

#### String Length Limits
- [ ] First/Last Name: Max 100 characters
- [ ] Email: Max 120 characters
- [ ] Phone: Max 20 characters
- [ ] Description fields: Max 2000 characters
- [ ] Returns 422 with specific error when exceeded

#### Date Range Validation
- [ ] End date must be after start date
- [ ] Returns error: "End date must be after start date"

#### Bulk Operation Limits
- [ ] Bulk attendance max 500 records
- [ ] Returns 422 if exceeded: "Cannot process more than 500 records"

---

## 3. API RESPONSE FORMAT TESTING ✓

### 3.1 Success Response (200, 201)
```json
{
  "success": true,
  "data": { /* resource */ },
  "timestamp": "2026-02-15T10:30:00Z"
}
```

**Verify:**
- [ ] `success: true` present
- [ ] `data` contains resource
- [ ] `timestamp` is ISO 8601 format
- [ ] No `error` field
- [ ] Correct HTTP status (200 or 201)

### 3.2 Paginated Response (200)
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  },
  "timestamp": "2026-02-15T10:30:00Z"
}
```

**Verify:**
- [ ] `pagination` object present
- [ ] All pagination fields present and correct type
- [ ] `total` reflects actual count
- [ ] `totalPages` = ceil(total / pageSize)
- [ ] `hasMore` = (page < totalPages)
- [ ] `data` is array

### 3.3 Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": "Not found",
  "code": "NOT_FOUND",
  "timestamp": "2026-02-15T10:30:00Z"
}
```

**Verify:**
- [ ] `success: false`
- [ ] `error` is descriptive message
- [ ] `code` is error constant
- [ ] `timestamp` present
- [ ] No `data` field
- [ ] Correct HTTP status code

### 3.4 Validation Error Response (422)
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "data": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "timestamp": "2026-02-15T10:30:00Z"
}
```

**Verify:**
- [ ] `success: false`
- [ ] `code: VALIDATION_ERROR`
- [ ] `data` is array of field errors
- [ ] Each error has `field` and `message`
- [ ] All validation errors included (not just first)
- [ ] HTTP status 422

---

## 4. HTTP STATUS CODE TESTING ✓

- [ ] 200 OK - GET successful
- [ ] 201 Created - POST successful with resource created
- [ ] 204 No Content - DELETE successful or OPTIONS preflight
- [ ] 400 Bad Request - Invalid parameters (malformed JSON, invalid pageSize)
- [ ] 401 Unauthorized - Missing/invalid token
- [ ] 403 Forbidden - Insufficient permissions
- [ ] 404 Not Found - Resource doesn't exist
- [ ] 409 Conflict - Unique constraint violation (duplicate ID)
- [ ] 413 Payload Too Large - Request exceeds size limit
- [ ] 422 Unprocessable Entity - Validation errors
- [ ] 429 Too Many Requests - Rate limit exceeded
- [ ] 500 Internal Server Error - Unexpected server error

**Test Script:**
```bash
# 200 OK
curl -w "\n%{http_code}\n" http://localhost:3000/api/students \
  -H "Authorization: Bearer $TOKEN"

# 404 Not Found
curl -w "\n%{http_code}\n" http://localhost:3000/api/students/invalid-uuid \
  -H "Authorization: Bearer $TOKEN"

# 401 Unauthorized
curl -w "\n%{http_code}\n" http://localhost:3000/api/students
```

---

## 5. RATE LIMITING TESTING ✓

### 5.1 General API Rate Limit (30 requests/minute)

**Test:**
```bash
# Send 31 requests in quick succession
for i in {1..31}; do
  curl http://localhost:3000/api/students \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nRequest $i: %{http_code}\n"
  sleep 0.1
done
```

**Expected:**
- [ ] Requests 1-30: 200 OK
- [ ] Request 31: 429 Too Many Requests
- [ ] Header `Retry-After: 60` present on 429

### 5.2 Auth Rate Limit (5 requests/15 minutes)

**Test:**
```bash
# Send 6 login attempts
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nAttempt $i: %{http_code}\n"
  sleep 0.1
done
```

**Expected:**
- [ ] Attempts 1-5: 401/200 (depends on credentials)
- [ ] Attempt 6: 429 Too Many Requests
- [ ] Header `Retry-After: 900` (15 minutes)

### 5.3 Rate Limit Reset

- [ ] Rate limit resets after time window expires
- [ ] Different users have independent limits
- [ ] Rate limit key is: `${method}:${path}:${identifier}`
- [ ] Identifier is user ID (if auth'd) or IP address

---

## 6. SECURITY HEADERS TESTING ✓

### 6.1 Required Headers
```bash
curl -i http://localhost:3000/api/students \
  -H "Authorization: Bearer $TOKEN"
```

**Check for headers:**
- [ ] `X-Frame-Options: DENY` - Prevent clickjacking
- [ ] `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- [ ] `X-XSS-Protection: 1; mode=block` - XSS protection
- [ ] `Strict-Transport-Security: max-age=31536000` - Force HTTPS
- [ ] `Content-Security-Policy` - Restrict resource loading
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control
- [ ] `Permissions-Policy` - Restrict browser features

---

## 7. CORS TESTING ✓

### 7.1 Preflight Request
```bash
curl -i -X OPTIONS http://localhost:3000/api/students \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET"
```

**Expected:**
- [ ] HTTP 204 No Content
- [ ] `Access-Control-Allow-Origin: http://localhost:3001`
- [ ] `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH`
- [ ] `Access-Control-Allow-Headers: *`
- [ ] `Access-Control-Max-Age: 86400`

### 7.2 Cross-Origin Request
```bash
curl -i http://localhost:3000/api/students \
  -H "Origin: http://localhost:3001" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- [ ] `Access-Control-Allow-Origin: http://localhost:3001`
- [ ] Request succeeds (200/201/etc)
- [ ] CORS headers present

### 7.3 Blocked Origins
```bash
curl -i http://localhost:3000/api/students \
  -H "Origin: http://malicious-site.com" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- [ ] Request still succeeds (CORS is permissive for requests)
- [ ] Browser would block at client-side if origin not whitelist

---

## 8. ENDPOINT-SPECIFIC TESTING ✓

### 8.1 GET /api/students (Pagination)
```bash
# Default pagination
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer $TOKEN"

# Custom page size
curl "http://localhost:3000/api/students?pageSize=50&page=2" \
  -H "Authorization: Bearer $TOKEN"

# Exceeds max
curl "http://localhost:3000/api/students?pageSize=500" \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Default pageSize: 20
- [ ] Default page: 1
- [ ] Max pageSize: 100 (caps if exceeded)
- [ ] Pagination metadata correct
- [ ] Returns correct number of items

### 8.2 POST /api/students (Create)
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "groupId": "uuid-here"
  }'
```

- [ ] Returns 201 Created
- [ ] Resource has ID assigned
- [ ] createdAt timestamp set
- [ ] Validation errors return 422
- [ ] Duplicate ID returns 409

### 8.3 PUT /api/students/:id (Update)
- [ ] Returns 200 OK on success
- [ ] Returns 404 for non-existent ID
- [ ] ID field cannot be modified
- [ ] createdAt field remains unchanged
- [ ] Partial updates allowed
- [ ] Validation errors return 422

### 8.4 POST /api/attendance/bulk (Bulk Operations)
```bash
curl -X POST http://localhost:3000/api/attendance/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"studentId": "uuid1", "sessionId": "session1", "status": "PRESENT"},
      {"studentId": "uuid2", "sessionId": "session1", "status": "ABSENT"}
    ]
  }'
```

- [ ] Max 500 records per request
- [ ] Exceeding limit returns 422
- [ ] All records validated before processing
- [ ] Invalid individual records return field-level errors
- [ ] Valid records still processed on partial success
- [ ] Returns array of results with success/error for each

---

## 9. INPUT SANITIZATION TESTING ✓

### 9.1 XSS Prevention
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "<script>alert(1)</script>",
    "lastName": "Doe"
  }'
```

- [ ] HTML tags stripped or escaped
- [ ] JavaScript stripped: `javascript:alert(1)`
- [ ] Event handlers stripped: `onerror=alert(1)`
- [ ] Data stored safely without XSS payload

### 9.2 SQL Injection Prevention
- [ ] Single quotes in input don't break queries
- [ ] SQL keywords in input harmless
- [ ] Parameterized queries used (Prisma protects this)
- [ ] Input validation prevents injection

**Test:**
```bash
curl "http://localhost:3000/api/students?status=ACTIVE'; DROP TABLE students;--" \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Returns validation error for invalid status
- [ ] No database damage

### 9.3 Path Traversal Prevention
- [ ] File paths in input validated
- [ ] `../` sequences blocked or handled safely
- [ ] Cannot access parent directories

---

## 10. LOAD & STRESS TESTING ✓

### 10.1 Concurrent Requests
```bash
# 10 concurrent requests
ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/students
```

**Metrics:**
- [ ] Requests/sec: > 50
- [ ] Failure rate: 0%
- [ ] Response time: < 500ms avg
- [ ] Max response time: < 2000ms

### 10.2 High Load (1000+ requests)
```bash
# 1000 requests, 50 concurrent
wrk -t 4 -c 50 -d 30s \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/students
```

- [ ] Handles load without crashing
- [ ] Response times degrade gracefully
- [ ] Rate limiting prevents abuse
- [ ] Memory doesn't leak significantly

---

## 11. DATA INTEGRITY TESTING ✓

### 11.1 Concurrent Updates
```bash
# Send 2 PATCH requests simultaneously
curl -X PUT /students/uuid -d '{data1}' &
curl -X PUT /students/uuid -d '{data2}' &
wait
```

- [ ] Last write wins or conflict detected
- [ ] Data not corrupted
- [ ] No race condition data loss

### 11.2 Transaction Integrity
- [ ] Bulk operations atomic (all succeed or all fail)
- [ ] Referential integrity maintained
- [ ] Foreign key constraints enforced

---

## 12. ERROR HANDLING TESTING ✓

### 12.1 Meaningful Error Messages
- [ ] 404 specifies what resource not found
- [ ] 422 lists all validation failures
- [ ] 409 explains why conflict (duplicate ID, etc)
- [ ] Messages are user-friendly (not stack traces)

### 12.2 Error Logging
- [ ] Server errors logged with request ID
- [ ] Stack traces in logs (not in response)
- [ ] Sensitive data not logged

---

## 13. DATABASE TESTING ✓

### 13.1 Data Persistence
- [ ] Data survives server restart
- [ ] Cascading deletes work correctly
- [ ] Unique constraints enforced
- [ ] Foreign keys enforced

### 13.2 Data Migration
- [ ] Schema changes don't break existing data
- [ ] Migration process documented
- [ ] Rollback procedure tested

---

## 14. PERFORMANCE TESTING ✓

### 14.1 Query Performance
- [ ] List endpoints: < 500ms
- [ ] Create endpoints: < 1000ms
- [ ] Update endpoints: < 500ms
- [ ] Bulk operations: < 5s (for 500 records)

### 14.2 Memory Usage
- [ ] Baseline at startup
- [ ] Doesn't increase after repeated requests
- [ ] Rate limiter doesn't leak memory
- [ ] Connection pool properly sized

---

## 15. DOCUMENTATION TESTING ✓

### 15.1 API Documentation
- [ ] All endpoints documented
- [ ] Example requests included
- [ ] Example responses included
- [ ] Error cases documented
- [ ] Rate limits documented
- [ ] Authentication requirements clear
- [ ] Required headers documented
- [ ] Query parameters documented

### 15.2 Error Code Reference
- [ ] All error codes listed
- [ ] Meanings are clear
- [ ] HTTP status mapping correct
- [ ] Solutions/troubleshooting suggested

---

## Summary Report Template

```markdown
# Testing Report - [Date]

## Execution Summary
- Total Tests: __
- Passed: __
- Failed: __
- Skipped: __
- Pass Rate: __%

## Status by Category
- Authentication: ✓ / ✗
- Validation: ✓ / ✗
- Response Format: ✓ / ✗
- HTTP Status Codes: ✓ / ✗
- Rate Limiting: ✓ / ✗
- Security Headers: ✓ / ✗
- CORS: ✓ / ✗
- Endpoints: ✓ / ✗
- Sanitization: ✓ / ✗
- Performance: ✓ / ✗

## Critical Issues Found
1. [Issue description]
   - Impact: High/Medium/Low
   - Resolution: [steps taken]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Sign-off
- Tested by: [Name]
- Date: [Date]
- Approved for production: ✓ / ✗
```
