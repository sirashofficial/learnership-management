---
name: yeha-timetable-fix-skill
description: >
  Use this skill when fixing or rebuilding the YEHA Timetable page.
  It defines the correct weekly schedule, exact group names to match from the database,
  colour assignments, UI design rules, and what went wrong in the first implementation.
---

# YEHA – Timetable Fix Skill

## What This Skill Is For

This skill guides AI assistants fixing the YEHA timetable after the first implementation
produced incorrect results. The specific problems were:

1. Sessions appeared on wrong days (Sun/Mon/Tue instead of Mon/Tue/Wed/Thu)
2. Session titles used module names instead of group names
3. Groups were not linked to real database Group records (hardcoded names used)
4. The calendar rendered as a month view with small boxes instead of a week view with time slots
5. Group colours were inconsistent across components

---

## The Correct Weekly Schedule — Source of Truth

This must be implemented exactly. Do not interpret or modify this structure.

```
MONDAY and WEDNESDAY (every week):

  Venue: Lecture Room
  Time: 09:00 – 14:00
  Groups (each gets their own session block):
    - City Logistics (LP) 2026
    - Azelis SA (LP) 2026
    - Monteagle (LP) 2026
    - Beyond Insights (LP) 2026
    - Kelpack 2025 (only if this group exists in the DB — check first)

  Venue: Computer Lab
  Time: 09:00 – 14:00
  Groups:
    - Azelis 2025
    - Packaging World 2025

TUESDAY and THURSDAY (every week):

  Venue: Lecture Room
  Time: 09:00 – 14:00
  Groups:
    - Flint Group 2025

  Venue: Computer Lab
  Time: 09:00 – 14:00
  Groups:
    - Wahl 2025
    - Monteagle 2025

FRIDAY: No sessions — do not generate any
SATURDAY/SUNDAY: No sessions — do not generate any
```

---

## Group Name Matching Rules

The seed script MUST query the database and match groups dynamically.
Never hardcode Group IDs. Here is how to match:

```javascript
// Step 1: Get all groups from DB
const allGroups = await prisma.group.findMany({
  select: { id: true, name: true, company: true }
})

// Step 2: Match by partial name (case-insensitive)
// Use this helper:
function findGroup(groups, searchTerm) {
  return groups.find(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.company && g.company.toLowerCase().includes(searchTerm.toLowerCase()))
  )
}

// Step 3: Log what was found and what was not
// If a group is not found → log warning and skip (do not crash)
// Example:
const cityLogistics = findGroup(allGroups, 'city logistics')
if (!cityLogistics) {
  console.warn('WARNING: City Logistics 2026 not found in database — skipping')
} else {
  console.log(`Found: ${cityLogistics.name} (${cityLogistics.id})`)
}
```

### Search Terms to Use Per Group

| Target Group | Search Term |
|---|---|
| City Logistics (LP) 2026 | `city logistics` |
| Azelis SA (LP) 2026 | `azelis sa` |
| Monteagle (LP) 2026 | `monteagle` + year 2026 filter |
| Beyond Insights (LP) 2026 | `beyond insights` |
| Kelpack 2025 | `kelpack` |
| Azelis 2025 | `azelis` + year 2025 filter |
| Packaging World 2025 | `packaging world` |
| Flint Group 2025 | `flint` |
| Wahl 2025 | `wahl` |
| Monteagle 2025 | `monteagle` + year 2025 filter |

**Important:** Monteagle exists in both 2025 and 2026. Distinguish by year or by checking
which collection/company they belong to. 2026 = Montazility collection. 2025 = individual.

---

## Session Data Structure

Each generated session must have:

```typescript
{
  groupId: string        // REAL Group.id from the database
  title: string          // group.name — EXACTLY as stored in DB
  date: Date             // The specific date (e.g. 2026-02-16 for a Monday)
  startTime: "09:00"
  endTime: "14:00"
  venue: "Lecture Room" | "Computer Lab"
  type: "LECTURE" | "COMPUTER_LAB"
  colour: string         // Hex colour from the colour map below
  isRecurring: true
}
```

**Critical:** `title` must be the group's name, not the module name. The module name
belongs in a separate field if needed. The calendar block heading = group name.

---

## Group Colour Map — Single Source of Truth

Create this in `src/lib/groupColours.ts` and import it everywhere.
Never define colours inline in components.

```typescript
const COLOUR_MAP: { key: string; colour: string }[] = [
  { key: 'city logistics',    colour: '#3B82F6' },  // Blue
  { key: 'azelis sa',        colour: '#14B8A6' },  // Teal — must match before 'azelis'
  { key: 'beyond insights',  colour: '#F97316' },  // Orange
  { key: 'kelpack',          colour: '#6366F1' },  // Indigo
  { key: 'packaging world',  colour: '#10B981' },  // Emerald
  { key: 'flint',            colour: '#EF4444' },  // Red
  { key: 'wahl',             colour: '#F59E0B' },  // Amber
  // Monteagle — must distinguish 2026 vs 2025
  // Handle by checking if the name contains '2026' or belongs to Montazility collection
]

// For Monteagle specifically:
// If group name contains '2026' or company is 'Montazility' → #8B5CF6 (Purple)
// Otherwise (2025) → #EC4899 (Pink)

// For Azelis specifically:
// If group name contains 'SA' or '2026' → #14B8A6 (Teal)
// Otherwise (2025) → #22C55E (Green)

export function getGroupColour(groupName: string, company?: string): string {
  const name = groupName.toLowerCase()
  const comp = (company || '').toLowerCase()

  // Monteagle disambiguation
  if (name.includes('monteagle')) {
    return (name.includes('2026') || comp.includes('montazility'))
      ? '#8B5CF6'   // Purple — 2026
      : '#EC4899'   // Pink — 2025
  }

  // Azelis disambiguation
  if (name.includes('azelis')) {
    return name.includes('sa') ? '#14B8A6' : '#22C55E'
  }

  // Standard matches
  for (const { key, colour } of COLOUR_MAP) {
    if (name.includes(key)) return colour
  }

  return '#6B7280' // Grey fallback
}
```

---

## Timetable UI — Required Design

### What Was Wrong
The first implementation used a month calendar grid with small event boxes (like a basic
calendar app). This is NOT what was requested.

### What Is Required
A professional **week view** with a **time axis** — similar to the reference image shared
(coloured blocks on a grid, time on Y axis, days on X axis).

### Layout Specification

```
┌─────────────────────────────────────────────────────────────────┐
│ TIMETABLE PAGE                                                   │
├─────────────┬───────────────────────────────────────────────────┤
│ LEFT SIDEBAR│ WEEK NAVIGATION + GRID                            │
│ (220px)     │                                                   │
│             │  < Mon 16 Feb – Fri 20 Feb 2026 >    [Today]     │
│ Filter:     │                                                   │
│ All Groups▼ │  TIME  │ MON  │ TUE  │ WED  │ THU  │ FRI        │
│             │ ───────┼──────┼──────┼──────┼──────┼────        │
│ All Venues▼ │ 09:00  │ ████ │ ████ │ ████ │ ████ │            │
│             │ 09:30  │ ████ │ ████ │ ████ │ ████ │            │
│ [Week] [Mo] │ 10:00  │ ████ │ ████ │ ████ │ ████ │            │
│             │  ...   │ ████ │ ████ │ ████ │ ████ │            │
│             │ 14:00  │      │      │      │      │            │
└─────────────┴───────────────────────────────────────────────────┘
```

### Session Block Rules

```
Positioning:
  - Y position = calculated from startTime (09:00 = top of grid)
  - Height = proportional to duration (09:00–14:00 = full block)
  - Each 30-minute slot = a fixed pixel height (recommend 48px per 30 min)
  - So 5 hours = 10 slots = 480px tall

Width:
  - If only 1 group in a column → full column width
  - If multiple groups share a day+venue → split column equally
  - Min gap of 4px between blocks

Content inside block:
  Line 1: Group name (font-bold, text-white, text-sm)
  Line 2: Venue (text-white/80, text-xs)
  Line 3: 09:00 – 14:00 (text-white/70, text-xs)

Styling:
  - background-color: group colour
  - border-radius: 8px
  - overflow: hidden
  - cursor: pointer
  - On hover: brightness-110
  - Box shadow: subtle drop shadow
```

### Time Axis Rules

```
Show time labels every 30 minutes: 09:00, 09:30, 10:00, ... 14:00
Label width: 60px (fixed, does not scroll)
Grid lines: light grey horizontal lines every 30 min
Header row (day names + dates): sticky at top
Time labels: sticky on left
```

### Filter Sidebar Rules

```
"All Groups" dropdown:
  - Lists every group that has sessions in the current week
  - Selecting a group hides all other groups' blocks
  - "All Groups" = show everything

"All Venues" dropdown:
  - Options: All Venues | Lecture Room | Computer Lab
  - Selecting a venue hides blocks from the other venue

View Toggle:
  - [Week] [Month] buttons
  - Week = the time-slot grid (default)
  - Month = the existing month calendar (keep as fallback)
```

### Session Detail Side Panel (on block click)

```
Slides in from the right (not a modal)
Width: 320px
Overlay: subtle dark backdrop on the left

Content:
  [Group colour header bar]
  Group Name (heading)
  Date: Monday, 16 February 2026
  Time: 09:00 – 14:00
  Venue: Lecture Room
  Students: [count from DB]
  Current Module: [from group's rollout plan]

  Buttons:
    [View Group] → /groups/[groupId]
    [Mark Attendance] → /attendance pre-filled
    [Add Reminder] → expands inline form

  Reminder form (when expanded):
    Text input: "Reminder text..."
    Priority: Low | Medium | Urgent (toggle)
    [Save Reminder] button

Close button: X top right
```

---

## Seed Script Requirements

```javascript
// scripts/seed-timetable.js — Required structure

async function main() {
  // 1. Delete all existing sessions
  await prisma.timetableSession.deleteMany()
  console.log('Cleared existing sessions')

  // 2. Fetch real groups from DB
  const allGroups = await prisma.group.findMany({ select: { id, name, company } })
  console.log(`Found ${allGroups.length} groups in database:`)
  allGroups.forEach(g => console.log(`  ${g.id} | ${g.name} | ${g.company}`))

  // 3. Match groups using findGroup() helper
  // Log found and not-found for every group

  // 4. Generate dates (Mon/Tue/Wed/Thu) from today through 4 months
  // Use getDay() === 1 (Mon), 2 (Tue), 3 (Wed), 4 (Thu)

  // 5. For each date, create sessions for the correct groups
  // title = group.name (NEVER the module name)

  // 6. Log total sessions created
  console.log(`Created ${total} sessions`)
}
```

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Using module names as session titles | Use `group.name` only |
| Hardcoding Group IDs | Always query `prisma.group.findMany()` first |
| Generating sessions on Fridays | Friday = no sessions |
| Month calendar view | Week view with time axis is required |
| Inline colour definitions | Import `getGroupColour()` from `src/lib/groupColours.ts` |
| Raw `fetch()` calls | Use SWR hooks only |
| Sessions not on Wed/Thu | Must include all 4 days: Mon, Tue, Wed, Thu |
| All groups stacked in one block | Each group = separate block side by side |

---

## Files That Must Exist After Fix

| File | Purpose |
|---|---|
| `src/lib/groupColours.ts` | Single colour source for all groups |
| `scripts/seed-timetable.js` | Corrected seed with DB group matching |
| `src/components/TimetableWeekView.tsx` | Full redesign with time-slot grid |
| `src/app/api/timetable/sessions/route.ts` | GET with startDate/endDate params |
| `src/app/timetable/page.tsx` | Timetable page using week view component |
| `src/components/TodaysSchedule.tsx` | Dashboard widget with real session data |

---

*YEHA Learnership Management System — Timetable Fix Skill v2.0*
*Stack: Next.js 14 | Prisma | SQLite | TypeScript | SWR | Tailwind CSS*
