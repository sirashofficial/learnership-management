# 🚀 PHASE 2 MASTER PROMPT
# Education Platform — Complete Site-Wide Implementation
# ======================================================
# PHASE 1 IS DONE. This prompt picks up everything still broken or incomplete.
#
# HOW TO USE:
# Paste this entire file into Cursor AI chat, Claude Code, or any AI
# assistant with access to your project files in VS Code.
# Work through tasks in order — each one builds on the last.
# ---------------------------------------------------------------

---

You are a senior full-stack developer continuing work on an education management
platform built with Next.js (App Router). Phase 1 wired up the dashboard,
compliance, assessments, progress, and export features. They are working.

Phase 2 is everything else. Your job is to implement full functionality across
the remaining pages and fix broken buttons/features site-wide.

## NON-NEGOTIABLE BEHAVIOUR RULES
1. Read every file before changing it. Tell me what you found first.
2. Never rewrite a whole component — make surgical, targeted edits only.
3. Match the existing code style exactly (TypeScript, naming conventions, imports).
4. Every API call needs: auth headers + try/catch + loading state + error state.
5. Never break something that already works.
6. Explain what you changed and how to verify it — in plain language.
7. If something is risky or unclear, ask before doing it.

## THE TECH STACK
- Framework: Next.js 14+ with App Router
- Frontend: React with hooks, Tailwind CSS
- Backend: Next.js API routes under src/app/api/
- Auth: Token in localStorage (key: 'token') — check existing working pages first
- Language: TypeScript — match whatever the files use

---

## ═══════════════════════════════════════════════════════
## TASK 1 — ATTENDANCE SYSTEM (Full Feature)
## ═══════════════════════════════════════════════════════

File to find: src/app/attendance/page.tsx (or similar)

### What needs to work:

**A) Mark Attendance**
- Group selector dropdown → loads from GET /api/groups
- Date picker (defaults to today)
- When group + date selected, load student list from GET /api/students?groupId={id}
- Each student row shows: name, photo/avatar, and 3 buttons: Present / Absent / Late
- Buttons must be visually distinct (green/red/yellow) and show which is currently selected
- On click, call POST /api/attendance with body:
  { studentId, groupId, date, status: "present" | "absent" | "late" }
- Show "Saved" confirmation inline (next to each student row, not a popup)
- "Mark All Present" button at top → loops through all students and marks each present
- Bulk submit: POST /api/attendance/bulk with array of all records at once

**B) View Attendance History**
- Date range picker (start date / end date)
- Filter by group
- Table showing: Student name | Date | Status | Marked by
- Colour-code rows: green = present, red = absent, yellow = late
- Pagination if more than 20 records
- Call GET /api/attendance/history?groupId={id}&startDate={}&endDate={}

**C) Attendance Alerts Panel**
- Section at bottom of page (or separate tab)
- Calls GET /api/attendance/alerts
- Shows students with low attendance (flagged by backend)
- Each alert shows: student name, current attendance %, trend arrow
- "Send Reminder" button per student (UI only for now, can be wired later)

**D) Attendance Stats Bar**
- At top of page, show 4 stat cards:
  - Today's attendance % → from GET /api/attendance/stats?date=today
  - This week % → same endpoint with week range
  - Students below 80% → count from GET /api/attendance/rates
  - Active alerts count → from GET /api/attendance/alerts

**APIs used:**
- GET  /api/attendance              → list records
- POST /api/attendance              → single mark
- POST /api/attendance/bulk         → mark all at once
- GET  /api/attendance/history      → past records
- GET  /api/attendance/stats        → aggregate stats
- GET  /api/attendance/rates        → per-student rates
- GET  /api/attendance/alerts       → low attendance flags
- GET  /api/attendance/export       → already done in Phase 1

---

## ═══════════════════════════════════════════════════════
## TASK 2 — CALENDAR / TIMETABLE (Interactive)
## ═══════════════════════════════════════════════════════

File to find: src/app/timetable/page.tsx (or similar)

### What needs to work:

**A) Calendar View**
- Show a proper weekly calendar grid (Mon–Fri, time slots 07:00–18:00)
- Each session/class appears as a coloured block on the correct day + time
- Sessions fetched from GET /api/timetable on page load
- Each session block shows: Group name, subject/lesson title, facilitator name, venue
- Clicking a session block opens a detail panel (slide-out or modal) showing full info

**B) Month View Toggle**
- Button to switch between Week View and Month View
- Month view shows sessions as dots/chips on calendar days
- Clicking a day in month view zooms to week view for that week

**C) Create New Session**
- "Add Session" button opens a form modal
- Fields: Group (dropdown), Date, Start time, End time, Lesson title, Venue, Facilitator
- Submit calls POST /api/timetable with session data
- New session appears immediately on calendar without full page reload

**D) Edit / Delete Session**
- In the session detail panel, "Edit" button opens same form pre-filled
- Calls PATCH /api/timetable/{id}/reschedule for time changes
- OR PUT/PATCH /api/timetable/{id} for full edit
- "Delete" button with confirmation dialog → DELETE /api/timetable/{id}

**E) Today Indicator**
- Current day highlighted in a different colour
- "Today" button to jump back to current week
- Current time line visible in week view (moving red line)

**F) Group Filter**
- Dropdown to filter calendar to show only one group's sessions
- "All Groups" option to show everything

**Implementation note:**
Do NOT install a full calendar library unless one is already in package.json.
Build a lightweight CSS Grid-based weekly calendar. It only needs to show 5 days
and time slots — this is very achievable with basic CSS grid and JavaScript.
If react-big-calendar or FullCalendar is already installed, use that instead.

**APIs used:**
- GET    /api/timetable                    → load all sessions
- POST   /api/timetable                    → create session
- PATCH  /api/timetable/{id}/reschedule    → update time/date
- DELETE /api/timetable/{id}               → remove session
- GET    /api/group-schedules              → group-level recurring schedule
- GET    /api/dashboard/schedule           → today's schedule (for Today view)

---

## ═══════════════════════════════════════════════════════
## TASK 3 — LESSON PLAN GENERATOR (AI-Powered)
## ═══════════════════════════════════════════════════════

File to find: src/app/lessons/page.tsx (or similar)

### What needs to work:

**A) Lesson Plan List**
- On load, fetch and display all existing lesson plans: GET /api/lessons
- Each plan shows: title, group, date, duration, status (draft/published)
- Click to view full lesson plan detail
- Filter by group dropdown
- "New Lesson Plan" button → goes to generator

**B) AI Lesson Plan Generator**
- This is the most important feature — make it feel powerful

Step 1 — Input form:
- Group selector → GET /api/groups
- Unit standard selector → GET /api/unit-standards (filtered by group's curriculum)
- Duration (30 min / 60 min / 90 min / 2 hours)
- Learning outcomes (auto-populated from selected unit standard, user can edit)
- Special notes / accommodations field (optional free text)
- "Generate Lesson Plan" button

Step 2 — AI Generation:
- On button click, show a loading state: animated spinner + "Generating your lesson plan..."
- Call POST /api/groups/{id}/lessons/generate with:
  {
    unitStandardId,
    duration,
    learningOutcomes,
    notes,
    groupId
  }
- While loading, show skeleton placeholder of what the lesson plan will look like

Step 3 — Display generated plan:
- Show the returned lesson plan in a structured, readable layout:
  * Header: Title, Group, Unit Standard, Duration, Date
  * Section: Learning Outcomes (numbered list)
  * Section: Introduction / Warm-up (with time allocation)
  * Section: Main Activity / Content (with time allocation)
  * Section: Assessment / Check for Understanding
  * Section: Wrap-up / Closing
  * Section: Resources needed
- Each section should be editable inline (click to edit text)

Step 4 — Save options:
- "Save as Draft" → POST /api/lessons with status: "draft"
- "Save & Publish" → POST /api/lessons with status: "published"
- "Regenerate" → calls the generate endpoint again with same inputs
- "Add to Timetable" → opens a mini modal to pick a date/time → POST /api/timetable

**C) Existing Lesson Plan Detail View**
- Route: /lessons/{id}
- Load plan: GET /api/lessons/{id}
- Full read view with all sections
- Edit button → makes all sections inline-editable
- Save changes → PUT /api/lessons/{id}
- Delete → DELETE /api/lessons/{id} with confirmation
- Print/Export button → opens browser print dialog with clean print styles

**APIs used:**
- GET  /api/lessons                         → list all plans
- POST /api/lessons                         → save new plan
- GET  /api/lessons/{id}                    → load single plan
- PUT  /api/lessons/{id}                    → update plan
- DELETE /api/lessons/{id}                  → delete plan
- POST /api/groups/{id}/lessons/generate    → AI generation ← KEY ENDPOINT
- GET  /api/unit-standards                  → populate unit standard dropdown
- GET  /api/groups                          → populate group dropdown
- POST /api/timetable                       → add lesson to calendar

---

## ═══════════════════════════════════════════════════════
## TASK 4 — STUDENT PROFILE PAGE (Missing Feature)
## ═══════════════════════════════════════════════════════

File to create: src/app/students/[id]/page.tsx

### What needs to work:

This page doesn't exist yet — build it from scratch.

**Layout (3 sections):**

Section 1 — Header card:
- Student name, ID number, group name, enrolment date
- Profile photo placeholder (initials avatar)
- Status badge: Active / Inactive / Completed
- Quick stats: Attendance %, Assessment completion %, Progress %
- Load from GET /api/students/{id}

Section 2 — Tabs:
Tab A — Progress:
- Load GET /api/students/{id}/progress
- Show each unit standard with completion status
- Progress bar per unit standard
- Overall completion % at top

Tab B — Attendance:
- Load GET /api/attendance?studentId={id}
- Monthly attendance calendar (small grid, colour-coded days)
- Attendance rate chart (last 12 weeks)
- List of absent days with dates

Tab C — Assessments:
- Load GET /api/assessments?studentId={id} (or by-group filtered to student)
- Table: Assessment name | Date | Result | Status
- Show passed/failed/pending badges

Tab D — POE (Portfolio of Evidence):
- Load GET /api/poe?studentId={id}
- List of POE items with completion status
- Each item: Unit standard link, evidence description, status

Section 3 — Notes / Actions:
- Free text notes field (save on blur)
- "Generate Progress Report" button → POST /api/reports/daily with student context
- "View in Group" link → back to group detail page

---

## ═══════════════════════════════════════════════════════
## TASK 5 — MODERATION WORKFLOW (Currently Broken)
## ═══════════════════════════════════════════════════════

File to find: src/app/moderation/page.tsx (or similar)

### What needs to work:

**A) Moderation Queue**
- On load, fetch assessments pending moderation: GET /api/assessments/marking
- Filter: show only assessments with status "pending_moderation"
- List shows: Student name | Assessment name | Submitted date | Marked by | Group
- Sort by oldest first (longest waiting)
- Count badge on page title: "Moderation (X pending)"

**B) Review Panel**
- Clicking a queued item opens a review panel (right side or full-screen modal)
- Shows:
  * Assessment details (unit standard, criteria)
  * Student's submitted evidence/answers
  * Original marker's decision + comments
  * Marking guide / rubric (from unit standard)
- Load via GET /api/assessments/{id}

**C) Moderation Actions**
Three decision buttons:
1. "Confirm Assessment" → green button
   - Calls POST /api/assessments/moderate with { assessmentId, decision: "confirmed", comments }
2. "Refer Back" → yellow button  
   - Requires a comment explaining why
   - Calls POST /api/assessments/moderate with { decision: "referred", comments }
3. "Override Decision" → red button
   - Opens second confirmation step
   - Calls POST /api/assessments/moderate with { decision: "overridden", newResult, comments }

**D) After Decision**
- Remove the item from the queue immediately (optimistic update)
- Show success toast: "Assessment confirmed for [Student Name]"
- If queue is empty, show: "✓ All assessments moderated"

**APIs used:**
- GET  /api/assessments/marking       → queue of assessments to review
- GET  /api/assessments/{id}          → load full assessment detail
- POST /api/assessments/moderate      → submit moderation decision
- GET  /api/assessments/stats         → show moderation stats at top

---

## ═══════════════════════════════════════════════════════
## TASK 6 — POE MANAGEMENT (Partially Working)
## ═══════════════════════════════════════════════════════

File to find: src/app/poe/page.tsx (or similar)

### What needs to work:

**A) POE Overview**
- Student selector → GET /api/students
- When student selected, load their POE: GET /api/poe?studentId={id}
- Show POE checklist grouped by unit standard
- Each item shows: evidence description, status (pending/submitted/approved), date

**B) Update POE Item**
- Clicking an item opens an edit panel
- Fields: Evidence description (text), Status (dropdown), Notes
- Save → PUT /api/poe with updated item
- Status options: Not Started / In Progress / Submitted / Approved / Rejected

**C) Add New POE Item**
- "Add Evidence" button
- Fields: Unit standard (dropdown from GET /api/unit-standards), Evidence type, Description
- Submit → POST /api/poe

**D) POE Completion Summary**
- At top of page: X of Y evidence items complete
- Progress bar
- Per unit standard: how many items done vs required

**E) Delete POE Item**
- Delete button with confirmation → DELETE /api/poe (with item id in body)

---

## ═══════════════════════════════════════════════════════
## TASK 7 — AI ASSISTANT (Context-Aware)
## ═══════════════════════════════════════════════════════

File to find: src/app/ai/page.tsx (or similar)

### What needs to work:

The chat UI probably works already. What's missing is context — the AI doesn't
know about your students, groups, or curriculum. Fix that.

**A) Context Injection**
Before sending each message to POST /api/ai/chat, enrich the request body:
```typescript
{
  messages: conversationHistory,
  context: {
    currentPage: window.location.pathname,
    userRole: currentUser.role,
    // Load these once on page mount:
    totalStudents: summaryData.totalStudents,
    totalGroups: summaryData.totalGroups,
    activeGroups: groupList.map(g => g.name)
  }
}
```

**B) Quick Action Buttons**
Add 4 shortcut buttons above the chat input:
1. "Summarise Today's Attendance" → prefills prompt + calls POST /api/ai/chat
2. "Generate Assessment for [group]" → routes to /lessons with AI tab active
3. "List Students Falling Behind" → queries progress data + AI summary
4. "Write Daily Report" → calls POST /api/reports/daily/generate-ai and displays result

**C) Semantic Search Tab**
- Second tab next to "Chat": "Search Curriculum"
- Search input → calls GET /api/ai/semantic-search?q={query}
- Results show matching unit standards, lessons, or curriculum items
- Each result is clickable and links to the relevant page

**D) Recommendations Panel**
- Sidebar or bottom section: "Suggested Actions"
- Calls GET /api/ai/recommendations on page load
- Shows 3-5 suggestions like: "3 students haven't attended in 2 weeks"
- Each suggestion has an action button

---

## ═══════════════════════════════════════════════════════
## TASK 8 — BROKEN BUTTONS SITE-WIDE AUDIT
## ═══════════════════════════════════════════════════════

Before starting this task, do a sweep of the codebase.

Run this in the terminal to find all buttons/links with missing handlers:
```bash
grep -rn "onClick={}" src/app/ --include="*.tsx"
grep -rn "onClick={() => {}}" src/app/ --include="*.tsx"  
grep -rn "href=\"#\"" src/app/ --include="*.tsx"
grep -rn "TODO\|FIXME\|placeholder\|coming soon" src/app/ --include="*.tsx" -i
```

For each result found:
1. Identify what the button is supposed to do (from its label or context)
2. Find the correct API endpoint from the backend sitemap
3. Implement the handler
4. Move to the next one

Common broken buttons to look for and fix:
- Any "View Details" button that doesn't navigate anywhere → add router.push()
- Any "Delete" button without a confirm dialog → add window.confirm() or a modal
- Any "Save" button that logs to console instead of calling API
- Any "Refresh" or "Reload" button that doesn't re-fetch data
- Any "Send" or "Submit" button with empty onClick

---

## ═══════════════════════════════════════════════════════
## TASK 9 — NAVIGATION & UX FIXES
## ═══════════════════════════════════════════════════════

**A) Breadcrumbs**
- Add breadcrumb navigation to all detail pages
- e.g., Groups > Group Name > Student Name
- Use Next.js Link component

**B) Empty States**
- Every list/table that can be empty needs a proper empty state
- Not just a blank page — show an icon, message, and action button
- Examples:
  - No students: "No students in this group yet. Add your first student →"
  - No lessons: "No lesson plans yet. Generate your first one →"
  - No attendance records: "No attendance marked yet. Mark today's attendance →"

**C) Loading Skeletons**
- Any page that fetches data on load should show skeleton loaders
- Not just a spinner — show the shape of what's loading
- Simple: grey animated boxes where content will appear

**D) Success / Error Toasts**
- Create ONE reusable toast component if not already present
- Every form save, delete, or action should show a toast
- Green for success, red for error, yellow for warning
- Auto-dismiss after 3 seconds
- Place at top-right of screen

**E) Back Navigation**
- Every detail/sub-page needs a "← Back" button
- Use router.back() or a specific href

---

## ═══════════════════════════════════════════════════════
## TASK 10 — REPORTS PAGE (Complete the Feature)
## ═══════════════════════════════════════════════════════

File to find: src/app/reports/page.tsx

Phase 1 added export buttons. Now complete the rest:

**A) Report Types Panel**
- Tabbed interface with 4 report types:
  1. Daily Attendance Report
  2. Group Progress Report  
  3. Assessment Results Report
  4. Unit Standards Completion Report

**B) Daily Attendance Report**
- Date picker + group selector
- "Generate" button → POST /api/reports/daily
- Display results in a formatted table
- "Generate AI Summary" button → POST /api/reports/daily/generate-ai
- Show AI-written narrative paragraph below the table
- Export PDF button (already done) + Export CSV button (already done)

**C) Group Progress Report**
- Group selector + date range
- "Generate" → GET /api/reports/group-progress?groupId={id}
- Show per-student progress table
- Highlight students below target in red

**D) Unit Standards Report**
- Qualification/programme selector (if applicable)
- "Generate" → GET /api/reports/unit-standards
- Show completion matrix: students vs unit standards
- Green cell = completed, grey = not started, yellow = in progress

---

## ═══════════════════════════════════════════════════════
## SHARED UTILITIES — Build these ONCE, use everywhere
## ═══════════════════════════════════════════════════════

If these don't exist already, build them as shared components/utilities.
Check src/components/ and src/lib/ first — don't duplicate what's there.

**1. Toast Notification System**
File: src/components/ui/Toast.tsx + src/hooks/useToast.ts
Usage: const { toast } = useToast(); toast.success('Saved!');

**2. Confirm Dialog**
File: src/components/ui/ConfirmDialog.tsx
Usage: <ConfirmDialog onConfirm={handleDelete} message="Delete this record?" />

**3. Empty State Component**
File: src/components/ui/EmptyState.tsx
Props: icon, title, description, actionLabel, onAction

**4. Loading Skeleton**
File: src/components/ui/Skeleton.tsx
Usage: <Skeleton lines={4} /> or <Skeleton type="table" rows={5} />

**5. Data Table Component**
File: src/components/ui/DataTable.tsx  
Props: columns, data, onRowClick, sortable, pagination

**6. API fetch helper (if not already present)**
File: src/lib/api.ts
```typescript
const token = () => localStorage.getItem('token') || ''

export const api = {
  get: (url: string) => fetch(url, {
    headers: { Authorization: `Bearer ${token()}` }
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() }),
  
  post: (url: string, body: unknown) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body)
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() }),
  
  put: (url: string, body: unknown) => fetch(url, {
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body)
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() }),
  
  delete: (url: string) => fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token()}` }
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() }),
}
```

---

## ORDER OF IMPLEMENTATION

Work through tasks in this priority order:

| Priority | Task | Why |
|----------|------|-----|
| 🔴 P1 | Task 1 — Attendance System | Used every single day by facilitators |
| 🔴 P1 | Task 3 — Lesson Plan Generator | Core teaching tool, high daily use |
| 🔴 P1 | Task 8 — Broken Buttons Audit | Quick wins across whole site |
| 🟡 P2 | Task 2 — Calendar / Timetable | Important but complex — do after attendance |
| 🟡 P2 | Task 4 — Student Profile Page | Needed for complete student view |
| 🟡 P2 | Task 10 — Reports (Complete) | Needed for funder/management reporting |
| 🟢 P3 | Task 5 — Moderation Workflow | Important for quality assurance |
| 🟢 P3 | Task 6 — POE Management | Important for accreditation |
| 🟢 P3 | Task 7 — AI Assistant Context | Makes AI useful, not just decorative |
| 🟢 P3 | Task 9 — Navigation & UX Fixes | Polish — do last |

---

## HOW TO START

1. Run the broken button audit first (grep commands in Task 8) — this tells us the full scope
2. Read src/app/attendance/page.tsx — tell me what's there
3. Then proceed with Task 1

Tell me: which task you're starting, which file you found, and what's currently in it.
Report back after EACH task before moving to the next.
