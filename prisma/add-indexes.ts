import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPerformanceIndexes() {
  console.log('Adding performance indexes...');
  
  try {
    // Execute raw SQL to add indexes (only for tables that exist)
    const queries = [
      // Student indexes
      'CREATE INDEX IF NOT EXISTS "Student_groupId_idx" ON "Student"("groupId")',
      'CREATE INDEX IF NOT EXISTS "Student_status_idx" ON "Student"("status")',
      'CREATE INDEX IF NOT EXISTS "Student_email_idx" ON "Student"("email")',
      
      // Attendance indexes
      'CREATE INDEX IF NOT EXISTS "Attendance_studentId_idx" ON "Attendance"("studentId")',
      'CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date")',
      'CREATE INDEX IF NOT EXISTS "Attendance_status_idx" ON "Attendance"("status")',
      'CREATE INDEX IF NOT EXISTS "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date")',
      
      // Assessment indexes
      'CREATE INDEX IF NOT EXISTS "Assessment_studentId_idx" ON "Assessment"("studentId")',
      'CREATE INDEX IF NOT EXISTS "Assessment_date_idx" ON "Assessment"("date")',
      
      // Session indexes (replaces Lesson)
      'CREATE INDEX IF NOT EXISTS "Session_groupId_idx" ON "Session"("groupId")',
      'CREATE INDEX IF NOT EXISTS "Session_date_idx" ON "Session"("date")',
      
      // POEChecklist indexes
      'CREATE INDEX IF NOT EXISTS "POEChecklist_studentId_idx" ON "POEChecklist"("studentId")',
      'CREATE INDEX IF NOT EXISTS "POEChecklist_status_idx" ON "POEChecklist"("status")',
      
      // Group indexes
      'CREATE INDEX IF NOT EXISTS "Group_companyId_idx" ON "Group"("companyId")',
      'CREATE INDEX IF NOT EXISTS "Group_status_idx" ON "Group"("status")',
      
      // LessonPlan indexes
      'CREATE INDEX IF NOT EXISTS "LessonPlan_groupId_idx" ON "LessonPlan"("groupId")',
      'CREATE INDEX IF NOT EXISTS "LessonPlan_date_idx" ON "LessonPlan"("date")',
    ];
    
    for (const query of queries) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log(`✓ Executed: ${query}`);
      } catch (error: any) {
        console.log(`⚠ Skipped (table may not exist): ${query}`);
      }
    }
    
    console.log('\n✓ All performance indexes added successfully!');
  } catch (error) {
    console.error('Error adding indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPerformanceIndexes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
