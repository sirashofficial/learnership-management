-- DropIndex
DROP INDEX "Assessment_dueDate_idx";

-- DropIndex
DROP INDEX "Assessment_moderationStatus_idx";

-- DropIndex
DROP INDEX "Assessment_result_idx";

-- DropIndex
DROP INDEX "Group_startDate_endDate_idx";

-- DropIndex
DROP INDEX "Group_name_idx";

-- DropIndex
DROP INDEX "Group_status_idx";

-- DropIndex
DROP INDEX "Session_groupId_date_idx";

-- DropIndex
DROP INDEX "Session_date_idx";

-- DropIndex
DROP INDEX "Session_groupId_idx";

-- DropIndex
DROP INDEX "Student_groupId_status_idx";

-- DropIndex
DROP INDEX "Student_facilitatorId_idx";

-- DropIndex
DROP INDEX "Student_status_idx";

-- DropIndex
DROP INDEX "Student_groupId_idx";

-- CreateTable
CREATE TABLE "RolloutPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "projectedStartDate" DATETIME NOT NULL,
    "projectedEndDate" DATETIME NOT NULL,
    "projectedSummativeDate" DATETIME,
    "projectedAssessmentDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "actualSummativeDate" DATETIME,
    "actualAssessmentDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RolloutPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolloutPlan_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UndoHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityIds" TEXT NOT NULL,
    "previousState" TEXT NOT NULL,
    "newState" TEXT NOT NULL,
    "description" TEXT,
    "canUndo" BOOLEAN NOT NULL DEFAULT true,
    "undoneAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UnitStandardRollout_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UnitStandardRollout_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UnitStandardRollout" ("assessingDate", "createdAt", "endDate", "groupId", "id", "startDate", "summativeDate", "unitStandardId", "updatedAt") SELECT "assessingDate", "createdAt", "endDate", "groupId", "id", "startDate", "summativeDate", "unitStandardId", "updatedAt" FROM "UnitStandardRollout";
DROP TABLE "UnitStandardRollout";
ALTER TABLE "new_UnitStandardRollout" RENAME TO "UnitStandardRollout";
CREATE UNIQUE INDEX "UnitStandardRollout_groupId_unitStandardId_key" ON "UnitStandardRollout"("groupId", "unitStandardId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
