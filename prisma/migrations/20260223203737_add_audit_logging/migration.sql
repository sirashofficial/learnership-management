/*
  Warnings:

  - You are about to drop the column `attemptNumber` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Assessment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "FacilitatorTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacilitatorTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "changeDescription" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymizedAt" DATETIME
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "retentionDaysActive" INTEGER NOT NULL DEFAULT 365,
    "retentionDaysArchive" INTEGER NOT NULL DEFAULT 2555,
    "archiveLocation" TEXT,
    "anonymizeAfterDays" INTEGER NOT NULL DEFAULT 1095,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastProcessedAt" DATETIME,
    "nextScheduledRun" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnonymizedAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "timestamp" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archiveLocation" TEXT,
    "retentionExpiry" DATETIME NOT NULL
);

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
    "deletedAt" DATETIME,
    "studentId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,
    CONSTRAINT "Assessment_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Assessment" ("assessedDate", "dueDate", "feedback", "id", "method", "moderatedBy", "moderatedDate", "moderationNotes", "moderationStatus", "notes", "result", "score", "studentId", "type", "unitStandardId") SELECT "assessedDate", "dueDate", "feedback", "id", "method", "moderatedBy", "moderatedDate", "moderationNotes", "moderationStatus", "notes", "result", "score", "studentId", "type", "unitStandardId" FROM "Assessment";
DROP TABLE "Assessment";
ALTER TABLE "new_Assessment" RENAME TO "Assessment";
CREATE INDEX "Assessment_unitStandardId_idx" ON "Assessment"("unitStandardId");
CREATE INDEX "Assessment_studentId_unitStandardId_idx" ON "Assessment"("studentId", "unitStandardId");
CREATE INDEX "Assessment_studentId_result_idx" ON "Assessment"("studentId", "result");
CREATE INDEX "Assessment_deletedAt_idx" ON "Assessment"("deletedAt");
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "coordinator" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "companyId" TEXT,
    "currentFacilitatedModuleId" TEXT,
    CONSTRAINT "Group_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Group_currentFacilitatedModuleId_fkey" FOREIGN KEY ("currentFacilitatedModuleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("address", "companyId", "contactName", "contactPhone", "coordinator", "createdAt", "endDate", "id", "location", "name", "notes", "startDate", "status", "updatedAt") SELECT "address", "companyId", "contactName", "contactPhone", "coordinator", "createdAt", "endDate", "id", "location", "name", "notes", "startDate", "status", "updatedAt" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE INDEX "Group_deletedAt_idx" ON "Group"("deletedAt");
CREATE TABLE "new_UnitStandardRollout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "unitStandardId" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "summativeDate" DATETIME,
    "assessingDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "actualSummativeDate" DATETIME,
    "actualAssessmentDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "completedPercent" INTEGER NOT NULL DEFAULT 0,
    "facilitated" BOOLEAN NOT NULL DEFAULT false,
    "facilitatedAt" DATETIME,
    "facilitatorNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UnitStandardRollout_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UnitStandardRollout_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UnitStandardRollout" ("actualAssessmentDate", "actualEndDate", "actualStartDate", "actualSummativeDate", "assessingDate", "completedPercent", "createdAt", "endDate", "groupId", "id", "startDate", "status", "summativeDate", "unitStandardId", "updatedAt") SELECT "actualAssessmentDate", "actualEndDate", "actualStartDate", "actualSummativeDate", "assessingDate", "completedPercent", "createdAt", "endDate", "groupId", "id", "startDate", "status", "summativeDate", "unitStandardId", "updatedAt" FROM "UnitStandardRollout";
DROP TABLE "UnitStandardRollout";
ALTER TABLE "new_UnitStandardRollout" RENAME TO "UnitStandardRollout";
CREATE UNIQUE INDEX "UnitStandardRollout_groupId_unitStandardId_key" ON "UnitStandardRollout"("groupId", "unitStandardId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FacilitatorTask_groupId_idx" ON "FacilitatorTask"("groupId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_anonymizedAt_idx" ON "AuditLog"("anonymizedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionPolicy_entityType_key" ON "DataRetentionPolicy"("entityType");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_entityType_idx" ON "DataRetentionPolicy"("entityType");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_isActive_idx" ON "DataRetentionPolicy"("isActive");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_nextScheduledRun_idx" ON "DataRetentionPolicy"("nextScheduledRun");

-- CreateIndex
CREATE INDEX "AnonymizedAuditLog_originalId_idx" ON "AnonymizedAuditLog"("originalId");

-- CreateIndex
CREATE INDEX "AnonymizedAuditLog_entityType_idx" ON "AnonymizedAuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AnonymizedAuditLog_timestamp_idx" ON "AnonymizedAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AnonymizedAuditLog_retentionExpiry_idx" ON "AnonymizedAuditLog"("retentionExpiry");

-- CreateIndex
CREATE INDEX "Student_deletedAt_idx" ON "Student"("deletedAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
