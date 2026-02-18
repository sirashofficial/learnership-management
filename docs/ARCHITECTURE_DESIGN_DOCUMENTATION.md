# System Architecture & Design Documentation

## System Overview

The Learnership Management System is a modern, production-grade learning management platform built with Next.js, Prisma, and TypeScript. It manages students, groups, assessments, and attendance tracking across a multi-group educational environment.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard  │  │   Analytics  │  │  Settings    │          │
│  │   (React)    │  │   (React)    │  │  (React)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/TLS
          ┌──────────────────▼──────────────────┐
          │      MIDDLEWARE LAYER               │
          │  ┌────────────────────────────────┐ │
          │  │  CORS & Security Headers       │ │
          │  │  Rate Limiting                 │ │
          │  │  JWT Verification              │ │
          │  │  Request/Response Logging      │ │
          │  └────────────────────────────────┘ │
          └──────────────────┬──────────────────┘
                             │
┌─────────────────────────────▼──────────────────────────────────┐
│                     API LAYER (Routes)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ /api/auth    │  │ /api/students│  │ /api/groups  │         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ login        │  │ GET (paging) │  │ GET          │         │
│  │ register     │  │ POST (create)│  │ POST         │         │
│  │ changepass   │  │ PUT (update) │  │ PUT          │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │/api/assess   │  │/api/attend   │  │/api/sessions│         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ GET (filter) │  │ POST (single)│  │ Generate     │         │
│  │ POST (create)│  │ POST (bulk)  │  │ Timetable    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────┬──────────────────────────────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
┌─────────▼────────────┐          ┌────────────▼──────────┐
│  VALIDATION LAYER    │          │  SECURITY LAYER      │
│ ┌──────────────────┐ │          │ ┌──────────────────┐ │
│ │ Zod Schemas      │ │          │ │ Input Sanitize   │ │
│ │ - 12+ schemas    │ │          │ │ XSS Prevention   │ │
│ │ - Custom valid.  │ │          │ │ SQL Injection    │ │
│ │ - Field errors   │ │          │ │ Path Traversal   │ │
│ │ - Bulk limits    │ │          │ │ Suspicious       │ │
│ └──────────────────┘ │          │ │ Pattern Detect   │ │
└─────────┬────────────┘          └────────────┬──────────┘
          │                                     │
          └─────────────────────┬───────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                   DATA ACCESS LAYER                         │
│            ┌────────────────────────────────┐               │
│            │  Prisma ORM                    │               │
│            │  ┌──────────────────────────┐  │               │
│            │  │ Query Optimization       │  │               │
│            │  │ Auto-parameterization    │  │               │
│            │  │ Type Safety (TypeScript) │  │               │
│            │  │ Connection Pooling       │  │               │
│            │  └──────────────────────────┘  │               │
│            └─────────────────┬───────────────┘               │
└────────────────────────────────┼───────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   DATABASE LAYER       │
                    │  PostgreSQL/MySQL      │
                    │  /SQLite (Dev)         │
                    │                        │
                    │  Models:               │
                    │  - User                │
                    │  - Student             │
                    │  - Group               │
                    │  - Assessment          │
                    │  - Session             │
                    │  - Attendance          │
                    │  - Module              │
                    │  - UnitStandard        │
                    └────────────────────────┘
```

---

## Layer Descriptions

### 1. Client Layer
- Next.js React components
- Server-side rendering for SEO
- Static page generation where applicable
- Client-side state management
- Real-time updates with WebSockets (optional)

### 2. Middleware Layer
**Location:** `src/middleware.ts`

**Responsibilities:**
- CORS preflight handling
- Security header injection (9 headers)
- JWT token verification
- Rate limiting enforcement
- Request/response logging
- Protected route redirection

**Flow:**
1. Receive incoming request
2. Check CORS origin (if OPTIONS, return 204)
3. Verify JWT token (for protected routes)
4. Apply security headers
5. Check rate limits
6. Log request details
7. Forward to appropriate route

### 3. API Layer (Routes)
**Location:** `src/app/api/**/*.ts`

**Route Structure:**
```
/api/
├── auth/
│   ├── login → POST
│   ├── register → POST
│   └── change-password → POST
├── students/
│   ├── [id] → GET, PUT, DELETE
│   └── → GET (paginated list), POST (create)
├── groups/
│   ├── [id] → GET, PUT, DELETE
│   └── → GET (paginated list), POST (create)
├── assessments/
│   ├── [id] → GET, PUT, DELETE
│   ├── stats → GET (statistics)
│   ├── by-group → GET (filter)
│   └── → GET (paginated list), POST (create)
├── attendance/
│   ├── [id] → GET
│   ├── bulk → POST (500 max records)
│   └── → POST (single record)
└── sessions/
    ├── generate → POST (create timetable)
    └── → GET (list sessions)
```

**Response Format:**
```typescript
// Success
{
  success: true,
  data: { /* resource */ },
  timestamp: "2026-02-15T10:30:00Z"
}

// Paginated
{
  success: true,
  data: [ /* items */ ],
  pagination: { page, pageSize, total, totalPages, hasMore },
  timestamp: "2026-02-15T10:30:00Z"
}

// Error
{
  success: false,
  error: "message",
  code: "ERROR_CODE",
  timestamp: "2026-02-15T10:30:00Z"
}

// Validation Error
{
  success: false,
  error: "Validation failed",
  code: "VALIDATION_ERROR",
  data: [
    { field: "email", message: "Invalid email format" },
    { field: "password", message: "Password too weak" }
  ],
  timestamp: "2026-02-15T10:30:00Z"
}
```

### 4. Validation Layer
**Location:** `src/lib/validations.ts`

**Validators:**
- emailValidator - Format + no .local domains
- passwordValidator - 8+ chars, uppercase, lowercase, numbers
- phoneValidator - International + local formats
- uuidValidator - Standard UUID format
- dateRangeValidator - End > Start
- bulkOperationValidator - Max 500 items
- contentLengthValidator - Field length limits

**Schemas (12+):**
```typescript
// Authentication
- loginSchema
- registerSchema
- changePasswordSchema

// Students
- createStudentSchema
- updateStudentSchema
- paginationSchema
- filterSchema

// Groups
- createGroupSchema
- updateGroupSchema

// Assessments
- createAssessmentSchema

// Attendance
- markAttendanceSchema
- bulkMarkAttendanceSchema
```

### 5. Security Layer
**Location:** `src/lib/security.ts`

**Features:**
- RateLimiter class (in-memory)
- 9 security headers
- CORS configuration
- Input sanitization (XSS prevention)
- Suspicious pattern detection
- Content-length validation

**Rate Limiting Presets:**
```typescript
strict: { max: 10, window: 60 }           // 10/min
moderate: { max: 30, window: 60 }         // 30/min
relaxed: { max: 100, window: 60 }         // 100/min
auth: { max: 5, window: 900 }             // 5/15min
upload: { max: 20, window: 3600 }         // 20/hr
```

### 6. Data Access Layer
**Location:** `src/lib/prisma.ts`

**Prisma Features:**
- Type-safe queries
- Auto-parameterized (prevents SQL injection)
- Connection pooling
- Transaction support
- Cascade deletes

**Instance:**
```typescript
export default prisma
```

### 7. Database Layer
**Location:** `prisma/schema.prisma`

**Models (8):**
- User (admin accounts)
- Student (learners)
- Group (learning cohorts)
- Assessment (tests/exams)
- Module (course modules)
- UnitStandard (learning standards)
- Session (class sessions/timetable)
- Attendance (attendance records)

**Relationships:**
```
User
  ├─ (admin of) Groups

Group
  ├─ Students (1:many)
  ├─ Assessments (1:many)
  ├─ Sessions (1:many)
  └─ Modules (1:many)

Student
  ├─ Group (many:1)
  └─ Attendance (1:many)

Assessment
  ├─ Group (many:1)
  ├─ Module (many:1)
  └─ UnitStandard (many:1)

Session
  ├─ Group (many:1)
  ├─ Module (many:1)
  └─ Attendance (1:many)
```

---

## Data Flow Examples

### Example 1: List Students with Pagination

```
Client Request:
  GET /api/students?page=2&pageSize=20
  Header: Authorization: Bearer <token>

Middleware:
  1. Verify JWT token ✓
  2. Check rate limit (30/min) ✓
  3. Apply security headers ✓

API Route (/api/students):
  4. Parse query params: { page: 2, pageSize: 20 }
  5. Validate with paginationSchema
  6. Query Prisma:
     - Skip: (page - 1) * pageSize = 20
     - Take: pageSize = 20
     - OrderBy: createdAt DESC
  7. Get total count
  8. Calculate hasMore

Response:
  {
    success: true,
    data: [ /* 20 students */ ],
    pagination: {
      page: 2,
      pageSize: 20,
      total: 85,
      totalPages: 5,
      hasMore: true
    },
    timestamp: "2026-02-15T10:45:30Z"
  }
```

### Example 2: Create Student with Validation

```
Client Request:
  POST /api/students
  Body: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+27721234567",
    groupId: "uuid-123"
  }

Middleware:
  1. Verify JWT token ✓
  2. Check rate limit (30/min) ✓
  3. Apply security headers ✓

API Route (/api/students):
  4. Parse body
  5. Validate with createStudentSchema:
     - Email format ✓
     - Phone format ✓
     - GroupId UUID ✓
  6. Sanitize inputs (XSS prevention)
  7. Check for suspicious patterns
  8. Validate content length
  9. Create in Prisma:
     - Check for duplicates
     - Insert record
     - Return with id, createdAt
  10. Return 201

Response:
  {
    success: true,
    data: {
      id: "uuid-456",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+27721234567",
      groupId: "uuid-123",
      createdAt: "2026-02-15T10:45:30Z",
      updatedAt: "2026-02-15T10:45:30Z"
    },
    timestamp: "2026-02-15T10:45:30Z"
  }
```

### Example 3: Bulk Attendance with Error Handling

```
Client Request:
  POST /api/attendance/bulk
  Body: {
    records: [
      { studentId: "s1", sessionId: "session1", status: "PRESENT" },
      { studentId: "s2", sessionId: "session1", status: "ABSENT" },
      { studentId: "s3", sessionId: "session1", status: "LATE" }
    ]
  }

Middleware:
  1. Verify JWT token ✓
  2. Check rate limit (30/min) ✓

API Route:
  3. Validate records count ≤ 500 ✓
  4. Validate each record:
     - studentId is valid UUID ✓
     - sessionId is valid UUID ✓
     - status in enum ✓
  5. Collect validation errors
  
  If errors found:
    Return 422 with field-level errors
    
  If valid:
    6. Create records in transaction (all or nothing)
    7. Return 200 with results

Response (on success):
  {
    success: true,
    data: {
      created: 3,
      failed: 0,
      records: [ /* success records */ ]
    },
    timestamp: "2026-02-15T10:45:30Z"
  }

Response (on validation error):
  {
    success: false,
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    data: [
      { index: 0, field: "studentId", message: "Invalid UUID" },
      { index: 2, field: "status", message: "Invalid status value" }
    ],
    timestamp: "2026-02-15T10:45:30Z"
  }
```

---

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   POST /api/auth/login
   { email, password }

2. Server validates credentials
   - Find user by email
   - Verify password with bcrypt
   - If invalid: return 401

3. Generate JWT token
   - Payload: { userId, role, email }
   - Expiry: 24 hours
   - Secret: JWT_SECRET (env var)

4. Return token to client
   - Store in localStorage (XSS risk - httpOnly cookie better)
   - Or store in httpOnly cookie

5. Client includes token in requests
   Authorization: Bearer <token>

6. Middleware verifies token
   - Decode JWT
   - Check expiry
   - Verify signature
   - Extract userId/role
   - Attach to request context

7. Route handler uses context
   - Access request.user.userId
   - Check request.user.role for admin operations
```

### Rate Limiting Strategy

```
Key Format:
- Authenticated: `auth:${method}:${path}:${userId}`
- Unauthenticated: `auth:${method}:${path}:${ip}`

Examples:
- POST /api/auth/login: 5 per 15 minutes
- General API: 30 per minute
- Upload: 20 per hour
- Custom per route

Storage:
- In-memory (development)
- Redis (production recommended)

Response on limit exceeded:
  HTTP 429 Too Many Requests
  Header: Retry-After: 60
  Body: { error: "Rate limit exceeded" }
```

### Input Sanitization

```typescript
// XSS Prevention
sanitizeString(input):
  - Remove: <, >, javascript:, on* handlers
  - Escape HTML entities
  - Example: "<script>alert(1)</script>" → ""

// SQL Injection Prevention
- Prisma parameterized queries (automatic)
- No raw SQL in routes
- Validate before query

// Path Traversal Prevention
- Validate IDs are valid UUIDs
- No file system access with user input
- Validate paths if file serving

// Suspicious Pattern Detection
- SQL keywords: DROP, DELETE, INSERT, etc.
- Code patterns: ${}, eval(), etc.
- Shell commands: ;, |, &, etc.
```

### Security Headers

```
X-Frame-Options: DENY
  → Prevent clickjacking

X-Content-Type-Options: nosniff
  → Prevent MIME sniffing

X-XSS-Protection: 1; mode=block
  → XSS filter

Strict-Transport-Security: max-age=31536000
  → Force HTTPS for 1 year

Content-Security-Policy: 'self' [whitelist]
  → Control resource loading

Referrer-Policy: strict-origin-when-cross-origin
  → Control referrer info

Permissions-Policy: ...
  → Restrict browser features
```

---

## Performance Optimization

### Database Query Optimization

```typescript
// BAD: N+1 queries (1 query per student's group)
const students = await prisma.student.findMany();
for (const student of students) {
  const group = await prisma.group.findUnique({
    where: { id: student.groupId }
  });
}

// GOOD: 1 query with relation
const students = await prisma.student.findMany({
  include: {
    group: true  // One query, not N+1
  }
})
```

### Response Caching

```
- Static pagination defaults (20 items/page)
- Group details cached on client
- Session data until calendar modified
- Assessment stats cached 1 hour
```

### Connection Pooling

```typescript
// Prisma automatically pools connections
// Environment: DATABASE_URL
// Pool size: max 5 (adjust for load)
const prisma = new PrismaClient({
  log: ['error'],
  errorFormat: 'pretty',
})
```

---

## Scaling Considerations

### Horizontal Scaling
- Stateless API (run multiple instances)
- Rate limiter → Redis (not in-memory)
- Session storage → Redis (not memory)
- Database replication/sharding

### Vertical Scaling
- Connection pool tuning
- Query indexes on frequently filtered fields
- Request batching for bulk operations

### Monitoring Metrics
- API response time (target: <500ms)
- Database query time (target: <100ms)
- Request rate (plateaus at 100+ req/s)
- Error rate (target: <0.1%)
- Memory usage (watch for leaks)

---

## Error Handling Strategy

### Error Types

```
1. Validation Errors (422)
   - Field-level errors with messages
   - Actionable feedback to client

2. Authentication Errors (401)
   - Missing token
   - Invalid token
   - Expired token

3. Authorization Errors (403)
   - Insufficient permissions
   - Admin-only operations

4. Not Found Errors (404)
   - Resource doesn't exist
   - Invalid ID

5. Conflict Errors (409)
   - Unique constraint violation
   - Duplicate resource

6. Rate Limit Errors (429)
   - Too many requests
   - Include Retry-After header

7. Server Errors (500)
   - Unexpected errors
   - Logged for debugging
   - Generic message to client
```

### Error Logging

```typescript
// All errors logged with context:
{
  timestamp: "2026-02-15T10:45:30Z",
  path: "/api/students",
  method: "POST",
  status: 500,
  error: "Unique constraint failed",
  userId: "user-123",
  requestId: "req-456"
}

// Sensitive data excluded from logs
// Stack traces in server logs, not client response
```

---

## Testing Strategy

### Unit Tests
- Validator functions
- Utility functions
- Schema validation

### Integration Tests
- API endpoints
- Request/response format
- Status codes
- Error handling

### Load Tests
- 100+ concurrent requests
- Response time degradation
- Memory/CPU usage
- Connection pool exhaustion

---

## Deployment Strategy

### Pre-Production Checklist
- [ ] Build succeeds (0 errors)
- [ ] Tests pass (80%+ coverage)
- [ ] Security audit complete
- [ ] Database migrations ready
- [ ] Environment variables set
- [ ] Backup procedure tested

### Production Deployment
1. Deploy new version
2. Run migrations
3. Smoke tests
4. Monitor for 24 hours
5. No rollback if stable

### Rollback Procedure
1. Revert to previous commit
2. Rebuild application
3. Restore database (if needed)
4. Clear caches
5. Monitor errors

---

## Maintenance

### Daily
- Monitor error logs
- Check API response times
- Verify backups

### Weekly
- Review security logs
- Analyze performance metrics
- Update dependencies (patch versions)

### Monthly
- Security audit
- Performance optimization
- Capacity planning
- Dependency updates (minor versions)

### Quarterly
- Load testing
- Disaster recovery drill
- Architecture review
- Major dependency updates
