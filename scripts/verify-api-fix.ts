
import prisma from '../src/lib/prisma';

async function verify() {
    console.log('--- STARTING VERIFICATION ---');
    try {
        const student = await prisma.student.findFirst({
            include: {
                group: {
                    include: { Company: true }
                }
            }
        });

        if (!student) {
            console.log('No students found to verify.');
            process.exit(0);
        }

        console.log('Student:', student.firstName, student.lastName);
        console.log('Group:', student.group?.name);
        console.log('Company:', (student.group as any)?.Company?.name || 'No Company');

        if (student.group && (student.group as any).Company) {
            console.log('✅ Relation "Company" successfully fetched.');
        } else {
            console.log('⚠️ Relation "Company" is null or missing for this student.');
        }

        // Also check groups API logic
        const groups = await prisma.group.findMany({
            take: 1,
            include: { Company: true }
        });
        console.log('Groups Fix Verification:', groups[0]?.Company ? '✅ Success' : '⚠️ No Company for first group');

        console.log('--- VERIFICATION COMPLETE ---');
        process.exit(0);
    } catch (e) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(e.message);
        process.exit(1);
    }
}

verify();
