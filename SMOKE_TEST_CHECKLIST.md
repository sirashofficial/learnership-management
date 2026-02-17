# Smoke Test Checklist

Status: Not executed yet.
Date: 2026-02-17

## Auth
- [ ] Login with a valid user
- [ ] Logout and verify redirect to login

## Dashboard -> Core Flows
- [ ] Open dashboard and verify summary cards load
- [ ] Open dashboard quick links (Groups, Students, Timetable, Reports)

## Groups
- [ ] Open Groups list and search for an existing group
- [ ] Open Group quick view drawer
- [ ] Open Group detail page and verify rollout/assessments load
- [ ] Export group progress CSV

## Students
- [ ] Open Students list and filter by group
- [ ] Open Student profile and switch tabs
- [ ] Download TXT and DOCX progress reports

## Attendance
- [ ] Mark attendance for a group and save
- [ ] Check history view loads for selected date
- [ ] Check analytics view renders charts

## Timetable
- [ ] Create a new session
- [ ] Confirm session appears in Week and Day views

## Lessons
- [ ] Create manual lesson
- [ ] Generate AI lesson (if docs are indexed)
- [ ] Add lesson to timetable from Lessons page

## Assessments
- [ ] Open Assessments and switch views
- [ ] Create or update a unit standard assessment
- [ ] Open Moderation queue and approve one item

## Reports
- [ ] Generate Daily Attendance report
- [ ] Generate Group Session report (DOCX and TXT)

## Admin
- [ ] Open Admin dashboard
- [ ] Open Users and list accounts
- [ ] Open Documents and view index stats
