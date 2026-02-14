
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    const today = new Date(); // 2026-02-10 based on metadata
    // Or hardcode to be sure: new Date('2026-02-10T12:00:00')

    console.log(`Checking sessions for: ${today.toISOString()}`);

    const start = startOfDay(today);
    const end = endOfDay(today);

    const sessions = await prisma.session.findMany({
        where: {
            date: {
                gte: start,
                lte: end
            }
        },
        include: {
            group: true
        }
    });

    console.log(`Found ${sessions.length} sessions for today.`);
    sessions.forEach(s => {
        console.log(`- ${s.group.name}: ${s.title} (${s.startTime}-${s.endTime})`);
    });

    if (sessions.length === 0) {
        // Check finding ANY future session to see where they are
        const nextSession = await prisma.session.findFirst({
            where: {
                date: { gt: end }
            },
            orderBy: { date: 'asc' },
            include: { group: true }
        });

        if (nextSession) {
            console.log(`Next scheduled session is on: ${nextSession.date.toISOString()} for ${nextSession.group.name}`);
        } else {
            console.log("No future sessions found.");
        }
    }
}

main().finally(() => prisma.$disconnect());
