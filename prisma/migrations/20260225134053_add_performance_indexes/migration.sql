-- CreateIndex
CREATE INDEX "Assessment_studentId_unitStandardId_result_idx" ON "Assessment"("studentId", "unitStandardId", "result");

-- CreateIndex
CREATE INDEX "Assessment_result_assessedDate_idx" ON "Assessment"("result", "assessedDate");

-- CreateIndex
CREATE INDEX "Attendance_studentId_status_date_idx" ON "Attendance"("studentId", "status", "date");

-- CreateIndex
CREATE INDEX "UnitStandard_moduleId_credits_idx" ON "UnitStandard"("moduleId", "credits");
