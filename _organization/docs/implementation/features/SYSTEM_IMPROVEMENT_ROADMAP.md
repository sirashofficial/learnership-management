# 🗺️ System Improvement Roadmap

**Based on Comprehensive Architecture Audit - Feb 24, 2026**

---

## 🎯 Overview

This roadmap addresses critical findings from the architecture audit of the Learnership Management System handling **46 students**, **9 groups**, and **3,315 assessments**.

### Priority Levels

- 🔴 **P0 - CRITICAL:** System-breaking issues, data integrity problems
- 🟡 **P1 - HIGH:** Performance issues, user experience problems  
- 🟢 **P2 - MEDIUM:** Technical debt, optimization opportunities
- 🔵 **P3 - LOW:** Nice-to-have improvements

---

## 📅 Phase 1: Data Integrity & Critical Fixes (Week 1)

### 🔴 P0-1: Investigate Missing Attendance Data

**Problem:** 0 attendance records despite full UI implementation

**Tasks:**
- [ ] Run diagnostic: `node scripts/test-attendance-flow.js`
- [ ] Check if Attendance table schema matches code
- [ ] Test attendance marking end-to-end
- [ ] Verify database writes are working
- [ ] Check for data migration issues

**Acceptance Criteria:**
- Understand why no attendance records exist
- Fix UI→Database flow if broken
- Create test attendance records successfully

**Estimated Time:** 4 hours

**Script to Create:**
```javascript
// scripts/test-attendance-flow.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAttendanceFlow() {
  console.log('Testing Attendance Flow...\n');
  
  // 1. Get a student
  const student = await prisma.student.findFirst();
  if (!student) throw new Error('No students found');
  
  // 2. Try to create attendance
  const attendance = await prisma.attendance.create({
    data: {
      studentId: student.id,
      date: new Date(),
      status: 'PRESENT',
      notes: 'Test attendance record'
    }
  });
  
  console.log('✅ Attendance created:', attendance.id);
  
  // 3. Verify it can be read
  const found = await prisma.attendance.findUnique({
    where: { id: attendance.id }
  });
  
  console.log('✅ Attendance retrieved:', found ? 'YES' : 'NO');
  
  // 4. Clean up test data
  await prisma.attendance.delete({ where: { id: attendance.id } });
  console.log('✅ Test cleanup complete');
  
  await prisma.$disconnect();
}

testAttendanceFlow().catch(console.error);
```

---

### 🔴 P0-2: Resolve Session-LessonPlan Disconnect

**Problem:** 810 lesson plans but 0 sessions

**Tasks:**
- [ ] Clarify intended relationship between LessonPlan and Session
- [ ] Check if sessions should auto-create from lesson plans
- [ ] Review session creation workflow in UI
- [ ] Test session creation manually
- [ ] Determine if Sessions are even needed

**Questions to Answer:**
1. Are LessonPlan and Session supposed to be separate?
2. Should lesson plans convert to sessions when scheduled?
3. Is there a missing cron job or trigger?

**Acceptance Criteria:**
- Document the intended data model
- Either fix session creation OR remove Session table if unused
- Update UI accordingly

**Estimated Time:** 6 hours

---

### 🔴 P0-3: Verify Assessment Data Integrity

**Problem:** 3,315 assessments = 72 per student (very high)

**Tasks:**
- [ ] Run assessment analysis script
- [ ] Check for duplicate assessments
- [ ] Verify assessment types distribution
- [ ] Check for orphaned records
- [ ] Validate with actual training curriculum

**Script:**
```javascript
// scripts/analyze-assessments.js
async function analyzeAssessments() {
  // Breakdown by type and result
  const breakdown = await prisma.assessment.groupBy({
    by: ['type', 'result'],
    _count: { id: true },
    _avg: { score: true }
  });
  console.table(breakdown);
  
  // Find students with excessive assessments  
  const excessive = await prisma.$queryRaw`
    SELECT 
      s.studentId,
      s.firstName,
      s.lastName,
      COUNT(a.id) as assessmentCount
    FROM Student s
    LEFT JOIN Assessment a ON a.studentId = s.id
    GROUP BY s.id
    HAVING COUNT(a.id) > 50
    ORDER BY assessmentCount DESC
  `;
  
  console.log('\nStudents with >50 assessments:');
  console.table(excessive);
  
  // Check for exact duplicates
  const duplicates = await prisma.$queryRaw`
    SELECT 
      studentId,
      unitStandardId,
      type,
      assessedDate,
      COUNT(*) as count
    FROM Assessment
    GROUP BY studentId, unitStandardId, type, date(assessedDate)
    HAVING COUNT(*) > 1
  `;
  
  console.log(`\nFound ${duplicates.length} potential duplicate groups`);
}
```

**Acceptance Criteria:**
- Confirm assessment count is correct OR identify duplicates
- Clean up any duplicate/invalid assessments
- Document assessment business rules

**Estimated Time:** 8 hours

---

### 🟡 P1-1: Fix Schema Inconsistencies

**Problem:** Code references `deletedAt` column that doesn't exist

**Tasks:**
- [ ] Run `npx prisma db pull` to see actual schema
- [ ] Compare with `schema.prisma` file
- [ ] Run `npx prisma db push` to sync
- [ ] Test all pages after schema sync
- [ ] Verify no data loss

**Command:**
```bash
# Backup first
node scripts/backup-db.js

# Sync schema
npx prisma db push

# Verify
node scripts/quick-count.js
```

**Acceptance Criteria:**
- No schema mismatch errors in logs
- All queries execute successfully
- Data counts remain the same

**Estimated Time:** 2 hours

---

## 📅 Phase 2: Performance & Optimization (Week 2)

### 🟡 P1-2: Implement Pagination for Assessments

**Problem:** Loading 3,315 assessments causes slow page loads

**Tasks:**
- [ ] Add pagination to `/api/assessments` endpoint
- [ ] Update frontend to handle paginated data
- [ ] Add URL query params for page number
- [ ] Implement "Load More" or pagination UI
- [ ] Test with real data

**Implementation:**
```typescript
// src/app/api/assessments/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;
  
  const [assessments, total] = await Promise.all([
    prisma.assessment.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        unitStandard: { select: { code: true, title: true } }
      }
    }),
    prisma.assessment.count()
  ]);
  
  return NextResponse.json({
    data: assessments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
```

**Acceptance Criteria:**
- Assessment page loads in <1 second
- Pagination controls work correctly
- Can navigate through all 3,315 assessments

**Estimated Time:** 6 hours

---

### 🟡 P1-3: Add Database Indexes

**Problem:** Slow queries on large assessment table

**Tasks:**
- [ ] Identify slow queries from logs
- [ ] Add indexes to frequently queried columns
- [ ] Measure query time before/after
- [ ] Update Prisma schema with indexes
- [ ] Test performance improvement

**Implementation:**
```prisma
// prisma/schema.prisma
model Assessment {
  // ... existing fields ...
  
  @@index([studentId])
  @@index([unitStandardId])
  @@index([studentId, unitStandardId])
  @@index([result])
  @@index([assessedDate])
  @@index([studentId, result])
}

model Attendance {
  // ... existing fields ...
  
  @@index([date])
  @@index([studentId, date])
  @@index([groupId, date])
}
```

**Acceptance Criteria:**
- Query times reduced by 50%+
- Dashboard loads faster
- Student detail pages load faster

**Estimated Time:** 3 hours

---

### 🟡 P1-4: Optimize Dashboard Loading

**Problem:** Dashboard takes 2-3 seconds to load

**Tasks:**
- [ ] Profile dashboard API endpoints
- [ ] Implement server-side caching for stats
- [ ] Lazy load charts and heavy components
- [ ] Pre-calculate metrics in database
- [ ] Add loading skeletons

**Implementation:**
```typescript
// Add caching to expensive calculations
import { cache } from 'react';

export const getDashboardStats = cache(async () => {
  // Expensive calculation
  const stats = await calculateAllMetrics();
  return stats;
});

// Revalidate every 30 seconds
export const revalidate = 30;
```

**Acceptance Criteria:**
- Dashboard loads in <1 second
- Smooth loading experience
- Stats update every 30 seconds

**Estimated Time:** 8 hours

---

## 📅 Phase 3: Architecture Improvements (Week 3)

### 🟢 P2-1: Standardize State Management

**Problem:** Mixing React Context, SWR, and local state causes confusion

**Goals:**
- Remove `StudentContext` (marked as DEPRECATED)
- Standardize on SWR for all server state
- Keep Context only for auth
- Document patterns

**Tasks:**
- [ ] Audit all uses of StudentContext
- [ ] Migrate to SWR hooks
- [ ] Remove StudentContext file
- [ ] Update documentation
- [ ] Create state management guide

**Pattern to Establish:**
```typescript
// ✅ CORRECT: Use SWR for server data
const { data, error, isLoading } = useSWR('/api/students', fetcher);

// ✅ CORRECT: Use Context only for auth
const { user, login, logout } = useAuth();

// ❌ AVOID: Using Context for server data
const { students } = useStudents(); // DEPRECATED
```

**Acceptance Criteria:**
- No more StudentContext imports
- All pages use SWR consistently
- Documentation updated

**Estimated Time:** 6 hours

---

### 🟢 P2-2: Consolidate Duplicate API Endpoints

**Problem:** 119 endpoints with potential redundancy

**Tasks:**
- [ ] Audit all 119 API endpoints
- [ ] Identify duplicates (e.g., multiple student endpoints)
- [ ] Consolidate where possible
- [ ] Update frontend to use consolidated endpoints
- [ ] Document endpoint purposes

**Example Consolidation:**
```typescript
// BEFORE: Multiple endpoints
// GET /api/students
// GET /api/students/active
// GET /api/students/byGroup/:id
// GET /api/dashboard/students

// AFTER: Single endpoint with query params
// GET /api/students?status=active&groupId=123&include=progress
```

**Acceptance Criteria:**
- Reduce to ~80-90 endpoints
- Clear documentation of each endpoint
- No breaking changes for frontend

**Estimated Time:** 12 hours

---

### 🟢 P2-3: Re-enable and Test Rate Limiting

**Problem:** Rate limiting currently disabled for testing

**Tasks:**
- [ ] Re-enable rate limiting on login endpoint
- [ ] Test that it works correctly
- [ ] Adjust limits based on real usage
- [ ] Add rate limit headers to responses
- [ ] Document rate limits

**Implementation:**
```typescript
// src/app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  // Re-enable rate limiting
  const rateLimitResult = await rateLimit({ 
    interval: 60000,  // 1 minute
    maxRequests: 10   // 10 attempts
  })(request);
  
  if (rateLimitResult) return rateLimitResult;
  
  // ... rest of login logic
}
```

**Acceptance Criteria:**
- Login rate limiting works
- Clear error messages for users
- Legitimate users not affected

**Estimated Time:** 2 hours

---

## 📅 Phase 4: Monitoring & Quality (Week 4)

### 🟢 P2-4: Implement Error Tracking

**Problem:** No visibility into production errors

**Tasks:**
- [ ] Set up Sentry or similar
- [ ] Add error boundaries in React
- [ ] Log API errors
- [ ] Set up alerts for critical errors
- [ ] Create error dashboard

**Implementation:**
```bash
npm install @sentry/nextjs

# Configure
npx @sentry/wizard -i nextjs
```

**Acceptance Criteria:**
- All errors tracked
- Alerts for critical issues
- Weekly error review process

**Estimated Time:** 4 hours

---

### 🟢 P2-5: Add Automated Data Quality Checks

**Problem:** No automated detection of data issues

**Tasks:**
- [ ] Create daily data quality cron job
- [ ] Check for anomalies (missing data, duplicates)
- [ ] Alert on data quality issues
- [ ] Generate weekly data quality report
- [ ] Dashboard widget for data health

**Implementation:**
```javascript
// scripts/daily-data-quality-check.js
async function dailyChecks() {
  const issues = [];
  
  // Check 1: Attendance for active sessions
  const sessionsToday = await prisma.session.count({
    where: { date: new Date() }
  });
  const attendanceToday = await prisma.attendance.count({
    where: { date: new Date() }
  });
  
  if (sessionsToday > 0 && attendanceToday === 0) {
    issues.push('NO_ATTENDANCE_FOR_ACTIVE_SESSIONS');
  }
  
  // Check 2: Orphaned records
  const orphanedAssessments = await prisma.assessment.count({
    where: { student: null }
  });
  
  if (orphanedAssessments > 0) {
    issues.push(`ORPHANED_ASSESSMENTS: ${orphanedAssessments}`);
  }
  
  // Send alerts
  if (issues.length > 0) {
    await sendAlert(issues);
  }
  
  return issues;
}
```

**Acceptance Criteria:**
- Daily checks run automatically
- Issues detected within 24 hours
- Email/Slack alerts sent

**Estimated Time:** 6 hours

---

## 📅 Phase 5: Future Enhancements (Month 2+)

### 🔵 P3-1: Consider PostgreSQL Migration

**When:** If users exceed 100 students or 20 groups

**Benefits:**
- Better concurrent write handling
- Built-in replication
- More advanced features
- Better performance at scale

**Migration Steps:**
1. Set up PostgreSQL instance
2. Export SQLite data
3. Update Prisma datasource
4. Test thoroughly
5. Migrate production

**Estimated Time:** 16 hours

---

### 🔵 P3-2: Add Real-time Features

**Ideas:**
- WebSocket for live attendance marking
- Push notifications for important events
- Real-time dashboard updates
- Collaborative session planning

**Technologies:**
- Socket.io or Pusher
- Service Workers for notifications
- Redis for pub/sub

**Estimated Time:** 40 hours

---

### 🔵 P3-3: Implement Comprehensive Testing

**Coverage Goals:**
- Unit tests: 70%
- Integration tests: Key flows
- E2E tests: Critical paths

**Implementation:**
```bash
# Already have Vitest setup
npm run test

# Add Playwright for E2E
npm install -D @playwright/test
```

**Estimated Time:** 60 hours

---

## 📊 Progress Tracking

### Week 1: Data Integrity ✅ / ❌
- [ ] P0-1: Investigate attendance data
- [ ] P0-2: Resolve sessions issue
- [ ] P0-3: Verify assessments
- [ ] P1-1: Fix schema

**Success Metrics:**
- All data integrity issues understood
- Critical bugs fixed
- No schema errors in production

---

### Week 2: Performance ✅ / ❌
- [ ] P1-2: Implement pagination
- [ ] P1-3: Add database indexes
- [ ] P1-4: Optimize dashboard

**Success Metrics:**
- Dashboard loads in <1s
- Assessment page loads in <1s
- Query times reduced 50%+

---

### Week 3: Architecture ✅ / ❌
- [ ] P2-1: Standardize state management
- [ ] P2-2: Consolidate APIs
- [ ] P2-3: Re-enable rate limiting

**Success Metrics:**
- No StudentContext usage
- API count reduced to ~85
- Rate limiting working

---

### Week 4: Quality ✅ / ❌
- [ ] P2-4: Error tracking
- [ ] P2-5: Automated checks

**Success Metrics:**
- Error tracking active
- Daily checks running
- Weekly reports generated

---

## 🎯 Success Criteria

### System Quality Goals

**Before (Current):**
- Data Integrity: 5/10
- Performance: 6/10
- Architecture: 7/10
- Monitoring: 2/10

**After Phase 1-4 (Target):**
- Data Integrity: 9/10
- Performance: 8/10
- Architecture: 8/10
- Monitoring: 7/10

---

## 📞 Support

**Questions or Issues:**
- Review: [COMPREHENSIVE_ARCHITECTURE_AUDIT.md](COMPREHENSIVE_ARCHITECTURE_AUDIT.md)
- Data Issues: [DATA_INTEGRITY_REPORT.md](DATA_INTEGRITY_REPORT.md)
- This Roadmap: Track progress weekly

**Weekly Standup:**
- Review completed tasks
- Identify blockers
- Adjust timeline as needed

---

*Roadmap Created: February 24, 2026*
*Next Review: March 3, 2026*
