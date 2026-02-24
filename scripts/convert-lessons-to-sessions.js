#!/usr/bin/env node

/**
 * Batch Convert LessonPlans to Sessions
 * 
 * This script converts existing LessonPlan records to Session records
 * so that attendance can be tracked against them.
 * 
 * Usage:
 *   node scripts/convert-lessons-to-sessions.js          # Preview (dry run)
 *   node scripts/convert-lessons-to-sessions.js --run    # Actually convert
 *   node scripts/convert-lessons-to-sessions.js --force  # Force convert all
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isDryRun = !process.argv.includes('--run') && !process.argv.includes('--force');
const isForce = process.argv.includes('--force');

async function main() {
  console.log('🔄 LessonPlan → Session Converter\n');
  console.log('═'.repeat(60));

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Run with --run to actually create sessions');
  } else if (isForce) {
    console.log('⚡ FORCE MODE - Will attempt to convert all lessons');
  } else {
    console.log('✅ LIVE MODE - Creating sessions now');
  }
  console.log('═'.repeat(60) + '\n');

  // Fetch all lesson plans (without includes to avoid schema issues)
  const lessonPlans = await prisma.lessonPlan.findMany({
    orderBy: { date: 'asc' },
  });

  // Separately fetch needed data
  const modules = await prisma.module.findMany();
  const groups = await prisma.group.findMany();
  const facilitators = await prisma.user.findMany();
  
  // Create lookup maps
  const moduleMap = Object.fromEntries(modules.map(m => [m.id, m]));
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]));
  const facilitatorMap = Object.fromEntries(facilitators.map(f => [f.id, f]));

  console.log(`📚 Found ${lessonPlans.length} LessonPlans in database\n`);

  if (lessonPlans.length === 0) {
    console.log('❌ No lesson plans found to convert');
    return;
  }

  // Check existing sessions
  const existingSessions = await prisma.session.count();
  console.log(`📅 Current Sessions in database: ${existingSessions}\n`);

  const results = {
    total: lessonPlans.length,
    created: 0,
    skipped: 0,
    errors: 0,
    sessions: [],
    errorDetails: [],
  };

  // Process each lesson plan
  for (const lessonPlan of lessonPlans) {
    try {
      // Check if Session already exists (avoid duplicates)
      const existingSession = await prisma.session.findFirst({
        where: {
          groupId: lessonPlan.groupId || undefined,
          facilitatorId: lessonPlan.facilitatorId,
          date: lessonPlan.date,
          startTime: lessonPlan.startTime,
          endTime: lessonPlan.endTime,
        },
      });

      if (existingSession && !isForce) {
        results.skipped++;
        continue;
      }

      if (isDryRun) {
        // Preview mode - just count
        results.created++;
        if (results.created <= 5) {
          // Show first 5 examples
          const group = groupMap[lessonPlan.groupId] || {};
          console.log(`  📝 Would create: ${lessonPlan.title}`);
          console.log(`     Group: ${group.name || 'N/A'} | Date: ${lessonPlan.date.toISOString().split('T')[0]} | ${lessonPlan.startTime}-${lessonPlan.endTime}`);
        }
      } else {
        // Actually create the session
        const module = moduleMap[lessonPlan.moduleId] || {};
        const session = await prisma.session.create({
          data: {
            groupId: lessonPlan.groupId || '',
            facilitatorId: lessonPlan.facilitatorId,
            date: lessonPlan.date,
            startTime: lessonPlan.startTime,
            endTime: lessonPlan.endTime,
            title: lessonPlan.title,
            module: module.name || 'Unknown Module',
            notes: lessonPlan.notes || `Converted from LessonPlan (ID: ${lessonPlan.id})`,
          },
        });

        results.created++;
        results.sessions.push({
          sessionId: session.id,
          lessonPlanId: lessonPlan.id,
          title: session.title,
        });

        // Show progress every 50 records
        if (results.created % 50 === 0) {
          console.log(`  ✅ Created ${results.created} sessions...`);
        }
      }
    } catch (error) {
      results.errors++;
      results.errorDetails.push({
        lessonPlanId: lessonPlan.id,
        title: lessonPlan.title,
        error: error.message,
      });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 CONVERSION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total LessonPlans:  ${results.total}`);
  console.log(`${isDryRun ? 'Would create' : 'Created'}:       ${results.created}`);
  console.log(`Skipped (exists):   ${results.skipped}`);
  console.log(`Errors:             ${results.errors}`);
  console.log('═'.repeat(60) + '\n');

  if (results.errors > 0) {
    console.log('❌ ERRORS:\n');
    results.errorDetails.forEach((err) => {
      console.log(`  • ${err.title} (${err.lessonPlanId})`);
      console.log(`    Error: ${err.error}\n`);
    });
  }

  if (isDryRun) {
    console.log('💡 To actually create these sessions, run:');
    console.log('   node scripts/convert-lessons-to-sessions.js --run\n');
  } else {
    // Verify final counts
    const finalSessionCount = await prisma.session.count();
    console.log(`✅ SUCCESS!`);
    console.log(`   Total Sessions now in database: ${finalSessionCount}`);
    console.log(`   New sessions created: ${results.created}\n`);
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
