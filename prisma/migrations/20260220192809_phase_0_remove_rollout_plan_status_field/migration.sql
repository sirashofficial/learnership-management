/*
  Warnings:

  - You are about to drop the column `status` on the `RolloutPlan` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RolloutPlan" (
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
    "credits" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RolloutPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolloutPlan_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RolloutPlan" ("actualAssessmentDate", "actualEndDate", "actualStartDate", "actualSummativeDate", "createdAt", "credits", "groupId", "id", "moduleId", "moduleNumber", "notes", "projectedAssessmentDate", "projectedEndDate", "projectedStartDate", "projectedSummativeDate", "updatedAt") SELECT "actualAssessmentDate", "actualEndDate", "actualStartDate", "actualSummativeDate", "createdAt", "credits", "groupId", "id", "moduleId", "moduleNumber", "notes", "projectedAssessmentDate", "projectedEndDate", "projectedStartDate", "projectedSummativeDate", "updatedAt" FROM "RolloutPlan";
DROP TABLE "RolloutPlan";
ALTER TABLE "new_RolloutPlan" RENAME TO "RolloutPlan";
CREATE INDEX "RolloutPlan_groupId_idx" ON "RolloutPlan"("groupId");
CREATE UNIQUE INDEX "RolloutPlan_groupId_moduleId_key" ON "RolloutPlan"("groupId", "moduleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
