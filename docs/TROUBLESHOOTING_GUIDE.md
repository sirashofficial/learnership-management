# Troubleshooting & Common Issues Guide

## Quick Reference

### Symptom → Solution Map

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| 401 Unauthorized | Missing/invalid token | Check Authorization header, refresh token |
| 429 Too Many Requests | Rate limited | Wait 15 minutes, check rate limit settings |
| 500 Internal Server Error | Server error | Check logs, Sentry, restart if needed |
| Database timeout | Connection pool exhausted | Restart service, check concurrent requests |
| Slow response times | High load/unoptimized query | Check logs, enable caching, add DB indexes |
| Memory leak | Process growing over time | Restart service, enable heap profiling |
| CORS error | Origin not whitelisted | Check CORS config, add origin to whitelist |
| Email validation fails | Invalid format | Verify email format (alphanumeric@domain.ext) |
| Password validation fails | Weak password | Must include uppercase, lowercase, numbers, 8+ chars |

---

## 1. Authentication & Authorization Issues

### Issue 1.1: "Invalid Token" Error

**Error Message:**
```
{
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

**Root Causes:**
- Token is expired (>24 hours old)
- Token signature is invalid
- Token format is incorrect
- Token was from different environment

**Solutions:**

**Step 1: Verify Token Format**
```bash
# Check Authorization header format
curl -H "Authorization: Bearer eyJhbGc..." https://api.example.com/api/students

# Incorrect formats (common mistakes):
# ❌ Authorization: eyJhbGc...         (missing "Bearer")
# ❌ Authorization: Token eyJhbGc...   (wrong prefix)
# ❌ Authorization: bearer eyJhbGc...  (lowercase - case sensitive)
```

**Step 2: Check Token Expiry**
```bash
# Decode token to check expiration
node -e "
const token = 'YOUR_TOKEN_HERE';
const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
console.log('Expires:', new Date(decoded.exp * 1000));
console.log('Now:', new Date());
"
```

**Step 3: Generate New Token**
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "yourpassword"
}

# Response will include new token
# Store in Authorization header or cookie
```

**Step 4: Verify Environment**
```bash
# Ensure you're using correct API endpoint
# Development: http://localhost:3000
# Staging: https://staging.example.com
# Production: https://api.example.com

# Tokens generated in one environment won't work in another
```

---

### Issue 1.2: "Unauthorized - Insufficient Permissions"

**Error Message:**
```
{
  "error": "Unauthorized",
  "message": "Insufficient permissions for this action"
}
```

**Root Causes:**
- User role doesn't have required permission
- Attempting to access another user's data
- Feature restricted to admin/manager only

**Solutions:**

**Step 1: Check User Role**
```bash
# Verify logged-in user role
GET /api/auth/me
# Response includes: { role: "USER/ADMIN/MANAGER/ASSESSOR" }
```

**Step 2: Check Permission Requirements**
```
Required Permissions by Endpoint:
- POST /api/students        → role: ADMIN, MANAGER
- GET /api/students         → role: ADMIN, MANAGER, ASSESSOR
- PUT /api/groups/:id       → role: ADMIN, MANAGER
- POST /api/assessments/:id/grade → role: ADMIN, MANAGER, ASSESSOR
- DELETE /api/users/:id     → role: ADMIN only
```

**Step 3: Request Role Upgrade (Admin only)**
```bash
# Admin can change user role
PUT /api/users/{userId}
{
  "role": "MANAGER"
}
```

---

### Issue 1.3: Token Expiry During Long Session

**Symptom:**
- Works fine for 24 hours
- Suddenly get "Invalid token" errors
- User must log in again

**Solutions:**

**Option 1: Implement Token Refresh**
```typescript
// Client-side (automatic refresh)
const response = await fetch('/api/students', {
  headers: { Authorization: `Bearer ${token}` }
});

if (response.status === 401) {
  // Try to refresh token
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  
  if (refreshResponse.ok) {
    const { token: newToken } = await refreshResponse.json();
    // Retry original request with new token
  }
}
```

**Option 2: Extend Token Expiry**
```typescript
// Server-side: src/lib/auth.ts
// Change token expiry time
const token = jwt.sign(
  payload,
  process.env.JWT_SECRET,
  { expiresIn: '48h' } // Increased from 24h
);
```

---

## 2. Validation Errors

### Issue 2.1: Email Validation Fails

**Error Message:**
```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

**Root Causes:**
- Invalid email format
- Email contains spaces or special characters
- Email uses invalid top-level domain
- Email ends in .local (reserved)

**Valid Email Formats:**
```
✓ john@example.com
✓ john.smith@example.co.uk
✓ john+learnership@example.com
✓ j.s_123@sub.example.com
```

**Invalid Email Formats:**
```
✗ john@example         (missing TLD)
✗ john @example.com    (space in email)
✗ john@example.local   (.local is reserved)
✗ john..smith@exam.com (consecutive dots)
✗ john@.com            (missing domain)
```

**Solution:**
```bash
# Test email format
node -e "
const email = 'john@example.com';
const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@.]+\$/;
console.log('Valid:', regex.test(email));
"
```

---

### Issue 2.2: Password Validation Fails

**Error Message:**
```json
{
  "success": false,
  "errors": [
    { "field": "password", "message": "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number" }
  ]
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- No specific special character required

**Valid Passwords:**
```
✓ MyPassword123
✓ SecurePass99
✓ Learn2024Pro
✓ abc123DEF456
```

**Invalid Passwords:**
```
✗ password123       (no uppercase)
✗ PASSWORD123       (no lowercase)
✗ PasswordAbc       (no number)
✗ Pass1             (too short - 5 chars)
✗ 12345678          (no letters)
```

**Solution:**
```bash
node -e "
const password = 'MyPassword123';
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}\$/;
console.log('Valid:', regex.test(password));
"
```

---

### Issue 2.3: Phone Number Validation

**Error Message:**
```json
{
  "errors": [
    { "field": "phoneNumber", "message": "Invalid phone number format" }
  ]
}
```

**Accepted Phone Formats:**
```
South African:
✓ +27123456789      (with country code)
✓ +27 123 456 789   (with spaces)
✓ 0123456789        (local format)

International:
✓ +1-555-123-4567   (US)
✓ +44-20-XXXX-XXXX  (UK)
✓ +86-10-XXXX-XXXX  (China)

Format Rules:
- 10-15 digits
- Can include +, -, (), spaces
- Country prefix optional (except required for international numbers)
```

**Solution:**
```bash
# Validate phone number
node -e "
const phone = '+27123456789';
const regex = /^\\+?[\\d\\s()\\-]{9,15}\$/;
console.log('Valid:', regex.test(phone));
"
```

---

### Issue 2.4: UUID Validation

**Error Message:**
```json
{
  "errors": [
    { "field": "studentId", "message": "Invalid UUID format" }
  ]
}
```

**Valid UUID Format:**
```
✓ 550e8400-e29b-41d4-a716-446655440000  (standard)
✓ 550e8400e29b41d4a716446655440000      (without hyphens)
```

**Invalid Formats:**
```
✗ 550e8400-e29b-41d4-a716                (incomplete)
✗ student-123                             (custom ID, not UUID)
✗ 550e8400_e29b_41d4_a716_446655440000  (underscore instead of dash)
```

**Solution:**
```bash
# Check if valid UUID
node -e "
const uuid = '550e8400-e29b-41d4-a716-446655440000';
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\$/i;
console.log('Valid:', uuidRegex.test(uuid));
"
```

---

## 3. Rate Limiting Issues

### Issue 3.1: "429 Too Many Requests"

**Error Message:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 900
{
  "error": "Rate limit exceeded",
  "retryAfter": 900
}
```

**Rate Limits by Endpoint:**
```
Authentication Endpoints:
- POST /api/auth/login        → 5 requests per 15 minutes (per IP)
- POST /api/auth/register     → 3 requests per hour (per IP)

Standard API:
- GET /api/*                  → 30 requests per minute (per user)
- POST /api/*                 → 10 requests per minute (per user)
- PUT /api/*                  → 5 requests per minute (per user)

File Upload:
- POST /api/upload            → 20 requests per hour (per user)
```

**Solutions:**

**Step 1: Wait and Retry**
```bash
# Check Retry-After header
# Wait that many seconds before next request
# Default: 15 minutes for auth, 1 minute for API

# After 15 minutes, retry
sleep 900
curl https://api.example.com/api/students
```

**Step 2: Reduce Request Frequency**
```bash
# ❌ Bad: Send 30 requests in 1 second
for i in {1..30}; do
  curl https://api.example.com/api/students
done

# ✓ Good: Send 30 requests over 60 seconds
for i in {1..30}; do
  curl https://api.example.com/api/students
  sleep 2
done
```

**Step 3: Implement Exponential Backoff (Client)**
```typescript
async function makeRequest(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        const delay = Math.pow(2, i) * retryAfter * 1000; // Exponential backoff
        console.log(`Rate limited. Waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

**Step 4: Whitelist IP (Admin)**
```bash
# Add trusted IPs to bypass rate limiting
# In src/lib/security.ts, add to rateLimiterBypass array
const rateLimiterBypass = [
  '192.168.1.100',      // Office IP
  '10.0.0.50',          // Server IP
];
```

---

### Issue 3.2: Rate Limiter Misidentifies User

**Symptom:**
- Getting 429 errors despite low usage
- Multiple users on same network all get 429s
- Works fine on different network

**Cause:**
- IP-based rate limiting incorrectly groups users
- NAT/proxy causes multiple users to share IP
- Load balancer not forwarding client IP

**Solutions:**

**Option 1: Use User-based Limiting**
```typescript
// src/lib/security.ts
// Instead of tracking by IP, track by userId
const userRateLimiter = new RateLimiter();
const userKey = `user:${userId}:${endpoint}`;
userRateLimiter.check(userKey, limit);
```

**Option 2: Whitelist Local Network**
```typescript
// Skip rate limiting for internal IPs
if (isInternalIP(request.ip)) {
  return next(); // Skip rate limiting
}
```

**Option 3: Increase Rate Limit**
```typescript
// src/lib/security.ts
const rateLimitPresets = {
  standard: { requests: 60, window: 60 }, // Doubled from 30
  auth: { requests: 10, window: 900 },    // Doubled from 5
};
```

---

## 4. Database Issues

### Issue 4.1: Database Connection Failed

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Root Causes:**
- Database server not running
- Wrong connection string
- Wrong host/port
- Firewall blocking connection

**Solutions:**

**Step 1: Verify Database Service Running**
```bash
# PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# MySQL
sudo systemctl status mysql
sudo systemctl start mysql

# SQLite (file-based)
ls -la db.sqlite3
```

**Step 2: Check Connection String**
```bash
# .env file should have
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Verify format:
# postgresql://[user[:password]@][host[:port]][/dbname]

# Common values:
# Local development: postgresql://postgres:password@localhost:5432/learnership
# Docker: postgresql://postgres:password@postgres:5432/learnership
# Cloud (AWS RDS): postgresql://user:pass@db.xxx.rds.amazonaws.com:5432/learnership
```

**Step 3: Test Connection**
```bash
# PostgreSQL
psql -h localhost -U postgres -d learnership -c "SELECT 1"

# MySQL
mysql -h localhost -u root -p learnership -e "SELECT 1"

# Connection string test
npm run prisma db push --skip-generate
```

**Step 4: Check Firewall**
```bash
# PostgreSQL default port: 5432
# Check if port is accessible
netstat -tuln | grep 5432

# Or
telnet localhost 5432
```

---

### Issue 4.2: Database Connection Pool Exhausted

**Error Message:**
```
Error: Cannot get a connection, pool error Timeout ...
Error: too many connections
```

**Root Causes:**
- Connection pool size too small for load
- Connections not being released
- Long-running queries blocking connections
- Multiple processes opening connections

**Solutions:**

**Step 1: Check Pool Size**
```typescript
// .env
DATABASE_URL="postgresql://...?schema=public&connection_limit=20"
//                                                   ^ pool size

// Default: 5 (too small for production)
// Recommended: 20 for single server, 5-10 per server in cluster
```

**Step 2: Monitor Active Connections**
```sql
-- PostgreSQL
SELECT 
  datname, 
  count(*) as connections,
  max(now() - pg_stat_activity.query_start)::interval as longest_query
FROM pg_stat_activity
GROUP BY datname;

-- MySQL
SHOW PROCESSLIST;

-- Check for idle connections
SELECT * FROM pg_stat_activity WHERE state = 'idle';
```

**Step 3: Kill Long-Running Queries**
```sql
-- PostgreSQL: Find slow query
SELECT pid, now() - pg_stat_activity.query_start, query 
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Kill it
SELECT pg_terminate_backend(pid);

-- MySQL
KILL QUERY process_id;
```

**Step 4: Increase Pool Size**
```bash
# Update .env
DATABASE_URL="postgresql://...?connection_limit=30"

# Restart application
npm run build
npm run start
```

---

### Issue 4.3: Slow Queries

**Symptom:**
- API responses take >1 second
- Database CPU usage high
- Logs show slow query warnings

**Solutions:**

**Step 1: Enable Query Logging**
```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`SLOW QUERY (${e.duration}ms): ${e.query}`);
  }
});
```

**Step 2: Find Slow Queries**
```bash
# View last 20 lines of log (should be JSON format)
tail -20 /var/log/learnership/combined.log | grep "duration"

# Or use Sentry to see slow requests
# Look for requests with duration >1000ms
```

**Step 3: Add Missing Indexes**
```sql
-- Example: slow student list query
CREATE INDEX idx_student_group_status ON "Student"(groupId, status);

-- Verify index is used
EXPLAIN ANALYZE SELECT * FROM Student WHERE groupId = 'g-123' AND status = 'ACTIVE';
```

**Step 4: Optimize Query**
```typescript
// ❌ Slow: N+1 query
const students = await prisma.student.findMany();
for (const student of students) {
  student.group = await prisma.group.findUnique({ where: { id: student.groupId } });
}

// ✓ Fast: Single query with join
const students = await prisma.student.findMany({
  include: { group: true } // Joins in single query
});
```

---

## 5. API Response Issues

### Issue 5.1: Unexpected Response Format

**Error:**
```json
{
  "error": "Cannot read property 'data' of undefined"
}
```

**Root Cause:**
- API not returning expected format
- Response wrapper missing
- Different endpoint with different format

**Solutions:**

**Verify Standard Response Format:**
```typescript
// Expected format for all endpoints
{
  "success": true,
  "data": { /* actual data */ },
  "timestamp": "2026-02-15T10:30:00Z",
  "pagination": {
    // Only for list endpoints
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}

// For errors
{
  "success": false,
  "error": "Not found",
  "code": "NOT_FOUND",
  "timestamp": "2026-02-15T10:30:00Z"
}

// For validation errors
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ],
  "code": "VALIDATION_ERROR"
}
```

**Usage Example:**
```typescript
const response = await fetch('/api/students');
const json = await response.json();

if (json.success) {
  const data = json.data;           // Array or object
  const total = json.pagination.total; // If paginated
} else if (json.errors) {
  // Validation errors
  json.errors.forEach(err => console.log(err.field, err.message));
} else {
  // Other errors
  console.error(json.error, json.code);
}
```

---

### Issue 5.2: 404 Not Found Errors

**Symptom:**
```
GET /api/students/invalid-id
Response: 404 Not Found
```

**Root Causes:**
- Wrong URL path
- ID doesn't exist
- Resource was deleted
- Typo in endpoint name

**Solutions:**

**Step 1: Verify Endpoint URL**
```
Correct format:
- GET  /api/students          (list)
- GET  /api/students/:id      (get one)
- POST /api/students          (create)
- PUT  /api/students/:id      (update)
- DELETE /api/students/:id    (delete)

Common typos:
❌ /api/student/id            (singular instead of plural)
❌ /api/students/find/:id     (extra path segment)
❌ /api/students/:id/details  (extra path segment)
```

**Step 2: Verify ID Exists**
```bash
# List all students to find correct ID
curl -H "Authorization: Bearer token" \
  "https://api.example.com/api/students?page=1&pageSize=50"

# Take ID from response and use it
curl -H "Authorization: Bearer token" \
  "https://api.example.com/api/students/st-123"
```

**Step 3: Check if Resource Deleted**
```bash
# Try to get it
GET /api/students/st-123
# 404 means it was deleted or never existed

# Option A: Look in deletion logs
grep "DELETE" /var/log/learnership/combined.log | grep st-123

# Option B: Restore from backup
# Ask DevOps to restore from previous backup
```

---

### Issue 5.3: Empty Response Data

**Symptom:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0
  }
}
```

**Possible Causes:**
- No records match filter
- Wrong filter parameters
- User doesn't have permission to see records
- Records exist but in different group/status

**Solutions:**

**Step 1: Remove Filters and Retry**
```bash
# With filters (returns nothing)
GET /api/students?status=WITHDRAWN&groupId=g-999

# Without filters (returns all)
GET /api/students

# If data returned without filters, issue is with filters
```

**Step 2: Check Filter Parameters**
```bash
# Valid status values
status=ACTIVE | COMPLETED | WITHDRAWN | SUSPENDED

# Valid sort orders
sort=email,asc
sort=enrollmentDate,desc

# Check current valid values
GET /api/students?page=1&pageSize=100 # Get all, see what's there
```

**Step 3: Verify Permissions**
```bash
# Some endpoints filter results based on user role
# Example: users can only see their own data

# If you're a USER role, you might get empty array
# Try with ADMIN role to see all records

# Check your role
GET /api/auth/me
# { role: "USER" }
# Ask admin to change role to MANAGER
```

---

## 6. Performance Issues

### Issue 6.1: Slow API Responses

**Symptom:**
- Requests take >2 seconds
- Error rate increases during peak hours
- Response time degradation over time

**Solutions:**

**Step 1: Check Current Performance**
```bash
# Measure API response time
time curl -H "Authorization: Bearer token" \
  https://api.example.com/api/students

# Real time: 2.500 seconds
# User: 0.100s, System: 0.050s, Real: 2.500s
# ^ 2.5 second response time is slow (target <500ms)
```

**Step 2: Identify Bottleneck**
```bash
# Check which component is slow
# In .env, enable detailed logging
LOG_LEVEL=debug

# Run request again and check logs
tail -f /var/log/learnership/combined.log

# Look for slow queries (>100ms)
# Look for slow HTTP calls (>500ms)
# Look for middleware delays

# From logs you'll see:
# - Database query took 2000ms (too slow!)
# - API call to external service took 1500ms
# - Middleware processing took 100ms
```

**Step 3: Implement Caching**
```typescript
// src/lib/cache.ts
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

function get(key: string) {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.value;
  }
  cache.delete(key);
  return null;
}

function set(key: string, value: any, ttl = CACHE_TTL) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

// Usage in route
export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get('groupId');
  const cacheKey = `students:${groupId}`;
  
  let data = get(cacheKey);
  if (!data) {
    data = await prisma.student.findMany({ where: { groupId } });
    set(cacheKey, data);
  }
  
  return NextResponse.json({ data });
}
```

**Step 4: Optimize Database Queries**
```sql
-- Check query execution plan
EXPLAIN ANALYZE SELECT * FROM Student WHERE groupId = 'g-123';

-- If using sequential scan (slow), add index
CREATE INDEX idx_student_group ON "Student"(groupId);

-- Re-run EXPLAIN - should now use index
EXPLAIN ANALYZE SELECT * FROM Student WHERE groupId = 'g-123';
```

---

### Issue 6.2: Memory Usage Growing

**Symptom:**
- Memory grows over time
- Eventually OOM (Out of Memory) error
- Restart needed daily

**Solutions:**

**Step 1: Monitor Memory**
```bash
# Check Node.js process memory
ps aux | grep node
# NODE     PID  CPU  MEM    VSZ    RSS
# node   12345  0.5  4.2%   1.2GB  450MB
# ^ Growing from 100MB to 450MB = leak

# Or use built-in
node --expose-gc -e "setInterval(() => {
  const mem = process.memoryUsage();
  console.log('Memory:', {
    heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(mem.external / 1024 / 1024) + 'MB'
  });
}, 5000)"
```

**Step 2: Find Memory Leak**
```bash
# Install heap snapshot tool
npm install --save-dev v8-profiler-next

# Take heap snapshot
node -e "require('v8-profiler-next').startProfiling()"
# Let app run for 5 minutes
node -e "require('v8-profiler-next').stopProfiling()"

# Analyze with Chrome DevTools
```

**Step 3: Common Causes & Fixes**

**Cause 1: Unbounded Cache**
```typescript
// ❌ Bad: Cache grows infinitely
const cache = new Map();
function addToCache(key, value) {
  cache.set(key, value); // Never cleared!
}

// ✓ Good: Cache with size limit
class LimitedCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

**Cause 2: Event Listener Leak**
```typescript
// ❌ Bad: Never removes listeners
prisma.$on('query', (e) => {
  // Listener added but never removed
});

// ✓ Good: Remove listeners
const handler = (e) => { /* ... */ };
prisma.$on('query', handler);
// Later: prisma.$off('query', handler);
```

**Cause 3: Unreleased Database Connections**
```typescript
// ❌ Bad: Connection never closed
const client = new pg.Client();
await client.connect();
await client.query('SELECT 1');
// Never: await client.end();

// ✓ Good: Use connection pooling
// Prisma handles this automatically
const user = await prisma.user.findUnique({ where: { id } });
// Connection returned to pool automatically
```

**Step 4: Force Garbage Collection (Emergency)**
```bash
# Restart service to clear memory
sudo systemctl restart learnership

# Or schedule automatic restart
# crontab -e
0 3 * * * systemctl restart learnership  # 3am daily
```

---

## 7. Build & Deployment Issues

### Issue 7.1: Build Failing

**Error Message:**
```
error: 'beforeAll' is not defined
error TS2304: Cannot find name 'beforeAll'
```

**Root Cause:**
- Test files included in production build
- TypeScript trying to compile test files

**Solution:**
```typescript
// tsconfig.json
{
  "exclude": [
    "tests",
    "**/*.test.ts",
    "**/*.test.tsx",
    "vitest.config.ts"
  ]
}
```

**Verify Fix:**
```bash
npm run build
# Should now succeed
```

---

### Issue 7.2: "Cannot find module" in Production

**Error:**
```
Error: Cannot find module '@/lib/auth'
```

**Cause:**
- Path alias not configured
- Import path incorrect
- File doesn't exist in output

**Solution:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

// next.config.js must also configure paths
module.exports = {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src/')
    };
    return config;
  }
};
```

---

## 8. Communication & Notification Issues

### Issue 8.1: Notifications Not Sending

**Symptom:**
- User signs up but no email confirmation
- Assessment graded but no notification

**Solutions:**

**Step 1: Check If Notification Service Configured**
```bash
# .env should have
MAIL_PROVIDER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@example.com
MAIL_PASSWORD=app_password
```

**Step 2: Test Email Service**
```typescript
// Test email sending
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

transporter.sendMail({
  from: process.env.MAIL_USER,
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test email'
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Email sent:', info.response);
});
```

**Step 3: Check Notification Logs**
```bash
# Search for notification-related errors
grep -i "email\|notification" /var/log/learnership/error.log

# Common issues:
# - "Invalid email" → Check email format
# - "Authentication failed" → Check credentials
# - "Connection timeout" → Check firewall
```

---

## 9. Security Issues

### Issue 9.1: CORS Error

**Error:**
```
Access to XMLHttpRequest at 'https://api.example.com:443/api/students' 
from origin 'https://app.example.com' has been blocked by CORS policy
```

**Root Causes:**
- Origin not whitelisted
- Preflight request failing
- Headers not allowed

**Solutions:**

**Step 1: Add Origin to Whitelist**
```typescript
// src/middleware.ts
const allowedOrigins = [
  'https://app.example.com',
  'https://manage.example.com',
  'http://localhost:3001' // Development
];

if (allowedOrigins.includes(request.headers.get('origin'))) {
  response.headers.set('Access-Control-Allow-Origin', origin);
}
```

**Step 2: Verify Headers Allowed**
```typescript
// src/middleware.ts
response.headers.set(
  'Access-Control-Allow-Headers',
  'Content-Type, Authorization'
);
response.headers.set(
  'Access-Control-Allow-Methods',
  'GET, POST, PUT, DELETE, OPTIONS'
);
```

**Step 3: Test CORS**
```bash
# Preflight request (OPTIONS)
curl -X OPTIONS https://api.example.com/api/students \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Should return 200 with CORS headers
```

---

## Quick Solutions Reference

```bash
# Memory usage high?
curl http://localhost:3000/api/health | jq '.memory'

# Database slow?
Tail database logs and look for queries >100ms

# API errors?
Check Sentry: https://sentry.io

# Rate limited?
Wait 15 minutes for auth, 1 minute for API

# Need token?
POST /api/auth/login with credentials

# Forgot password?
POST /api/auth/reset-password with email

# Still stuck?
1. Check logs: /var/log/learnership/error.log
2. Check Sentry for error traces
3. Review API response status code
4. Verify environment variables
5. Restart service: systemctl restart learnership
```

---

## Escalation Path

**For Different Issues:**

**Development Issues:**
- Check local logs: npm run dev (check console)
- Check browser console for client errors
- Verify .env file has all variables

**Staging Issues:**
- Check staging server logs: /var/log/learnership/
- Check Sentry for error patterns
- Compare with development setup

**Production Issues (SEV1/SEV2):**
1. Page on-call engineer immediately
2. Check health endpoint: /api/health
3. Verify database connectivity
4. Check error rate in Sentry
5. Consider rollback if recent deployment

**For Extended Outages:**
1. Document incident
2. Notify stakeholders
3. Implement workaround if possible
4. Create post-mortem
5. Implement prevention measures

