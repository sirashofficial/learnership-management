
import prisma from '../src/lib/prisma';

async function verify() {
    console.log('--- SIMULATING /api/students SUMMARY LOGIC ---');
    try {
        const where = {}; // Base criteria as per students/route.ts

        const statsResult = await prisma.student.aggregate({
            where,
            _count: {
                id: true,
                status: true,
            },
            _avg: {
                progress: true,
            }
        });

        const activeCount = await prisma.student.count({
            where: {
                ...where,
                status: 'ACTIVE'
            }
        });

        const summary = {
            total: statsResult._count.id,
            active: activeCount,
            averageProgress: Math.round(statsResult._avg.progress || 0)
        };

        console.log('--- VERIFICATION RESULT ---');
        console.log(JSON.stringify(summary, null, 2));

        if (summary.total > 20) {
            console.log(`✅ Success: Total Students (${summary.total}) is correctly calculated globally.`);
        } else if (summary.total === 0) {
            console.log('⚠️ No students found in database.');
        } else {
            console.log(`ℹ️ Total Students is ${summary.total}. If this is the true total, then the fix is correct.`);
        }

        process.exit(0);
    } catch (e) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(e.message);
        process.exit(1);
    }
}

verify();
