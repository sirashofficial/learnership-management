/*
  Warnings:

  - You are about to drop the `TimetableSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TimetableSession";
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE INDEX "Assessment_result_idx" ON "Assessment"("result");

-- CreateIndex
CREATE INDEX "Assessment_moderationStatus_idx" ON "Assessment"("moderationStatus");

-- CreateIndex
CREATE INDEX "Assessment_dueDate_idx" ON "Assessment"("dueDate");

-- CreateIndex
CREATE INDEX "Group_status_idx" ON "Group"("status");

-- CreateIndex
CREATE INDEX "Group_name_idx" ON "Group"("name");

-- CreateIndex
CREATE INDEX "Group_startDate_endDate_idx" ON "Group"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Session_groupId_idx" ON "Session"("groupId");

-- CreateIndex
CREATE INDEX "Session_date_idx" ON "Session"("date");

-- CreateIndex
CREATE INDEX "Session_groupId_date_idx" ON "Session"("groupId", "date");

-- CreateIndex
CREATE INDEX "Student_groupId_idx" ON "Student"("groupId");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "Student_facilitatorId_idx" ON "Student"("facilitatorId");

-- CreateIndex
CREATE INDEX "Student_groupId_status_idx" ON "Student"("groupId", "status");
