const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MODULE_INFO = [
  { number: 1, name: 'Numeracy', credits: 16 },
  { number: 2, name: 'HIV/AIDS & Communications', credits: 24 },
  { number: 3, name: 'Market Requirements', credits: 22 },
  { number: 4, name: 'Business Sector & Industry', credits: 26 },
  { number: 5, name: 'Financial Requirements', credits: 26 },
  { number: 6, name: 'Business Operations', credits: 26 },
];

const buildWorkplaceLabel = (startDate: string, endDate: string) => {
  if (!startDate && !endDate) {
    return 'Workplace Activity';
  }
  const start = startDate || 'N/A';
  const end = endDate || 'N/A';
  return `Workplace Activity - (${start} - ${end})`;
};

async function normalizeRolloutPlans() {
  console.log('🔧 Normalizing rollout plan notes...\n');

  const groups = await prisma.group.findMany({
    select: { id: true, name: true, notes: true },
  });

  let updated = 0;

  for (const group of groups) {
    if (!group.notes) {
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(group.notes);
    } catch (error) {
      console.warn(`⚠️  Skipping ${group.name}: notes is not valid JSON`);
      continue;
    }

    if (!parsed.rolloutPlan || !Array.isArray(parsed.rolloutPlan.modules)) {
      continue;
    }

    const plan = parsed.rolloutPlan;
    const modules = plan.modules;

    let changed = false;

    const normalizedModules = modules.map((module: any, index: number) => {
      const normalized = { ...module };

      const moduleNumber = normalized.moduleNumber ?? normalized.moduleIndex ?? index + 1;
      if (normalized.moduleNumber !== moduleNumber) {
        normalized.moduleNumber = moduleNumber;
        changed = true;
      }

      if (!normalized.moduleName) {
        const lookup = MODULE_INFO.find((info) => info.number === moduleNumber);
        normalized.moduleName = lookup ? lookup.name : `Module ${moduleNumber}`;
        changed = true;
      }

      if (!Array.isArray(normalized.unitStandards)) {
        normalized.unitStandards = [];
        changed = true;
      }

      if (!normalized.workplaceActivity) {
        const startDate = normalized.workplaceActivityStartDate || '';
        const endDate = normalized.workplaceActivityEndDate || '';
        if (startDate || endDate) {
          normalized.workplaceActivity = {
            startDate,
            endDate,
            label: buildWorkplaceLabel(startDate, endDate),
          };
          changed = true;
        }
      }

      if (normalized.workplaceActivity && !normalized.workplaceActivity.label) {
        const startDate = normalized.workplaceActivity.startDate || '';
        const endDate = normalized.workplaceActivity.endDate || '';
        normalized.workplaceActivity.label = buildWorkplaceLabel(startDate, endDate);
        changed = true;
      }

      return normalized;
    });

    if (changed) {
      const nextPlan = {
        ...plan,
        groupName: plan.groupName || group.name,
        modules: normalizedModules,
      };

      await prisma.group.update({
        where: { id: group.id },
        data: { notes: JSON.stringify({ ...parsed, rolloutPlan: nextPlan }) },
      });

      updated += 1;
      console.log(`✅ Updated ${group.name}`);
    }
  }

  console.log(`\n📊 Summary: updated ${updated} group(s)`);
}

normalizeRolloutPlans()
  .catch((error) => {
    console.error('Error normalizing rollout plans:', error);
  })
  .finally(() => prisma.$disconnect());
