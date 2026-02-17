---
name: edu-platform-wiring-agent
description: >
  Use this skill when implementing, fixing, or wiring up frontend pages to
  backend APIs in the education management platform. Covers dashboard, 
  assessment checklist, progress, curriculum builder, exports, compliance,
  and any other frontend-to-backend connection work. Guides the agent to
  work systematically, safely, and in plain language.
---

# Education Platform â€” Frontend Wiring Agent

## Purpose

This skill guides an AI coding agent to systematically wire up the frontend 
pages of an education management platform to its existing backend API. 

The backend API is largely complete. The problem is that frontend pages are 
either showing static/placeholder data, have broken form submissions, or are 
not calling their corresponding API endpoints at all.

The agent's job is to bridge that gap â€” safely, one page at a time.

---

## Platform Context

**Type**: Education & Youth Development Management System  
**Stack**: Next.js (App Router) Â· React Â· Tailwind CSS Â· TypeScript/JavaScript  
**API base**: All endpoints under `src/app/api/` (Next.js route handlers)  
**Auth**: Token-based â€” token stored in localStorage or cookie  

**Who uses it**: Facilitators, assessors, programme managers  
**What it manages**: Students, groups, attendance, assessments, curriculum, 
compliance, progress tracking, POE (Portfolio of Evidence), timetables, reports

---

## Core Behaviour Rules

### Rule 1: Read Before You Write
ALWAYS read the target file before modifying it. Never assume what a file 
contains. State what you found before proposing changes.

### Rule 2: Surgical Edits Only
Never rewrite a whole component. Find the specific broken/missing part and 
fix only that. If data fetching already exists for some fields, don't replace 
it â€” add alongside it.

### Rule 3: Match the Codebase Style
- If the file uses TypeScript â†’ use TypeScript
- If there's a custom API client (e.g. `apiClient`, `useApi`, `fetcher`) â†’ use it
- If the project uses React Query â†’ use useQuery/useMutation
- If it uses plain fetch â†’ use plain fetch
- Match existing naming conventions (camelCase, PascalCase, etc.)

### Rule 4: Never Break Auth
Every API call must include the auth token. Check how existing working pages 
send their token and replicate that exact pattern.

### Rule 5: Always Add Error Handling
Every fetch must be in a try/catch. On failure, set an error state and show 
a readable message. Never let an unhandled rejection crash the page.

### Rule 6: Always Add Loading States
Any component that fetches data must show a loading indicator while waiting.
A simple boolean `isLoading` state with a spinner or skeleton is sufficient.

### Rule 7: Explain in Plain Language
Before making changes, explain what you're about to do and why. After making
changes, summarise what changed and how to verify it worked. Avoid jargon 
unless the user has shown they understand it.

---

## Implementation Playbook

### ðŸ  TASK 1 â€” Dashboard (Home Page)

**Goal**: Replace hardcoded/placeholder data with real API responses.

**APIs to call on mount**:
```
GET /api/dashboard/summary          â†’ totals: students, groups, attendance %
GET /api/dashboard/today-classes    â†’ list of today's sessions
GET /api/dashboard/alerts           â†’ warnings and flags
GET /api/dashboard/recent-activity  â†’ activity feed items
GET /api/dashboard/charts           â†’ chart series data (optional, do last)
```

**Implementation pattern**:
```typescript
const [summaryData, setSummaryData] = useState(null)
const [todayClasses, setTodayClasses] = useState([])
const [alerts, setAlerts] = useState([])
const [recentActivity, setRecentActivity] = useState([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const loadDashboard = async () => {
    try {
      const [summary, classes, alertsData, activity] = await Promise.all([
        fetch('/api/dashboard/summary').then(r => r.json()),
        fetch('/api/dashboard/today-classes').then(r => r.json()),
        fetch('/api/dashboard/alerts').then(r => r.json()),
        fetch('/api/dashboard/recent-activity').then(r => r.json()),
      ])
      setSummaryData(summary)
      setTodayClasses(classes)
      setAlerts(alertsData)
      setRecentActivity(activity)
    } catch (err) {
      console.error('Dashboard load failed:', err)
    } finally {
      setIsLoading(false)
    }
  }
  loadDashboard()
}, [])
```

**Verification**: Numbers on dashboard match what's in the database.

---

### âœ… TASK 2 â€” Assessment Checklist

**Goal**: Load a student's checklist state from the API and save checkbox changes.

**APIs used**:
```
GET  /api/groups                          â†’ populate group dropdown
GET  /api/students?groupId={id}           â†’ populate student dropdown  
GET  /api/assessments/{id}/complete       â†’ load current checklist state
POST /api/assessments/{id}/complete       â†’ save a checkbox change
GET  /api/formatives?studentId={id}       â†’ load formative tasks
POST /api/formatives/completion           â†’ save formative completion
```

**Key logic**:
- Load groups on mount â†’ user selects group
- When group selected â†’ load students for that group
- When student selected â†’ load their assessment completion state
- Each checkbox `onChange` â†’ debounce 300ms then POST the updated state
- Show "Saving..." then "Saved âœ“" feedback (auto-hide after 2 seconds)

**Gotcha to watch for**: The assessment ID likely comes from the URL params or 
from the list of assessments loaded for that student's group. Make sure you're 
passing the correct ID to the complete endpoint.

---

### ðŸ“ˆ TASK 3 â€” Progress Page

**Goal**: Show per-student progress against learning outcomes for a selected group.

**APIs used**:
```
GET /api/groups                           â†’ group selector
GET /api/reports/group-progress?groupId  â†’ group-level progress data
GET /api/students/{id}/progress          â†’ individual student progress (on demand)
```

**Layout to build**:
1. Group selector dropdown at top
2. Summary bar: "X/Y students on track"
3. Table or card list: one row per student showing:
   - Name
   - % outcomes completed (progress bar)
   - Status label (On Track / Behind / At Risk)
4. Clicking a student expands a detail view with their individual breakdown

**Colour logic**:
- â‰¥ 75% complete â†’ green (On Track)
- 50â€“74% â†’ yellow (Behind)
- < 50% â†’ red (At Risk)

---

### ðŸ—ï¸ TASK 4 â€” Curriculum Builder Save

**Goal**: Make the builder form actually save to the database.

**APIs used**:
```
POST /api/unit-standards              â†’ create new unit standard
PUT  /api/unit-standards/{id}         â†’ update existing
POST /api/unit-standards (with module context) â†’ or POST /api/modules if building a module
```

**Diagnosis steps**:
1. Find the form's submit handler
2. Check if it calls any API â€” if not, that's the bug
3. Map form fields to the API's expected request body
4. Add the API call with proper error handling
5. On success: show toast, then redirect to `/curriculum`

**Common issue**: Form fields don't match API field names. 
Fix: log the form data before sending and compare to what the API expects.

---

### ðŸ“¤ TASK 5 â€” Export Functions

**Goal**: Enable CSV/file downloads from Attendance and Reports pages.

**Reusable helper** â€” create once, use everywhere:
```typescript
// src/lib/downloadExport.ts
export async function downloadExport(
  endpoint: string,
  filename: string,
  params: Record<string, string> = {}
): Promise<void> {
  const token = localStorage.getItem('token') || ''
  const url = new URL(endpoint, window.location.origin)
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v))
  
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) throw new Error(`Export failed: ${response.statusText}`)
  
  const blob = await response.blob()
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(href)
}
```

**Where to add buttons**:

| Page | Button Label | Endpoint | Filename |
|------|-------------|----------|----------|
| Attendance | Export CSV | /api/attendance/export | attendance.csv |
| Reports | Export Attendance | /api/attendance/export | attendance-report.csv |
| Reports | Export Assessments | /api/assessments/export | assessments-report.csv |
| Reports | Generate AI Report | POST /api/reports/daily/generate-ai | (display in modal) |

---

### âš–ï¸ TASK 6 â€” Compliance Dashboard

**Goal**: Build compliance overview by aggregating 3 existing APIs. No new backend needed.

**APIs used**:
```
GET /api/attendance/stats                     â†’ platform-wide attendance
GET /api/groups                               â†’ list of groups
GET /api/groups/{id}/assessment-status        â†’ per-group assessment completion
GET /api/reports/unit-standards               â†’ unit standards report
```

**Implementation approach**:
1. Load all groups
2. For each group, load their assessment-status in parallel (`Promise.all`)
3. Cross-reference with attendance stats
4. Assign RAG status (Red/Amber/Green) per group:
   - Green: attendance â‰¥ 80% AND assessment completion â‰¥ 75%
   - Amber: attendance 60â€“79% OR assessment completion 50â€“74%
   - Red: attendance < 60% OR assessment completion < 50%
5. Show summary: X groups compliant, Y at risk, Z non-compliant

**Important**: This page may be slow on first load due to multiple requests.
Add a loading state and consider caching the results in sessionStorage.

---

## Authentication Pattern

Check the project for an existing auth helper. Common patterns to look for:

```typescript
// Pattern A: localStorage token
const token = localStorage.getItem('token')
headers: { 'Authorization': `Bearer ${token}` }

// Pattern B: Cookie-based (handled automatically by browser)
fetch(url, { credentials: 'include' })

// Pattern C: Custom API client
import { apiClient } from '@/lib/api'
const data = await apiClient.get('/students')
```

Always use whichever pattern exists in working pages like `/attendance` or `/students`.

---

## Error State Pattern

Use this consistent error pattern across all pages:

```typescript
const [error, setError] = useState<string | null>(null)

// In catch block:
setError('Could not load student data. Please try refreshing.')

// In JSX:
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}
```

---

## File Location Cheat Sheet

When looking for files, check these patterns:

| Page | Likely file path |
|------|-----------------|
| Dashboard | `src/app/page.tsx` or `src/app/(dashboard)/page.tsx` |
| Assessment Checklist | `src/app/assessment-checklist/page.tsx` |
| Progress | `src/app/progress/page.tsx` |
| Curriculum Builder | `src/app/curriculum/builder/page.tsx` |
| Attendance | `src/app/attendance/page.tsx` |
| Reports | `src/app/reports/page.tsx` |
| Compliance | `src/app/compliance/page.tsx` |
| API helper | `src/lib/api.ts` or `src/utils/apiClient.ts` |
| Auth helpers | `src/lib/auth.ts` or `src/context/AuthContext.tsx` |

If the file isn't there, look for it with: `find src -name "*.tsx" | grep -i dashboard`

---

## Verification Checklist

After completing each task, verify:

- [ ] Page loads without console errors
- [ ] Real data appears (not placeholder/hardcoded values)
- [ ] Loading state shows while data is fetching
- [ ] Error state shows if the API call fails (test by temporarily breaking the URL)
- [ ] Forms save data to the database (check by refreshing â€” data should persist)
- [ ] Auth token is included in all requests (check Network tab in DevTools)
- [ ] Mobile layout not broken

---

## Common Bugs & Fixes

**Bug**: Page shows data on first load, then goes blank on refresh  
**Fix**: The auth token isn't being sent â€” add the Authorization header

**Bug**: Form submit does nothing  
**Fix**: Check for `e.preventDefault()` AND that the handler is actually attached 
to the form's `onSubmit`, not just a button's `onClick`

**Bug**: API returns 401 Unauthorized  
**Fix**: Token is expired or not being sent. Check localStorage for the token key name.

**Bug**: API returns 404  
**Fix**: The endpoint URL has a typo or the wrong HTTP method is being used.
Check `BACKEND_SITEMAP.md` for the exact endpoint path and methods.

**Bug**: Data loads but component doesn't update  
**Fix**: State mutation issue. Make sure you're calling the setter function 
(`setStudents(data)`) not mutating state directly.

**Bug**: CORS error in browser console  
**Fix**: This shouldn't happen with Next.js API routes (same origin). 
If it does, check that you're calling `/api/...` not `http://localhost:3001/api/...`

---

## Communicating Progress

After each task, report back with:

1. **What file you found** and what it currently contains
2. **What was missing or broken** (in plain terms)
3. **What you changed** (brief summary, not the whole code)
4. **How to verify it works** (what the user should see or click)
5. **Any concerns** â€” if something looks risky or unclear, flag it

Example:
> "I found the dashboard at `src/app/page.tsx`. It had hardcoded numbers 
> like `totalStudents = 0` and no API calls at all. I added a `useEffect` 
> that loads the summary, today's classes, and alerts on page load. 
> To verify: refresh the dashboard â€” you should see your real student count.
> One thing I noticed: there's no error handling if the database is offline â€” 
> want me to add that too?"

---

## Out of Scope (Don't Touch)

- Database schema / migration files
- Authentication logic (login/register) â€” already working
- Backend API route handlers â€” only touch if a frontend fix requires it 
  AND you have confirmed the backend endpoint is the problem
- Settings page â€” already working
- Groups page core list/create â€” already working

---

## When You're Stuck

If you can't find a file, run:
```bash
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "progress\|checklist\|compliance"
```

If an API endpoint isn't responding as expected, check:
1. Is the route file at the correct path in `src/app/api/`?
2. Does the HTTP method match (GET vs POST)?
3. Is the request body formatted as JSON with `Content-Type: application/json`?
4. Is the auth token present and valid?

If in doubt, ask. Don't guess and overwrite working code.

