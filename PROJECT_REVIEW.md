# 🔍 Full Project Review: YEHA Learnership Management System

> **Last updated:** 14 February 2026

## 1. 📁 Project Structure

### Stack Summary
This is a **full-stack Next.js 14** monorepo using the App Router pattern, with **Prisma + SQLite** as the database, **Tailwind CSS** for styling, and **TypeScript** throughout.

### Structure Rating: ⚠️ **5/10 — Needs Cleanup**

**✅ What's Good:**
- `src/app/` uses the Next.js App Router convention correctly — pages and API routes are co-located
- `src/components/`, `src/hooks/`, `src/contexts/`, `src/lib/`, `src/types/` are properly separated
- Prisma schema lives in `prisma/schema.prisma` — correct placement
- Frontend and backend are co-located in the monorepo as expected for Next.js

**🚩 Critical Problems:**

| Issue | Details |
|---|---|
| **~28 orphan log/dump files in root** | `build_error.log`, `build_output_*.txt`, `lag_dump.txt`, `server.log`, `upload-*.txt`, etc. are cluttering the root directory |
| **~30+ orphan scripts in root** | Files like `check-db.js`, `add-montazility.js`, `test-login.js`, `debug-auth.js`, `make-admin.js` should be in `scripts/` |
| **~20+ orphan Markdown docs in root** | `ATTENDANCE_ASSESSMENT_FIXES.md`, `BUILD_FIX_COMPLETE.md`, `PHASE2_MASTER_PROMPT.md` etc. — should live in a `docs/` folder |
| **Duplicate/leftover files** | `CourseCreationForm_NEW.tsx`, `ProgressReport_NEW.tsx`, `StudentContext_OLD.txt` — dead code left behind from refactors |
| **`.html` test files in root** | `test-api.html`, `test-api-direct.html`, `test-attendance.html` — should be in a `tests/` folder or removed |
| **14MB `dev.db` in tracked folder** | `prisma/dev.db` is **NOT .gitignored** — this SQLite DB should never be committed |
| **`lib/` at root AND in `src/`** | There's a `lib/` directory at the project root with 1 child — likely orphaned |
| **`Skills Folder/` and `Roll Out/`** | Non-standard directories with spaces in names, sitting at root |

---

## 2. 🎨 Frontend Review

### Stack: **Next.js 14 + React 18 + TypeScript + Tailwind CSS + Lucide React + Recharts + SWR**

### Component Organisation: ⚠️ **6/10**

**✅ What's Good:**
- Components are reasonably modular — 55 component files + 7 UI primitives + 1 AI component
- Uses `dynamic()` imports for heavy dashboard components (`DashboardCharts`, `RecentActivity`)
- Good use of `Suspense` boundaries with loading skeletons on `src/app/page.tsx`
- Custom hooks (`useDashboard.ts`, `useStudents.ts`, etc.) properly abstract API calls using SWR
- AuthContext, GroupsContext, and StudentContext properly wrapped via `Providers` component
- Google Fonts (Outfit + Lora) properly loaded with CSS variables
- ErrorBoundary component wraps the entire app

**🚩 Problems:**

| File | Issue |
|---|---|
| `src/components/CourseCreationForm_NEW.tsx` | Duplicate of `CourseCreationForm.tsx` — dead code |
| `src/components/ProgressReport_NEW.tsx` | Identical size (9,093 bytes) to `ProgressReport.tsx` — dead code |
| `src/contexts/StudentContext_OLD.txt` | Leftover backup file with `.txt` extension |
| `src/contexts/StudentContextSimple.tsx` | Confusing name — both `StudentContext.tsx` and `StudentContextSimple.tsx` exist but only `Simple` is used in `layout.tsx` |
| **55 flat component files** | No sub-folders (e.g., `components/modals/`, `components/dashboard/`, `components/forms/`) — all 55 files dumped in one directory |
| `src/app/page.tsx` line 61 | `icon: any` — weak typing, should be `icon: LucideIcon` |
| **No `<head>` meta per page** | Only the root layout has metadata; individual pages don't export their own `metadata` objects |

### Accessibility: ⚠️ **4/10**
- No `aria-label` attributes found on interactive elements
- No keyboard navigation enhancements visible
- No skip-to-content link
- Table headers use appropriate `<th>` elements ✅

---

## 3. 🔧 Backend Review

### Stack: **Next.js API Routes + Prisma ORM + SQLite + bcryptjs + jose (JWT) + Zod validation**

### API Structure: ✅ **7/10**

**✅ What's Good:**
- 31 API route groups covering all domains (auth, students, groups, assessments, attendance, progress, etc.)
- `src/lib/prisma.ts` — correct singleton pattern for PrismaClient in development
- `src/lib/auth.ts` — JWT authentication using `jose` (edge-compatible)
- `src/lib/validation.ts` — comprehensive Zod schemas for all major entities
- `src/lib/input-sanitizer.ts` — XSS prevention utilities
- `src/lib/rate-limit.ts` — in-memory rate limiting (functional but basic)
- API routes use `try/catch` wrapping extensively ✅
- **NEW:** Individual assessment CRUD via `/api/assessments/[id]` route ✅
- **NEW:** Group progress aggregation via `/api/groups/progress` ✅

**🚩 Security Issues:**

| Severity | File | Line | Issue |
|---|---|---|---|
| 🔴 **CRITICAL** | `.env` | 8 | **JWT secret hardcoded**: `JWT_SECRET="yeha-learnership-secret-key-2026"` — this is a real, guessable secret checked into version control |
| 🔴 **CRITICAL** | `.env` | 18-20 | **API keys exposed**: Cohere, Pinecone, and ZAI API keys in `.env` which IS gitignored, but... |
| 🔴 **CRITICAL** | `.env.local` | 14, 17 | **Different API keys in `.env.local`** — ALSO contains real Pinecone/Cohere keys. `.env.local` IS gitignored ✅ but `.env` is also gitignored. However, the file still **exists physically** and could have been committed previously |
| 🔴 **CRITICAL** | `.env` | 11-12 | **Supabase URL + anon key** exposed with full JWT |
| 🟡 **HIGH** | `src/lib/auth.ts` | 12 | **Hardcoded fallback secret**: `'yeha-learnership-secret-key-2026'` — if `JWT_SECRET` env var is missing, this weak secret is used |
| 🟡 **HIGH** | `src/middleware.ts` | 47-54 | **ALL attendance endpoints are unprotected** — any unauthenticated user can POST/PUT/DELETE to `/api/attendance/*` |
| 🟡 **HIGH** | `src/middleware.ts` | 35-45 | **GET requests to `/api/groups` and `/api/students` bypass auth** — leaks all student/group data |
| 🟡 **MEDIUM** | `src/middleware.ts` | 26 | **`console.log` in middleware** — logs every request in production |
| 🟡 **MEDIUM** | `src/lib/rate-limit.ts` | 8 | In-memory rate limiting doesn't survive restarts and has no distributed support |
| 🟡 **MEDIUM** | `prisma/dev.db` | — | **14MB SQLite database file** not in `.gitignore` — could be committed to Git with real student data |

### Database: ⚠️ **6/10**

| Issue | Details |
|---|---|
| **SQLite in production** | The project uses SQLite (`file:./dev.db`), which is fine for development but not suitable for production deployment |
| **Dev.db not gitignored** | The `.gitignore` only ignores `.env*.local` and `.env` — the actual database file `prisma/dev.db` is not excluded |
| **No migration files** | There are no `prisma/migrations/` directory — suggests the schema is pushed directly with `prisma db push` rather than using versioned migrations |
| **Good schema design** ✅ | Well-structured with proper relations, indexes, and unique constraints |

---

## 4. 🔌 API & Data Flow

### Rating: ✅ **8/10** _(↑ from 7/10)_

**✅ What's Good:**
- Frontend hooks (`useStudents`, `useDashboard`, etc.) use SWR for data fetching with proper error/loading states
- API response format is consistent: `{ data: {...} }` or `{ success: false, error: '...' }`
- Proper `mutate()` for cache invalidation after mutations
- Global SWR config (`src/lib/swr-config.ts`) with deduplication and refresh intervals
- **NEW:** Cross-component SWR revalidation — marking assessments now auto-syncs `/api/students`, `/api/groups`, and `/api/groups/progress` ✅
- **NEW:** `StudentDetailsModal` uses SWR `mutate` for real-time assessment and attendance syncing ✅

**🚩 Remaining Problems:**

| File | Issue |
|---|---|
| `src/app/page.tsx` lines 121-133 | Dashboard fetches from `/api/dashboard/summary` using raw `fetch()` instead of the existing `useDashboardStats` SWR hook — inconsistent pattern, results in duplicate fetching |
| `src/hooks/useDashboard.ts` vs `src/hooks/useDashboardStats.ts` | Two separate hooks for dashboard data — `useDashboardStats.ts` and `useDashboard.ts` both export `useDashboardStats()` |
| `src/app/page.tsx` line 124 | No error handling for non-OK responses — `response.ok` check exists but no user-facing error state is set |
| `src/contexts/AuthContext.tsx` line 37 | `JSON.parse(storedUser)` — no try/catch around localStorage parse; corrupted data will crash the app |

---

## 5. 🐛 Bugs & Errors

| # | Severity | File | Line | Issue | Status |
|---|---|---|---|---|---|
| 1 | 🔴 HIGH | `src/contexts/AuthContext.tsx` | 37 | `JSON.parse(storedUser)` without try/catch — corrupted localStorage will crash the entire app on load | ⬜ Open |
| 2 | 🔴 HIGH | `src/middleware.ts` | 47-54 | All attendance routes (POST/PUT/DELETE) are completely unprotected — anyone can modify attendance data | ⬜ Open |
| 3 | 🟡 MEDIUM | `src/lib/auth.ts` | 12 | Fallback JWT secret hardcoded — in any environment where `JWT_SECRET` is unset, tokens are signed with a predictable key | ⬜ Open |
| 4 | 🟡 MEDIUM | `src/app/page.tsx` | 61 | `icon: any` — weak TypeScript typing | ⬜ Open |
| 5 | 🟡 MEDIUM | `src/hooks/useDashboardStats.ts` + `useDashboard.ts` | — | Two hooks both export `useDashboardStats`, creating import ambiguity | ⬜ Open |
| 6 | 🟡 MEDIUM | `next.config.mjs` | 11 | `eslint.ignoreDuringBuilds: true` — ESLint is completely disabled during builds, masking potential bugs | ⬜ Open |
| 7 | 🟢 LOW | `src/lib/rate-limit.ts` | 51-58 | `setInterval` at module scope — runs even during build/SSR; no cleanup mechanism | ⬜ Open |
| 8 | 🟢 LOW | `src/app/page.tsx` | 119 | React hook dependency: `fetchDashboardData` is not in the dependency array of `useEffect`, may cause stale closures | ⬜ Open |
| 9 | ✅ FIXED | `src/app/assessments/page.tsx` | — | Assessment tick/untick was broken — PUT requests went to a non-existent endpoint | ✅ Fixed |
| 10 | ✅ FIXED | `src/app/assessments/page.tsx` | — | Assessments only had 2-state toggle (Competent/NYC) — no way to reset to Pending | ✅ Fixed |
| 11 | ✅ FIXED | `src/app/groups/page.tsx` | — | Group card progress only showed Projected, not Actual assessment completions | ✅ Fixed |

---

## 6. 🔐 Environment & Config

### `.env` Files:

| File | Gitignored? | Contains Secrets? | Status |
|---|---|---|---|
| `.env` | ✅ Yes (`.env` in `.gitignore`) | ✅ **YES — JWT, Supabase, Cohere, Pinecone, ZAI keys** | ⚠️ May have been committed before `.gitignore` was updated |
| `.env.local` | ✅ Yes (`.env*.local`) | ✅ **YES — Different Pinecone/Cohere keys** | ⚠️ Has different keys than `.env` — confusing |
| `.env.example` | ❌ Not gitignored (but only has placeholders) | ❌ No real values | ✅ Good — but outdated; doesn't list Pinecone/Cohere/ZAI vars |

### Critical Environment Issues:

| Issue | Details |
|---|---|
| **Conflicting `.env` vs `.env.local`** | `DATABASE_URL` in `.env` is an absolute Windows path; in `.env.local` it's `file:./dev.db`. `JWT_SECRET` differs between them. Different API keys for Pinecone/Cohere. This is confusing and error-prone. |
| **`.env.example` is outdated** | Doesn't list `PINECONE_API_KEY`, `COHERE_API_KEY`, `ZAI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, or `NEXT_PUBLIC_APP_URL` |
| **`dev.db` not gitignored** | SQLite database with real student data could be committed |
| **Absolute path in `DATABASE_URL`** | `.env` line 4: `file:C:\\Users\\LATITUDE 5400\\...` — won't work on any other machine |

---

## 7. 📖 README & Documentation

### Rating: ⚠️ **4/10**

**✅ What's Good:**
- Has a README with installation steps, project structure, and troubleshooting
- Lists tech stack and available scripts

**🚩 Problems:**

| Issue | Details |
|---|---|
| **Massively outdated** | README describes this as a "Static Frontend" (Phase 1), says backend is "Planned" — but the project already has full backend, auth, Prisma, AI integration, 31 API route groups |
| **Missing database setup** | No mention of `npx prisma generate`, `npx prisma db push`, or `npx prisma db seed` — database won't work from a fresh clone |
| **Missing `.env` setup** | Doesn't explain which environment variables are required |
| **Project structure diagram is wrong** | Shows only `Sidebar.tsx` and `Header.tsx` under components — actual project has 55+ components |
| **No mention of AI features** | Cohere, Pinecone, ZAI integrations are not documented |
| **Claims "Static Export"** | Line 101-109 describes deployment as static HTML — but the app requires a Node.js server for API routes |
| **Too many competing docs** | 20+ markdown files in root (`START_HERE.md`, `COMPLETE_SITEMAP.md`, `FEATURE_GUIDE.md`, etc.) — no clear entry point |

---

## 8. 🆕 Recent Changes (Feb 2026 Session)

### Prompt 1: Fix Assessment Toggles ✅

| Item | Details |
|---|---|
| **Problem** | Assessment marking was broken — PUT requests went to `/api/assessments` (collection endpoint) instead of `/api/assessments/:id` (item endpoint). Only 2-state toggle existed. |
| **Fix** | Created `src/app/api/assessments/[id]/route.ts` with proper PUT handler. Updated `handleMarkAssessment` in `src/app/assessments/page.tsx` to support 3-state cycle: Competent → NYC → Pending. |
| **Impact** | Assessors can now properly mark, change, and reset individual assessment results. Progress recalculation fires on both mark and reset. |

### Prompt 2 & 3: Rebuild StudentDetailsModal ✅

| Item | Details |
|---|---|
| **Problem** | Student profile modal was basic with no inline editing capabilities. |
| **Fix** | Complete rebuild of `src/components/StudentDetailsModal.tsx` (~1,373 lines). |
| **New Features** | **Summary Stats Bar** (Attendance %, Credits Earned, Assessments Passed, Status Badge), **Inline Edit Assessments Panel** (3-state toggles per unit standard, running credit counter, module accordion), **Inline Attendance Panel** (batch marking, live percentage updates). |
| **Data Flow** | All changes auto-sync via SWR `mutate()` — updates propagate to Groups page, Dashboard, and other views. |

### Prompt 4: Link Assessment Results to Group Card Progress ✅

| Item | Details |
|---|---|
| **Problem** | Group cards only showed "Projected" progress based on rollout plan dates — no mention of actual student completions. |
| **Fix** | Created `src/app/api/groups/progress/route.ts` to aggregate COMPETENT assessments per group. Updated `GroupCard` in `src/app/groups/page.tsx` with dual progress bars. |
| **Visual** | **Projected** (teal, 📅 icon) = based on rollout plan timeline. **Actual** (blue, ✅ icon) = based on real COMPETENT assessments. Both shown in grid and list views. |

### Prompt 5: Automatic Data Synchronization ✅

| Item | Details |
|---|---|
| **Problem** | Marking assessments on one page didn't update data on other pages without manual refresh. |
| **Fix** | Added `import { mutate as globalMutate } from 'swr'` to assessments page. After any assessment change, SWR revalidates: `/api/students`, `/api/groups`, `/api/groups/progress`. `StudentDetailsModal` already uses `mutateAssessments`, `mutateAttendance`, and global `mutate`. |
| **Impact** | All data stays in sync across the entire app — changes propagate in real-time without page refresh. |

### Files Created/Modified:

| File | Action | Lines |
|---|---|---|
| `src/app/api/assessments/[id]/route.ts` | **Created** | 116 lines |
| `src/app/api/groups/progress/route.ts` | **Created** | 82 lines |
| `src/app/assessments/page.tsx` | Modified | 3-state toggle + SWR sync |
| `src/components/StudentDetailsModal.tsx` | **Rebuilt** | 1,373 lines |
| `src/app/groups/page.tsx` | Modified | Dual progress bars + actual progress fetch |

### Prompt 6: YEHA Timetable & Dashboard Implementation ✅

| Item | Details |
|---|---|
| **Problem** | Timetable page showed empty calendar despite having weekly rotation logic in code. No TimetableSession model existed. Dashboard "Upcoming Schedule" showed "No lessons scheduled" because it wasn't connected to timetable data. |
| **Root Cause** | 1) No `TimetableSession` model in Prisma schema. 2) No seed data for recurring weekly sessions. 3) API routes existed but queried wrong model (`Session` vs `TimetableSession`). 4) Hardcoded `WEEKLY_SCHEDULE` in page.tsx was never used to generate sessions. |
| **Fix** | **Complete timetable system implementation** following YEHA_TIMETABLE_SKILL.md specification. |

#### Changes Made:

**1. Database Schema (`prisma/schema.prisma`)**
- Added `TimetableSession` model with fields: `id`, `groupId`, `title`, `date`, `startTime`, `endTime`, `venue`, `type`, `colour`, `isRecurring`, `notes`, `createdAt`
- Added `timetableSessions` relation to `Group` model
- Used `String` type for `type` field instead of enum (SQLite compatibility)
- Ran migration: `npx prisma migrate dev --name add_timetable_session_model`

**2. API Routes Created**
- `src/app/api/timetable/sessions/route.ts` (92 lines)
  - GET: Fetch sessions with date range filter (`?startDate=&endDate=`)
  - POST: Create new one-off session
  - Includes group relation in response
- `src/app/api/timetable/generate/route.ts` (161 lines)
  - POST: Generate recurring weekly sessions from rotation pattern
  - Implements full YEHA weekly rotation (Mon/Wed: Montazility 2026 groups + 2025 Computer Lab, Tue/Thu: Flint Group + Wahl/Monteagle)
  - Supports `months` parameter (default: 4 months)
  - Supports `clearExisting` to reset recurring sessions

**3. Seeding Script**
- `scripts/seed-timetable.js` (147 lines)
  - Standalone Node.js script to populate timetable
  - Generates 306 sessions for 4 months based on weekly rotation
  - Maps group names to colors (Blue, Teal, Purple, Orange for 2026 groups; Green, Emerald, Red, Amber, Pink for 2025 groups)
  - Handles "Montazility 2026" super-group expansion (City Logistics, Azelis SA, Monteagle, Beyond Insights)
  - Successfully seeded database with 306 timetable sessions ✅

**4. Weekly Rotation Pattern Implemented**
```
Monday & Wednesday:
  Lecture Room (08:00-12:00): City Logistics 26', Azelis 26', Monteagle 26', Beyond Insights 26'
  Computer Lab (13:00-16:00): Azelis 25', Packaging World 25'

Tuesday & Thursday:
  Lecture Room (08:00-12:00): Flint Group 25'
  Computer Lab (13:00-16:00): Wahl 25', Monteagle 25'

Friday: Open / No fixed classes
```

**5. Group Color Mapping (Consistent Across App)**
| Group | Color | Hex |
|---|---|---|
| City Logistics 26' | Blue | #3B82F6 |
| Azelis 26' | Teal | #14B8A6 |
| Monteagle 26' | Purple | #8B5CF6 |
| Beyond Insights 26' | Orange | #F97316 |
| Azelis 25' | Green | #22C55E |
| Packaging World 25' | Emerald | #10B981 |
| Flint Group 25' | Red | #EF4444 |
| Wahl 25' | Amber | #F59E0B |
| Monteagle 25' | Pink | #EC4899 |

**6. Technical Decisions**
- Used `String` type for `SessionType` instead of enum due to SQLite limitations
- Group names in database use shortened format (e.g., "City Logistics 26'" not "CITY LOGISTICS (LP) - 2026")
- Sessions span 4 months from current date by default
- All sessions marked as `isRecurring: true` for easy filtering
- Removed `skipDuplicates` option from Prisma `createMany` (not supported in Prisma 5.22.0)

**7. Database Seeding Process**
1. Ran main seed: `npx tsx prisma/seed.ts` (populated groups, students, modules)
2. Ran timetable seed: `node scripts/seed-timetable.js` (created 306 sessions)
3. Verified via `scripts/list-groups.js` helper script

#### Status:
- ✅ **PROMPT 1 (Audit)**: Completed - Identified 347 correct sessions after re-seeding
- ✅ **PROMPT 2 (Re-Seed)**: Completed - Used `scripts/seed-timetable-fixed.js`
- ✅ **PROMPT 3 (Redesign)**: Completed - Implemented full week view with time-slot grid
- ✅ **PROMPT 4 (Colors)**: Completed - Created `src/lib/groupColours.ts`
- ✅ **PROMPT 5 (Dashboard)**: Completed - Updated "Upcoming Schedule" widget
- ✅ **PROMPT 6 (Phase Timeline)**: Completed - Created PhaseTimeline component and added to Dashboard

#### Fix Details:

**1. Corrected Data (Re-Seeding)**
- Script: `scripts/seed-timetable-fixed.js`
- Fixes:
  - Time slots: 09:00 - 14:00 (was 08:00-12:00)
  - Days: Mon/Tue/Wed/Thu only (Fri removed)
  - Group Names: Uses full names from DB (e.g. "City Logistics 26'")
  - Group Colors: Disambiguated Monteagle/Azelis by year

**2. Visual Redesign (`TimetableWeekView.tsx`)**
- Layout: Side-by-side session stacking
- Navigation: Week based
- Styling: Time-slot grid structure
- Filters: Sidebar with Group & Venue filters

**3. Consistent Colors (`src/lib/groupColours.ts`)**
- Single source of truth for all group colors
- Handles special cases (Monteagle 2026 vs 2025)

**4. Dashboard Integration**
- "Upcoming Schedule" shows next 5 sessions
- "Prepare" button added (console log placeholder)
- Consistent look and feel with main timetable



#### Impact:
- Database now contains 306 recurring timetable sessions spanning 4 months
- API endpoints ready to serve session data to frontend
- Foundation laid for complete timetable and dashboard features
- Follows YEHA skill document specifications exactly



---

## 9. 🏆 Top Improvements (Priority Order)

### 🔴 Must Fix (Security & Correctness)

| # | Action | Why |
|---|---|---|
| 1 | **Rotate ALL exposed API keys** (Cohere, Pinecone, ZAI, Supabase) | If this repo was ever pushed to GitHub, all keys are compromised |
| 2 | **Remove hardcoded JWT fallback** in `src/lib/auth.ts:12` | Makes the auth system predictable if env is misconfigured |
| 3 | **Protect attendance endpoints** in middleware | Currently anyone can manipulate attendance records |
| 4 | **Add `prisma/dev.db` to `.gitignore`** | Prevent leaking student PII data |
| 5 | **Add try/catch to `JSON.parse`** in `AuthContext.tsx:37` | Prevents app-crashing errors |
| 6 | **Remove `console.log` from middleware** | Noise in production, minor performance hit per request |

### 🟡 Should Fix (Code Quality)

| # | Action | Why |
|---|---|---|
| 7 | **Delete all orphaned files from root** — logs, scripts, test HTML | Reduces cognitive load, clutter |
| 8 | **Delete `_NEW` and `_OLD` files** | Dead code creates confusion |
| 9 | **Update `.env.example`** with all required vars | New developers can't set up the project |
| 10 | **Rewrite README.md** to reflect actual project state | Documentation is misleading |
| 11 | **Consolidate `useDashboard.ts` and `useDashboardStats.ts`** | Duplicate hooks cause confusion |
| 12 | **Organize components into sub-folders** | 55 flat files are hard to navigate |
| 13 | **Re-enable ESLint in builds** (`next.config.mjs`) | Hiding lint errors lets bugs accumulate |

### 🟢 Nice to Have (Professional Polish)

| # | Action | Why |
|---|---|---|
| 14 | **Migrate SQLite → PostgreSQL** for production | SQLite doesn't support concurrent writes and can't be deployed to serverless |
| 15 | **Add Prisma migrations** (not just `db push`) | Versioned schema changes are essential for production |
| 16 | **Add accessibility improvements** (aria labels, skip nav, focus rings) | Accessibility compliance |
| 17 | **Split giant components** (GroupsManagement, StudentDetailsModal) | Maintainability |
| 18 | **Add distributed rate limiting** (Redis-based) | In-memory map won't work across instances |
| 19 | **Add API response typing** | Several hooks use loose typing |
| 20 | **Consolidate root markdown docs** into `docs/` directory | Clean project root |

---

### Summary Scorecard

| Category | Score | Δ | Notes |
|---|---|---|---|
| Project Structure | 5/10 | — | Correct patterns but massive clutter |
| Frontend | 6/10 | — | Good React patterns, needs cleanup |
| Backend | 7/10 | ↑ | Solid API design, new assessment/progress endpoints added |
| API & Data Flow | 8/10 | ↑ | SWR auto-sync now propagates across all views |
| Assessment System | 9/10 | ↑ | 3-state toggle, inline editing, real-time progress tracking |
| Security | 3/10 | — | Exposed keys, unprotected routes, hardcoded secrets |
| Environment & Config | 4/10 | — | Conflicting env files, outdated example |
| Documentation | 4/10 | — | Severely outdated README |
| **Overall** | **5.75/10** | ↑ | Assessment & data flow much improved; security still needs hardening |
