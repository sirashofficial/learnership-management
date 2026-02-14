# Full Site Data Audit
Date: 2026-02-10T17:58:39.248Z

## 1. Database Statistics (Record Counts)
- **user**: 2
- **company**: 8
- **group**: 10
- **groupRolloutPlan**: 10
- **unitStandardRollout**: 0
- **student**: 12
- **formativeAssessment**: 0
- **formativeCompletion**: 0
- **session**: 1566
- **attendance**: 0
- **attendancePolicy**: 0
- **attendanceAlert**: 0
- **attendanceReport**: 0
- **assessment**: 3
- **moduleProgress**: 0
- **unitStandardProgress**: 0
- **pOEChecklist**: 0
- **pOEFile**: 0
- **module**: 6
- **curriculumEmbedding**: 0
- **documentChunk**: 0
- **unitStandard**: 26
- **activity**: 4
- **lessonPlan**: 2
- **curriculumDocument**: 0
- **groupCourse**: 0
- **courseProgress**: 0
- **recurringSessionOverride**: 0
- **scheduleTemplate**: 0
- **groupSchedule**: 0

## 2. File Systems Inventory (src/)

### Full File List
/src/app/admin/page.tsx
/src/app/admin/users/page.tsx
/src/app/ai/page.tsx
/src/app/api/admin/cleanup/route.ts
/src/app/api/ai/chat/route.ts
/src/app/api/ai/generate-assessment/route.ts
/src/app/api/ai/index-documents/route.ts
/src/app/api/ai/recommendations/route.ts
/src/app/api/ai/semantic-search/route.ts
/src/app/api/assessments/analytics/route.ts
/src/app/api/assessments/bulk/route.ts
/src/app/api/assessments/bulk-generate/route.ts
/src/app/api/assessments/bulk-update/route.ts
/src/app/api/assessments/by-group/route.ts
/src/app/api/assessments/export/route.ts
/src/app/api/assessments/marking/route.ts
/src/app/api/assessments/moderate/route.ts
/src/app/api/assessments/route.ts
/src/app/api/assessments/stats/route.ts
/src/app/api/assessments/templates/route.ts
/src/app/api/assessments/[id]/complete/route.ts
/src/app/api/attendance/alerts/route.ts
/src/app/api/attendance/bulk/route.ts
/src/app/api/attendance/export/route.ts
/src/app/api/attendance/history/route.ts
/src/app/api/attendance/policies/route.ts
/src/app/api/attendance/rates/route.ts
/src/app/api/attendance/route.ts
/src/app/api/attendance/stats/route.ts
/src/app/api/auth/login/route.ts
/src/app/api/auth/logout/route.ts
/src/app/api/auth/me/route.ts
/src/app/api/auth/register/route.ts
/src/app/api/companies/route.ts
/src/app/api/curriculum/route.ts
/src/app/api/dashboard/alerts/route.ts
/src/app/api/dashboard/charts/route.ts
/src/app/api/dashboard/recent-activity/route.ts
/src/app/api/dashboard/schedule/route.ts
/src/app/api/dashboard/stats/route.ts
/src/app/api/dashboard/today-classes/route.ts
/src/app/api/formatives/completion/route.ts
/src/app/api/formatives/route.ts
/src/app/api/group-schedules/route.ts
/src/app/api/groups/auto-calculate/route.ts
/src/app/api/groups/auto-rollout/route.ts
/src/app/api/groups/merge/route.ts
/src/app/api/groups/route.ts
/src/app/api/groups/upload/route.ts
/src/app/api/groups/[id]/lessons/generate/route.ts
/src/app/api/groups/[id]/rollout/route.ts
/src/app/api/groups/[id]/route.ts
/src/app/api/lessons/route.ts
/src/app/api/lessons/[id]/route.ts
/src/app/api/modules/route.ts
/src/app/api/modules/[id]/route.ts
/src/app/api/plans/route.ts
/src/app/api/plans/[id]/route.ts
/src/app/api/poe/route.ts
/src/app/api/progress/route.ts
/src/app/api/recurring-sessions/route.ts
/src/app/api/reminders/route.ts
/src/app/api/reminders/send-pending-emails/route.ts
/src/app/api/reminders/[id]/mark-read/route.ts
/src/app/api/reminders/[id]/route.ts
/src/app/api/reports/daily/generate-ai/route.ts
/src/app/api/reports/daily/route.ts
/src/app/api/reports/group-progress/route.ts
/src/app/api/reports/unit-standards/route.ts
/src/app/api/schedule-templates/route.ts
/src/app/api/search/route.ts
/src/app/api/sessions/generate/route.ts
/src/app/api/settings/appearance/route.ts
/src/app/api/settings/notifications/route.ts
/src/app/api/settings/profile/route.ts
/src/app/api/settings/reminders/route.ts
/src/app/api/settings/security/route.ts
/src/app/api/settings/system/route.ts
/src/app/api/students/route.ts
/src/app/api/students/[id]/progress/route.ts
/src/app/api/students/[id]/route.ts
/src/app/api/test-endpoint/route.ts
/src/app/api/timetable/route.ts
/src/app/api/timetable/schedule/route.ts
/src/app/api/timetable/[id]/audit/route.ts
/src/app/api/timetable/[id]/reschedule/route.ts
/src/app/api/timetable/[id]/route.ts
/src/app/api/unit-standards/route.ts
/src/app/api/unit-standards/[id]/route.ts
/src/app/api/users/route.ts
/src/app/api/users/[id]/password/route.ts
/src/app/api/users/[id]/route.ts
/src/app/assessment-checklist/page.tsx
/src/app/assessments/loading.tsx
/src/app/assessments/page.tsx
/src/app/attendance/page.tsx
/src/app/compliance/page.tsx
/src/app/curriculum/builder/page.tsx
/src/app/curriculum/page.tsx
/src/app/globals.css
/src/app/groups/page.tsx
/src/app/groups/[id]/page.tsx
/src/app/layout.tsx
/src/app/lessons/page.tsx
/src/app/loading.tsx
/src/app/login/page.tsx
/src/app/moderation/page.tsx
/src/app/page.tsx
/src/app/poe/page.tsx
/src/app/progress/page.tsx
/src/app/register/page.tsx
/src/app/reports/page.tsx
/src/app/settings/page.tsx
/src/app/students/loading.tsx
/src/app/students/page.tsx
/src/app/timetable/loading.tsx
/src/app/timetable/page.tsx
/src/app/timetable/page.tsx.backup
/src/components/AddNoteModal.tsx
/src/components/AddStudentModal.tsx
/src/components/ai/AIChat.tsx
/src/components/AssessmentModal.tsx
/src/components/AssessmentResultModal.tsx
/src/components/AttendanceCalendar.tsx
/src/components/AttendanceTrendChart.tsx
/src/components/BulkAssessmentModal.tsx
/src/components/CourseCreationForm.tsx
/src/components/CourseCreationForm_NEW.tsx
/src/components/CourseProgressChart.tsx
/src/components/CreateAssessmentModal.tsx
/src/components/CreditAdjustmentModal.tsx
/src/components/DashboardAlerts.tsx
/src/components/DashboardCharts.tsx
/src/components/DashboardStats.tsx
/src/components/EditStudentModal.tsx
/src/components/ErrorBoundary.tsx
/src/components/EventDetailModal.tsx
/src/components/GlobalSearch.tsx
/src/components/GranularRolloutTable.tsx
/src/components/GroupDistributionChart.tsx
/src/components/GroupModal.tsx
/src/components/GroupsManagement.tsx
/src/components/GroupUploadModal.tsx
/src/components/Header.tsx
/src/components/LearnerAssessmentTracker.tsx
/src/components/MainLayout.tsx
/src/components/MarkAssessmentModal.tsx
/src/components/MarkAttendanceModal.tsx
/src/components/ModerationQueue.tsx
/src/components/ModuleProgress.tsx
/src/components/ModuleProgressCard.tsx
/src/components/ModuleProgressionPanel.tsx
/src/components/PlanForm.tsx
/src/components/ProgressReport.tsx
/src/components/ProgressReport_NEW.tsx
/src/components/providers.tsx
/src/components/QuickActions.tsx
/src/components/RecentActivity.tsx
/src/components/RecurringSessionModal.tsx
/src/components/ReminderWidget.tsx
/src/components/ScheduleLessonModal.tsx
/src/components/Sidebar.tsx
/src/components/StatCard.tsx
/src/components/StatDetailsModal.tsx
/src/components/StudentCard.tsx
/src/components/StudentDetailsModal.tsx
/src/components/StudentProgressModal.tsx
/src/components/TimetableCalendarView.tsx
/src/components/TimetableWeekView.tsx
/src/components/TodayClassesDashboard.tsx
/src/components/TodaysSchedule.tsx
/src/components/ui/button.tsx
/src/components/ui/input.tsx
/src/components/ui/scroll-area.tsx
/src/components/WeeklyCalendarView.tsx
/src/contexts/AuthContext.tsx
/src/contexts/GroupsContext.tsx
/src/contexts/StudentContext.tsx
/src/contexts/StudentContextSimple.tsx
/src/contexts/StudentContext_OLD.txt
/src/hooks/useAI.ts
/src/hooks/useAssessments.ts
/src/hooks/useAssessmentStats.ts
/src/hooks/useAttendance.ts
/src/hooks/useCurriculum.ts
/src/hooks/useDashboard.ts
/src/hooks/useDashboardStats.ts
/src/hooks/useDebounce.ts
/src/hooks/useLessons.ts
/src/hooks/useProgress.ts
/src/hooks/useSites.ts
/src/hooks/useStudents.ts
/src/lib/ai/cohere.ts
/src/lib/ai/gemini.ts
/src/lib/ai/index.ts
/src/lib/ai/pinecone.ts
/src/lib/ai/zai.ts
/src/lib/api-utils.ts
/src/lib/attendance-calculator.ts
/src/lib/auth.ts
/src/lib/email.ts
/src/lib/groupNameUtils.js
/src/lib/input-sanitizer.ts
/src/lib/lesson-parser.ts
/src/lib/logger.ts
/src/lib/middleware.ts
/src/lib/notifications.ts
/src/lib/prisma.ts
/src/lib/progress-alerts.ts
/src/lib/progress-calculator.ts
/src/lib/rate-limit.ts
/src/lib/report-generator.ts
/src/lib/rollout-utils.ts
/src/lib/swr-config.ts
/src/lib/utils.ts
/src/lib/validation.ts
/src/lib/validations.ts
/src/middleware.ts
/src/types/index.ts
/src/types/reports.ts
