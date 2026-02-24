-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "result" TEXT,
    "score" INTEGER,
    "assessedDate" DATETIME,
    "dueDate" DATETIME NOT NULL,
    "notes" TEXT,
    "feedback" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "moderatedDate" DATETIME,
    "moderationNotes" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,
    CONSTRAINT "Assessment_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Assessment" ("assessedDate", "attemptNumber", "createdAt", "dueDate", "feedback", "id", "method", "moderatedBy", "moderatedDate", "moderationNotes", "moderationStatus", "notes", "result", "score", "studentId", "type", "unitStandardId", "updatedAt") SELECT "assessedDate", "attemptNumber", "createdAt", "dueDate", "feedback", "id", "method", "moderatedBy", "moderatedDate", "moderationNotes", "moderationStatus", "notes", "result", "score", "studentId", "type", "unitStandardId", "updatedAt" FROM "Assessment";
DROP TABLE "Assessment";
ALTER TABLE "new_Assessment" RENAME TO "Assessment";
CREATE INDEX "Assessment_unitStandardId_idx" ON "Assessment"("unitStandardId");
CREATE INDEX "Assessment_studentId_unitStandardId_idx" ON "Assessment"("studentId", "unitStandardId");
CREATE INDEX "Assessment_studentId_result_idx" ON "Assessment"("studentId", "result");
CREATE TABLE "new_Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "markedBy" TEXT,
    "markedAt" DATETIME,
    "qrCodeScan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "groupId" TEXT,
    CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("createdAt", "date", "groupId", "id", "markedAt", "markedBy", "notes", "qrCodeScan", "sessionId", "status", "studentId", "updatedAt") SELECT "createdAt", "date", "groupId", "id", "markedAt", "markedBy", "notes", "qrCodeScan", "sessionId", "status", "studentId", "updatedAt" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");
CREATE INDEX "Attendance_groupId_date_idx" ON "Attendance"("groupId", "date");
CREATE UNIQUE INDEX "Attendance_studentId_date_groupId_key" ON "Attendance"("studentId", "date", "groupId");
CREATE TABLE "new_AttendanceAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceAlert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceAlert" ("createdAt", "details", "id", "message", "notificationSent", "resolved", "resolvedAt", "resolvedBy", "severity", "studentId", "type", "updatedAt") SELECT "createdAt", "details", "id", "message", "notificationSent", "resolved", "resolvedAt", "resolvedBy", "severity", "studentId", "type", "updatedAt" FROM "AttendanceAlert";
DROP TABLE "AttendanceAlert";
ALTER TABLE "new_AttendanceAlert" RENAME TO "AttendanceAlert";
CREATE INDEX "AttendanceAlert_studentId_idx" ON "AttendanceAlert"("studentId");
CREATE INDEX "AttendanceAlert_type_idx" ON "AttendanceAlert"("type");
CREATE INDEX "AttendanceAlert_resolved_idx" ON "AttendanceAlert"("resolved");
CREATE TABLE "new_CourseProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "CourseProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CourseProgress" ("createdAt", "id", "progress", "studentId", "updatedAt") SELECT "createdAt", "id", "progress", "studentId", "updatedAt" FROM "CourseProgress";
DROP TABLE "CourseProgress";
ALTER TABLE "new_CourseProgress" RENAME TO "CourseProgress";
CREATE TABLE "new_FormativeCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "completedDate" DATETIME,
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "moderatedDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    "formativeId" TEXT NOT NULL,
    CONSTRAINT "FormativeCompletion_formativeId_fkey" FOREIGN KEY ("formativeId") REFERENCES "FormativeAssessment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormativeCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormativeCompletion" ("attempts", "completedDate", "createdAt", "formativeId", "id", "moderatedBy", "moderatedDate", "moderationStatus", "notes", "passed", "score", "studentId", "updatedAt") SELECT "attempts", "completedDate", "createdAt", "formativeId", "id", "moderatedBy", "moderatedDate", "moderationStatus", "notes", "passed", "score", "studentId", "updatedAt" FROM "FormativeCompletion";
DROP TABLE "FormativeCompletion";
ALTER TABLE "new_FormativeCompletion" RENAME TO "FormativeCompletion";
CREATE INDEX "FormativeCompletion_studentId_idx" ON "FormativeCompletion"("studentId");
CREATE INDEX "FormativeCompletion_formativeId_idx" ON "FormativeCompletion"("formativeId");
CREATE UNIQUE INDEX "FormativeCompletion_studentId_formativeId_key" ON "FormativeCompletion"("studentId", "formativeId");
CREATE TABLE "new_ModuleProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "completionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModuleProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ModuleProgress" ("completionDate", "createdAt", "creditsEarned", "id", "moduleId", "progress", "startDate", "status", "studentId", "updatedAt") SELECT "completionDate", "createdAt", "creditsEarned", "id", "moduleId", "progress", "startDate", "status", "studentId", "updatedAt" FROM "ModuleProgress";
DROP TABLE "ModuleProgress";
ALTER TABLE "new_ModuleProgress" RENAME TO "ModuleProgress";
CREATE UNIQUE INDEX "ModuleProgress_studentId_moduleId_key" ON "ModuleProgress"("studentId", "moduleId");
CREATE TABLE "new_POEChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module1POE" BOOLEAN NOT NULL DEFAULT false,
    "module1POEDate" DATETIME,
    "module2POE" BOOLEAN NOT NULL DEFAULT false,
    "module2POEDate" DATETIME,
    "module3POE" BOOLEAN NOT NULL DEFAULT false,
    "module3POEDate" DATETIME,
    "module4POE" BOOLEAN NOT NULL DEFAULT false,
    "module4POEDate" DATETIME,
    "module5POE" BOOLEAN NOT NULL DEFAULT false,
    "module5POEDate" DATETIME,
    "module6POE" BOOLEAN NOT NULL DEFAULT false,
    "module6POEDate" DATETIME,
    "assessmentsSigned" BOOLEAN NOT NULL DEFAULT false,
    "assessmentsDate" DATETIME,
    "logbookComplete" BOOLEAN NOT NULL DEFAULT false,
    "logbookSigned" BOOLEAN NOT NULL DEFAULT false,
    "logbookDate" DATETIME,
    "idCopyPresent" BOOLEAN NOT NULL DEFAULT false,
    "idCopyDate" DATETIME,
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "contractDate" DATETIME,
    "inductionComplete" BOOLEAN NOT NULL DEFAULT false,
    "inductionDate" DATETIME,
    "verifiedBy" TEXT,
    "verifiedDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "POEChecklist_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_POEChecklist" ("assessmentsDate", "assessmentsSigned", "contractDate", "contractSigned", "createdAt", "id", "idCopyDate", "idCopyPresent", "inductionComplete", "inductionDate", "logbookComplete", "logbookDate", "logbookSigned", "module1POE", "module1POEDate", "module2POE", "module2POEDate", "module3POE", "module3POEDate", "module4POE", "module4POEDate", "module5POE", "module5POEDate", "module6POE", "module6POEDate", "notes", "studentId", "updatedAt", "verifiedBy", "verifiedDate") SELECT "assessmentsDate", "assessmentsSigned", "contractDate", "contractSigned", "createdAt", "id", "idCopyDate", "idCopyPresent", "inductionComplete", "inductionDate", "logbookComplete", "logbookDate", "logbookSigned", "module1POE", "module1POEDate", "module2POE", "module2POEDate", "module3POE", "module3POEDate", "module4POE", "module4POEDate", "module5POE", "module5POEDate", "module6POE", "module6POEDate", "notes", "studentId", "updatedAt", "verifiedBy", "verifiedDate" FROM "POEChecklist";
DROP TABLE "POEChecklist";
ALTER TABLE "new_POEChecklist" RENAME TO "POEChecklist";
CREATE UNIQUE INDEX "POEChecklist_studentId_key" ON "POEChecklist"("studentId");
CREATE TABLE "new_UnitStandardProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" DATETIME,
    "completionDate" DATETIME,
    "formativesPassed" INTEGER NOT NULL DEFAULT 0,
    "summativePassed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,
    CONSTRAINT "UnitStandardProgress_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UnitStandardProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UnitStandardProgress" ("completionDate", "createdAt", "formativesPassed", "id", "startDate", "status", "studentId", "summativePassed", "unitStandardId", "updatedAt") SELECT "completionDate", "createdAt", "formativesPassed", "id", "startDate", "status", "studentId", "summativePassed", "unitStandardId", "updatedAt" FROM "UnitStandardProgress";
DROP TABLE "UnitStandardProgress";
ALTER TABLE "new_UnitStandardProgress" RENAME TO "UnitStandardProgress";
CREATE UNIQUE INDEX "UnitStandardProgress_studentId_unitStandardId_key" ON "UnitStandardProgress"("studentId", "unitStandardId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
