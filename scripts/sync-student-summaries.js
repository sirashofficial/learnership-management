const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncStudentSummaries() {
  console.log('🔄 Starting student summary sync...\n');

  try {
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`📊 Found ${students.length} students to process\n`);

    let updatedCount = 0;
    let discrepanciesFound = 0;
    const discrepancies = [];

    for (const student of students) {
      // Get all assessments for this student
      const assessments = await prisma.assessment.findMany({
        where: { studentId: student.id },
        select: {
          id: true,
          result: true,
          unitStandardId: true,
          type: true,
        },
      });

      // Calculate progress: count of competent assessments / total assessments * 100
      const totalAssessments = assessments.length;
      const competentAssessments = assessments.filter((a) => a.result === 'COMPETENT').length;
      const calculatedProgress = totalAssessments > 0 ? Math.round((competentAssessments / totalAssessments) * 100) : 0;

      // Calculate total credits from competent summative/integrated assessments
      let calculatedCredits = 0;
      const competentUnitStandardIds = new Set();

      assessments.forEach((a) => {
        if (a.result === 'COMPETENT' && (a.type === 'SUMMATIVE' || a.type === 'INTEGRATED')) {
          competentUnitStandardIds.add(a.unitStandardId);
        }
      });

      // Get credits for each competent unit standard
      if (competentUnitStandardIds.size > 0) {
        const unitStandards = await prisma.unitStandard.findMany({
          where: { id: { in: Array.from(competentUnitStandardIds) } },
          select: { credits: true },
        });
        calculatedCredits = unitStandards.reduce((sum, us) => sum + us.credits, 0);
      }

      // Get current student record
      const currentStudent = await prisma.student.findUnique({
        where: { id: student.id },
        select: { progress: true, totalCreditsEarned: true },
      });

      // Check for discrepancies
      let hasDiscrepancy = false;
      if (currentStudent.progress !== calculatedProgress) {
        hasDiscrepancy = true;
        discrepanciesFound++;
        discrepancies.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          field: 'progress',
          current: currentStudent.progress,
          calculated: calculatedProgress,
        });
      }

      if (currentStudent.totalCreditsEarned !== calculatedCredits) {
        hasDiscrepancy = true;
        if (!discrepancies.find((d) => d.studentId === student.studentId && d.field === 'totalCreditsEarned')) {
          discrepanciesFound++;
        }
        discrepancies.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          field: 'totalCreditsEarned',
          current: currentStudent.totalCreditsEarned,
          calculated: calculatedCredits,
        });
      }

      // Update if discrepancies found
      if (hasDiscrepancy) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            progress: calculatedProgress,
            totalCreditsEarned: calculatedCredits,
          },
        });
        updatedCount++;
      }
    }

    console.log(`✅ Sync complete!\n`);
    console.log(`📈 Stats:`);
    console.log(`  - Total students: ${students.length}`);
    console.log(`  - Updated: ${updatedCount}`);
    console.log(`  - Discrepancies found: ${discrepanciesFound}`);

    if (discrepancies.length > 0) {
      console.log(`\n⚠️  Discrepancies detected:\n`);
      const grouped = discrepancies.reduce((acc, d) => {
        const key = d.studentId;
        if (!acc[key]) acc[key] = [];
        acc[key].push(d);
        return acc;
      }, {});

      for (const [studentId, items] of Object.entries(grouped)) {
        const student = items[0];
        console.log(`${student.name} (${studentId}):`);
        items.forEach((item) => {
          console.log(`  - ${item.field}: ${item.current} → ${item.calculated}`);
        });
      }
    } else {
      console.log(`\n✨ No discrepancies found!`);
    }

  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncStudentSummaries();
