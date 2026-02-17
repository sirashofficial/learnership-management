#!/usr/bin/env node
// De-duplicate students by normalized full name (keep oldest created).

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeName(firstName, lastName) {
  const first = String(firstName || '').trim().toLowerCase();
  const last = String(lastName || '').trim().toLowerCase();
  const name = `${first} ${last}`.trim();
  return name || null;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      studentId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const byName = new Map();
  const noName = [];

  for (const student of students) {
    const key = normalizeName(student.firstName, student.lastName);
    if (!key) {
      noName.push(student);
      continue;
    }

    if (!byName.has(key)) {
      byName.set(key, []);
    }
    byName.get(key).push(student);
  }

  const toDelete = [];
  const toKeep = [];

  for (const [key, list] of byName.entries()) {
    if (!Array.isArray(list) || list.length === 0) continue;
    // Oldest is first because we ordered by createdAt asc.
    const [keep, ...rest] = list;
    toKeep.push(keep);
    for (const dup of rest) {
      toDelete.push(dup);
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  const deleteIds = toDelete.map((s) => s.id);
  const chunks = chunkArray(deleteIds, 200);

  console.log(`Total students: ${students.length}`);
  console.log(`Unique names: ${byName.size}`);
  console.log(`Duplicates to delete: ${deleteIds.length}`);

  for (const ids of chunks) {
    await prisma.formativeCompletion.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.attendance.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.attendanceAlert.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.assessment.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.courseProgress.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.moduleProgress.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.unitStandardProgress.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.pOEChecklist.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.student.deleteMany({ where: { id: { in: ids } } });
  }

  const remaining = await prisma.student.count();
  console.log(`Remaining students: ${remaining}`);
}

main()
  .catch((err) => {
    console.error('Deduplication failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
