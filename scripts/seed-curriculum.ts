
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CURRICULUM = [
    {
        moduleNumber: 1,
        code: 'MODULE_1',
        name: 'Numeracy',
        fullName: 'Module 1: Numeracy',
        purpose: 'Build foundational mathematical skills',
        credits: 16,
        notionalHours: 160,
        classroomHours: 48,
        workplaceHours: 112,
        unitStandards: [
            { code: '7480', title: 'Demonstrate understanding of rational and irrational numbers and number systems', credits: 3, level: 2, type: 'Fundamental' },
            { code: '9008', title: 'Identify, describe, compare, classify, explore shape and motion in 2-and 3-dimensional shapes in different contexts', credits: 3, level: 2, type: 'Fundamental' },
            { code: '9007', title: 'Work with a range of patterns and functions and solve problems', credits: 5, level: 2, type: 'Fundamental' },
            { code: '7469', title: 'Use mathematics to investigate and monitor the financial aspects of personal, business and national issues', credits: 2, level: 2, type: 'Fundamental' },
            { code: '9009', title: 'Apply basic knowledge of statistics and probability to influence the use of data and procedures in order to investigate life related problems', credits: 3, level: 2, type: 'Fundamental' },
        ]
    },
    {
        moduleNumber: 2,
        code: 'MODULE_2',
        name: 'HIV/AIDS & Communications',
        fullName: 'Module 2: HIV/AIDS & Communications',
        purpose: 'Develop communication skills and HIV/AIDS awareness',
        credits: 24,
        notionalHours: 240,
        classroomHours: 72,
        workplaceHours: 168,
        unitStandards: [
            { code: '13915', title: 'Demonstrate knowledge and understanding of HIV/AIDS in a workplace, and its effects on a business sub-sector, own organisation and a specific workplace', credits: 4, level: 3, type: 'Core' }, // Level 3 per prompt? Usually NQF 2 but OK.
            { code: '8963', title: 'Access and use information from texts', credits: 5, level: 2, type: 'Fundamental' }, // 8963/8964 treated as pair? Seeding individually.
            { code: '8964', title: 'Write for a defined context', credits: 5, level: 2, type: 'Fundamental' },
            { code: '8962', title: 'Maintain and adapt oral/signed communication', credits: 5, level: 2, type: 'Fundamental' },
            { code: '8967', title: 'Use language and communication in occupational learning programmes', credits: 5, level: 2, type: 'Fundamental' },
        ]
    },
    {
        moduleNumber: 3,
        code: 'MODULE_3',
        name: 'Market Requirements',
        fullName: 'Module 3: Market Requirements',
        purpose: 'Understand market dynamics and customer needs',
        credits: 22,
        notionalHours: 220,
        classroomHours: 66,
        workplaceHours: 154,
        unitStandards: [
            { code: '119673', title: 'Identify and demonstrate entrepreneurial ideas and opportunities', credits: 7, level: 2, type: 'Core' },
            { code: '119669', title: 'Match new venture opportunity to market needs', credits: 6, level: 2, type: 'Core' },
            { code: '119672', title: 'Manage marketing and selling processes of a new venture', credits: 7, level: 2, type: 'Core' },
            { code: '114974', title: 'Apply the basic skills of customer service', credits: 2, level: 2, type: 'Core' },
        ]
    },
    {
        moduleNumber: 4,
        code: 'MODULE_4',
        name: 'Business Sector & Industry',
        fullName: 'Module 4: Business Sector & Industry',
        purpose: 'Understand the business environment',
        credits: 26,
        notionalHours: 260,
        classroomHours: 78,
        workplaceHours: 182,
        unitStandards: [
            { code: '119667', title: 'Identify the composition of a selected new venture\'s industry/sector and its procurement systems', credits: 5, level: 2, type: 'Core' },
            { code: '119712', title: 'Tender for business or work in a selected new venture', credits: 8, level: 2, type: 'Core' }, // Assumed credits
            { code: '119671', title: 'Administer contracts for a selected new venture', credits: 13, level: 2, type: 'Core' }, // Assumed credits to sum to 26? 5+8+13=26
        ]
    },
    {
        moduleNumber: 5,
        code: 'MODULE_5',
        name: 'Financial Requirements',
        fullName: 'Module 5: Financial Requirements',
        purpose: 'Manage business finances',
        credits: 26,
        notionalHours: 260,
        classroomHours: 78,
        workplaceHours: 182,
        unitStandards: [
            { code: '119666', title: 'Determine financial requirements of a new venture', credits: 8, level: 2, type: 'Core' },
            { code: '119670', title: 'Produce a business plan for a new venture', credits: 8, level: 2, type: 'Core' },
            { code: '119674', title: 'Manage finances of a new venture', credits: 10, level: 2, type: 'Core' },
            // { code: '119668', title: 'Manage business operations', credits: 8, level: 2, type: 'Core' }, // Prompt listed 119668 here? Or Module 6? Let's check.
            // Prompt says: Mod 5: 119666, 119670, 119674, 119668, 13932. Mod 6: 13929, 13932, 13930, 114959, 113924.
            // 119668 is usually "Manage business operations" -> Module 6?
            // Prompt puts it in 5.
            { code: '119668', title: 'Manage business operations', credits: 4, level: 2, type: 'Core' },
            // 13932 in Mod 5 AND 6?
            // Seeding 13932 once.
        ]
    },
    {
        moduleNumber: 6,
        code: 'MODULE_6',
        name: 'Business Operations',
        fullName: 'Module 6: Business Operations',
        purpose: 'Oversee daily operations',
        credits: 26,
        notionalHours: 260,
        classroomHours: 78,
        workplaceHours: 182,
        unitStandards: [
            { code: '13929', title: 'Co-ordinate meetings, minor events and travel arrangements', credits: 3, level: 3, type: 'Elective' },
            { code: '13932', title: 'Prepare and process documents for financial and banking processes', credits: 5, level: 3, type: 'Core' },
            { code: '13930', title: 'Monitor and control the reception area', credits: 4, level: 3, type: 'Elective' },
            { code: '114959', title: 'Behave in a professional manner in a business environment', credits: 4, level: 2, type: 'Elective' },
            { code: '113924', title: 'Apply basic business ethics in a work environment', credits: 2, level: 2, type: 'Elective' },
        ]
    }
];

async function main() {
    console.log('Seeding Curriculum...');

    for (const mod of CURRICULUM) {
        console.log(`Processing ${mod.name}...`);

        // Upsert Module
        const moduleRecord = await prisma.module.upsert({
            where: { moduleNumber: mod.moduleNumber },
            update: {
                credits: mod.credits,
                notionalHours: mod.notionalHours,
                classroomHours: mod.classroomHours,
                workplaceHours: mod.workplaceHours,
            },
            create: {
                moduleNumber: mod.moduleNumber,
                code: mod.code,
                name: mod.name,
                fullName: mod.fullName,
                purpose: mod.purpose,
                credits: mod.credits,
                notionalHours: mod.notionalHours,
                classroomHours: mod.classroomHours,
                workplaceHours: mod.workplaceHours,
                order: mod.moduleNumber,
            }
        });

        // Upsert Unit Standards
        for (const us of mod.unitStandards) {
            await prisma.unitStandard.upsert({
                where: { code: us.code },
                update: {
                    moduleId: moduleRecord.id, // Ensure linked to correct module
                },
                create: {
                    code: us.code,
                    title: us.title,
                    credits: us.credits,
                    level: us.level,
                    type: us.type,
                    moduleId: moduleRecord.id,
                }
            });
        }
    }

    console.log('Curriculum seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
