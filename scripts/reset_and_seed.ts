
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting Robust Database Reset & Seed...');

    try {
        // 1. Disable Foreign Keys for SQLite
        console.log('🔓 Disabling Foreign Keys...');
        await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

        // 2. Truncate all tables
        console.log('🧹 Cleaning all tables...');
        const tableNames = [
            'User', 'Company', 'Group', 'GroupRolloutPlan', 'UnitStandardRollout', 'Student',
            'FormativeAssessment', 'FormativeCompletion', 'Session', 'Attendance',
            'AttendancePolicy', 'AttendanceAlert', 'AttendanceReport', 'Assessment',
            'ModuleProgress', 'UnitStandardProgress', 'POEChecklist', 'POEFile', 'Module',
            'CurriculumEmbedding', 'DocumentChunk', 'UnitStandard', 'Activity',
            'LessonPlan', 'CurriculumDocument', 'GroupCourse', 'CourseProgress',
            'RecurringSessionOverride', 'ScheduleTemplate', 'GroupSchedule'
        ];

        for (const table of tableNames) {
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
                // Reset sequence if exists (sqlite specific)
                await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='${table}';`);
            } catch (e) {
                // Table might not exist, ignore
            }
        }

        // 3. Re-enable Foreign Keys
        console.log('🔒 Re-enabling Foreign Keys...');
        await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

        // 4. Run the original seed script via CLI
        console.log('🌱 Executing original seed script...');
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

        console.log('✅ Database successfully reset and seeded!');

    } catch (error) {
        console.error('❌ Error during reset/seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
