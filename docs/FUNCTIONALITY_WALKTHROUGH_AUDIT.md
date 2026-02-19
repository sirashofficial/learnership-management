# Full Functionality Walkthrough (Report)

Date: 2026-02-17
Scope: Full app walkthrough and sync map.

## Sync Map (How Pages Connect)

### Shared Data Sources
- Students: /api/students, /api/students/:id, /api/students/:id/progress
- Groups: /api/groups, /api/groups/:id, /api/groups/progress
- Attendance: /api/attendance, /api/attendance/*, /api/attendance/rates
- Assessments: /api/assessments, /api/assessments/*, /api/assessments/bulk-*
- Timetable: /api/timetable, /api/timetable/*
- Reports: /api/reports/*
- Curriculum: /api/curriculum, /api/modules, /api/unit-standards
- AI: /api/ai/*

### Key Sync Behaviors
- Assessments update group + student progress: global SWR mutate on /api/students, /api/groups, /api/groups/progress.
- Group detail toggles assessments and refreshes multiple caches: /api/assessments, /api/students, /api/groups, /api/groups/:id.
- Timetable sessions refresh timetable SWR keys after creation.
- Student profile report downloads revalidate student, progress, attendance, and assessment data before export.
- Attendance stats are reused in Students, Groups, and Compliance for rates and RAG status.

### Page-to-Page Relationships
- Dashboard -> Groups, Students, Attendance, Timetable, Reports, Lessons, Assessments
- Groups -> Group Detail -> Assessments and Rollout stats -> Reports (group progress)
- Students -> Student Profile -> Attendance + Assessments + POE
- Lessons -> Timetable (Add to Timetable)
- Assessments -> Moderation and Compliance
- Admin -> Documents -> AI (index and search)

## Walkthrough (Per Page)

### Dashboard
- Live stats and charts; links into core flows.

### Groups
- Grid/list with quick view drawer.
- Group detail supports rollout plan stats, assessment marking, bulk pass, and exports.

### Students
- List with filters and bulk actions.
- Student profile with tabs; TXT/DOCX report export.

### Attendance
- Marking, history, and analytics views.
- Bulk actions and export menu.

### Timetable
- Week/day/group views with new session modal.

### Lessons
- Manual creation and AI generation; link to timetable.

### Assessments
- Manage unit standards and assessment outcomes; moderation queue; analytics views.

### Reports
- Daily attendance, group progress, assessment results, unit standards, group session reports.

### Curriculum + AI
- Curriculum library with PDF export and AI upload.
- AI chat and semantic search.

### Compliance + POE
- Compliance RAG at student/group level.
- POE checklist tracking per student.

### Admin + Settings + Auth
- Admin: users + documents + index stats.
- Settings: profile, notifications, reminders, system, appearance, security.
- Login/Register flows.

## Placeholders or Risks (Now Addressed)
- Lessons page use client directive moved to top.
- Student TXT report duplicate lines removed.
- Curriculum Builder uses selected student instead of hardcoded ID.
- Attendance collections now dynamic instead of hardcoded Montzelity list.
