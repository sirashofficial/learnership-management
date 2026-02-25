-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FACILITATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "coordinator" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "currentFacilitatedModuleId" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRolloutPlan" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "module1StartDate" TIMESTAMP(3),
    "module1EndDate" TIMESTAMP(3),
    "module2StartDate" TIMESTAMP(3),
    "module2EndDate" TIMESTAMP(3),
    "module3StartDate" TIMESTAMP(3),
    "module3EndDate" TIMESTAMP(3),
    "module4StartDate" TIMESTAMP(3),
    "module4EndDate" TIMESTAMP(3),
    "module5StartDate" TIMESTAMP(3),
    "module5EndDate" TIMESTAMP(3),
    "module6StartDate" TIMESTAMP(3),
    "module6EndDate" TIMESTAMP(3),
    "rolloutDocPath" TEXT,

    CONSTRAINT "GroupRolloutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolloutPlan" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "projectedStartDate" TIMESTAMP(3) NOT NULL,
    "projectedEndDate" TIMESTAMP(3) NOT NULL,
    "projectedSummativeDate" TIMESTAMP(3),
    "projectedAssessmentDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "actualSummativeDate" TIMESTAMP(3),
    "actualAssessmentDate" TIMESTAMP(3),
    "credits" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolloutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UndoHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityIds" TEXT NOT NULL,
    "previousState" TEXT NOT NULL,
    "newState" TEXT NOT NULL,
    "description" TEXT,
    "canUndo" BOOLEAN NOT NULL DEFAULT true,
    "undoneAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UndoHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilitatorTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilitatorTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitStandardRollout" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "summativeDate" TIMESTAMP(3),
    "assessingDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "actualSummativeDate" TIMESTAMP(3),
    "actualAssessmentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "completedPercent" INTEGER NOT NULL DEFAULT 0,
    "facilitated" BOOLEAN NOT NULL DEFAULT false,
    "facilitatedAt" TIMESTAMP(3),
    "facilitatorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitStandardRollout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "idNumber" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsEarned" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "groupId" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "currentModuleId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormativeAssessment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentPath" TEXT,
    "questions" INTEGER,
    "passingScore" INTEGER NOT NULL DEFAULT 50,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,

    CONSTRAINT "FormativeAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormativeCompletion" (
    "id" TEXT NOT NULL,
    "completedDate" TIMESTAMP(3),
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "moderatedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "formativeId" TEXT NOT NULL,

    CONSTRAINT "FormativeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "markedBy" TEXT,
    "markedAt" TIMESTAMP(3),
    "qrCodeScan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "groupId" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendancePolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minimumPercentage" INTEGER NOT NULL DEFAULT 80,
    "consecutiveAbsences" INTEGER NOT NULL DEFAULT 3,
    "warningThreshold" INTEGER NOT NULL DEFAULT 75,
    "criticalThreshold" INTEGER NOT NULL DEFAULT 60,
    "notifyOnAbsence" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnWarning" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCritical" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "format" TEXT NOT NULL,
    "filePath" TEXT,
    "generatedBy" TEXT NOT NULL,
    "parameters" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "result" TEXT,
    "score" INTEGER,
    "assessedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "feedback" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "moderatedDate" TIMESTAMP(3),
    "moderationNotes" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleProgress" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "ModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitStandardProgress" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "formativesPassed" INTEGER NOT NULL DEFAULT 0,
    "summativePassed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,

    CONSTRAINT "UnitStandardProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POEChecklist" (
    "id" TEXT NOT NULL,
    "module1POE" BOOLEAN NOT NULL DEFAULT false,
    "module1POEDate" TIMESTAMP(3),
    "module2POE" BOOLEAN NOT NULL DEFAULT false,
    "module2POEDate" TIMESTAMP(3),
    "module3POE" BOOLEAN NOT NULL DEFAULT false,
    "module3POEDate" TIMESTAMP(3),
    "module4POE" BOOLEAN NOT NULL DEFAULT false,
    "module4POEDate" TIMESTAMP(3),
    "module5POE" BOOLEAN NOT NULL DEFAULT false,
    "module5POEDate" TIMESTAMP(3),
    "module6POE" BOOLEAN NOT NULL DEFAULT false,
    "module6POEDate" TIMESTAMP(3),
    "assessmentsSigned" BOOLEAN NOT NULL DEFAULT false,
    "assessmentsDate" TIMESTAMP(3),
    "logbookComplete" BOOLEAN NOT NULL DEFAULT false,
    "logbookSigned" BOOLEAN NOT NULL DEFAULT false,
    "logbookDate" TIMESTAMP(3),
    "idCopyPresent" BOOLEAN NOT NULL DEFAULT false,
    "idCopyDate" TIMESTAMP(3),
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "contractDate" TIMESTAMP(3),
    "inductionComplete" BOOLEAN NOT NULL DEFAULT false,
    "inductionDate" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "POEChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POEFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POEFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL,
    "notionalHours" INTEGER NOT NULL,
    "classroomHours" INTEGER NOT NULL,
    "workplaceHours" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumEmbedding" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "CurriculumEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitStandard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "UnitStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "resources" TEXT,
    "assessmentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unitStandardId" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT,
    "objectives" TEXT,
    "materials" TEXT,
    "activities" TEXT,
    "notes" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "groupId" TEXT,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "CurriculumDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupCourse" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringSessionOverride" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "groupName" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "notes" TEXT,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notificationTime" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringSessionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schedule" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSchedule" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "GroupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "groupId" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "venue" TEXT,
    "objectives" TEXT,
    "materials" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "message" TEXT,
    "venue" TEXT,
    "sendTo" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "browserNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "industry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupStats" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "totalCreditsEarned" INTEGER NOT NULL DEFAULT 0,
    "avgProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "atRiskCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSummary" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE INDEX "Group_isDeleted_idx" ON "Group"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "GroupRolloutPlan_groupId_key" ON "GroupRolloutPlan"("groupId");

-- CreateIndex
CREATE INDEX "RolloutPlan_groupId_idx" ON "RolloutPlan"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "RolloutPlan_groupId_moduleId_key" ON "RolloutPlan"("groupId", "moduleId");

-- CreateIndex
CREATE INDEX "UndoHistory_userId_idx" ON "UndoHistory"("userId");

-- CreateIndex
CREATE INDEX "UndoHistory_expiresAt_idx" ON "UndoHistory"("expiresAt");

-- CreateIndex
CREATE INDEX "UndoHistory_canUndo_idx" ON "UndoHistory"("canUndo");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "FacilitatorTask_groupId_idx" ON "FacilitatorTask"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitStandardRollout_groupId_unitStandardId_key" ON "UnitStandardRollout"("groupId", "unitStandardId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_groupId_idx" ON "Student"("groupId");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "Student_progress_idx" ON "Student"("progress");

-- CreateIndex
CREATE INDEX "Student_facilitatorId_idx" ON "Student"("facilitatorId");

-- CreateIndex
CREATE INDEX "Student_groupId_status_progress_idx" ON "Student"("groupId", "status", "progress");

-- CreateIndex
CREATE INDEX "Student_isDeleted_idx" ON "Student"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "FormativeAssessment_code_key" ON "FormativeAssessment"("code");

-- CreateIndex
CREATE INDEX "FormativeCompletion_studentId_idx" ON "FormativeCompletion"("studentId");

-- CreateIndex
CREATE INDEX "FormativeCompletion_formativeId_idx" ON "FormativeCompletion"("formativeId");

-- CreateIndex
CREATE UNIQUE INDEX "FormativeCompletion_studentId_formativeId_key" ON "FormativeCompletion"("studentId", "formativeId");

-- CreateIndex
CREATE INDEX "Session_groupId_idx" ON "Session"("groupId");

-- CreateIndex
CREATE INDEX "Session_facilitatorId_idx" ON "Session"("facilitatorId");

-- CreateIndex
CREATE INDEX "Session_date_idx" ON "Session"("date");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE INDEX "Attendance_groupId_date_idx" ON "Attendance"("groupId", "date");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_idx" ON "Attendance"("sessionId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_groupId_status_idx" ON "Attendance"("groupId", "status");

-- CreateIndex
CREATE INDEX "Attendance_isDeleted_idx" ON "Attendance"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_groupId_key" ON "Attendance"("studentId", "date", "groupId");

-- CreateIndex
CREATE INDEX "AttendanceAlert_studentId_idx" ON "AttendanceAlert"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceAlert_type_idx" ON "AttendanceAlert"("type");

-- CreateIndex
CREATE INDEX "AttendanceAlert_resolved_idx" ON "AttendanceAlert"("resolved");

-- CreateIndex
CREATE INDEX "Assessment_studentId_idx" ON "Assessment"("studentId");

-- CreateIndex
CREATE INDEX "Assessment_createdAt_idx" ON "Assessment"("createdAt");

-- CreateIndex
CREATE INDEX "Assessment_studentId_createdAt_idx" ON "Assessment"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Assessment_unitStandardId_idx" ON "Assessment"("unitStandardId");

-- CreateIndex
CREATE INDEX "Assessment_studentId_unitStandardId_idx" ON "Assessment"("studentId", "unitStandardId");

-- CreateIndex
CREATE INDEX "Assessment_result_idx" ON "Assessment"("result");

-- CreateIndex
CREATE INDEX "Assessment_studentId_result_idx" ON "Assessment"("studentId", "result");

-- CreateIndex
CREATE INDEX "Assessment_isDeleted_idx" ON "Assessment"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleProgress_studentId_moduleId_key" ON "ModuleProgress"("studentId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitStandardProgress_studentId_unitStandardId_key" ON "UnitStandardProgress"("studentId", "unitStandardId");

-- CreateIndex
CREATE UNIQUE INDEX "POEChecklist_studentId_key" ON "POEChecklist"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_moduleNumber_key" ON "Module"("moduleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Module_code_key" ON "Module"("code");

-- CreateIndex
CREATE INDEX "DocumentChunk_category_idx" ON "DocumentChunk"("category");

-- CreateIndex
CREATE INDEX "DocumentChunk_filename_idx" ON "DocumentChunk"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "UnitStandard_code_key" ON "UnitStandard"("code");

-- CreateIndex
CREATE INDEX "UnitStandard_moduleId_idx" ON "UnitStandard"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSessionOverride_date_groupName_venue_key" ON "RecurringSessionOverride"("date", "groupName", "venue");

-- CreateIndex
CREATE INDEX "GroupSchedule_groupId_idx" ON "GroupSchedule"("groupId");

-- CreateIndex
CREATE INDEX "GroupSchedule_templateId_idx" ON "GroupSchedule"("templateId");

-- CreateIndex
CREATE INDEX "Plan_groupId_idx" ON "Plan"("groupId");

-- CreateIndex
CREATE INDEX "Plan_facilitatorId_idx" ON "Plan"("facilitatorId");

-- CreateIndex
CREATE INDEX "Reminder_planId_idx" ON "Reminder"("planId");

-- CreateIndex
CREATE INDEX "Reminder_scheduledAt_idx" ON "Reminder"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderPreference_userId_key" ON "ReminderPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupStats_groupId_key" ON "GroupStats"("groupId");

-- CreateIndex
CREATE INDEX "GroupStats_groupId_idx" ON "GroupStats"("groupId");

-- CreateIndex
CREATE INDEX "GroupStats_lastCalculatedAt_idx" ON "GroupStats"("lastCalculatedAt");

-- CreateIndex
CREATE INDEX "DashboardSummary_metricType_timestamp_idx" ON "DashboardSummary"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "DashboardSummary_timestamp_idx" ON "DashboardSummary"("timestamp");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_currentFacilitatedModuleId_fkey" FOREIGN KEY ("currentFacilitatedModuleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRolloutPlan" ADD CONSTRAINT "GroupRolloutPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolloutPlan" ADD CONSTRAINT "RolloutPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolloutPlan" ADD CONSTRAINT "RolloutPlan_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilitatorTask" ADD CONSTRAINT "FacilitatorTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitStandardRollout" ADD CONSTRAINT "UnitStandardRollout_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitStandardRollout" ADD CONSTRAINT "UnitStandardRollout_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentModuleId_fkey" FOREIGN KEY ("currentModuleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormativeAssessment" ADD CONSTRAINT "FormativeAssessment_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormativeAssessment" ADD CONSTRAINT "FormativeAssessment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormativeCompletion" ADD CONSTRAINT "FormativeCompletion_formativeId_fkey" FOREIGN KEY ("formativeId") REFERENCES "FormativeAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormativeCompletion" ADD CONSTRAINT "FormativeCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAlert" ADD CONSTRAINT "AttendanceAlert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleProgress" ADD CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleProgress" ADD CONSTRAINT "ModuleProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitStandardProgress" ADD CONSTRAINT "UnitStandardProgress_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitStandardProgress" ADD CONSTRAINT "UnitStandardProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POEChecklist" ADD CONSTRAINT "POEChecklist_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumEmbedding" ADD CONSTRAINT "CurriculumEmbedding_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitStandard" ADD CONSTRAINT "UnitStandard_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumDocument" ADD CONSTRAINT "CurriculumDocument_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupCourse" ADD CONSTRAINT "GroupCourse_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSchedule" ADD CONSTRAINT "GroupSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSchedule" ADD CONSTRAINT "GroupSchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderPreference" ADD CONSTRAINT "ReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
