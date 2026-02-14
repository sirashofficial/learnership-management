
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Students Query...');
        const students = await prisma.student.findMany({
            include: {
                group: true,
                facilitator: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        console.log(`Success! Found ${students.length} students.`);
        if (students.length > 0) {
            console.log('Sample student:', JSON.stringify({
                id: students[0].id,
                name: `${students[0].firstName} ${students[0].lastName}`,
                group: students[0].group?.name
            }, null, 2));
        }
    } catch (e) {
        console.error('FAILED QUERY:');
        console.error(e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
