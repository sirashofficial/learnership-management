# Developer Reference & Cheat Sheet

## Quick Command Reference

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm test:coverage
npm test -- students.test.ts  # Specific file

# Database commands
npx prisma db push            # Apply schema changes
npx prisma migrate dev        # Create migration
npx prisma studio            # Open database UI
npx prisma db seed           # Seed test data

# Check code
npm run lint                  # Linting
npm run type-check          # TypeScript check

# Format code
npm run format              # Prettier formatting

# Debugging
npm run dev --verbose       # Verbose output
```

---

## API Endpoints Overview

```
Authentication:
  POST   /api/auth/login      - Login user
  POST   /api/auth/register   - Register new user
  POST   /api/auth/refresh    - Refresh token
  GET    /api/auth/me         - Get current user

Students:
  GET    /api/students        - List (paginated)
  POST   /api/students        - Create
  GET    /api/students/:id    - Get one
  PUT    /api/students/:id    - Update
  DELETE /api/students/:id    - Delete

Groups:
  GET    /api/groups          - List
  POST   /api/groups          - Create
  GET    /api/groups/:id      - Get one
  PUT    /api/groups/:id      - Update
  DELETE /api/groups/:id      - Delete

Assessments:
  GET    /api/assessments     - List
  POST   /api/assessments     - Create
  GET    /api/assessments/:id - Get one
  PUT    /api/assessments/:id - Update
  DELETE /api/assessments/:id - Delete

Attendance:
  POST   /api/attendance      - Record (bulk)
  GET    /api/attendance      - List

System:
  GET    /api/health         - Health check
```

---

## Database Models at a Glance

```
User
├─ id (unique)
├─ email (unique)
├─ password (hashed)
├─ firstName, lastName
├─ role (USER/ADMIN/MANAGER/ASSESSOR)
└─ status (ACTIVE/INACTIVE/SUSPENDED)

Student
├─ id (unique)
├─ firstName, lastName
├─ email (unique)
├─ userId (→ User)
├─ groupId (→ Group, nullable)
└─ status (ACTIVE/COMPLETED/WITHDRAWN/SUSPENDED)

Group
├─ id (unique)
├─ name (unique)
├─ code (unique)
├─ startDate, endDate
├─ maxCapacity
└─ status (PLANNING/ACTIVE/PAUSED/COMPLETED)

Assessment
├─ id (unique)
├─ studentId (→ Student)
├─ moduleId (→ Module)
├─ score, percentage
├─ status (PENDING/IN_PROGRESS/SUBMITTED/GRADED)
└─ outcome (PASS/FAIL/INCOMPLETE)

Session
├─ id (unique)
├─ groupId (→ Group)
├─ scheduledDate, startTime, endTime
├─ sessionType (CLASS/WORKSHOP/PRACTICAL/ASSESSMENT)
└─ status (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELED)

Attendance
├─ id (unique)
├─ studentId (→ Student)
├─ sessionId (→ Session)
├─ status (PRESENT/ABSENT/LATE/EXCUSED/PARTIAL)
└─ timeIn, timeOut

UnitStandard (Curriculum)
├─ id (unique)
├─ code (unique)
├─ title
└─ credits

Module (Content)
├─ id (unique)
├─ code (unique)
├─ title
├─ unitStandardId (→ UnitStandard)
└─ assessmentType (PRACTICAL/THEORETICAL/PROJECT)
```

---

## Common Code Patterns

### Creating a New API Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validationErrorResponse, handleApiError } from '@/lib/api-utils';
import { createStudentSchema } from '@/lib/validations';
import * as Sentry from '@sentry/nextjs';

// GET - List with pagination
export async function GET(request: NextRequest) {
  try {
    const { page, pageSize } = getPageParams(request);
    
    const data = await prisma.student.findMany({
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.student.count();
    const pagination = createPagination(page, pageSize, total);
    
    return NextResponse.json({
      success: true,
      data,
      pagination
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = createStudentSchema.parse(body);
    
    // Create record
    const data = await prisma.student.create({
      data: validated
    });
    
    // Log action
    Logger.info('Student created', { studentId: data.id });
    
    // Return response
    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    
    Sentry.captureException(error);
    return handleApiError(error);
  }
}

// Require authentication
export const middleware = [requireAuth];
```

### Writing a Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestUser, generateTestToken } from '../setup';

describe('API: Students', () => {
  let token: string;
  
  beforeEach(async () => {
    // Setup test data
    const user = await setupTestUser({ role: 'ADMIN' });
    token = generateTestToken(user.id);
  });
  
  afterEach(async () => {
    // Cleanup
    // Delete test data if needed
  });
  
  it('should list students', async () => {
    const response = await fetch('http://localhost:3000/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const json = await response.json();
    
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });
  
  it('should create student with validation', async () => {
    const response = await fetch('http://localhost:3000/api/students', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        enrollmentDate: '2026-02-15'
      })
    });
    
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBeDefined();
  });
});
```

### Using Prisma with Relations

```typescript
// Get student with related data
const student = await prisma.student.findUnique({
  where: { id: 'st-123' },
  include: {
    group: true,              // Get related group
    assessments: true,        // Get all assessments
    attendances: {            // Get with filtering
      where: { status: 'PRESENT' },
      include: { session: true }
    }
  }
});

// Create with relations
const student = await prisma.student.create({
  data: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    group: { connect: { id: 'g-123' } },  // Link existing group
    enrollmentDate: new Date('2026-02-15')
  },
  include: { group: true }
});

// Update relation
const student = await prisma.student.update({
  where: { id: 'st-123' },
  data: {
    group: { connect: { id: 'g-456' } }  // Change group
  },
  include: { group: true }
});

// Disconnect relation
const student = await prisma.student.update({
  where: { id: 'st-123' },
  data: {
    groupId: null  // Remove from group
  }
});
```

### Error Handling

```typescript
import { ZodError } from 'zod';

export async function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    // Validation error
    return NextResponse.json({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    }, { status: 422 });
  }
  
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json({
        success: false,
        code: 'CONFLICT',
        error: 'Record already exists'
      }, { status: 409 });
    }
    
    if (error.code === 'P2025') {
      // Record not found
      return NextResponse.json({
        success: false,
        code: 'NOT_FOUND',
        error: 'Record not found'
      }, { status: 404 });
    }
  }
  
  // Generic server error
  Sentry.captureException(error);
  return NextResponse.json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    error: 'An unexpected error occurred'
  }, { status: 500 });
}
```

### Validation Schema

```typescript
import { z } from 'zod';
import { passwordValidator, emailValidator } from './validators';

export const createStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: emailValidator,
  phoneNumber: z.string().optional(),
  enrollmentDate: z.string().datetime(),
  groupId: z.string().uuid().optional()
});

export const updateStudentSchema = createStudentSchema.partial();

export const createUserSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['USER', 'ADMIN', 'MANAGER', 'ASSESSOR'])
});
```

---

## Security Checklist

When adding new features, ensure:

- [ ] **Authentication**: Routes requiring auth have `requireAuth` middleware
- [ ] **Authorization**: Role checks with `requireRole('ADMIN')`
- [ ] **Validation**: All inputs validated with Zod schemas
- [ ] **Sanitization**: String inputs sanitized with `sanitizeString()`
- [ ] **SQL Injection**: Using Prisma (automatic protection)
- [ ] **Rate Limiting**: API has rate limiting enabled
- [ ] **CORS**: Proper CORS headers set
- [ ] **Sensitive Data**: No passwords/tokens in responses
- [ ] **Error Messages**: Generic error messages (no data leakage)
- [ ] **Logging**: Sensitive data not logged

---

## Performance Checklist

- [ ] **Pagination**: List endpoints paginate (max 100 items)
- [ ] **Indexes**: Database queries have indexes on where clauses
- [ ] **Caching**: Frequently accessed data cached
- [ ] **N+1 Queries**: Using `include` for relations (not separate queries)
- [ ] **Response Time**: API responses <500ms (target)
- [ ] **Memory**: No memory leaks (monitor with `npm run dev`)
- [ ] **Bundle Size**: Keep client bundle <1MB

---

## Testing Checklist

Before code review:

- [ ] All tests pass: `npm test`
- [ ] No console errors/warnings
- [ ] Test coverage >80%
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Invalid input rejected

---

## Deployment Checklist

Before deploying:

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No security warnings
- [ ] Database migrations tested on staging
- [ ] Monitoring alerts configured

---

## Useful URLs

**Development:**
- Local API: http://localhost:3000
- Health check: http://localhost:3000/api/health
- Database admin: http://localhost:5555 (Prisma Studio)

**Staging:**
- API: https://staging-api.example.com
- Health: https://staging-api.example.com/api/health

**Production:**
- API: https://api.example.com
- Health: https://api.example.com/api/health
- Monitoring: https://sentry.io (error tracking)
- Status: https://status.example.com

---

## Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| LEARNERSHIP_SYSTEM_ARCHITECTURE.md | Understand data models & system design | 30 min |
| API_DOCUMENTATION.md | API endpoint reference | 30 min |
| TEAM_ONBOARDING_GUIDE.md | Get started onboarding | 1 hour |
| TROUBLESHOOTING_GUIDE.md | Solve common problems | Reference |
| MONITORING_AND_LOGGING_GUIDE.md | Setup monitoring & alerts | 1 hour |
| PRODUCTION_TESTING_CHECKLIST.md | Test before deployment | Reference |
| PRODUCTION_DEPLOYMENT_CHECKLIST.md | Deploy to production | Reference |

---

## Common Issues Quick Fix

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify JWT token in Authorization header |
| 429 Too Many Requests | Wait 15 min for auth, 1 min for API |
| 422 Validation Error | Check error response for invalid fields |
| 404 Not Found | Verify endpoint URL and resource ID |
| 500 Server Error | Check Sentry, server logs, restart |
| Slow response | Check logs for slow queries, enable caching |
| Memory leak | Restart server, check for circular refs |
| Database error | Verify connection, check indexes |

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/student-export

# Make changes and commit
git add .
git commit -m "Feat: Add student export feature"

# Push to GitHub
git push origin feature/student-export

# Create Pull Request on GitHub
# 1. Go to GitHub repo
# 2. Click "New Pull Request"
# 3. Select your branch
# 4. Fill in description
# 5. Request review

# After approval, merge
git checkout main
git pull origin main
git merge feature/student-export
git push origin main

# Delete feature branch
git branch -d feature/student-export
git push origin --delete feature/student-export
```

---

## Environment Variables Quick Reference

```bash
# Database (required)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT (required)
JWT_SECRET=your_secret_key_at_least_32_chars

# Environment (required)
NODE_ENV=development|staging|production

# Monitoring (recommended for prod)
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>

# Email (optional)
MAIL_PROVIDER=smtp|console
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@example.com
MAIL_PASSWORD=app_password

# Logging
LOG_LEVEL=debug|info|warn|error
```

---

## Common Environment Setups

**Local Development:**
```
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:password@localhost:5432/learnership_dev
MAIL_PROVIDER=console
```

**Staging:**
```
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=postgresql://...@staging-db.example.com:5432/learnership
SENTRY_DSN=https://...
```

**Production:**
```
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=postgresql://...@prod-db.example.com:5432/learnership
SENTRY_DSN=https://...
MAIL_PROVIDER=smtp
```

---

## Learning Resources

**For TypeScript:**
- Official Docs: https://www.typescriptlang.org/docs
- In ~30 min: https://www.typescriptlang.org/docs/handbook

**For Next.js:**
- App Router: https://nextjs.org/docs/app
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

**For Prisma:**
- Docs: https://www.prisma.io/docs
- Reference: https://www.prisma.io/docs/reference/api-reference

**For Zod:**
- Docs: https://zod.dev
- Validation: https://zod.dev/?id=basic-usage

**For Testing (Vitest):**
- Docs: https://vitest.dev
- Getting Started: https://vitest.dev/guide

---

## Keyboard Shortcuts

**VS Code:**
```
Ctrl+K Ctrl+F    Format document
Ctrl+Shift+P     Command palette
Ctrl+/           Comment line
Ctrl+D           Select word
Ctrl+L           Select line
F2               Rename
F5               Debug
```

**Terminal:**
```
Ctrl+C           Stop running command
Ctrl+Z           Suspend command
Ctrl+R           Search history
!! (or Ctrl+P)   Repeat last command
```

---

## Weekly Tasks

**Monday:**
- [ ] Review weekend monitoring alerts
- [ ] Check team Slack for updates

**Wednesday:**
- [ ] View upcoming deployments
- [ ] Prepare PR reviews

**Friday:**
- [ ] Code review pending PRs
- [ ] Deploy stable features
- [ ] Update progress in tickets

---

## Monthly Checklist

- [ ] Review code quality metrics
- [ ] Update dependencies (npm audit, npm update)
- [ ] Review monitoring dashboards
- [ ] Database maintenance
- [ ] Backup verification
- [ ] Team retrospective
- [ ] Roadmap planning for next month

---

**Last Updated:** February 2026
**Maintained By:** Engineering Team
**Version:** 2.1.0
