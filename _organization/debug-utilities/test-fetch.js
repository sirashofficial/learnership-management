const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFetch() {
    console.log('Testing Group fetch...');
    try {
        const groups = await prisma.group.findMany({
            include: {
                _count: {
                    select: { students: true }
                },
                unitStandardRollouts: {
                    include: {
                        unitStandard: {
                            include: {
                                module: true
                            }
                        }
                    }
                },
            }
        });
        console.log('Success! Fetched', groups.length, 'groups.');
        if (groups.length > 0) {
            console.log('First group sample:', groups[0].name);
            console.log('Rollouts count for first group:', groups[0].unitStandardRollouts?.length);
        }
    } catch (error) {
        console.error('FAILED to fetch groups:', error.message);
        if (error.code) console.log('Prisma Error Code:', error.code);
    } finally {
        await prisma.$disconnect();
    }
}

testFetch();
