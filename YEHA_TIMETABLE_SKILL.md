---
name: yeha-timetable-dashboard-skill
description: >
  Use this skill when working on the YEHA Timetable page or Dashboard homepage.
  It defines the weekly rotation pattern, group structures, data relationships,
  design rules, and patterns Copilot must follow when building or fixing these features.
---

# YEHA – Timetable & Dashboard Skill

## What This Skill Covers

This skill is the reference guide for AI assistants working on:
- The Timetable page (`src/app/timetable/page.tsx`)
- The Dashboard homepage (`src/app/page.tsx`)
- The Upcoming Schedule widget
- The Phase Timeline feature
- Reminders and session prep functionality

Read this fully before making any changes to these areas.

---

## Project Stack (Do Not Deviate)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS — no external CSS files |
| Database | Prisma + SQLite (`prisma/dev.db`) |
| Data Fetching | SWR custom hooks in `src/hooks/` |
| Auth | JWT via `jose` |
| Icons | Lucide React |
| Charts | Recharts (already installed) |

---

## The Weekly Rotation — Source of Truth

This is the fixed weekly schedule that drives ALL timetable session generation.
Do not change this structure without being explicitly told to.

```
Monday & Wednesday:
  Lecture Room  → Montazility 2026 (super-group — see below)
  Computer Lab  → Azelis 2025, Packaging World 2025

Tuesday & Thursday:
  Lecture Room  → Flint Group 2025
  Computer Lab  → Wahl 2025, Monteagle 2025

Friday:
  → Open / No fixed classes
```

### Standard Session Times
```
Morning session:   08:00 – 12:00
Afternoon session: 13:00 – 16:00
```

---

## Group Structure

### Montazility 2026 — Super Group (Collection)
This is a cluster/collection label, not a single group. It contains:
- City Logistics (LP) 2026
- Azelis SA (LP) 2026
- Monteagle (LP) 2026
- Beyond Insights (LP) 2026

When generating sessions, each sub-group within Montazility 2026 gets its own session block
on Mon/Wed but they share the same venue (Lecture Room).

### 2025 Groups (Individual Cohorts)
- Azelis 2025
- Packaging World 2025
- Flint Group 2025
- Wahl 2025
- Monteagle 2025

---

## Colour Assignment (Keep Consistent Across the Whole App)

These colours must be used everywhere — timetable blocks, group labels, timeline bars, dashboard dots.

| Group | Colour |
|---|---|
| City Logistics 2026 | Blue (`#3B82F6`) |
| Azelis SA 2026 | Teal (`#14B8A6`) |
| Monteagle 2026 | Purple (`#8B5CF6`) |
| Beyond Insights 2026 | Orange (`#F97316`) |
| Azelis 2025 | Green (`#22C55E`) |
| Packaging World 2025 | Emerald (`#10B981`) |
| Flint Group 2025 | Red (`#EF4444`) |
| Wahl 2025 | Amber (`#F59E0B`) |
| Monteagle 2025 | Pink (`#EC4899`) |
| Computer Lab sessions | Lighter shade (20% opacity) of group colour |

---

## Prisma Models Required

If these do not exist in `prisma/schema.prisma`, add them.

### TimetableSession
```prisma
model TimetableSession {
  id          String   @id @default(cuid())
  groupId     String
  group       Group    @relation(fields: [groupId], references: [id])
  title       String
  date        DateTime
  startTime   String   // "08:00"
  endTime     String   // "12:00"
  venue       String
  type        SessionType @default(LECTURE)
  colour      String
  isRecurring Boolean  @default(true)
  notes       String?
  reminders   Reminder[]
  createdAt   DateTime @default(now())
}

enum SessionType {
  LECTURE
  COMPUTER_LAB
  WORKSHOP
  ASSESSMENT
}
```

### Reminder
```prisma
model Reminder {
  id        String           @id @default(cuid())
  sessionId String?
  session   TimetableSession? @relation(fields: [sessionId], references: [id])
  groupId   String?
  group     Group?           @relation(fields: [groupId], references: [id])
  text      String
  priority  ReminderPriority @default(MEDIUM)
  dueDate   DateTime
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
}

enum ReminderPriority {
  LOW
  MEDIUM
  URGENT
}
```

---

## API Routes to Create or Fix

| Route | Method | Purpose |
|---|---|---|
| `/api/timetable/sessions` | GET | Return sessions filtered by `?startDate=&endDate=` |
| `/api/timetable/sessions` | POST | Create a new one-off session |
| `/api/timetable/generate` | POST | Seed recurring sessions from the rotation pattern |
| `/api/reminders` | GET | Return reminders, filtered by `?date=today` or `?groupId=` |
| `/api/reminders` | POST | Create a new reminder |
| `/api/reminders/[id]` | PATCH | Mark reminder as read / update |

---

## Dashboard — Required Widgets (In Order on Page)

```
1. Stats Cards Row (existing — keep)
   Active Groups | Total Students | Avg Attendance | Alerts

2. Phase Timeline (NEW)
   Horizontal timeline — one row per group
   Shows modules as coloured phase blocks
   "Today" marker line across all rows

3. Two-column row:
   LEFT  → Upcoming Schedule (fix to use real timetable data)
   RIGHT → Alerts / Urgent Notifications (existing — keep but improve)

4. Recent Activity (existing — fix Invalid Date bug)
```

---

## Phase Timeline — Design Rules

This is the most visual new feature. Follow these rules exactly.

```
Layout:
  - Full width, horizontal scroll if needed
  - One row per group (or collection)
  - Group name label on the left (fixed, does not scroll)
  - Timeline bar on the right (scrollable)
  - Vertical red/white dashed line = "Today"

Phase Blocks on each bar:
  - Each block = one Module
  - Width = proportional to module duration (days)
  - Completed → solid group colour
  - Current → group colour with subtle pulse animation
  - Future → light grey (#E5E7EB)

Hover tooltip on each block:
  - Module name
  - Start date – End date
  - Credits
  - Actual completion %

Click on a group row → navigate to /groups/[groupId]

Data source:
  - Rollout plan dates from Groups API
  - Actual completion % from assessment records
  - Do NOT hardcode dates — always calculate from DB
```

---

## Upcoming Schedule Widget — Rules

```
Data: GET /api/timetable/sessions?startDate=[today]&endDate=[+7days]
Display: Next 5 sessions maximum
Sort: Ascending by date then time

Each session card shows:
  - Colour dot (group colour)
  - Group name
  - Day and date (e.g. "Monday, 17 Feb")
  - Time range (e.g. "08:00 – 12:00")
  - Venue
  - Current module name
  - "Prepare" button → opens PrepPanel (slide-in from right)
  - "Today" badge if session is today

Fetch with SWR — do not use raw fetch()
Revalidate every 5 minutes
```

---

## Prep Panel — Session Preparation Slide-In

```
Trigger: Click "Prepare" on any upcoming session card
Behaviour: Slides in from the right side of the screen (not a modal — does not block the page)

Sections:
  A — Session Info (read-only)
      Group, date, time, venue, module, student count, actual credit %

  B — Quick Actions (buttons)
      "Generate Lesson Plan" → produces structured template, opens editable modal
      "Mark Attendance" → pre-fills attendance page for this group + date
      "View Group" → navigates to /groups/[groupId]
      "Add Reminder" → expands reminder form inline in the panel

  C — Reminders (for this session's date and group)
      List of existing reminders
      Add new reminder: text, priority, time

Lesson Plan Template (generated, not AI for now — keep it simple):
  ## Lesson Plan — [Group Name]
  **Date:** [date]
  **Module:** [module name]
  **Unit:** [current unit]
  **Duration:** [session duration]
  **Venue:** [venue]

  ### Learning Objectives
  - [placeholder]

  ### Activities
  1. Introduction / Recap (15 min)
  2. Main Content (90 min)
  3. Assessment / Check (30 min)
  4. Wrap-up (15 min)

  ### Resources Needed
  - [placeholder]

  ### Notes
  - [placeholder]
```

---

## Timetable Calendar UI Rules

```
Default view: Week view (Mon–Fri)
Time axis: 07:30 – 17:00 on Y axis (left side)
Day axis: Mon–Sat on X axis (top)

Session block:
  - Positioned at exact time on the grid
  - Height proportional to duration
  - Background = group colour
  - Text: Group name (bold), Venue, Time
  - Border radius: 6px
  - Click → session detail panel

Filters (left sidebar):
  - Select Group (dropdown, multi-select)
  - Select Venue (dropdown)
  - View: Month / Week / 3 Day / Day (toggle buttons)

Navigation:
  - < > arrows for previous/next week
  - "Today" button resets to current week
  - Month/year label at top

Empty day:
  - Show subtle "+" icon — clicking opens New Session form
  - Do NOT show empty rows as dead space
```

---

## Date Handling — Fix Invalid Date Bug

All date formatting in the app must use this safe utility.
Add it to `src/lib/dateUtils.ts` if it doesn't exist.

```typescript
export const safeFormatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Date unavailable'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Date unavailable'
  return d.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export const safeFormatTime = (time: string | null | undefined): string => {
  if (!time) return '--:--'
  return time
}
```

Replace every instance of `new Date(x).toLocaleDateString()` in the codebase
with `safeFormatDate(x)` from this utility.

---

## What NOT To Do

- ❌ Do not hardcode dates or session data — everything must come from the database
- ❌ Do not use `window.location.reload()` — use SWR `mutate()`
- ❌ Do not create separate CSS files — use Tailwind classes only
- ❌ Do not install new npm packages without listing them first
- ❌ Do not change the auth system or middleware while working on timetable/dashboard
- ❌ Do not use `any` TypeScript types — define proper interfaces
- ❌ Do not format dates without null-checking first (this causes "Invalid Date")
- ❌ Do not put the Phase Timeline data in a separate context — use SWR hooks

---

## Testing Checklist

After each prompt is implemented:

- [ ] Timetable shows coloured session blocks on the correct days
- [ ] Session blocks are at correct time positions (week view)
- [ ] Clicking a session block shows session details
- [ ] Group filters work to show/hide sessions
- [ ] Dashboard "Upcoming Schedule" shows real sessions
- [ ] "Today" badge appears on today's sessions
- [ ] "Prepare" button opens the prep panel
- [ ] Lesson plan template generates and is editable
- [ ] Reminders save and appear on timetable + notification bell
- [ ] Phase timeline shows all groups with correct phase blocks
- [ ] "Today" marker line shows on the phase timeline
- [ ] No "Invalid Date" appears anywhere on the dashboard
- [ ] Nothing requires a page refresh to update

---

*YEHA Learnership Management System — Timetable & Dashboard Skill v1.0*
*Stack: Next.js 14 | Prisma | SQLite | TypeScript | SWR | Tailwind CSS*
*Locale: en-ZA (South African date format)*
