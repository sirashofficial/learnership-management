# YEHA – Timetable Fix Prompts (Correcting What Was Built)
> The timetable has sessions in the DB but the rotation, groups, and design are all wrong.
> Run these in order. One at a time. Test in browser before moving to the next.

---

## What Is Currently Wrong (Be Honest With Yourself Before Starting)

| Problem | What You See | What It Should Be |
|---|---|---|
| Wrong days | Sessions only on Sun 15, Mon 16, Tue 17 | Every Mon, Tue, Wed, Thu — every week |
| Wrong groups | "Market Re...", "HIV/AIDS...", "Financial..." — these are module names, not group names | Group names: Azelis SA, City Logistics, Monteagle, etc. |
| Groups not linked | Seed used hardcoded names, not real DB Group IDs | Sessions must reference actual Group.id from database |
| Wrong design | Small text boxes in a month calendar | Week view with time axis 09:00–14:00, tall coloured blocks |
| Missing groups | Kelpack 25' not seeded | Must include all groups from DB |

---

## The Correct Schedule (This Is The Source of Truth — Do Not Change It)

```
MONDAY & WEDNESDAY:
  Lecture Room  → All MONTZELITY 26' groups (City Logistics 2026, Azelis SA 2026,
                  Monteagle 2026, Beyond Insights 2026) — each gets their own block
                  + KELPACK 25' (if this group exists in the database)
  Computer Lab  → AZELIS 25', PACKAGING WORLD 25'

TUESDAY & THURSDAY:
  Lecture Room  → FLINT GROUP 25'
  Computer Lab  → WAHL 25', MONTEAGLE 25'

FRIDAY:
  → No sessions

Session Time: 09:00 – 14:00 (all groups, all days)
```

---

## PROMPT 1 — Audit First (No Changes)

```
@workspace The timetable seed created 306 sessions but they are showing on wrong days
and using module names instead of group names. Before fixing anything, audit the current state.

Please run the following and show me ALL output:

1. Query the TimetableSession table directly. Show the first 30 rows with these columns:
   id, groupId, title, date (formatted as YYYY-MM-DD day-of-week), startTime, venue
   I need to see: are sessions actually on Mon/Tue/Wed/Thu, or on wrong days?

2. Query the Group table. Show ALL groups with:
   id, name, company (or collection name), status
   I need the exact id and exact name for every group in the database.

3. Open scripts/seed-timetable.js and show me:
   - How did it find the Group IDs? Did it query the DB or hardcode them?
   - What group names or IDs did it use?
   - What day-of-week logic did it use to assign Mon/Wed vs Tue/Thu?

4. Open src/components/TimetableWeekView.tsx and tell me:
   - Does it render a time-slot grid (Y axis = time, X axis = days)?
   - Or does it render a month calendar with small event boxes?
   - What is the current height/sizing of each session block?

Do NOT change any code. Just show me the findings from all 4 points.
```

---

## PROMPT 2 — Delete Bad Sessions and Re-Seed Correctly

Run this AFTER Prompt 1 confirms the group IDs and what went wrong.

```
@workspace Now that I can see the group IDs and the seeding problems, I need to:
1. Delete all existing TimetableSession records
2. Re-seed correctly using the real Group IDs from the database

Here is the schedule to implement:

MONDAY and WEDNESDAY each week (session time 09:00 – 14:00):
  Lecture Room sessions — one session block per group:
    - City Logistics (LP) 2026  → colour #3B82F6 (blue)
    - Azelis SA (LP) 2026       → colour #14B8A6 (teal)
    - Monteagle (LP) 2026       → colour #8B5CF6 (purple)
    - Beyond Insights (LP) 2026 → colour #F97316 (orange)
    - Kelpack 2025 (if exists)  → colour #6366F1 (indigo)

  Computer Lab sessions — one session block per group:
    - Azelis 2025               → colour #22C55E (green)
    - Packaging World 2025      → colour #10B981 (emerald)

TUESDAY and THURSDAY each week (session time 09:00 – 14:00):
  Lecture Room sessions:
    - Flint Group 2025          → colour #EF4444 (red)

  Computer Lab sessions:
    - Wahl 2025                 → colour #F59E0B (amber)
    - Monteagle 2025            → colour #EC4899 (pink)

FRIDAY: No sessions

DATE RANGE: Generate sessions from today (Feb 2026) through May 2026

CRITICAL REQUIREMENTS:
- Look up REAL Group IDs from the database using: prisma.group.findMany()
- Match groups by name (case-insensitive, partial match is fine)
- If a group name is not found in the DB, log a warning and skip it — do not crash
- Each session title = the group's actual name (not the module name)
- Store groupId as a foreign key to the real Group record
- session.title = group.name

Please:
1. Update scripts/seed-timetable.js with this corrected logic
2. Add a step at the start that queries all groups from the DB and logs their names/IDs
3. Delete all existing TimetableSession records before inserting new ones
4. Run the seed script and show me the output confirming which groups were matched
5. Show me 10 sample sessions from the DB after seeding to confirm correct days and group names
```

---

## PROMPT 3 — Redesign the Timetable Calendar (Week View with Time Slots)

Run after Prompt 2 confirms sessions are correct in the DB.

```
@workspace The timetable is currently showing a month calendar with small text event boxes.
I need to completely replace this with a proper week view that looks like a professional
scheduling tool — similar to Google Calendar week view but styled for YEHA.

Here is exactly what I want:

LAYOUT STRUCTURE:
  Left sidebar (fixed, 220px wide):
    - "Timetable" heading
    - Filter: "All Groups" dropdown — lists every group from the DB
    - Filter: "All Venues" dropdown — Lecture Room, Computer Lab
    - View toggle: Week | Month (default = Week)
    - Small month mini-calendar for date jumping (optional, nice to have)

  Main area:
    Top row: Week navigation (< prev week | Mon 16 Feb – Fri 20 Feb | next week >)
             + "Today" button on the right

    Time grid:
      Y axis (left): Time labels every 30 min from 09:00 to 14:30
      X axis (top): Mon | Tue | Wed | Thu | Fri (5 columns, no weekend)

    Session blocks:
      - Positioned at exact time on the grid (09:00 start, top of block)
      - Height = proportional to duration (09:00–14:00 = 5 hours = full column height)
      - Width = full column width minus 8px padding each side
      - Background = group colour (from the colour map below)
      - Border radius: 8px
      - Content inside block:
          Line 1 (bold, white): Group name
          Line 2 (white, smaller): Venue name
          Line 3 (white, smaller): 09:00 – 14:00
      - On hover: slight brightness increase, cursor pointer
      - On click: opens session detail panel (side panel, not modal)

    If multiple groups share the same day (e.g. Mon has 7 groups):
      - Stack them side by side in the same column
      - Each block takes equal width share of the column

COLOUR MAP (apply exactly):
  City Logistics 2026    → #3B82F6
  Azelis SA 2026         → #14B8A6
  Monteagle 2026         → #8B5CF6
  Beyond Insights 2026   → #F97316
  Kelpack 2025           → #6366F1
  Azelis 2025            → #22C55E
  Packaging World 2025   → #10B981
  Flint Group 2025       → #EF4444
  Wahl 2025              → #F59E0B
  Monteagle 2025         → #EC4899

SESSION DETAIL SIDE PANEL (opens on click):
  - Slides in from the right (not a modal)
  - Shows: Group name, Date, Time, Venue, Current module, Student count
  - "View Group" button → /groups/[groupId]
  - "Mark Attendance" button → pre-fills attendance for this group and date
  - "Add Reminder" button → small inline form
  - Close button (X) top right

Please:
1. Fully rewrite src/components/TimetableWeekView.tsx with this design
2. Update src/app/timetable/page.tsx to use the new component
3. Fetch sessions from GET /api/timetable/sessions?startDate=&endDate= using SWR
4. Apply Tailwind CSS only — no external calendar libraries
5. Show every file changed
```

---

## PROMPT 4 — Fix the Group Colour Consistency Across the Whole App

Run after Prompt 3. This makes sure group colours are the same everywhere.

```
@workspace Group colours need to be consistent across the timetable, dashboard,
group cards, and student list. Right now they may be different in each component.

I want a single source of truth for group colours.

Please:

1. Create src/lib/groupColours.ts with this exact colour map:

const GROUP_COLOURS: Record<string, string> = {
  // Match by checking if the group name INCLUDES any of these keys (case-insensitive)
  'city logistics': '#3B82F6',
  'azelis sa': '#14B8A6',
  'azelis': '#22C55E',          // 2025 version — matched after 'azelis sa'
  'monteagle 2026': '#8B5CF6',
  'monteagle': '#EC4899',       // 2025 version — matched after 'monteagle 2026'
  'beyond insights': '#F97316',
  'kelpack': '#6366F1',
  'packaging world': '#10B981',
  'flint group': '#EF4444',
  'wahl': '#F59E0B',
}

Export a function:
  getGroupColour(groupName: string): string
  → loops through the map, returns the first match, defaults to '#6B7280' (grey) if no match

2. Replace all hardcoded group colour logic in:
   - TimetableWeekView.tsx
   - TodaysSchedule.tsx (dashboard widget)
   - GroupCard component (if it has colour logic)
   - Any other component that assigns colours to groups

3. Import getGroupColour from src/lib/groupColours.ts everywhere instead of inline colour logic

Show every file changed.
```

---

## PROMPT 5 — Fix the Dashboard Upcoming Schedule

Run after Prompt 4. This makes the dashboard show real upcoming sessions with correct group names.

```
@workspace The dashboard Upcoming Schedule widget needs to show the correct upcoming
timetable sessions using the real group names and colours.

Please update the Upcoming Schedule section on the dashboard (TodaysSchedule.tsx or equivalent):

DISPLAY:
  - Show next 5 sessions from today onwards
  - Each session card shows:
      [Colour dot] Group Name         Day, Date • 09:00 – 14:00
      📍 Venue name                   [Prepare button]
  - "Today" green badge if the session is today
  - "Tomorrow" amber badge if the session is tomorrow

DATA:
  - Fetch from GET /api/timetable/sessions?startDate=today&endDate=+7days
  - Use SWR — not raw fetch
  - Colours from getGroupColour() in src/lib/groupColours.ts

PREPARE BUTTON:
  - For now, clicking it logs to console: "Prepare clicked for [group name] on [date]"
  - We will wire it up fully in the next session

Also fix: If there are no sessions in the next 7 days, show:
  "No sessions scheduled — check your timetable"
  with a link to /timetable

Show every file changed.
```

---

## Run Order Summary

| # | Prompt | What It Does |
|---|---|---|
| 1 | Audit current state | Find out exactly what was seeded and why it's wrong |
| 2 | Re-seed with correct groups | Delete bad sessions, re-seed with real DB group IDs |
| 3 | Redesign the calendar UI | Week view, time slots, coloured blocks, side panel |
| 4 | Centralise group colours | Single colour source used everywhere |
| 5 | Fix dashboard schedule | Real sessions, correct names, prepare button |

---

## Critical Rules for Copilot to Follow

- ALWAYS query the database for real Group IDs — never hardcode them
- Session title = the group's actual name from the database
- Group colours come from src/lib/groupColours.ts — not inline
- No external calendar libraries — use Tailwind CSS grid/flex
- Use SWR for all data fetching — no raw fetch() calls
- Test: after each prompt, check localhost:3000/timetable and confirm sessions show on Mon/Tue/Wed/Thu

---

*YEHA – Youth Education & Skills Management System*
*Stack: Next.js 14 | Prisma | SQLite | TypeScript | SWR | Tailwind CSS*
