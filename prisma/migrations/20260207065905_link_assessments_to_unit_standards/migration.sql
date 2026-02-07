/*
  Warnings:

  - You are about to drop the column `module` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `unitStandard` on the `Assessment` table. All the data in the column will be lost.
  - Made the column `unitStandardId` on table `Assessment` required. This step will fail if there are existing NULL values in that column.

*/
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
    CONSTRAINT "Assessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assessment_unitStandardId_fkey" FOREIGN KEY ("unitStandardId") REFERENCES "UnitStandard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assessment" ("assessedDate", "attemptNumber", "createdAt", "dueDate", "feedback", "id", "method", "moderatedBy", "moderatedDate", "moderationNotes", "moderationStatus", "notes", "result", "score", "studentId", "type", "unitStandardId", "updatedAt") SELECT "assessedDate", "attemptNumber", "createdAt", "dueDate", "feedback", "id", "method", "moderatedBy", "moderatedDate", "moderationNotes", "moderationStatus", "notes", "result", "score", "studentId", "type", "unitStandardId", "updatedAt" FROM "Assessment";
DROP TABLE "Assessment";
ALTER TABLE "new_Assessment" RENAME TO "Assessment";
CREATE INDEX "Assessment_unitStandardId_idx" ON "Assessment"("unitStandardId");
CREATE INDEX "Assessment_studentId_unitStandardId_idx" ON "Assessment"("studentId", "unitStandardId");
CREATE INDEX "Assessment_studentId_result_idx" ON "Assessment"("studentId", "result");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
