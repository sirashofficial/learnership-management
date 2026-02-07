/**
 * Data Migration Script: Link Existing Assessments to Unit Standards
 * 
 * This script migrates existing assessments that have unitStandard as a string
 * to properly link them to UnitStandard records via unitStandardId.
 * 
 * Run this BEFORE running the Prisma migration.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateAssessments() {
    console.log('🔄 Starting assessment migration...\n');

    try {
        // Get all assessments
        const assessments = await prisma.assessment.findMany({
            select: {
                id: true,
                unitStandard: true,
                module: true,
                unitStandardId: true,
            }
        });

        console.log(`📊 Found ${assessments.length} assessments to migrate\n`);

        // Get all unit standards for lookup
        const unitStandards = await prisma.unitStandard.findMany({
            select: {
                id: true,
                code: true,
                title: true,
            }
        });

        console.log(`📚 Found ${unitStandards.length} unit standards for matching\n`);

        let migrated = 0;
        let alreadyLinked = 0;
        let notFound = 0;
        const unmatchedAssessments = [];

        for (const assessment of assessments) {
            // Skip if already has unitStandardId
            if (assessment.unitStandardId) {
                alreadyLinked++;
                continue;
            }

            // Try to find matching unit standard by code
            const unitStandardCode = assessment.unitStandard?.trim();

            if (!unitStandardCode) {
                console.log(`⚠️  Assessment ${assessment.id} has no unitStandard value`);
                unmatchedAssessments.push({
                    id: assessment.id,
                    reason: 'No unitStandard value'
                });
                notFound++;
                continue;
            }

            const matchingUnitStandard = unitStandards.find(
                us => us.code === unitStandardCode
            );

            if (matchingUnitStandard) {
                // Update assessment with unitStandardId
                await prisma.assessment.update({
                    where: { id: assessment.id },
                    data: { unitStandardId: matchingUnitStandard.id }
                });

                migrated++;
                console.log(`✅ Linked assessment ${assessment.id} to unit standard ${unitStandardCode} (${matchingUnitStandard.title})`);
            } else {
                console.log(`❌ No unit standard found for code: ${unitStandardCode}`);
                unmatchedAssessments.push({
                    id: assessment.id,
                    unitStandard: unitStandardCode,
                    reason: 'No matching unit standard'
                });
                notFound++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   Total Assessments: ${assessments.length}`);
        console.log(`   ✅ Successfully Migrated: ${migrated}`);
        console.log(`   ℹ️  Already Linked: ${alreadyLinked}`);
        console.log(`   ❌ Not Found: ${notFound}`);

        if (unmatchedAssessments.length > 0) {
            console.log('\n⚠️  Unmatched Assessments:');
            unmatchedAssessments.forEach(a => {
                console.log(`   - ${a.id}: ${a.reason}${a.unitStandard ? ` (${a.unitStandard})` : ''}`);
            });
            console.log('\n⚠️  These assessments will need manual review!');
            console.log('   You may need to:');
            console.log('   1. Create the missing unit standards');
            console.log('   2. Manually link these assessments');
            console.log('   3. Or delete these assessments if they are invalid\n');
        }

        if (notFound > 0) {
            console.log('\n❌ Migration completed with errors.');
            console.log('   Please resolve unmatched assessments before running Prisma migration.');
            console.log('   The migration will fail if assessments have no unitStandardId.\n');
            return false;
        } else {
            console.log('\n✅ Migration completed successfully!');
            console.log('   You can now run: npx prisma migrate dev --name link_assessments_to_unit_standards\n');
            return true;
        }

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateAssessments()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
