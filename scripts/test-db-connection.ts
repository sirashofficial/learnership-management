
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Database Connection...');
    console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL is not defined in process.env');
    }

    try {
        const groupCount = await prisma.group.count();
        console.log(`Connection successful! Found ${groupCount} groups.`);
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
