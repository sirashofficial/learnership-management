const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function cleanupOldData() {
  try {
    console.log('🧹 Starting cleanup of old groups and students...\n');
    
    // Define groups to keep (2026 groups only)
    const groupsToKeep = [
      'AZELIS SA 2026',
      'BEYOND INSIGHTS 2026',
      'CITY LOGISTICS 2026',
      'MONTEAGLE 2026'
    ];
    
    // Get all groups NOT in the keep list
    const groupsToDelete = await db.group.findMany({
      where: {
        NOT: {
          name: { in: groupsToKeep }
        }
      },
      include: {
        students: true
      }
    });
    
    console.log(`📊 Found ${groupsToDelete.length} groups to delete\n`);
    
    let totalStudentsDeleted = 0;
    let totalSessionsDeleted = 0;
    let totalAssessmentsDeleted = 0;
    let totalAttendanceDeleted = 0;
    let totalProgressDeleted = 0;
    
    for (const group of groupsToDelete) {
      console.log(`🗑️  Processing group: ${group.name}`);
      
      try {
        // Get all students in this group
        const students = await db.student.findMany({
          where: { groupId: group.id }
        });
        
        // Delete student-related data
        for (const student of students) {
          // Delete assessments
          const assessDeleted = await db.assessment.deleteMany({ where: { studentId: student.id } });
          totalAssessmentsDeleted += assessDeleted.count;
          
          // Delete attendance records
          const attnDeleted = await db.attendance.deleteMany({ where: { studentId: student.id } });
          totalAttendanceDeleted += attnDeleted.count;
          
          // Delete formative completions
          const formDeleted = await db.formativeCompletion.deleteMany({ where: { studentId: student.id } });
          totalProgressDeleted += formDeleted.count;
          
          // Delete progress records
          const modProgDeleted = await db.moduleProgress.deleteMany({ where: { studentId: student.id } });
          totalProgressDeleted += modProgDeleted.count;
          
          const unitProgDeleted = await db.unitStandardProgress.deleteMany({ where: { studentId: student.id } });
          totalProgressDeleted += unitProgDeleted.count;
          
          // Delete course progress
          const courseProgDeleted = await db.courseProgress.deleteMany({ where: { studentId: student.id } });
          totalProgressDeleted += courseProgDeleted.count;
          
          // Delete POE checklist
          const poeDeleted = await db.pOEChecklist.deleteMany({ where: { studentId: student.id } });
          totalProgressDeleted += poeDeleted.count;
        }
        
        // Delete all students in the group
        const studentsDeleted = await db.student.deleteMany({ where: { groupId: group.id } });
        totalStudentsDeleted += studentsDeleted.count;
        
        // Delete sessions and attendance for the group
        const sessionsDeleted = await db.session.deleteMany({ where: { groupId: group.id } });
        totalSessionsDeleted += sessionsDeleted.count;
        
        const groupAttnDeleted = await db.attendance.deleteMany({ where: { groupId: group.id } });
        totalAttendanceDeleted += groupAttnDeleted.count;
        
        // Delete group-related data
        const rolloutDeleted = await db.groupRolloutPlan.deleteMany({ where: { groupId: group.id } });
        const unitRolloutDeleted = await db.unitStandardRollout.deleteMany({ where: { groupId: group.id } });
        const lessonPlanDeleted = await db.lessonPlan.deleteMany({ where: { groupId: group.id } });
        const groupCourseDeleted = await db.groupCourse.deleteMany({ where: { groupId: group.id } });
        const groupScheduleDeleted = await db.groupSchedule.deleteMany({ where: { groupId: group.id } });
        
        // Finally, delete the group
        await db.group.delete({ where: { id: group.id } });
        
        console.log(`   ✅ Deleted: ${students.length} students, ${sessionsDeleted.count} sessions`);
        console.log(`      - Assessments: ${assessDeleted.count}, Attendance: ${attnDeleted.count}, Progress: ${modProgDeleted.count + unitProgDeleted.count}\n`);
      } catch (error) {
        console.error(`   ❌ Error deleting group ${group.name}:`, error.message);
      }
    }
    
    // Get remaining data
    const remainingGroups = await db.group.findMany();
    const remainingStudents = await db.student.findMany();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Deleted:
  • ${groupsToDelete.length} groups
  • ${totalStudentsDeleted} students
  • ${totalAssessmentsDeleted} assessments
  • ${totalSessionsDeleted} sessions
  • ${totalAttendanceDeleted} attendance records
  • ${totalProgressDeleted} progress records
  
📊 Remaining: 
  • ${remainingGroups.length} groups
  • ${remainingStudents.length} students`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Critical error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

cleanupOldData();
