# Pages Inventory

## 1. Framework

**Next.js 14.2.0 — App Router** (`src/app/`)

This project uses the Next.js [App Router](https://nextjs.org/docs/app) (introduced in Next.js 13). Routing is **file-based**: every `page.tsx` file inside `src/app/` automatically becomes a publicly accessible route. No separate router configuration file is required.

Key configuration files:
- `next.config.mjs` — Next.js project configuration
- `src/middleware.ts` — Edge middleware for request-level logic (auth guards, redirects)
- `src/app/layout.tsx` — Root layout (fonts, providers, error boundary, AI overlay)
- `src/app/guardian/layout.tsx` — Sub-layout for the guardian portal

---

## 2. Page Entry Points

### Public / Auth Pages

| Route | File Path |
|-------|-----------|
| `/login` | `src/app/login/page.tsx` |
| `/register` | `src/app/register/page.tsx` |

### Core Application Pages

| Route | File Path |
|-------|-----------|
| `/` | `src/app/page.tsx` |
| `/dashboard` | `src/app/dashboard/page.tsx` |
| `/groups` | `src/app/groups/page.tsx` |
| `/groups/[id]` | `src/app/groups/[id]/page.tsx` |
| `/groups/[id]/rollout` | `src/app/groups/[id]/rollout/page.tsx` |
| `/students` | `src/app/students/page.tsx` |
| `/students/[id]` | `src/app/students/[id]/page.tsx` |
| `/assessments` | `src/app/assessments/page.tsx` |
| `/assessments/generate` | `src/app/assessments/generate/page.tsx` |
| `/assessment-checklist` | `src/app/assessment-checklist/page.tsx` |
| `/attendance` | `src/app/attendance/page.tsx` |
| `/progress` | `src/app/progress/page.tsx` |
| `/compliance` | `src/app/compliance/page.tsx` |
| `/moderation` | `src/app/moderation/page.tsx` |
| `/poe` | `src/app/poe/page.tsx` |
| `/timetable` | `src/app/timetable/page.tsx` |
| `/lessons` | `src/app/lessons/page.tsx` |
| `/lessons/[id]` | `src/app/lessons/[id]/page.tsx` |
| `/curriculum` | `src/app/curriculum/page.tsx` |
| `/curriculum/search` | `src/app/curriculum/search/page.tsx` |
| `/curriculum/builder` | `src/app/curriculum/builder/page.tsx` |
| `/reports` | `src/app/reports/page.tsx` |
| `/ai` | `src/app/ai/page.tsx` |
| `/settings` | `src/app/settings/page.tsx` |

### Admin Pages (role-restricted)

| Route | File Path |
|-------|-----------|
| `/admin` | `src/app/admin/page.tsx` |
| `/admin/users` | `src/app/admin/users/page.tsx` |
| `/admin/validation` | `src/app/admin/validation/page.tsx` |
| `/admin/restore` | `src/app/admin/restore/page.tsx` |
| `/admin/reports/sseta` | `src/app/admin/reports/sseta/page.tsx` |
| `/admin/documents` | `src/app/admin/documents/page.tsx` |

### Guardian Portal Pages

| Route | File Path |
|-------|-----------|
| `/guardian/login` | `src/app/guardian/login/page.tsx` |
| `/guardian/dashboard` | `src/app/guardian/dashboard/page.tsx` |
| `/guardian/students/[studentId]` | `src/app/guardian/students/[studentId]/page.tsx` |
| `/guardian/settings` | `src/app/guardian/settings/page.tsx` |

---

## 3. Summary

| Category | Count |
|----------|-------|
| Public / Auth | 2 |
| Core Application | 24 |
| Admin | 6 |
| Guardian Portal | 4 |
| **Total** | **36** |

There are **36 `page.tsx` files** across `src/app/`, covering the full application surface: authentication, learner management (groups, students, assessments, attendance, progress), content tools (lessons, curriculum, timetable, AI assistant), reporting/compliance, and dedicated admin and guardian portals.

Dynamic segments (`[id]`, `[studentId]`) handle per-resource detail pages without additional routing configuration.

---

## 4. Routing Mechanism

Routing is entirely **file-system driven** by Next.js App Router conventions:

- A file at `src/app/<path>/page.tsx` → URL `/<path>`
- Dynamic routes use square-bracket folder names: `[id]`, `[studentId]`
- Layouts (`layout.tsx`) wrap entire route subtrees (root layout and guardian sub-layout)
- `src/middleware.ts` runs at the edge before every request to apply authentication guards and redirects
- API routes live under `src/app/api/**` and are **not** page entry points

No explicit router config file (e.g., `react-router` routes array or `vue-router` config) exists — the directory structure **is** the route declaration.
