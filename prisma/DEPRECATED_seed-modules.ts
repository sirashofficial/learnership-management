import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modulesData = [
    {
        moduleNumber: 1,
        code: 'MODULE_1',
        name: 'Numeracy',
        fullName: 'Use Basic Mathematics in Order to Fulfil New Venture Functions Effectively',
        purpose: 'Equip learners with the necessary mathematical skills and knowledge to successfully run their own businesses.',
        credits: 16,
        notionalHours: 160,
        classroomHours: 51,
        workplaceHours: 119,
        order: 1,
        unitStandards: [
            { code: '7480', title: 'Demonstrate understanding of rational and irrational numbers and number systems', credits: 2, level: 2, type: 'Fundamental' },
            { code: '9008', title: 'Identify, describe, compare, classify, explore shape and motion in 2-and 3-dimensional shapes in different contexts', credits: 3, level: 2, type: 'Fundamental' },
            { code: '9007', title: 'Work with a range of patterns and functions and solve problems', credits: 5, level: 2, type: 'Fundamental' },
            { code: '7469', title: 'Use mathematics to investigate and monitor the financial aspects of personal and community life', credits: 3, level: 2, type: 'Fundamental' },
            { code: '9009', title: 'Apply basic knowledge of statistics and probability to influence the use of data and procedures in order to investigate life related problems', credits: 3, level: 2, type: 'Fundamental' },
        ]
    },
    {
        moduleNumber: 2,
        code: 'MODULE_2',
        name: 'HIV/AIDS & Communications',
        fullName: 'Demonstrate Knowledge of HIV/AIDS and Apply Basic Communication Skills in a New Venture Context',
        purpose: 'Equip learners with communication skills and HIV/AIDS awareness to successfully interact with employees, clients and suppliers.',
        credits: 24,
        notionalHours: 240,
        classroomHours: 72,
        workplaceHours: 168,
        order: 2,
        unitStandards: [
            { code: '8963', title: 'Access and use information from texts', credits: 5, level: 2, type: 'Fundamental' },
            { code: '8964', title: 'Write for a defined context', credits: 5, level: 2, type: 'Fundamental' },
            { code: '8962', title: 'Maintain and adapt oral communication', credits: 5, level: 2, type: 'Fundamental' },
            { code: '8967', title: 'Use language in occupational learning', credits: 5, level: 2, type: 'Fundamental' },
            { code: '13915', title: 'Demonstrate knowledge and understanding of HIV/AIDS in a workplace and a specific community context', credits: 4, level: 3, type: 'Elective' },
        ]
    },
    {
        moduleNumber: 3,
        code: 'MODULE_3',
        name: 'Market Requirements',
        fullName: 'Determine Market Requirements and Manage the Relevant Marketing and Selling Processes',
        purpose: 'Equip learners with knowledge of the requirements of the market in which they operate and how to benefit from this knowledge in the form of increased sales.',
        credits: 22,
        notionalHours: 220,
        classroomHours: 66,
        workplaceHours: 154,
        order: 3,
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
        fullName: 'Demonstrate an Understanding of the Sector/Industry in Which the Business Operates',
        purpose: 'Provide learners with the knowledge and skills to procure raw material, products, etc. as needed by their business. Learners should be able to successfully tender for business and administer contracts.',
        credits: 26,
        notionalHours: 260,
        classroomHours: 78,
        workplaceHours: 182,
        order: 4,
        unitStandards: [
            { code: '119667', title: 'Identify the composition of a selected new venture\'s industry/sector and its procurement systems', credits: 8, level: 2, type: 'Core' },
            { code: '119712', title: 'Tender for business or work in a selected new venture', credits: 8, level: 3, type: 'Elective' },
            { code: '119671', title: 'Administer contracts for a selected new venture', credits: 10, level: 3, type: 'Elective' },
        ]
    },
    {
        moduleNumber: 5,
        code: 'MODULE_5',
        name: 'Financial Requirements',
        fullName: 'Determine Financial Requirements and Manage Financial Resources of a New Venture',
        purpose: 'Provide learners with knowledge and skills to run the financial side of a business: financial requirements, cash flow needed, pricing and costing of goods and services, keep records of financial transactions and controlling the finances of a business.',
        credits: 26,
        notionalHours: 260,
        classroomHours: 78,
        workplaceHours: 182,
        order: 5,
        unitStandards: [
            { code: '119666', title: 'Determine financial requirements of a new venture', credits: 8, level: 2, type: 'Core' },
            { code: '119670', title: 'Produce a business plan for a new venture', credits: 8, level: 3, type: 'Core' },
            { code: '119674', title: 'Manage finances for a new venture', credits: 10, level: 2, type: 'Core' },
        ]
    },
    {
        moduleNumber: 6,
        code: 'MODULE_6',
        name: 'Business Operations',
        fullName: 'Manage Business Operations',
        purpose: 'Provide learners with knowledge and skills to manage day-to-day business operations effectively.',
        credits: 26,
        notionalHours: 260,
        classroomHours: 78,
        workplaceHours: 182,
        order: 6,
        unitStandards: [
            { code: '119668', title: 'Manage business operations', credits: 8, level: 2, type: 'Core' },
            { code: '13929', title: 'Co-ordinate meetings, minor events and travel arrangements', credits: 3, level: 3, type: 'Elective' },
            { code: '13932', title: 'Prepare and process documents for financial and banking processes', credits: 5, level: 3, type: 'Elective' },
            { code: '13930', title: 'Monitor and control the receiving and satisfaction of visitors', credits: 4, level: 3, type: 'Elective' },
            { code: '114959', title: 'Behave in a professional manner in a business environment', credits: 4, level: 2, type: 'Core' },
            { code: '113924', title: 'Apply basic business ethics in a work environment', credits: 2, level: 2, type: 'Core' },
        ]
    },
];

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    console.log('🗑️  Clearing existing modules and unit standards...');
    await prisma.unitStandard.deleteMany({});
    await prisma.module.deleteMany({});

    // Seed modules and unit standards
    console.log('📚 Seeding modules and unit standards...');

    for (const moduleData of modulesData) {
        const { unitStandards, ...moduleInfo } = moduleData;

        const module = await prisma.module.create({
            data: {
                ...moduleInfo,
                unitStandards: {
                    create: unitStandards
                }
            },
            include: {
                unitStandards: true
            }
        });

        console.log(`✅ Created Module ${module.moduleNumber}: ${module.name} with ${module.unitStandards.length} unit standards`);
    }

    // Summary
    const totalModules = await prisma.module.count();
    const totalUnitStandards = await prisma.unitStandard.count();
    const totalCredits = modulesData.reduce((sum, m) => sum + m.credits, 0);

    console.log('\n📊 Seed Summary:');
    console.log(`   Modules: ${totalModules}`);
    console.log(`   Unit Standards: ${totalUnitStandards}`);
    console.log(`   Total Credits: ${totalCredits}`);
    console.log('\n✨ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
