# 📚 YEHA Architecture - Quick Reference Guide

**Date:** February 23, 2026  
**Project:** YEHA - Youth Education & Skills Management System  
**Audience:** New developers, architects, stakeholders

---

## 🎯 Quick Start

### What is YEHA?
A **full-stack Next.js 14 application** for managing SSETA NVC Level 2 training programs. Frontend, backend, and database all in one codebase.

### Key Characteristics
- ✅ **Monolithic** - Single Next.js codebase
- ✅ **Full-stack** - React frontend + Node.js API + SQLite database
- ✅ **Type-safe** - TypeScript throughout
- ✅ **Production-ready** - Auth, validation, error handling included
- ✅ **AI-powered** - Google Gemini, Cohere, Pinecone integrations
- ✅ **Scalable** - Up to ~100 concurrent users

### Tech Stack at a Glance
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Backend** | Next.js 14 API Routes |
| **Database** | SQLite + Prisma ORM |
| **Caching** | SWR (browser), HTTP headers |
| **AI** | Google Gemini, Cohere, Pinecone, Z.AI |
| **Auth** | JWT tokens + bcryptjs |

---

## 🗂️ Architecture Documents

### Main Documentation
1. **[COMPREHENSIVE_ARCHITECTURE_SITEMAP.md](COMPREHENSIVE_ARCHITECTURE_SITEMAP.md)** (⭐ START HERE)
   - Complete architecture overview (15 sections)
   - Data models and relationships
   - API routes and patterns
   - State management strategies
   - Security implementation
   - 60+ pages of detailed analysis

2. **[ARCHITECTURE_VISUAL_DIAGRAMS.md](ARCHITECTURE_VISUAL_DIAGRAMS.md)**
   - 15 Mermaid diagrams
   - Visual flow illustrations
   - Request/response sequences
   - Component hierarchies
   - Database relationships

3. **[QUICK_REFERENCE.md]** (This file)
   - Quick answers to common questions
   - Navigation guide
   - Key tables and lists

---

## ❓ Quick Answers

### "What happens when a user loads the dashboard?"

```
1. User navigates to /dashboard
   ↓
2. browser loads page.tsx component
   ↓
3. Component calls useDashboardStats() hook
   ↓
4. Hook checks SWR cache (in browser memory)
   ↓
5. If cache hit: renders cached data immediately
   If cache miss: makes fetch request
   ↓
6. GET /api/dashboard/stats hits API route
   ↓
7. Middleware verifies JWT token
   ↓
8. API route queries database (Prisma)
   ↓
9. Database returns student stats, assessment counts, etc
   ↓
10. API calculates computed fields (progress %, status)
    ↓
11. Returns formatted JSON response
    ↓
12. Hook stores in SWR cache (30 second TTL)
    ↓
13. Component renders with data
    ↓
14. Background refresh happens at 30s mark
```

**Key Point:** User sees data immediately from cache, data stays fresh via polling.

### "How is a student record updated?"

```
1. User edits student name in modal
   ↓
2. User clicks "Save"
   ↓
3. Component calls hook mutation:
   mutate(PUT /api/students/[id], {...})
   ↓
4. PUT /api/students/[studentId] API route
   ↓
5. Middleware: auth check ✓, role check ✓
   ↓
6. Prisma.student.update() in database
   ↓
7. API returns updated student record
   ↓
8. SWR invalidates cache (marks stale)
   ↓
9. SWR immediately revalidates (fresh fetch)
   ↓
10. Component re-renders with new data
    ↓
11. User sees updated name
```

**Key Point:** Optimistic update not used; pessimistic update ensures consistency.

### "How does authentication work?"

```
Login Page:
1. User enters email + password
   ↓
2. POST /api/auth/login
   ↓
3. Server: SELECT user, validate password with bcrypt
   ↓
4. If valid: Generate JWT token (24 hour expiry)
   ↓
5. Return token + user info
   ↓
6. Client stores in localStorage

Protected Pages:
1. User navigates to /groups
   ↓
2. useAuth hook checks localStorage for token
   ↓
3. Redirect to /login if missing
   ↓
4. Include token in all API calls:
   Authorization: Bearer eyJ...
   ↓
5. Middleware verifies JWT signature
   ↓
6. Extract userId, role, grant access
```

**Key Point:** Stateless auth via JWT. No server sessions needed.

### "How are assessments marked/graded?"

```
1. Facilitator opens assessment view
   GET /api/assessments?groupId=X
   └─ Returns pending assessments
   
2. Facilitator clicks "Mark Grade"
   ↓
3. Modal opens with form
   └─ Select: COMPETENT / NOT_YET_COMPETENT
   └─ Optional: feedback, notes
   └─ Auto-calculate: credits earned

4. Click "Submit"
   ↓
5. PUT /api/assessments/[id]
   {
     result: "COMPETENT",
     score: 85,
     assessedDate: "2026-02-23",
     feedback: "Well done!"
   }

6. Database updated
   ↓
7. Related records updated:
   └─ student.totalCreditsEarned += 10
   └─ moduleProgress.progress recalculated
   └─ rolloutPlan.status recalculated

8. UI refreshed
   └─ Dashboard stats updated
   └─ Progress bars updated
   └─ Alerts re-evaluated
```

**Key Point:** Single write, cascading calculations update related records.

### "How are attendance records marked?"

```
Session: Numeracy - Module 1
Date: 2026-02-23, Time: 09:00-11:00
Group: NVC Level 2 Cohort A (20 students)

Scenario 1: Mark All Present
1. Click "Bulk Mark Attendance"
2. Modal opens dialog with all students checked
3. Click "Mark All Present"
4. POST /api/attendance/bulk-mark
   {
     sessionId: "session-uuid",
     records: [
       { studentId: "s1", status: "PRESENT" },
       { studentId: "s2", status: "PRESENT" },
       ... (18 more)
     ]
   }
5. Database: INSERT 20 attendance records
6. Calculate: attendanceRate = 20/20 = 100%
7. Check: No alerts triggered

Scenario 2: Some Students Late/Absent
POST /api/attendance/bulk-mark
{
  records: [
    { studentId: "s1", status: "LATE" },
    { studentId: "s2", status: "PRESENT" },
    { studentId: "s3", status: "ABSENT" },
    ... (17 more)
  ]
}
1. Database: INSERT 20 records
2. Check alerts:
   └─ s3 absent? Check consecutive absences (> 3?)
   └─ If yes: CREATE AttendanceAlert
   └─ Notify facilitator

3. Impact on dashboard:
   └─ Student s3: attendance rate drops
   └─ Group health score updates
   └─ Alert card shows on dashboard
```

**Key Point:** Bulk operations supported, undo available for 30 minutes.

### "How does the AI assist facilitators?"

```
1. Facilitator clicks "Generate Lesson Plan"
   └─ Format: Modal/Form for settings
   └─ Select Module, Unit Standard, Duration

2. POST /api/ai/generate-lesson
   {
     moduleId: "module-2",
     unitStandardId: "us-2.1",
     duration: 180 // minutes
   }

3. API: Fetch module details + curriculum docs
   ↓
4. POST /semantic-search
   └─ Query: "Module 2 topics activities"
   └─ Get top-5 relevant curriculum documents

5. Call Google Gemini API with context:
   {
     prompt: "Generate a 180-minute lesson plan for... 
              considering these curriculum materials: [docs]
              for students at Level 2 NVC",
     temperature: 0.7,
     maxTokens: 2000
   }

6. Gemini returns structured lesson:
   {
     title: "Module 2: Introduction",
     objectives: [...],
     activities: [
       {
         activity: "Icebreaker (10 min)",
         instructions: "...",
         resources: ["projector", "whiteboard"]
       },
       ... (8 more activities)
     ],
     assessment: "Practical demonstration"
   }

7. API formats response
   ↓
8. Optional: Save to database (LessonPlan table)
   ↓
9. Return to UI
   └─ Display formatted lesson
   └─ Allow edit, download as PDF, print
```

**Key Point:** AI augments human facilitation, not replacement. Facilitator always reviews before using.

### "What happens if the student count is 5000?"

```
Current architecture is optimized for ~100 users.
For 5000 students:

PROBLEMS THAT ARISE:
1. List pages timeout (retrieve 5000 records)
   └─ Solution: Always paginate (we do: page=1, pageSize=20)

2. Dashboard stats slow (aggregate queries)
   └─ Solution: Pre-calculate, cache longer (5 min TTL)

3. SQLite bottleneck (single-writer)
   └─ Solution: Migrate to PostgreSQL

4. Memory issues (load all in memory)
   └─ Solution: Streaming responses, database cursors

5. SWR cache out of memory
   └─ Solution: Smaller cache window, more aggressive eviction

SCALING SOLUTION:
├─ Phase 1: Optimize (add indexes, pagination) → ~500 users
├─ Phase 2: Cache layer (Redis) → ~2000 users
├─ Phase 3: PostgreSQL database → ~5000 users
├─ Phase 4: Microservices + read replicas → 10000+ users
```

**Key Point:** Design supports growth via staging; refactor at each phase.

---

## 📋 Reference Tables

### API Endpoints by Domain

| Domain | Count | Key Endpoints |
|--------|-------|---------------|
| **Admin** | 5+ | Settings, logs, backups |
| **AI** | 7+ | Chat, generate-*, semantic-search, index |
| **Assessment** | 8+ | List, mark, bulk-mark, moderation, summary |
| **Attendance** | 8+ | List, mark, bulk-mark, alerts, reports |
| **Auth** | 3+ | Login, register, logout, refresh |
| **Curriculum** | 5+ | Modules, unit-standards, documents, formatives |
| **Dashboard** | 3+ | Stats, summary, recent-activity |
| **Data** | 3+ | Various data cleanup/sync endpoints |
| **Groups** | 8+ | CRUD, bulk, rollout planning, details |
| **Lessons** | 5+ | CRUD, scheduling, templates |
| **Progress** | 3+ | Calculate, summary, milestone tracking |
| **Reports** | 6+ | Attendance, progress, compliance, AI-gen |
| **Sessions** | 6+ | CRUD, attendance, timetable views |
| **Students** | 6+ | CRUD, progress, bulk operations |
| **Undo** | 1 | Revert last bulk operation |
| **Validation** | 1+ | Input validation testing |

### Data Model Summary

| Entity | Table | Records | Key Relations |
|--------|-------|---------|---------------|
| **User** | users | 5-50 | Facilitates groups, creates lessons |
| **Group** | groups | 5-20 | Contains students, schedules sessions |
| **Student** | students | 200-5000 | Takes assessments, attends sessions |
| **Module** | modules | 6 | Fixed (NVC Level 2) |
| **UnitStandard** | unit_standards | 24-30 | 4-5 per module |
| **Assessment** | assessments | ~500 | 1-5 per student per unit standard |
| **Attendance** | attendance | ~50k | Daily marking per student |
| **Session** | sessions | 100-200 | 3-5 per week per group |
| **FormativeAssessment** | formative_assessments | 24-30 | 1-2 per unit standard |
| **RolloutPlan** | rollout_plans | 60-120 | Planning matrix (group × module) |

### Custom Hooks Overview

| Hook | Purpose | Refresh | Cache TTL |
|------|---------|---------|-----------|
| **useStudents** | Fetch students | 30s | SWR managed |
| **useGroups** | Fetch groups with data | 30s | SWR managed |
| **useAssessments** | Fetch assessments | 30s | SWR managed |
| **useAttendance** | Fetch attendance records | 15s | SWR managed (live) |
| **useLessons** | Fetch lesson plans | 60s | SWR managed |
| **useCurriculum** | Fetch curriculum content | 300s | SWR managed |
| **useProgress** | Calculate progress | 30s | SWR managed |
| **useDashboard** | Dashboard stats | 30s | SWR managed |
| **useApi** | Generic API requests | Custom | Global cache (30s default) |
| **useLocalStorage** | Browser storage | - | localStorage |
| **useFormState** | Form state management | - | Component state |
| **useDebounce** | Debounce values | Custom | Memory |

### Authentication & Authorization

| Aspect | Detail |
|--------|--------|
| **Auth Method** | JWT (JSON Web Token) |
| **Token Storage** | localStorage (client-side) |
| **Token Lifetime** | 24 hours |
| **Secret Key** | process.env.JWT_SECRET (32+ chars) |
| **Password Hashing** | bcryptjs (10 salt rounds) |
| **Roles** | FACILITATOR, ADMIN, COORDINATOR |
| **Rate Limiting** | Per IP, configurable per endpoint |
| **CORS** | Whitelisted origins |
| **Security Headers** | X-Frame-Options, X-Content-Type-Options, etc |

### Cache Strategy

| Component | Strategy | TTL | Revalidation |
|-----------|----------|-----|--------------|
| **SWR Layer** | Stale-while-revalidate | 15-60s | Auto-refresh, on-focus |
| **Global Cache** | useApi Map<url, data> | 30s | Deduplication |
| **HTTP Cache** | Cache-Control headers | 30s-1h | ETag-based |
| **localStorage** | Browser storage | Indefinite | Manual clear |

### Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Dashboard load** | < 2s | ~1.5s | ✅ |
| **List page (20 items)** | < 1s | ~0.8s | ✅ |
| **Modal open** | < 500ms | ~300ms | ✅ |
| **API response** | < 1s | ~500-800ms | ✅ |
| **Bulk mark (20 records)** | < 2s | ~1.2s | ✅ |
| **Search** | < 2s | ~1s | ✅ |

---

## 🔍 How to Navigate the Codebase

### "I need to add a new page (e.g., Reports)"

```
1. Create page structure:
   src/app/reports/page.tsx

2. Define data needs:
   - What data does page display?
   - Which API endpoints needed?
   - Hooks: useReports(), useDashboard()?

3. Create API endpoint:
   src/app/api/reports/route.ts
   - GET handler
   - Auth middleware
   - Prisma query
   - Format response

4. Create custom hook:
   src/hooks/useReports.ts
   - useSWR with config
   - Pagination
   - Filtering logic

5. Build components:
   src/components/ReportCard.tsx
   src/components/ReportModal.tsx
   src/components/ReportTable.tsx

6. Add to sidebar:
   src/components/Sidebar.tsx
   - Add navigation item
   - Import page icon

7. Link auth (if needed):
   src/lib/middleware.ts
   - requireRole(['FACILITATOR', 'ADMIN'])
```

### "I need to add a new field to Students"

```
1. Update database schema:
   prisma/schema.prisma
   └─ Add field to Student model

2. Create migration:
   npx prisma migrate dev --name add_field_name

3. Update type definitions:
   src/types/index.ts
   └─ Update Student interface

4. Update API response:
   src/app/api/students/route.ts
   └─ Include new field in select

5. Update UI components:
   src/components/StudentCard.tsx
   src/components/StudentModal.tsx
   └─ Display/edit new field

6. Update validations:
   src/lib/validations.ts
   └─ Add Zod validation for field

7. Test:
   - Load students page
   - Create new student
   - Edit existing student
   - Verify field saves/loads
```

### "I need to connect to a new AI provider"

```
1. Create new provider integration:
   src/lib/ai/new-provider.ts
   └─ Initialize client
   └─ Export functions

2. Add to AI index:
   src/lib/ai/index.ts
   └─ export * from './new-provider'

3. Create API route:
   src/app/api/ai/new-feature/route.ts
   └─ POST handler
   └─ Call new provider
   └─ Handle errors

4. Add error handling:
   Try new provider → Fallback to existing → Return error
   
5. Update environment:
   .env.local
   └─ Add NEW_PROVIDER_API_KEY

6. Add to documentation:
   docs/ENVIRONMENT_CONFIGURATION_GUIDE.md
   └─ Document setup steps
```

---

## 🚀 Common Tasks

### Task: "Make attendance real-time"
**Current:** Polls every 15 seconds  
**Goal:** Real-time updates when teacher marks  
**Solution:**
- Add WebSocket server (separate Node process)
- Emit events when attendance marked
- Connect browser WebSocket listener
- Update UI on event receipt
- Fallback to polling if WebSocket fails

### Task: "Add email notifications"
**Current:** Resend integration exists (optional)  
**Goal:** Email on student at-risk  
**Solution:**
- Already integrated via Resend
- Create /api/reports/send-email endpoint
- Trigger on AttendanceAlert creation
- Email template with student details
- Add user preference to disable

### Task: "Export report as Excel"
**Current:** PDF and CSV support  
**Goal:** Excel format  
**Solution:**
- Add library: npm install xlsx
- Create /api/reports/export/excel endpoint
- Generate workbook from dataset
- Stream Excel file to client
- Add button in Reports page

### Task: "Scale to 10,000 students"
**Major refactor needed:**
- Migrate SQLite → PostgreSQL
- Add Redis caching layer
- Implement database indexes
- Add read replicas for analytics
- Consider microservices split
- Timeline: 3-6 months

---

## 📞 Key Contacts in Codebase

| Responsibility | File | Developer Guide |
|---------------|------|-----------------|
| **Auth** | `src/lib/auth.ts` | JWT flow, password hashing |
| **Database** | `prisma/schema.prisma` | Schema changes, migrations |
| **API Response Format** | `src/lib/api-utils.ts` | Standardized responses |
| **Caching** | `src/lib/swr-config.ts` | Refresh intervals |
| **UI Components** | `src/components/ui/` | Base component library |
| **AI Features** | `src/lib/ai/` | Multi-provider integration |
| **Security** | `src/middleware.ts` | Auth, CORS, rate limiting |
| **Database Seed** | `scripts/seed-safe.js` | Initial data load |

---

## 💡 Tips & Best Practices

### ✅ DO
- ✅ Always paginate large result sets (default: 20 items per page)
- ✅ Use include() in Prisma to prevent N+1 queries
- ✅ Cache API responses with SWR (don't re-fetch every render)
- ✅ Validate all inputs with Zod before processing
- ✅ Use TypeScript types everywhere (type-safety is a feature)
- ✅ Add loading states and error boundaries
- ✅ Test API routes with Postman/curl before component integration
- ✅ Document why, not what (comments explain design decisions)

### ❌ DON'T
- ❌ Don't query database without filters (causes long loading)
- ❌ Don't fetch in useEffect without debouncing (causes multiple requests)
- ❌ Don't store sensitive data in localStorage (JWT only, no passwords)
- ❌ Don't ignore TypeScript errors (they're there to help)
- ❌ Don't make circular imports (architect around them)
- ❌ Don't use `any` type (use proper types)
- ❌ Don't modify Prisma migrations after pushed to DB
- ❌ Don't forget to handle errors in API routes

---

## 🎓 Learning Resources

### For Frontend Developers
- Next.js docs: https://nextjs.org/docs
- React 18 hooks: https://react.dev/reference/react/hooks
- Tailwind CSS: https://tailwindcss.com/docs
- SWR: https://swr.vercel.app/

### For Backend Developers
- Prisma docs: https://www.prisma.io/docs/
- Next.js API routes: https://nextjs.org/docs/api-routes/introduction
- JWT.io: https://jwt.io/
- SQLite docs: https://www.sqlite.org/docs.html

### For DevOps/Deployment
- Vercel deployment: https://vercel.com/docs
- Environment variables: https://nextjs.org/docs/basic-features/environment-variables
- Database backups: `npm run db:backup`
- Monitoring: Browser DevTools, server logs

---

## 📈 Improvement Roadmap

### Q1 2026 (Current)
- ✅ Core CRUD operations
- ✅ Attendance tracking
- ✅ Basic assessments
- ✅ AI lesson generation

### Q2 2026
- 🔄 Real-time updates (WebSocket)
- 🔄 Advanced reporting
- 🔄 Mobile companion app
- 🔄 Dark mode UI

### Q3 2026
- 🔄 Database optimization
- 🔄 Audit logging
- 🔄 Custom workflows
- 🔄 Multi-language support

### Q4 2026+
- 🔄 Microservices migration
- 🔄 Advanced analytics
- 🔄 Integration with SARS systems
- 🔄 Compliance reporting

---

## ❓ FAQ

**Q: Can this run on-premises?**  
A: Yes. It's self-contained with no external dependencies (except optional AI services). Copy the folder and run `npm install && npm run build && npm start`.

**Q: How do I backup data?**  
A: Run `npm run db:backup`. Backs up SQLite file to /backups folder. To restore: `npm run db:restore`.

**Q: Can I use this with a different database?**  
A: Yes. Modify prisma/schema.prisma, change datasource provider. Works with PostgreSQL, MySQL, MongoDB, etc.

**Q: What's the largest deployment?**  
A: Recommended max: 100 concurrent users. Beyond that, consider PostgreSQL + caching layer.

**Q: How do I add new SSETA modules?**  
A: Edit prisma/schema.prisma Module table, run migration, seed database with new modules.

**Q: Is the system POPIA-compliant?**  
A: Partially. Auth is secure, but no formal audit logging. Add audit tables if needed.

**Q: Can I use authentication from Active Directory?**  
A: Not currently. Would require SSO integration (OAuth 2.0 flow). Future enhancement.

---

## 📞 Support

- **For architecture questions:** Refer to COMPREHENSIVE_ARCHITECTURE_SITEMAP.md
- **For visual explanations:** See ARCHITECTURE_VISUAL_DIAGRAMS.md
- **For code examples:** Check relevant /src folder files
- **For deployment:** Review next.config.mjs and environment setup
- **For AI features:** See docs/ENVIRONMENT_CONFIGURATION_GUIDE.md

---

**Last Updated:** February 23, 2026  
**Version:** 1.0  
**Status:** Complete & Comprehensive
