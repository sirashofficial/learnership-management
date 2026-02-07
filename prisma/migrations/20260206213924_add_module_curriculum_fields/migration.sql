/*
  Warnings:

  - Added the required column `classroomHours` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moduleNumber` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notionalHours` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workplaceHours` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `UnitStandard` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("createdAt", "date", "groupId", "id", "markedAt", "markedBy", "notes", "qrCodeScan", "sessionId", "status", "studentId", "updatedAt") SELECT "createdAt", "date", "groupId", "id", "markedAt", "markedBy", "notes", "qrCodeScan", "sessionId", "status", "studentId", "updatedAt" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");
CREATE INDEX "Attendance_groupId_date_idx" ON "Attendance"("groupId", "date");
CREATE UNIQUE INDEX "Attendance_studentId_date_groupId_key" ON "Attendance"("studentId", "date", "groupId");
CREATE TABLE "new_Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Module" ("code", "createdAt", "credits", "description", "id", "name", "order", "status", "updatedAt") SELECT "code", "createdAt", "credits", "description", "id", "name", "order", "status", "updatedAt" FROM "Module";
DROP TABLE "Module";
ALTER TABLE "new_Module" RENAME TO "Module";
CREATE UNIQUE INDEX "Module_moduleNumber_key" ON "Module"("moduleNumber");
CREATE UNIQUE INDEX "Module_code_key" ON "Module"("code");
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
    CONSTRAINT "ModuleProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ModuleProgress" ("completionDate", "createdAt", "id", "moduleId", "progress", "startDate", "status", "studentId", "updatedAt") SELECT "completionDate", "createdAt", "id", "moduleId", "progress", "startDate", "status", "studentId", "updatedAt" FROM "ModuleProgress";
DROP TABLE "ModuleProgress";
ALTER TABLE "new_ModuleProgress" RENAME TO "ModuleProgress";
CREATE UNIQUE INDEX "ModuleProgress_studentId_moduleId_key" ON "ModuleProgress"("studentId", "moduleId");
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "idNumber" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsEarned" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "groupId" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "currentModuleId" TEXT,
    CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_currentModuleId_fkey" FOREIGN KEY ("currentModuleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("createdAt", "email", "facilitatorId", "firstName", "groupId", "id", "idNumber", "lastName", "phone", "progress", "status", "studentId", "updatedAt") SELECT "createdAt", "email", "facilitatorId", "firstName", "groupId", "id", "idNumber", "lastName", "phone", "progress", "status", "studentId", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");
CREATE TABLE "new_UnitStandard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "moduleId" TEXT NOT NULL,
    CONSTRAINT "UnitStandard_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UnitStandard" ("code", "content", "createdAt", "credits", "id", "level", "moduleId", "title", "updatedAt") SELECT "code", "content", "createdAt", "credits", "id", "level", "moduleId", "title", "updatedAt" FROM "UnitStandard";
DROP TABLE "UnitStandard";
ALTER TABLE "new_UnitStandard" RENAME TO "UnitStandard";
CREATE UNIQUE INDEX "UnitStandard_code_key" ON "UnitStandard"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
