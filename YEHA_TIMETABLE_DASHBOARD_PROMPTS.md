# YEHA – Timetable & Dashboard Improvement Prompts
> Run in VS Code Copilot Chat using `@workspace` — in order, one at a time.
> Do not skip ahead. Test each one in the browser before running the next.

---

## Context — What's Wrong Right Now

Before running any prompt, understand the two core problems:

**Problem 1 — Timetable is empty**
The weekly rotation logic already exists in `src/app/timetable/page.tsx` and `src/lib/groupNameUtils.js`
but the sessions are never rendered onto the calendar. The calendar grid exists, the data does not show up in it.

**Problem 2 — Dashboard is disconnected**
The "Upcoming Schedule" widget says "No lessons scheduled for the next 7 days" because
it is not reading from the timetable data. The `Invalid Date` on recent activity is a date formatting bug.

---

## PROMPT 1 — Diagnose Why the Timetable Is Empty

Run this first. Do not make changes yet — just understand the problem.

```
@workspace The timetable page at localhost:3000/timetable shows a calendar grid for February 2026
but every day is completely empty. No sessions appear despite the fact that weekly rotation logic
already exists in the codebase.

Please investigate and tell me:

1. In src/app/timetable/page.tsx — how does it currently fetch or generate session data?
   Does it call an API route, read from the database via Prisma, or generate sessions from hardcoded logic?

2. In src/lib/groupNameUtils.js — what does this file define? What is "Montazility 2026" and
   how are the group clusters structured?

3. Is there an API route for timetable sessions? If yes, what is the file path and what does it return?
   If no, where is the session data supposed to come from?

4. Is there a TimetableSession or Schedule model in prisma/schema.prisma?
   If yes, does it have any data? Run: npx prisma studio or check the DB directly.
   If no, that explains why nothing shows.

5. What is the "New Session" button supposed to do — does it save to the database or just local state?

Do not change any code. Just report back with answers to all 5 points.
```

---

## PROMPT 2 — Fix the Timetable: Generate Weekly Sessions from the Rotation

Run this after Prompt 1 confirms the issue. This rebuilds the timetable so it actually shows sessions.

```
@workspace The timetable calendar is empty because sessions are not being generated from
the weekly rotation pattern defined in the codebase. I need to fix this.

Here is the weekly rotation that must be used:

| Day | Lecture Room | Computer Lab |
|-----|-------------|--------------|
| Mon & Wed | Montazility 2026 groups | Azelis 2025, Packaging World 2025 |
| Tue & Thu | Flint Group 2025 | Wahl 2025, Monteagle 2025 |
| Friday | Open / No fixed classes | Open / No fixed classes |

"Montazility 2026" is a super-group containing:
- City Logistics (LP) 2026
- Azelis SA (LP) 2026
- Monteagle (LP) 2026
- Beyond Insights (LP) 2026

Standard session times are:
- Morning session: 08:00 – 12:00
- Afternoon session: 13:00 – 16:00

Please:

1. If there is NO TimetableSession model in Prisma — add one with these fields:
   - id, groupId, title, date, startTime, endTime, venue, type (LECTURE / COMPUTER_LAB), colour, createdAt

2. Create a seeding function or script that generates recurring weekly sessions
   for the current month and the next 3 months based on the rotation above.
   Each group gets a distinct colour (use the YEHA green palette + blues/purples for variety).

3. Create or fix the API route GET /api/timetable/sessions that returns sessions
   filtered by a date range (query params: startDate, endDate).

4. Update the timetable page to:
   - Fetch sessions from the API on load
   - Render each session as a coloured block on the correct day in the calendar grid
   - Show: Group name, time, venue on each block
   - Support month view (current) and add a week view toggle

5. Run the seed to populate the database so sessions appear immediately.

Show me every file created or changed.
```

---

## PROMPT 3 — Upgrade the Calendar to Match the Reference Design

Run this after Prompt 2 so sessions are visible. This upgrades the visual layout.

```
@workspace The timetable now shows sessions. I want to upgrade it to look and work like
a proper scheduling tool — similar to the reference design with coloured blocks per group,
time slots on the left, and filters.

Please redesign the timetable page with these features:

LAYOUT:
- Left sidebar with filters: Select Group/Class, Select Venue, View toggle (Month / Week / 3 Day / Day)
- Main calendar area showing time slots from 07:30 to 17:00 on the Y axis
- Days of the week on the X axis (week view as default)
- Each session = a coloured card block positioned at the correct time slot
- Session card shows: Group name, Venue, Time range, Module/topic if available

COLOURS (assign per group, keep consistent):
- City Logistics 2026 → Blue
- Azelis SA 2026 → Teal/Green
- Monteagle 2026 → Purple
- Beyond Insights 2026 → Orange
- 2025 groups → Warm colours (red, amber, pink)
- Computer Lab sessions → slightly lighter shade of the group colour

INTERACTIONS:
- Click a session block → opens a session detail panel (right side or modal)
  showing: Group, date, time, venue, current module, number of students
- Click "+ New Session" → opens a form to create a one-off session for a specific group
- Click "+ New Plan" → opens a form to set up a recurring weekly plan for a group

NAVIGATION:
- Previous/Next week arrows
- "Today" button jumps to current week
- Month picker at top

Please update src/app/timetable/page.tsx and any related components.
Show every file changed.
```

---

## PROMPT 4 — Fix the Dashboard: Connect Upcoming Schedule to Timetable

Run this after the timetable is working. This connects the dashboard to real session data.

```
@workspace The dashboard "Upcoming Schedule" section currently shows "No lessons scheduled
for the next 7 days" even though timetable sessions now exist in the database.

Also there is an "Invalid Date" bug showing in the Recent Activity section.

Please fix both:

UPCOMING SCHEDULE FIX:
1. Find where "Upcoming Schedule" is rendered on the dashboard (src/app/page.tsx or a dashboard component)
2. Connect it to the timetable sessions API: GET /api/timetable/sessions?startDate=today&endDate=+7days
3. Display the next 5 upcoming sessions, each showing:
   - Group name (with group colour dot)
   - Day and time (e.g. "Monday, 17 Feb • 08:00 – 12:00")
   - Venue
   - Current module the group is on
   - A "Prepare" button (for now just a placeholder — Prompt 5 will wire this up)
4. If today has a session, highlight it with "Today" badge
5. Use SWR to fetch so it stays live without refresh

INVALID DATE BUG:
6. Find the Recent Activity component — locate where dates are being formatted
7. Add null/undefined checks before any date formatting (new Date(), toLocaleDateString(), etc.)
8. Wrap all date format calls in a safe utility like:
   const safeDate = (d) => d && !isNaN(new Date(d)) ? new Date(d).toLocaleDateString() : 'Date unavailable'

Show every file changed.
```

---

## PROMPT 5 — Dashboard: Next Session Prep Panel

Run this after Prompt 4. This adds the smart prep functionality to the dashboard.

```
@workspace I want the dashboard to help me prepare for my next class directly from the homepage.

When I click "Prepare" on an upcoming session in the Upcoming Schedule widget, it should:

1. Open a right-side panel (slide in from the right, don't navigate away) showing:

   SECTION A — Session Info
   - Group name, date, time, venue
   - Current module and unit they are on
   - Number of students in the group
   - Credit progress for the group (actual %)

   SECTION B — Quick Actions (buttons)
   - "Generate Lesson Plan" → calls the AI endpoint (if one exists) or creates a
     text template with: Module name, Unit, Learning objectives, Activities placeholder, Resources needed
     Then opens it in a modal for editing and saving
   - "Mark Attendance for This Session" → pre-fills the attendance page for this group and date
   - "View Group" → navigates to the group card
   - "Add Reminder" → opens a small form to set a reminder for this session

   SECTION C — Reminders for This Session
   - List any existing reminders linked to this date/group
   - Option to add new reminder with: text, priority (Low / Medium / Urgent), time

2. The "Add Reminder" form should save to the database and:
   - Show on the Timetable session block
   - Show in the "Today's Reminders" panel on the timetable page
   - Show as a notification bell item in the top bar

Please:
- Build the slide-in prep panel component
- Create a Reminder model in Prisma if one doesn't exist (fields: id, sessionId, groupId, text, priority, dueDate, isRead, createdAt)
- Create API routes: POST /api/reminders, GET /api/reminders?date=today
- Wire up the "Generate Lesson Plan" button to produce a structured template
- Show every file created or changed
```

---

## PROMPT 6 — Dashboard: Phase Timeline View

Run this last. This adds the visual phase/progress timeline that gives you the big picture.

```
@workspace I want to add a clean visual Phase Timeline to the dashboard homepage.
Think Monday.com / Notion style — a horizontal timeline showing where each group
is in their learnership journey.

Here is what I want:

COMPONENT: Phase Timeline (add below the stats cards on the dashboard homepage)

DISPLAY:
- One row per Group (or per Collection like "Montazility 2026")
- Horizontal bar showing the full learnership duration (start date → end date from rollout plan)
- The bar is divided into Modules/Phases (e.g. Module 1, Module 2, etc.)
- Each phase block is coloured:
  - Completed phases → solid green
  - Current phase → animated pulse green or blue
  - Future phases → light grey
- A vertical "Today" line marker across all rows
- Each group row shows: Group name, current module name, % complete

ON HOVER over a phase block:
- Tooltip showing: Module name, start date, end date, credits, actual completion %

CLICK on a group row:
- Navigates to that group's detail page

DATA SOURCE:
- Use the rollout plan data already linked to groups
- Overlay actual assessment completion % on top of the projected plan

DESIGN RULES:
- Clean, minimal — no clutter
- Use YEHA colour palette (dark navy sidebar, green accents)
- Must work on both desktop and when sidebar is collapsed
- Responsive — on smaller screens, show a scrollable horizontal timeline

Please:
1. Create a PhaseTimeline component in src/components/
2. Add it to the dashboard homepage below the stats cards
3. Fetch data from an updated /api/groups endpoint that includes phase/module breakdown
4. Show every file created or changed
```

---

## Run Order Summary

| # | Prompt | What It Does |
|---|---|---|
| 1 | Diagnose timetable | Understand why it's empty — no code changes |
| 2 | Fix timetable data | Generate sessions from rotation, seed DB |
| 3 | Upgrade calendar UI | Week view, time slots, coloured blocks, filters |
| 4 | Fix dashboard schedule | Connect to timetable data, fix Invalid Date bug |
| 5 | Session prep panel | Lesson plan, reminders, quick actions from dashboard |
| 6 | Phase timeline | Visual progress overview across all groups |

---

## After Each Prompt

1. Open `localhost:3000/timetable` and `localhost:3000` to test
2. If you see errors in the terminal, paste them here before continuing
3. Prompt 1 is diagnosis only — you must read Copilot's answer and share it before running Prompt 2

---

*Generated for YEHA – Youth Education & Skills Management System*
*Stack: Next.js 14 | Prisma | SQLite | TypeScript | SWR | Tailwind CSS*
