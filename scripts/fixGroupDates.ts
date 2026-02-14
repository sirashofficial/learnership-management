import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parsePlanDate(dateStr: string): Date | null {
  // Try DD/MM/YYYY format first
  const dmy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Try "DD Month YYYY" format (e.g., "01 September 2025")
  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const dmy2 = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (dmy2) {
    const [, day, month, year] = dmy2;
    const monthNum = months[month.toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(Number(year), monthNum, Number(day));
    }
  }

  return null;
}

async function fixGroupDates() {
  console.log('🔍 Checking group start dates against rollout plan dates...\n');

  const groups = await prisma.group.findMany({
    select: { id: true, name: true, startDate: true, notes: true },
  });

  let updated = 0;
  let mismatched = [];

  for (const group of groups) {
    if (!group.notes) continue;

    try {
      const parsed = JSON.parse(group.notes);
      const planStartDate = parsed?.rolloutPlan?.startDate;

      if (!planStartDate) continue;

      // Parse plan date with flexible format support
      const planDate = parsePlanDate(planStartDate);
      if (!planDate) {
        console.warn(`⚠️  Could not parse date for ${group.name}: ${planStartDate}`);
        continue;
      }

      const planDateStr = planDate.toISOString().split('T')[0];

      // Get group's current start date in YYYY-MM-DD format
      const groupDateStr = new Date(group.startDate).toISOString().split('T')[0];

      if (groupDateStr !== planDateStr) {
        mismatched.push({
          name: group.name,
          currentDate: groupDateStr,
          planDate: planDateStr,
        });

        // Update the group's startDate to match the plan
        await prisma.group.update({
          where: { id: group.id },
          data: { startDate: planDate },
        });
        updated++;

        console.log(`✅ Updated ${group.name}`);
        console.log(`   Current: ${groupDateStr} → Plan: ${planDateStr}`);
      }
    } catch (e: any) {
      console.error(`❌ Error processing ${group.name}:`, e.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated} groups`);
  console.log(`   📋 Mismatches found: ${mismatched.length}`);

  if (mismatched.length > 0) {
    console.log(`\n   Details:`);
    mismatched.forEach((m) => {
      console.log(`   - ${m.name}: ${m.currentDate} → ${m.planDate}`);
    });
  }

  process.exit(0);
}

fixGroupDates().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
