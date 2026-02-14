
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Groups Query...');
        const groups = await prisma.group.findMany({
            include: {
                students: {
                    select: {
                        id: true,
                        studentId: true,
                        firstName: true,
                        lastName: true,
                        progress: true,
                        status: true,
                    },
                    orderBy: { lastName: 'asc' },
                },
                _count: {
                    select: { students: true, sessions: true },
                },
                rolloutPlan: true,
            },
            orderBy: { name: 'asc' },
        });
        console.log(`Success! Found ${groups.length} groups.`);
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
