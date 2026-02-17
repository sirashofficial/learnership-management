
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES_DATA = [
    {
        moduleNumber: 1,
        name: 'Numeracy',
        code: 'MODULE_1',
        credits: 16,
        unitStandards: [
            { code: '7480', title: 'Demonstrate understanding of rational and irrational numbers', credits: 2, level: 2 },
            { code: '9008', title: 'Identify, describe, compare, classify, explore shape and motion in 2-and 3-dimensional shapes in different contexts', credits: 3, level: 2 },
            { code: '9007', title: 'Work with a range of patterns and functions and solve problems', credits: 5, level: 2 },
            { code: '7469', title: 'Use mathematics to investigate and monitor the financial aspects of personal, business and national issues', credits: 3, level: 2 },
            { code: '9009', title: 'Apply basic knowledge of statistics and probability to influence the use of data and procedures in order to investigate life related problems', credits: 3, level: 2 },
        ]
    },
    {
        moduleNumber: 2,
        name: 'HIV/AIDS & Communications',
        code: 'MODULE_2',
        credits: 24,
        unitStandards: [
            { code: '13915', title: 'Demonstrate knowledge and understanding of HIV/AIDS in a workplace, and its effects on a business sub-sector, own organisation and a specific workplace', credits: 4, level: 2 },
            { code: '8963', title: 'Access and use information from texts', credits: 5, level: 2 }, // Assuming 8963/8964 are alternatives or separate, listing both if valid, or just one. Prompt says 8963/8964. I will add 8963.
            { code: '8964', title: 'Write for a defined context', credits: 5, level: 2 },
            { code: '8962', title: 'Maintain and adapt oral communication', credits: 5, level: 2 },
            { code: '8967', title: 'Use language and communication in occupational learning programmes', credits: 5, level: 2 },
        ]
    },
    {
        moduleNumber: 3,
        name: 'Market Requirements',
        code: 'MODULE_3',
        credits: 22,
        unitStandards: [
            { code: '119673', title: 'Identify and demonstrate entrepreneurial ideas and opportunities', credits: 7, level: 2 },
            { code: '119669', title: 'Match new venture opportunity to market needs', credits: 6, level: 2 },
            { code: '119672', title: 'Manage marketing and selling processes of a new venture', credits: 7, level: 2 },
            { code: '114974', title: 'Apply the basic skills of customer service', credits: 2, level: 2 },
        ]
    },
    {
        moduleNumber: 4,
        name: 'Business Sector & Industry',
        code: 'MODULE_4',
        credits: 26,
        unitStandards: [
            { code: '119667', title: 'Identify the composition of a selected new venture\'s industry/sector and its role in the economy', credits: 8, level: 2 },
            { code: '119712', title: 'Tender for business or work in a selected new venture', credits: 8, level: 2 },
            { code: '119671', title: 'Administer contracts for a selected new venture', credits: 10, level: 2 },
        ]
    },
    {
        moduleNumber: 5,
        name: 'Financial Requirements',
        code: 'MODULE_5',
        credits: 26,
        unitStandards: [
            { code: '119666', title: 'Determine financial requirements of a new venture', credits: 8, level: 2 },
            { code: '119670', title: 'Produce a business plan for a new venture', credits: 8, level: 2 },
            { code: '119674', title: 'Manage finances of a new venture', credits: 10, level: 2 },
        ]
    },
    {
        moduleNumber: 6,
        name: 'Business Operations',
        code: 'MODULE_6',
        credits: 26,
        unitStandards: [
            { code: '119668', title: 'Manage business operations', credits: 8, level: 2 },
            { code: '13929', title: 'Co-ordinate meetings', credits: 3, level: 2 },
            { code: '13932', title: 'Prepare and process documents for financial and banking processes', credits: 5, level: 2 },
            { code: '13930', title: 'Monitor and control the reception area', credits: 4, level: 2 },
            { code: '114959', title: 'Behave in a professional manner in a business environment', credits: 4, level: 2 },
            { code: '113924', title: 'Apply basic business ethics in a work environment', credits: 2, level: 2 },
        ]
    }
];

// Helper to fill in placeholders or correct data would be good, but for now we seed what we have.
// I will ensure unique IDs.

async function main() {
    console.log('Seeding Curriculum...');

    for (const mod of MODULES_DATA) {
        const moduleRecord = await prisma.module.upsert({
            where: { code: mod.code },
            update: {
                name: mod.name,
                credits: mod.credits,
            },
            create: {
                moduleNumber: mod.moduleNumber,
                code: mod.code,
                name: mod.name,
                fullName: `Module ${mod.moduleNumber}: ${mod.name}`,
                purpose: mod.name,
                credits: mod.credits,
                notionalHours: mod.credits * 10,
                classroomHours: Math.round(mod.credits * 10 * 0.3),
                workplaceHours: Math.round(mod.credits * 10 * 0.7),
                order: mod.moduleNumber,
                status: 'ACTIVE',
            }
        });
        console.log(`Module ensured: ${moduleRecord.code}`);

        for (const us of mod.unitStandards) {
            await prisma.unitStandard.upsert({
                where: { code: us.code },
                update: {
                    moduleId: moduleRecord.id // Ensure link is correct
                },
                create: {
                    code: us.code,
                    title: us.title || `Unit Standard ${us.code}`,
                    credits: us.credits,
                    level: us.level,
                    type: 'Core', // Default
                    moduleId: moduleRecord.id,
                }
            });
        }
        console.log(`Seeded ${mod.unitStandards.length} unit standards for ${mod.code}`);
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
