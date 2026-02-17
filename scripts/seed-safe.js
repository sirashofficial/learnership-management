#!/usr/bin/env node
/**
 * SAFE SEEDING SCRIPT
 * - Backs up DB first
 * - Dedupes students by studentId
 * - Upserts curriculum by code
 * - Single source of truth for rollouts
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function normalizeStudentId(value) {
  return String(value || '').trim();
}

function normalizeName(firstName, lastName) {
  const first = String(firstName || '').trim().toLowerCase();
  const last = String(lastName || '').trim().toLowerCase();
  const fullName = `${first} ${last}`.trim();
  return fullName || null;
}

function deriveYearFromGroupName(groupName) {
  const match = String(groupName || '').match(/(20\d{2})/);
  if (match) return Number(match[1]);
  return new Date().getFullYear();
}

function addMonths(date, months) {
  const result = new Date(date.getTime());
  const targetMonth = result.getMonth() + months;
  const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const day = result.getDate();
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  result.setFullYear(targetYear, normalizedMonth, Math.min(day, lastDay));
  return result;
}

function parsePlanDate(value) {
  if (!value) return null;
  const [day, month, year] = String(value).split('/').map((part) => Number(part));
  if (!day || !month || !year) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupsDir = path.join(__dirname, '..', 'backups');
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  const backupPath = path.join(backupsDir, `dev-${timestamp}.db`);

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir);
  }

  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);
}

async function preFlightCheck() {
  const studentCount = await prisma.student.count();
  const unitCount = await prisma.unitStandard.count();
  const assessmentCount = await prisma.assessment.count();
  const students = await prisma.student.findMany({
    select: { id: true, studentId: true, firstName: true, lastName: true },
  });

  const studentIdMap = new Map();
  const nameMap = new Map();

  for (const student of students) {
    const studentIdKey = normalizeStudentId(student.studentId);
    if (studentIdKey) {
      if (!studentIdMap.has(studentIdKey)) studentIdMap.set(studentIdKey, []);
      studentIdMap.get(studentIdKey).push(student.id);
    }

    const nameKey = normalizeName(student.firstName, student.lastName);
    if (nameKey) {
      if (!nameMap.has(nameKey)) nameMap.set(nameKey, []);
      nameMap.get(nameKey).push(student.id);
    }
  }

  const duplicateStudentIds = Array.from(studentIdMap.entries()).filter(([, ids]) => ids.length > 1);
  const duplicateNames = Array.from(nameMap.entries()).filter(([, ids]) => ids.length > 1);

  console.log('\n📊 CURRENT STATE:');
  console.log(`   Students: ${studentCount}`);
  console.log(`   Unit Standards: ${unitCount}`);
  console.log(`   Assessments: ${assessmentCount}`);
  console.log(`   Duplicate studentId groups: ${duplicateStudentIds.length}`);
  console.log(`   Duplicate name groups: ${duplicateNames.length}\n`);

  return { studentCount, unitCount, assessmentCount };
}

async function seedStudents(studentsData) {
  console.log('👥 Seeding students (deduped by studentId/name)...');

  const existingStudents = await prisma.student.findMany({
    select: { id: true, studentId: true, firstName: true, lastName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const existingByName = new Map();

  for (const student of existingStudents) {
    const key = normalizeName(student.firstName, student.lastName);
    if (!key) continue;
    if (!existingByName.has(key)) {
      existingByName.set(key, student);
    }
  }

  for (const student of studentsData) {
    const nameKey = normalizeName(student.firstName, student.lastName);
    const existing = nameKey ? existingByName.get(nameKey) : null;
    const baseId = existing?.studentId || normalizeStudentId(student.studentId);
    const year = student.year || new Date().getFullYear();
    const groupKey = String(student.groupName || student.groupId || '').trim();
    const hash = crypto
      .createHash('sha1')
      .update(`${nameKey || 'student'}:${groupKey}`)
      .digest('hex')
      .slice(0, 6)
      .toUpperCase();
    const resolvedId = baseId || `STU-${year}-${hash}`;

    await prisma.student.upsert({
      where: { studentId: resolvedId },
      update: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || null,
        phone: student.phone || null,
        idNumber: student.idNumber || null,
        status: student.status || 'ACTIVE',
        groupId: student.groupId,
        facilitatorId: student.facilitatorId,
      },
      create: {
        studentId: resolvedId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || null,
        phone: student.phone || null,
        idNumber: student.idNumber || null,
        status: student.status || 'ACTIVE',
        groupId: student.groupId,
        facilitatorId: student.facilitatorId,
      }
    });
  }

  console.log(`✅ ${studentsData.length} students processed (upserted)`);
}

async function seedCurriculum(curriculumData) {
  console.log('📚 Seeding curriculum (deduped by code)...');

  for (const unit of curriculumData) {
    await prisma.unitStandard.upsert({
      where: { code: unit.code },
      update: {
        title: unit.title,
        credits: unit.credits,
        level: unit.level,
        type: unit.type,
        moduleId: unit.moduleId,
      },
      create: {
        code: unit.code,
        title: unit.title,
        credits: unit.credits,
        level: unit.level,
        type: unit.type,
        moduleId: unit.moduleId,
      }
    });
  }

  console.log(`✅ ${curriculumData.length} units processed`);
}

async function seedRollouts(rolloutsData) {
  console.log('📅 Seeding rollouts (GroupRolloutPlan table ONLY)...');

  for (const rollout of rolloutsData) {
    await prisma.groupRolloutPlan.upsert({
      where: { groupId: rollout.groupId },
      update: rollout,
      create: rollout,
    });
  }

  console.log(`✅ ${rolloutsData.length} rollouts set`);
}

function parseGroupsMarkdown(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  const groups = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      current = { name: headingMatch[1].trim(), students: [] };
      groups.push(current);
      continue;
    }

    const studentMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (studentMatch && current) {
      current.students.push(studentMatch[1].trim());
    }
  }

  return groups;
}

async function seedUnitStandardRolloutsFromNotes(groups) {
  const unitStandards = await prisma.unitStandard.findMany({
    select: { id: true, code: true },
  });
  const unitByCode = new Map(unitStandards.map((unit) => [unit.code, unit.id]));

  let created = 0;
  let skipped = 0;

  for (const group of groups) {
    if (!group.notes) continue;
    let parsed;
    try {
      parsed = JSON.parse(group.notes);
    } catch {
      continue;
    }

    const plan = parsed?.rolloutPlan;
    if (!plan?.modules?.length) continue;

    for (const module of plan.modules) {
      const units = Array.isArray(module.unitStandards) ? module.unitStandards : [];
      for (const unit of units) {
        const code = String(unit.code || unit.id || '').trim();
        const unitStandardId = unitByCode.get(code);
        if (!unitStandardId) {
          skipped += 1;
          continue;
        }

        await prisma.unitStandardRollout.upsert({
          where: {
            groupId_unitStandardId: {
              groupId: group.id,
              unitStandardId,
            },
          },
          update: {
            startDate: parsePlanDate(unit.startDate),
            endDate: parsePlanDate(unit.endDate),
            summativeDate: parsePlanDate(unit.summativeDate),
            assessingDate: parsePlanDate(unit.assessingDate),
          },
          create: {
            groupId: group.id,
            unitStandardId,
            startDate: parsePlanDate(unit.startDate),
            endDate: parsePlanDate(unit.endDate),
            summativeDate: parsePlanDate(unit.summativeDate),
            assessingDate: parsePlanDate(unit.assessingDate),
          },
        });
        created += 1;
      }
    }
  }

  console.log(`✅ Unit standard rollouts upserted: ${created}`);
  if (skipped > 0) {
    console.log(`ℹ️ Unit rollouts skipped (missing unit codes): ${skipped}`);
  }
}

async function ensureFacilitator() {
  const existing = await prisma.user.findFirst({
    where: { email: { in: ['ash@yeha.training', 'facilitator@yeha.co.za'] } },
  });

  if (existing) return existing;

  const hashedPassword = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: {
      email: 'facilitator@yeha.co.za',
      name: 'Default Facilitator',
      password: hashedPassword,
      role: 'FACILITATOR',
    },
  });
}

async function ensureGroupsFromMarkdown(groupsFromMd) {
  const ensured = [];

  for (const group of groupsFromMd) {
    const year = deriveYearFromGroupName(group.name);
    const startDate = new Date(`${year}-02-01`);
    const endDate = addMonths(startDate, 12);

    const existing = await prisma.group.findFirst({ where: { name: group.name } });
    if (existing) {
      ensured.push({ ...existing, year });
      continue;
    }

    const created = await prisma.group.create({
      data: {
        name: group.name,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });
    ensured.push({ ...created, year });
  }

  return ensured;
}

function buildStudentsData(groupsFromMd, groupsByName, facilitatorId) {
  const students = [];

  for (const group of groupsFromMd) {
    const groupRecord = groupsByName.get(group.name);
    if (!groupRecord) continue;

    for (const fullName of group.students) {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts.slice(0, -1).join(' ') || parts[0];
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
      students.push({
        firstName,
        lastName,
        groupId: groupRecord.id,
        facilitatorId,
        groupName: group.name,
        year: groupRecord.year,
      });
    }
  }

  return students;
}

async function seedRolloutsFromNotes(groups) {
  const rollouts = [];

  for (const group of groups) {
    if (!group.notes) continue;
    let parsed;
    try {
      parsed = JSON.parse(group.notes);
    } catch {
      continue;
    }

    const plan = parsed?.rolloutPlan;
    if (!plan?.modules?.length) continue;

    const rollout = { groupId: group.id };

    for (const module of plan.modules) {
      const units = Array.isArray(module.unitStandards) ? module.unitStandards : [];
      if (units.length === 0) continue;
      const first = units[0];
      const last = units[units.length - 1];
      const moduleNumber = module.moduleNumber ?? module.moduleIndex;
      if (!moduleNumber) continue;
      const startDate = parsePlanDate(first.startDate);
      const endDate = parsePlanDate(last.endDate);
      if (startDate) rollout[`module${moduleNumber}StartDate`] = startDate;
      if (endDate) rollout[`module${moduleNumber}EndDate`] = endDate;
    }

    rollouts.push(rollout);
  }

  if (rollouts.length === 0) {
    console.log('ℹ️ No rollout data found in Group.notes to seed.');
    return;
  }

  await seedRollouts(rollouts);
}

async function main() {
  console.log('🚀 SAFE SEED PROTOCOL STARTING...\n');

  await backupDatabase();
  await preFlightCheck();

  const groupsMarkdownPath = path.join(__dirname, '..', 'all_learnership_groups.md');
  const groupsMarkdown = fs.existsSync(groupsMarkdownPath)
    ? fs.readFileSync(groupsMarkdownPath, 'utf8')
    : '';

  const groupsFromMd = parseGroupsMarkdown(groupsMarkdown);
  const facilitator = await ensureFacilitator();
  const ensuredGroups = await ensureGroupsFromMarkdown(groupsFromMd);
  const groupsByName = new Map(ensuredGroups.map((group) => [group.name, group]));

  const studentsData = buildStudentsData(groupsFromMd, groupsByName, facilitator.id);

  const modules = [
    {
      moduleNumber: 1,
      code: 'NVC-M1',
      name: 'Use Basic Mathematics in Order to Fulfil New Venture Functions Effectively',
      fullName: 'Module 1: Numeracy for New Ventures',
      purpose: 'Equip learners with mathematical skills for business',
      description: 'This learning programme aims to equip learners with the necessary mathematical skills and knowledge to successfully run their own businesses.',
      credits: 16,
      notionalHours: 160,
      classroomHours: 48,
      workplaceHours: 112,
      order: 1,
      status: 'ACTIVE',
    },
    {
      moduleNumber: 2,
      code: 'NVC-M2',
      name: 'HIV/AIDS & Communications',
      fullName: 'Module 2: HIV/AIDS & Communications',
      purpose: 'Equip learners with communication skills and HIV/AIDS awareness for business interaction',
      description: 'This module equips learners with the necessary communication skills and HIV/AIDS knowledge to successfully interact with employees, clients and suppliers.',
      credits: 24,
      notionalHours: 240,
      classroomHours: 72,
      workplaceHours: 168,
      order: 2,
      status: 'ACTIVE',
    },
    {
      moduleNumber: 3,
      code: 'NVC-M3',
      name: 'Determine market requirements and manage the relevant marketing and selling processes',
      fullName: 'Module 3: Marketing and Selling for New Ventures',
      purpose: 'Equip learners with knowledge of market requirements and marketing strategies',
      description: 'This module equips learners with knowledge of market requirements and how to benefit from this knowledge in the form of increased sales.',
      credits: 22,
      notionalHours: 220,
      classroomHours: 66,
      workplaceHours: 154,
      order: 3,
      status: 'ACTIVE',
    },
    {
      moduleNumber: 4,
      code: 'NVC-M4',
      name: 'Demonstrate an understanding of the sector/industry in which the business operates',
      fullName: 'Module 4: Business Sector & Industry',
      purpose: 'Equip learners with skills for procurement, tendering, and legal compliance',
      description: 'This module provides learners with knowledge and skills to procure raw material, tender for business, administer contracts, and comply with legal and health & safety requirements.',
      credits: 26,
      notionalHours: 260,
      classroomHours: 78,
      workplaceHours: 182,
      order: 4,
      status: 'ACTIVE',
    },
    {
      moduleNumber: 5,
      code: 'NVC-M5',
      name: 'Determine financial requirements and manage financial resources of a new venture',
      fullName: 'Module 5: Financial Requirements',
      purpose: 'Equip learners with skills for financial planning and resource management',
      description: 'This module provides learners with knowledge and skills to manage financial requirements, cash flow, pricing, costing, and financial record keeping.',
      credits: 26,
      notionalHours: 260,
      classroomHours: 78,
      workplaceHours: 182,
      order: 5,
      status: 'ACTIVE',
    },
    {
      moduleNumber: 6,
      code: 'NVC-M6',
      name: 'Manage business operations',
      fullName: 'Module 6: Business Operations Management',
      purpose: 'Equip learners with skills for overall business operations management',
      description: 'This module provides learners with knowledge and skills to manage overall business operations, coordinate business activities, and maintain professional business conduct.',
      credits: 26,
      notionalHours: 260,
      classroomHours: 78,
      workplaceHours: 182,
      order: 6,
      status: 'ACTIVE',
    },
  ];

  const moduleRecords = [];
  for (const moduleData of modules) {
    const record = await prisma.module.upsert({
      where: { moduleNumber: moduleData.moduleNumber },
      update: moduleData,
      create: moduleData,
    });
    moduleRecords.push(record);
  }

  const moduleIdByNumber = new Map(moduleRecords.map((module) => [module.moduleNumber, module.id]));

  const curriculumData = [
    { code: '7480', title: 'Demonstrate understanding of rational and irrational numbers and number systems', credits: 2, level: 2, type: 'Fundamental', moduleNumber: 1 },
    { code: '9008', title: 'Identify, describe, compare, classify, explore shape and motion in 2-and 3-dimensional shapes in different contexts', credits: 3, level: 2, type: 'Fundamental', moduleNumber: 1 },
    { code: '9007', title: 'Work with a range of patterns and functions and solve problems', credits: 5, level: 2, type: 'Fundamental', moduleNumber: 1 },
    { code: '7469', title: 'Use mathematics to investigate and monitor the financial aspects of personal and community life', credits: 3, level: 2, type: 'Fundamental', moduleNumber: 1 },
    { code: '9009', title: 'Apply basic knowledge of statistics and probability to influence the use of data and procedures in order to investigate life related problems', credits: 3, level: 2, type: 'Fundamental', moduleNumber: 1 },
    { code: '13915', title: 'Demonstrate knowledge and understanding of HIV/AIDS in a workplace and a given community', credits: 4, level: 3, type: 'Core', moduleNumber: 2 },
    { code: '8963/8964', title: 'Access and use information from texts / Write for a defined context', credits: 10, level: 2, type: 'Fundamental', moduleNumber: 2 },
    { code: '8962/8967', title: 'Maintain and adapt oral communication / Use language and communication in occupational learning programmes', credits: 10, level: 2, type: 'Fundamental', moduleNumber: 2 },
    { code: '119673', title: 'Identify and demonstrate entrepreneurial ideas and opportunities', credits: 7, level: 2, type: 'Core', moduleNumber: 3 },
    { code: '119669', title: 'Match new venture opportunity to market needs', credits: 6, level: 2, type: 'Core', moduleNumber: 3 },
    { code: '119672', title: 'Manage marketing and selling processes of a new venture', credits: 7, level: 2, type: 'Core', moduleNumber: 3 },
    { code: '114974', title: 'Apply the basic skills of customer service', credits: 2, level: 2, type: 'Elective', moduleNumber: 3 },
    { code: '119667', title: 'Identify the composition of a selected new venture\'s industry/sector and its procurement systems', credits: 8, level: 2, type: 'Core', moduleNumber: 4 },
    { code: '119712', title: 'Tender for business or work in a selected new venture', credits: 8, level: 3, type: 'Core', moduleNumber: 4 },
    { code: '119671', title: 'Administer contracts for a selected new venture', credits: 10, level: 3, type: 'Core', moduleNumber: 4 },
    { code: '119666', title: 'Determine financial requirements of a new venture', credits: 8, level: 2, type: 'Core', moduleNumber: 5 },
    { code: '119670', title: 'Produce a business plan for a new venture', credits: 8, level: 3, type: 'Core', moduleNumber: 5 },
    { code: '119674', title: 'Manage finances for a new venture', credits: 10, level: 2, type: 'Core', moduleNumber: 5 },
    { code: '119668', title: 'Manage business operations', credits: 8, level: 2, type: 'Core', moduleNumber: 6 },
    { code: '13932', title: 'Prepare and process documents for financial and banking processes', credits: 5, level: 3, type: 'Core', moduleNumber: 6 },
    { code: '13929', title: 'Co-ordinate meetings, minor events and travel arrangements', credits: 3, level: 3, type: 'Core', moduleNumber: 6 },
    { code: '13930', title: 'Monitor and control the receiving and satisfaction of visitors', credits: 4, level: 3, type: 'Core', moduleNumber: 6 },
    { code: '114959', title: 'Behave in a professional manner in a business environment', credits: 4, level: 2, type: 'Core', moduleNumber: 6 },
    { code: '113924', title: 'Apply basic business ethics in a work environment', credits: 3, level: 2, type: 'Core', moduleNumber: 6 },
  ].map((unit) => ({
    ...unit,
    moduleId: moduleIdByNumber.get(unit.moduleNumber),
  }));

  const rolloutsData = [];

  await seedStudents(studentsData);
  await seedCurriculum(curriculumData);
  await seedUnitStandardRolloutsFromNotes(ensuredGroups);
  if (rolloutsData.length > 0) {
    await seedRollouts(rolloutsData);
  } else {
    const dbGroups = await prisma.group.findMany({ select: { id: true, notes: true } });
    await seedRolloutsFromNotes(dbGroups);
  }

  console.log('\n--- AFTER SEEDING ---');
  await preFlightCheck();

  console.log('\n✅ SEEDING COMPLETE. Check counts above.\n');
}

main()
  .catch((e) => {
    console.error('❌ SEEDING FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
