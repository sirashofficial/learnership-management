---
name: edu-platform-phase2-agent
description: >
  Phase 2 implementation skill for the education management platform.
  Covers: Attendance system, Calendar/Timetable, Lesson Plan Generator,
  Student Profiles, Moderation Workflow, POE Management, AI Assistant
  context wiring, site-wide broken button fixes, navigation/UX polish,
  and Reports completion. Use after Phase 1 (dashboard, compliance,
  exports, assessment checklist, progress, curriculum builder) is done.
---

# Education Platform â€” Phase 2 Agent Skill

## What Phase 1 Covered (Do NOT re-implement)
- Dashboard API wiring (6 endpoints)
- Assessment Checklist save/load
- Progress page with group view
- Curriculum Builder form save
- Export buttons (attendance + assessments CSV)
- Compliance dashboard with RAG status

## What Phase 2 Covers
Everything else. This skill guides the agent through 10 tasks covering
all remaining broken, partial, or missing functionality across the platform.

---

## Platform Reference

### Key API Endpoints for Phase 2

**Attendance**
```
GET  /api/attendance                     req: filters  res: records
POST /api/attendance                     req: {studentId, groupId, date, status}
POST /api/attendance/bulk                req: [{studentId, status, date}...]
GET  /api/attendance/history             req: groupId, startDate, endDate
GET  /api/attendance/stats               req: date/range filters
GET  /api/attendance/rates               req: studentId/groupId
GET  /api/attendance/alerts              req: none
```

**Timetable / Calendar**
```
GET    /api/timetable                    res: all sessions
POST   /api/timetable                    req: session data
PATCH  /api/timetable/{id}/reschedule    req: new time/date
DELETE /api/timetable/{id}
GET    /api/group-schedules              res: recurring schedules
GET    /api/sessions/generate            res: session list
GET    /api/dashboard/schedule           res: today's schedule
```

**Lessons**
```
GET    /api/lessons                      res: all lesson plans
POST   /api/lessons                      req: lesson data + status
GET    /api/lessons/{id}
PUT    /api/lessons/{id}
DELETE /api/lessons/{id}
POST   /api/groups/{id}/lessons/generate req: {unitStandardId, duration, outcomes}
```

**Students (Profile)**
```
GET /api/students/{id}                   res: full student record
GET /api/students/{id}/progress          res: progress snapshot
GET /api/attendance?studentId={id}       res: student attendance records
GET /api/assessments?studentId={id}      res: student assessments
GET /api/poe?studentId={id}              res: student POE items
```

**Moderation**
```
GET  /api/assessments/marking            res: pending moderation queue
GET  /api/assessments/{id}              res: full assessment detail
POST /api/assessments/moderate           req: {assessmentId, decision, comments}
```

**POE**
```
GET    /api/poe                          req: studentId filter
POST   /api/poe                          req: poe item data
PUT    /api/poe                          req: updated item
DELETE /api/poe                          req: item id
```

**AI**
```
POST /api/ai/chat                        req: {messages, context}
GET  /api/ai/semantic-search             req: q={query}
GET  /api/ai/recommendations             res: suggestion list
POST /api/reports/daily/generate-ai      req: report context
```

**Reports**
```
POST /api/reports/daily                  req: {groupId, date}
GET  /api/reports/group-progress         req: groupId, dateRange
GET  /api/reports/unit-standards         req: filters
```

---

## Feature Implementation Patterns

### Pattern: Attendance Marking UI

The attendance marking UI follows this exact flow:
```
Mount â†’ load groups â†’ user selects group + date 
     â†’ load students for group 
     â†’ render student list with Present/Absent/Late buttons
     â†’ onClick: POST single record OR collect all â†’ POST bulk
     â†’ show per-row "Saved" confirmation
```

The key state shape:
```typescript
type AttendanceRecord = {
  studentId: string
  studentName: string
  status: 'present' | 'absent' | 'late' | null  // null = not marked yet
  saved: boolean  // shows the "âœ“ Saved" indicator
}
const [records, setRecords] = useState<AttendanceRecord[]>([])
```

When marking a student:
```typescript
const markStudent = async (studentId: string, status: string) => {
  // 1. Update local state immediately (optimistic)
  setRecords(prev => prev.map(r => 
    r.studentId === studentId ? { ...r, status } : r
  ))
  // 2. POST to API
  await api.post('/api/attendance', { studentId, groupId, date, status })
  // 3. Show saved indicator for this student
  setRecords(prev => prev.map(r =>
    r.studentId === studentId ? { ...r, saved: true } : r
  ))
  // 4. Hide saved indicator after 2 seconds
  setTimeout(() => {
    setRecords(prev => prev.map(r =>
      r.studentId === studentId ? { ...r, saved: false } : r
    ))
  }, 2000)
}
```

---

### Pattern: Calendar Grid (No Library Required)

Build a CSS Grid weekly calendar. This is simpler than it sounds:

```typescript
// Time slots: 07:00 to 18:00 in 30-min increments = 22 slots
const TIME_SLOTS = Array.from({length: 22}, (_, i) => {
  const hour = Math.floor(i / 2) + 7
  const min = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${min}`
})

// Days: Mon-Fri
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
```

CSS Grid structure:
```
grid-template-columns: 60px repeat(5, 1fr)  /* time col + 5 day cols */
grid-template-rows: 40px repeat(22, 40px)   /* header + 22 time slots */
```

Position a session on the grid:
```typescript
// Given session start time "09:00" and duration 60 mins:
const startSlot = getSlotIndex('09:00')  // returns slot number
const spanSlots = duration / 30           // 60 mins = 2 slots
// Apply as inline style:
style={{ gridRow: `${startSlot + 2} / span ${spanSlots}` }}
```

If `react-big-calendar` or `@fullcalendar/react` is in package.json â€” USE IT.
Check with: `cat package.json | grep calendar`

---

### Pattern: AI Lesson Generator Loading State

This should feel premium â€” the AI is doing something impressive:

```typescript
const [generatingStep, setGeneratingStep] = useState<string | null>(null)

const generateLesson = async () => {
  setGeneratingStep('Analysing unit standard...')
  await delay(800)
  setGeneratingStep('Designing learning sequence...')
  await delay(600)  
  setGeneratingStep('Generating lesson activities...')
  
  const result = await api.post(`/api/groups/${groupId}/lessons/generate`, payload)
  
  setGeneratingStep(null)
  setGeneratedPlan(result)
}
```

Show the step text with a spinner while loading. This makes the wait feel purposeful.

---

### Pattern: Moderation Queue

The moderation queue is a two-panel layout:
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Queue (left panel)      â”‚ Review Panel (right panel)        â”‚
â”‚                         â”‚                                   â”‚
â”‚ [Student] Assessment    â”‚  Student: John Doe                â”‚
â”‚ Pending Â· 2 days ago    â”‚  Assessment: Unit 3 Task 1        â”‚
â”‚                         â”‚  Marker: Jane Smith               â”‚
â”‚ [Student] Assessment    â”‚  Decision: Competent              â”‚
â”‚ Pending Â· 1 day ago     â”‚  Comments: "Good evidence..."     â”‚
â”‚                         â”‚                                   â”‚
â”‚                         â”‚  [Confirm] [Refer Back] [Override]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

On mobile, queue is full width and review panel is a bottom sheet.

---

### Pattern: Student Profile Tabs

Use a simple tab state â€” don't install a tabs library for this:
```typescript
type Tab = 'progress' | 'attendance' | 'assessments' | 'poe'
const [activeTab, setActiveTab] = useState<Tab>('progress')

// Load data lazily â€” only fetch a tab's data when it's first opened
const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set(['progress']))

const switchTab = (tab: Tab) => {
  setActiveTab(tab)
  if (!loadedTabs.has(tab)) {
    fetchTabData(tab)
    setLoadedTabs(prev => new Set([...prev, tab]))
  }
}
```

This avoids loading all 4 tabs' data on page mount.

---

### Pattern: POE Checklist

POE items should be grouped by unit standard:
```typescript
type POEItem = {
  id: string
  unitStandardId: string
  unitStandardName: string
  evidenceDescription: string
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
  notes?: string
}

// Group by unit standard for display:
const grouped = poeItems.reduce((acc, item) => {
  const key = item.unitStandardId
  if (!acc[key]) acc[key] = { name: item.unitStandardName, items: [] }
  acc[key].items.push(item)
  return acc
}, {} as Record<string, { name: string, items: POEItem[] }>)
```

---

## Shared Components to Build Once

Build these before starting the feature tasks. Check if they exist first.

### Toast System
```typescript
// src/hooks/useToast.ts
type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast { id: string; type: ToastType; message: string }

// Use React context to make available everywhere
// toast.success('Attendance saved')
// toast.error('Failed to load data')
```

### Confirm Dialog  
```typescript
// src/components/ui/ConfirmDialog.tsx
// Props: message, onConfirm, onCancel, confirmLabel?, danger?
// Usage: wrap around any delete/destructive action
```

### Empty State
```typescript
// src/components/ui/EmptyState.tsx
// Props: icon (emoji or SVG), title, description, actionLabel?, onAction?
// Every list page needs this for the "no data" case
```

### Skeleton Loader
```typescript
// src/components/ui/Skeleton.tsx  
// Simple grey animated pulse boxes
// Props: width?, height?, count? (for multiple lines)
```

---

## Common Bugs Specific to Phase 2

### Attendance date mismatch
Dates from the date picker are often in local timezone but the API expects UTC.
Fix: Always send dates as ISO strings: `new Date(dateInput).toISOString().split('T')[0]`

### Calendar sessions not positioning correctly
Usually a grid-row calculation error. Off-by-one is common.
Fix: Log the startSlot and spanSlots values and verify against the visual position.

### Lesson generator returns HTML or markdown
The AI endpoint may return formatted text, not a structured JSON object.
Fix: Check the response shape first. If it's a string, parse it or display as-is.
If it's structured JSON, map to your display sections.

### Student profile 404
The dynamic route `/students/[id]` needs `src/app/students/[id]/page.tsx`
(not `src/app/students/[id].tsx` â€” must be a folder with page.tsx inside).

### Moderation actions not updating queue
After POST /api/assessments/moderate, you must manually remove the item
from local state â€” the API won't push an update.
Fix: Use `.filter()` to remove the moderated item from your queue state.

### POE saves but doesn't update the list
PUT /api/poe returns the updated item â€” use it to update state directly
instead of re-fetching the whole list.

---

## File Naming Conventions

Follow these when creating new files:

| Type | Convention | Example |
|------|-----------|---------|
| Page | lowercase with hyphens | assessment-checklist/page.tsx |
| Component | PascalCase | AttendanceMarkingTable.tsx |
| Hook | camelCase with 'use' prefix | useAttendanceData.ts |
| Utility | camelCase | formatDate.ts |
| Type | PascalCase | AttendanceRecord.ts |

Always place:
- Reusable components â†’ src/components/ui/ or src/components/shared/
- Page-specific components â†’ src/components/[feature]/
- Hooks â†’ src/hooks/
- Utilities â†’ src/lib/ or src/utils/
- Types â†’ src/types/

---

## Verification Steps Per Task

**Task 1 (Attendance):**
- [ ] Can select a group and see all its students
- [ ] Clicking Present/Absent/Late shows as selected (highlighted button)
- [ ] Refreshing the page and re-selecting shows previously saved status
- [ ] "Mark All Present" marks every student and shows saved confirmations
- [ ] Alerts panel shows students below 80% attendance

**Task 2 (Calendar):**
- [ ] Week view shows current week with correct days
- [ ] Sessions from the database appear at the right time slots
- [ ] Clicking a session shows its details
- [ ] Creating a new session adds it to the calendar immediately
- [ ] "Today" button navigates to current week

**Task 3 (Lesson Generator):**
- [ ] Selecting a group loads relevant unit standards in dropdown
- [ ] Clicking Generate shows loading animation
- [ ] Generated plan appears with all sections
- [ ] Sections are editable inline
- [ ] Save as Draft saves and appears in lesson list
- [ ] "Add to Timetable" opens date/time picker

**Task 4 (Student Profile):**
- [ ] Clicking a student from /students navigates to /students/[id]
- [ ] Profile header shows correct student info
- [ ] Each tab loads its data without crashing
- [ ] Progress tab shows unit standard completion
- [ ] Back button returns to students list

**Task 5 (Moderation):**
- [ ] Queue shows assessments pending moderation with count
- [ ] Clicking an item shows its full detail on the right
- [ ] Confirming removes it from queue and shows success toast
- [ ] Refer Back requires a comment before submitting
- [ ] Empty queue shows "All moderated" message

**Task 6 (POE):**
- [ ] Student selector loads correctly
- [ ] POE items display grouped by unit standard
- [ ] Editing an item saves and updates the display
- [ ] Completion progress bar reflects actual item counts

**Task 7 (AI):**
- [ ] Chat sends messages and receives responses
- [ ] Quick action buttons pre-fill the chat and trigger a response
- [ ] Semantic search tab returns curriculum results
- [ ] Recommendations panel shows relevant suggestions

**Task 8 (Broken Buttons):**
- [ ] grep commands return a list of all empty onClick handlers
- [ ] Each one is identified and fixed or tracked in a list for review

**Task 9 (UX):**
- [ ] No page shows a blank white screen when empty
- [ ] All save/delete actions show a toast notification
- [ ] All detail pages have a back button
- [ ] Loading skeletons show on all data-fetching pages

**Task 10 (Reports):**
- [ ] All 4 report types generate without errors
- [ ] AI narrative appears below the table for daily report
- [ ] Export buttons download files with correct data

---

## How to Communicate Progress

After completing each task, tell the developer:

**Format:**
```
âœ… TASK [N] COMPLETE â€” [Task Name]

Found: [what file/state you found when you started]
Changed: [summary of what was added/fixed â€” plain language]
Key files: [list of files changed]
Verify by: [specific thing to click or check]
Watch out for: [any known issues or things to test carefully]
```

If a task is blocked or unclear:
```
âš ï¸ TASK [N] BLOCKED â€” [Task Name]
Reason: [what's stopping you]
Need: [what info or decision is needed to proceed]
Workaround: [if there's a way to proceed partially]
```

---

## Out of Scope for Phase 2

Do not touch:
- Auth (login/register) â€” working
- Dashboard data wiring â€” done in Phase 1
- Compliance RAG status â€” done in Phase 1
- Assessment Checklist core save â€” done in Phase 1
- Progress page group view â€” done in Phase 1
- Curriculum Builder form save â€” done in Phase 1
- Export buttons (attendance/assessments CSV) â€” done in Phase 1
- Backend API route handlers â€” only touch if you can prove the frontend 
  is correct and the backend is the issue
- Database migrations or schema files

---

## Quick Reference: Phase 2 Task Order

```
START HERE
    â”‚
    â–¼
[Shared Utils]  â† Build Toast, ConfirmDialog, EmptyState, Skeleton FIRST
    â”‚
    â–¼
Task 8 (Broken Button Audit)  â† Run grep, make a list, fix the easy ones
    â”‚
    â–¼
Task 1 (Attendance)  â† Daily use, highest priority
    â”‚
    â–¼
Task 3 (Lesson Generator)  â† Daily use, high priority
    â”‚
    â–¼
Task 2 (Calendar)  â† Important, moderately complex
    â”‚
    â–¼
Task 4 (Student Profile)  â† New page, medium complexity
    â”‚
    â–¼
Task 10 (Reports Complete)  â† Builds on existing page
    â”‚
    â–¼
Task 5 (Moderation)  â† Quality assurance feature
    â”‚
    â–¼
Task 6 (POE)  â† Accreditation feature
    â”‚
    â–¼
Task 7 (AI Context)  â† Enhancement layer
    â”‚
    â–¼
Task 9 (UX Polish)  â† Final pass
    â”‚
    â–¼
PHASE 2 COMPLETE
```

