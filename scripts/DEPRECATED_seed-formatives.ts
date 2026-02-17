import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Formative Assessments seed...');

    const formatives = [
        // Module 1 - Numeracy
        { code: '7469', title: 'Use mathematics to investigate and monitor financial aspects', description: 'Numeracy Formative Assessment', documentPath: '7469 formative.pdf', moduleCode: 'NVC-M1', unitStandardCode: '7469', questions: 10, passingScore: 50 },
        { code: '7480', title: 'Demonstrate understanding of rational and irrational numbers', description: 'Numeracy Formative Assessment', documentPath: '7480 formative.pdf', moduleCode: 'NVC-M1', unitStandardCode: '7480', questions: 12, passingScore: 50 },
        { code: '9007', title: 'Work with a range of patterns and functions', description: 'Numeracy Formative Assessment', documentPath: '9007 formative.pdf', moduleCode: 'NVC-M1', unitStandardCode: '9007', questions: 8, passingScore: 50 },
        { code: '9008', title: 'Identify, describe, compare, classify shapes', description: 'Numeracy Formative Assessment', documentPath: '9008 formative.pdf', moduleCode: 'NVC-M1', unitStandardCode: '9008', questions: 15, passingScore: 50 },
        { code: '9009', title: 'Apply basic knowledge of statistics and probability', description: 'Numeracy Formative Assessment', documentPath: '9009 Formative.pdf', moduleCode: 'NVC-M1', unitStandardCode: '9009', questions: 10, passingScore: 50 },

        // Module 3 - Market Requirements
        { code: '114974', title: 'Apply the basic skills of customer service', description: 'Market Requirements Formative Assessment', documentPath: '114974 formative.pdf', moduleCode: 'NVC-M3', unitStandardCode: '114974', questions: 8, passingScore: 50 },
        { code: '119669', title: 'Match new venture opportunity to market needs', description: 'Market Requirements Formative Assessment', documentPath: '119669 formative.pdf', moduleCode: 'NVC-M3', unitStandardCode: '119669', questions: 10, passingScore: 50 },
        { code: '119672', title: 'Manage marketing and selling processes', description: 'Market Requirements Formative Assessment', documentPath: '119672 formative.docx', moduleCode: 'NVC-M3', unitStandardCode: '119672', questions: 14, passingScore: 50 },
        { code: '119673', title: 'Identify and demonstrate entrepreneurial ideas', description: 'Market Requirements Formative Assessment', documentPath: '119673 formative.pdf', moduleCode: 'NVC-M3', unitStandardCode: '119673', questions: 12, passingScore: 50 },
    ];

    for (const formative of formatives) {
        const module = await prisma.module.findUnique({
            where: { code: formative.moduleCode },
        });

        const unitStandard = await prisma.unitStandard.findUnique({
            where: { code: formative.unitStandardCode },
        });

        if (!module || !unitStandard) {
            console.warn(`⚠️ Skipping ${formative.code}: Module or Unit Standard not found.`);
            continue;
        }

        try {
            await prisma.formativeAssessment.upsert({
                where: { code: formative.code },
                update: {
                    title: formative.title,
                    description: formative.description,
                    documentPath: formative.documentPath,
                    questions: formative.questions,
                    passingScore: formative.passingScore,
                    moduleId: module.id,
                    unitStandardId: unitStandard.id,
                },
                create: {
                    code: formative.code,
                    title: formative.title,
                    description: formative.description,
                    documentPath: formative.documentPath,
                    questions: formative.questions,
                    passingScore: formative.passingScore,
                    moduleId: module.id,
                    unitStandardId: unitStandard.id,
                },
            });
            console.log(`✅ Upserted formative: ${formative.code}`);
        } catch (error) {
            console.error(`❌ Error upserting ${formative.code}:`, error);
        }
    }

    console.log('🏁 Formative Assessments seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
