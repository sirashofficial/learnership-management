
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const groups = await prisma.group.findMany({
        include: {
            _count: {
                select: { sessions: true }
            }
        }
    });

    console.log('Session Counts per Group:');
    groups.forEach(g => {
        console.log(`- ${g.name}: ${g._count.sessions} sessions`);
    });
}

main().finally(() => prisma.$disconnect());
