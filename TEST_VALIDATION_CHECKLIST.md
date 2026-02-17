# End-to-End Testing Validation Checklist

## Pre-Test Requirements
- [ ] Server running on `http://localhost:3000`
- [ ] Database initialized (`prisma/dev.db`)
- [ ] At least one group exists in database
- [ ] At least one student exists in database
- [ ] At least one module in curriculum exists
- [ ] Environment variables configured (if using AI features)

## Test Phases

### Phase 1: Database & Data Validation âœ“
- [ ] Groups can be loaded via `/api/groups`
- [ ] Students can be loaded via `/api/students`
- [ ] Curriculum (modules) can be loaded via `/api/curriculum`

### Phase 2: Attendance Recording âœ“
- [ ] Attendance can be recorded for a group
- [ ] Attendance status saved correctly (present/absent/late)
- [ ] Attendance records can be retrieved for verification
- [ ] UUID parsing works correctly (fixed bug)

### Phase 3: Unit Standards & Assessment Setup âœ“
- [ ] Unit standards can be loaded via `/api/unit-standards`
- [ ] New unit standards can be created
- [ ] Unit standards are linked to modules
- [ ] All CRUD operations work (Create, Read, Update, Delete)

### Phase 4: Assessment Marking âœ“
- [ ] Formative assessments can be recorded
- [ ] Formative completion date/evidence stored correctly
- [ ] Summative assessments can be recorded
- [ ] Assessment status transitions work (not_started â†’ in_progress â†’ completed)
- [ ] Both assessment types visible in Assessment page

### Phase 5: Assessment Moderation âœ“
- [ ] Pending assessments appear in moderation queue
- [ ] Approve/Reject/Request Revision actions work
- [ ] Moderator notes are saved
- [ ] Assessment status updates correctly after moderation
- [ ] Non-compliant assessments flagged appropriately

### Phase 6: Report Generation âœ“
- [ ] Standard PDF report can be generated
- [ ] Report includes attendance data
- [ ] Report includes assessment completion data
- [ ] AI-enhanced report can be generated (if Cohere/Pinecone configured)
- [ ] Reports are downloadable/exportable

### Phase 7: Timetable Scheduling âœ“
- [ ] Lessons can be created for a group
- [ ] Lesson date, time, venue, topic stored correctly
- [ ] Lessons appear in timetable week view
- [ ] Lessons appear in month view
- [ ] Multiple groups can be assigned to same time slot
- [ ] Recurring sessions work with overrides
- [ ] Notifications scheduled for upcoming sessions

### Phase 8: Compliance Checking âœ“
- [ ] Compliance endpoints return status correctly
- [ ] Missing assessments detected
- [ ] Non-compliant students flagged
- [ ] Compliance data available for export

### Phase 9: Analytics & Progress âœ“
- [ ] Progress analytics can be retrieved
- [ ] Module completion percentages calculated correctly
- [ ] Student progress tracked across units
- [ ] Charts and graphs render properly
- [ ] Export options work (PDF/CSV)

## Critical Workflows to Test

### Workflow 1: Complete Assessment Cycle
1. Create a unit standard
2. Record formative assessment for student
3. Record summative assessment for same student
4. Test moderation approve/reject
5. Verify status changes in compliance

### Workflow 2: Daily Report Generation
1. Record attendance for group
2. Mark assessments for students in that group
3. Generate standard report (should include attendance + assessments)
4. Generate AI report (should provide enhanced insights)
5. Verify both reports are consistent

### Workflow 3: Week Scheduling
1. Create lessons for multiple groups
2. Assign same time slot to different groups
3. Create recurring sessions
4. Add override for specific date
5. Verify week/month view display correctly

### Workflow 4: End-to-End Student Tracking
1. Enroll student in group
2. Record attendance over multiple days
3. Mark assessments progressively (formative â†’ summative)
4. Generate progress report
5. Verify all data consistent across pages

## Expected Results

### Success Criteria
- âœ“ All 9 test phases pass (100% pass rate)
- âœ“ No TypeScript errors on any page
- âœ“ All API endpoints return correct status codes
- âœ“ Data persistence verified (created data retrieves correctly)
- âœ“ All three pages load without errors
- âœ“ Assessment moderation workflow complete
- âœ“ Reports generate successfully
- âœ“ Timetable displays all scheduled lessons

### Known Issues / Warnings to Monitor
- [ ] Cohere/Pinecone may return "service unavailable" if not configured
- [ ] Some API endpoints may have fallback behavior if database empty
- [ ] File-based attachments (evidence) depend on file system permissions

## Run Test Command

```bash
# Start the development server first
npm run dev

# In another terminal, run the E2E tests
node test-e2e-complete.js
```

## Performance Benchmarks (Optional)

| Operation | Expected Time | Status |
|-----------|---|---|
| Load students (100+) | <500ms | |
| Record attendance | <200ms | |
| Mark assessment | <300ms | |
| Generate standard report | <1000ms | |
| Generate AI report | <3000ms | |
| Load timetable (1 week) | <300ms | |

## Post-Test Actions

If all tests pass:
1. [ ] Commit changes with test results
2. [ ] Document any warnings encountered
3. [ ] Prepare deployment checklist
4. [ ] Brief team on system readiness

If tests fail:
1. [ ] Review failure details in test output
2. [ ] Check server logs for errors
3. [ ] Verify database state
4. [ ] Fix issues and re-run tests

---

**Last Updated**: 2025-02-05
**Tested Pages**: Assessment, Reports, Timetable
**Test Coverage**: 9 phases, 40+ individual checks

