-- Performance optimization indexes
-- Created to improve query performance on frequently accessed fields

-- Student indexes
CREATE INDEX IF NOT EXISTS "Student_groupId_idx" ON "Student"("groupId");
CREATE INDEX IF NOT EXISTS "Student_status_idx" ON "Student"("status");
CREATE INDEX IF NOT EXISTS "Student_email_idx" ON "Student"("email");

-- Attendance indexes
CREATE INDEX IF NOT EXISTS "Attendance_studentId_idx" ON "Attendance"("studentId");
CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX IF NOT EXISTS "Attendance_status_idx" ON "Attendance"("status");
CREATE INDEX IF NOT EXISTS "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- Assessment indexes
CREATE INDEX IF NOT EXISTS "Assessment_studentId_idx" ON "Assessment"("studentId");
CREATE INDEX IF NOT EXISTS "Assessment_moduleId_idx" ON "Assessment"("moduleId");
CREATE INDEX IF NOT EXISTS "Assessment_date_idx" ON "Assessment"("date");

-- Lesson indexes
CREATE INDEX IF NOT EXISTS "Lesson_groupId_idx" ON "Lesson"("groupId");
CREATE INDEX IF NOT EXISTS "Lesson_date_idx" ON "Lesson"("date");
CREATE INDEX IF NOT EXISTS "Lesson_startTime_idx" ON "Lesson"("startTime");

-- Module indexes
CREATE INDEX IF NOT EXISTS "Module_courseId_idx" ON "Module"("courseId");

-- POE indexes
CREATE INDEX IF NOT EXISTS "POE_studentId_idx" ON "POE"("studentId");
CREATE INDEX IF NOT EXISTS "POE_status_idx" ON "POE"("status");

-- RecurringSession indexes
CREATE INDEX IF NOT EXISTS "RecurringSession_groupId_idx" ON "RecurringSession"("groupId");
CREATE INDEX IF NOT EXISTS "RecurringSession_dayOfWeek_idx" ON "RecurringSession"("dayOfWeek");
