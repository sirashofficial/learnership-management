# API Testing & Integration Guide

## Quick Start: Run All Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# API smoke tests
npm run test:smoke

# E2E tests
npm run test:e2e
```

---

## Testing Strategy

### 1. Validation Testing

Every API request must validate input against Zod schemas.

**Test: Email Validation**
```javascript
// Valid emails
✓ user@example.com
✓ user+tag@example.com
✓ user.name@example.com

// Invalid emails
✗ user@local (local domain not allowed)
✗ invalid.email (missing @)
✗ user@ (incomplete)
✗ @example.com (missing username)
```

**Test: Password Strength**
```javascript
// Valid passwords
✓ MyPassword123 (8+ chars, upper, lower, number)
✓ SecureP@ss1 (special chars allowed)

// Invalid passwords
✗ password (no uppercase or numbers)
✗ Pass1 (too short)
✗ PASSWORD1 (no lowercase)
✗ password123 (no uppercase)
```

**Test: Date Range Validation**
```javascript
POST /groups
{
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-01-01T00:00:00Z"  // Invalid: end < start
}
// Response: 422 Validation Error
// Message: "End date must be after start date"
```

---

### 2. Authentication & Authorization Testing

**Test: Missing Token**
```bash
GET /students
# Response: 401 Unauthorized
# Error: "Missing or invalid authentication token"
```

**Test: Invalid Token**
```bash
GET /students \
  -H "Authorization: Bearer invalid.token.here"
# Response: 401 Unauthorized
```

**Test: Expired Token**
```bash
GET /students \
  -H "Authorization: Bearer <expired_token>"
# Response: 401 Unauthorized
# Error: "Token has expired"
```

**Test: Valid Token**
```bash
GET /students \
  -H "Authorization: Bearer <valid_token>"
# Response: 200 OK with student list
```

---

### 3. Rate Limiting Testing

**Test: Auth Endpoint Rate Limit (5/15 min)**
```bash
# Attempt 1-5
curl -X POST /api/auth/login -d '{"email":"test@test.com", "password":"pass"}'
# Response: 200 OK (or 401 with wrong credentials)

# Attempt 6
curl -X POST /api/auth/login -d '{"email":"test@test.com", "password":"pass"}'
# Response: 429 Too Many Requests
# Header: Retry-After: 900 (15 minutes)
```

**Test: General API Rate Limit (30/min)**
```bash
# Send 31 requests to /api/students within 60 seconds
for i in {1..31}; do
  curl -X GET /api/students \
    -H "Authorization: Bearer <token>"
done

# First 30 requests: 200 OK
# Request 31: 429 Too Many Requests
```

---

### 4. Response Format Testing

**Test: Success Response Structure**
```javascript
GET /students/uuid

Response must have:
✓ success: true
✓ data: { /* item */ }
✓ message: string (optional)
✓ timestamp: ISO 8601 string
✗ error: should not exist in success response
```

**Test: Paginated Response Structure**
```javascript
GET /students?page=1&pageSize=20

Response must have:
✓ success: true
✓ data: [ /* array */ ]
✓ pagination object with:
  ✓ page: 1
  ✓ pageSize: 20
  ✓ total: number
  ✓ totalPages: number
  ✓ hasMore: boolean
✓ timestamp: ISO 8601
```

**Test: Error Response Structure**
```javascript
GET /students/invalid-uuid

Response must have:
✓ success: false
✓ error: string message
✓ code: error code constant
✓ timestamp: ISO 8601
✗ data: should not contain sensitive info
```

**Test: Validation Error Response Structure**
```javascript
POST /students
{
  "firstName": "",
  "email": "invalid-email"
}

Response must have:
✓ success: false
✓ error: "Validation failed"
✓ code: "VALIDATION_ERROR"
✓ data: [
    { field: "firstName", message: "First name is required" },
    { field: "email", message: "Invalid email address" }
  ]
✓ timestamp: ISO 8601
```

---

### 5. HTTP Status Code Testing

**Test: 200 OK - Successful GET**
```bash
GET /students
# Response: 200 OK with data
```

**Test: 201 Created - Successful POST**
```bash
POST /students
# Response: 201 Created with created resource
```

**Test: 400 Bad Request - Invalid parameters**
```bash
GET /students?pageSize=invalid
# Response: 400 Bad Request
```

**Test: 404 Not Found - Missing resource**
```bash
GET /students/00000000-0000-0000-0000-000000000000
# Response: 404 Not Found
```

**Test: 409 Conflict - Duplicate resource**
```bash
POST /students
{ "studentId": "already-exists" }
# Response: 409 Conflict
```

---

### 6. Security Headers Testing

Verify all responses include required headers:

```bash
curl -i GET /students \
  -H "Authorization: Bearer <token>"

# Check for headers:
✓ X-Frame-Options: DENY
✓ X-Content-Type-Options: nosniff
✓ X-XSS-Protection: 1; mode=block
✓ Strict-Transport-Security: max-age=31536000
✓ Content-Security-Policy: present
✓ Referrer-Policy: strict-origin-when-cross-origin
✓ Permissions-Policy: present
```

---

### 7. CORS Testing

**Test: Preflight Request**
```bash
curl -i -X OPTIONS /students \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"

# Response: 204 No Content with CORS headers
✓ Access-Control-Allow-Origin: http://localhost:3000
✓ Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
✓ Access-Control-Max-Age: 86400
```

**Test: Cross-Origin Request**
```bash
curl -i -X GET /students \
  -H "Origin: http://localhost:3000" \
  -H "Authorization: Bearer <token>"

# Response includes:
✓ Access-Control-Allow-Origin: http://localhost:3000
✓ Access-Control-Allow-Credentials: true
```

---

### 8. Pagination Testing

**Test: Default Pagination**
```bash
GET /students
# pageSize defaults to 20, page defaults to 1
```

**Test: Custom Page Size**
```bash
GET /students?pageSize=50
# Returns 50 items per page
```

**Test: Max Page Size**
```bash
GET /students?pageSize=500
# Capped at max 100 items per page
```

**Test: Beyond Last Page**
```bash
GET /students?page=999
# Returns empty array with hasMore: false
```

---

### 9. Filtering & Sorting Testing

**Test: Filter by Status**
```bash
GET /students?status=ACTIVE
# Only returns students with status ACTIVE
```

**Test: Filter by Group**
```bash
GET /students?groupId=uuid-123
# Only returns students in that group
```

**Test: Combine Filters**
```bash
GET /students?status=ACTIVE&groupId=uuid-123
# Returns students that match BOTH conditions
```

---

### 10. Bulk Operations Testing

**Test: Bulk Attendance - Valid**
```bash
POST /attendance/bulk
{
  "records": [
    { "studentId": "uuid1", "sessionId": "session1", "status": "PRESENT" },
    { "studentId": "uuid2", "sessionId": "session1", "status": "ABSENT" }
  ]
}
# Response: 200 OK - All processed
```

**Test: Bulk Attendance - Exceeds Limit**
```bash
POST /attendance/bulk
{
  "records": [ /* 501 items */ ]
}
# Response: 422 Validation Error
# Error: "Cannot process more than 500 records at once"
```

**Test: Bulk Attendance - Partial Invalid**
```bash
POST /attendance/bulk
{
  "records": [
    { "studentId": "invalid-uuid", "sessionId": "s1", "status": "PRESENT" },
    { "studentId": "uuid2", "sessionId": "s1", "status": "INVALID_STATUS" }
  ]
}
# Response: 422 Validation Error with field-specific errors
```

---

### 11. Content Size Limits Testing

**Test: Within Size Limit**
```bash
POST /students
# Request body: ~2KB
# Response: 201 Created
```

**Test: Exceeds Size Limit (5MB default)**
```bash
POST /students
# Request body: 10MB
# Response: 413 Payload Too Large
# Error: "Request body exceeds maximum size of 5.00MB"
```

---

### 12. Data Immutability Testing

**Test: Modify Read-Only Fields**
```bash
PUT /students/uuid
{
  "id": "different-uuid",
  "createdAt": "2020-01-01T00:00:00Z"
}
# ID and createdAt should not change
```

---

### 13: Concurrent Request Testing

**Test: Race Condition Prevention**
```bash
# Send 2 requests to create the same student simultaneously
curl -X POST /students -d '{"studentId": "same-id", ...}' &
curl -X POST /students -d '{"studentId": "same-id", ...}' &
wait

# One succeeds (201)
# Other fails (409 Conflict) - Unique constraint violation
```

---

## Example Test Suite (Jest/Vitest)

```typescript
describe('Students API', () => {
  describe('GET /students', () => {
    it('should return paginated list with auth', async () => {
      const response = await fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.pagination).toBeDefined();
      expect(json.data).toBeInstanceOf(Array);
    });

    it('should return 401 without auth', async () => {
      const response = await fetch('/api/students');
      expect(response.status).toBe(401);
    });

    it('should validate pageSize max 100', async () => {
      const response = await fetch('/api/students?pageSize=500', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const json = await response.json();
      expect(json.pagination.pageSize).toBeLessThanOrEqual(100);
    });
  });

  describe('POST /students', () => {
    it('should create student with all required fields', async () => {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          groupId: 'valid-uuid'
        })
      });
      
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.firstName).toBe('John');
    });

    it('should reject invalid email', async () => {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          groupId: 'valid-uuid'
        })
      });
      
      expect(response.status).toBe(422);
      const json = await response.json();
      expect(json.error).toBe('Validation failed');
      expect(json.data).toContainEqual(
        expect.objectContaining({ field: 'email' })
      );
    });
  });
});
```

---

## Performance Testing

### Load Testing
```bash
# Test with 100 concurrent requests
ab -n 100 -c 100 \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/students
```

### Stress Testing
```bash
# Maintain load for 60 seconds
wrk -t 4 -c 100 -d 60s \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/students
```

---

## Monitoring & Debugging

### Enable Verbose Logging
```bash
DEBUG=* npm run dev
```

### Check Rate Limiter State
```bash
# In application logs:
# "RateLimit: key='ip:192.168.1.1' count=5/30 (remaining: 25)"
```

### Inspect Security Headers
```bash
curl -i http://localhost:3000/api/students \
  -H "Authorization: Bearer <token>" \
| grep -i "X-"
```

---

## Troubleshooting Test Failures

### 401 in Tests?
- Check token is valid
- Verify token not expired
- Ensure auth_token cookie set

### 422 Validation Error?
- Check error.data for field details
- Verify all required fields present
- Check field lengths/formats

### 429 Rate Limited?
- Wait for Retry-After seconds
- Implement backoff in tests
- Use test fixtures/mocks for repeated calls

### Flaky Tests?
- Use `beforeEach` to reset state
- Mock external API calls
- Set realistic timeouts
- Use test databases, not production
