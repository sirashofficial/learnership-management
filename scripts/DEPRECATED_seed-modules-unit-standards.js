#!/usr/bin/env node
// Seed NVC Level 2 modules and 24 unit standards without clearing other data.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    status: 'ACTIVE'
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
    status: 'ACTIVE'
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
    status: 'ACTIVE'
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
    status: 'ACTIVE'
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
    status: 'ACTIVE'
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
    status: 'ACTIVE'
  }
];

const unitStandards = [
  // Module 1
  { code: '7480', title: 'Demonstrate understanding of rational and irrational numbers and number systems', credits: 2, level: 2, type: 'Fundamental', moduleNumber: 1 },
  { code: '9008', title: 'Identify, describe, compare, classify, explore shape and motion in 2-and 3-dimensional shapes in different contexts', credits: 3, level: 2, type: 'Fundamental', moduleNumber: 1 },
  { code: '9007', title: 'Work with a range of patterns and functions and solve problems', credits: 5, level: 2, type: 'Fundamental', moduleNumber: 1 },
  { code: '7469', title: 'Use mathematics to investigate and monitor the financial aspects of personal and community life', credits: 3, level: 2, type: 'Fundamental', moduleNumber: 1 },
  { code: '9009', title: 'Apply basic knowledge of statistics and probability to influence the use of data and procedures in order to investigate life related problems', credits: 3, level: 2, type: 'Fundamental', moduleNumber: 1 },

  // Module 2
  { code: '13915', title: 'Demonstrate knowledge and understanding of HIV/AIDS in a workplace and a given community', credits: 4, level: 3, type: 'Core', moduleNumber: 2 },
  { code: '8963/8964', title: 'Access and use information from texts / Write for a defined context', credits: 10, level: 2, type: 'Fundamental', moduleNumber: 2 },
  { code: '8962/8967', title: 'Maintain and adapt oral communication / Use language and communication in occupational learning programmes', credits: 10, level: 2, type: 'Fundamental', moduleNumber: 2 },

  // Module 3
  { code: '119673', title: 'Identify and demonstrate entrepreneurial ideas and opportunities', credits: 7, level: 2, type: 'Core', moduleNumber: 3 },
  { code: '119669', title: 'Match new venture opportunity to market needs', credits: 6, level: 2, type: 'Core', moduleNumber: 3 },
  { code: '119672', title: 'Manage marketing and selling processes of a new venture', credits: 7, level: 2, type: 'Core', moduleNumber: 3 },
  { code: '114974', title: 'Apply the basic skills of customer service', credits: 2, level: 2, type: 'Elective', moduleNumber: 3 },

  // Module 4
  { code: '119667', title: 'Identify the composition of a selected new venture\'s industry/sector and its procurement systems', credits: 8, level: 2, type: 'Core', moduleNumber: 4 },
  { code: '119712', title: 'Tender for business or work in a selected new venture', credits: 8, level: 3, type: 'Core', moduleNumber: 4 },
  { code: '119671', title: 'Administer contracts for a selected new venture', credits: 10, level: 3, type: 'Core', moduleNumber: 4 },

  // Module 5
  { code: '119666', title: 'Determine financial requirements of a new venture', credits: 8, level: 2, type: 'Core', moduleNumber: 5 },
  { code: '119670', title: 'Produce a business plan for a new venture', credits: 8, level: 3, type: 'Core', moduleNumber: 5 },
  { code: '119674', title: 'Manage finances for a new venture', credits: 10, level: 2, type: 'Core', moduleNumber: 5 },

  // Module 6
  { code: '119668', title: 'Manage business operations', credits: 8, level: 2, type: 'Core', moduleNumber: 6 },
  { code: '13932', title: 'Prepare and process documents for financial and banking processes', credits: 5, level: 3, type: 'Core', moduleNumber: 6 },
  { code: '13929', title: 'Co-ordinate meetings, minor events and travel arrangements', credits: 3, level: 3, type: 'Core', moduleNumber: 6 },
  { code: '13930', title: 'Monitor and control the receiving and satisfaction of visitors', credits: 4, level: 3, type: 'Core', moduleNumber: 6 },
  { code: '114959', title: 'Behave in a professional manner in a business environment', credits: 4, level: 2, type: 'Core', moduleNumber: 6 },
  { code: '113924', title: 'Apply basic business ethics in a work environment', credits: 3, level: 2, type: 'Core', moduleNumber: 6 }
];

async function seedModulesAndUnitStandards() {
  console.log('Seeding modules and unit standards...');

  const moduleRecords = [];
  for (const moduleData of modules) {
    const record = await prisma.module.upsert({
      where: { moduleNumber: moduleData.moduleNumber },
      update: moduleData,
      create: moduleData
    });
    moduleRecords.push(record);
  }

  const moduleIdByNumber = new Map(moduleRecords.map(m => [m.moduleNumber, m.id]));

  let createdOrUpdated = 0;
  for (const unit of unitStandards) {
    const moduleId = moduleIdByNumber.get(unit.moduleNumber);
    if (!moduleId) {
      throw new Error(`Missing module for moduleNumber ${unit.moduleNumber}`);
    }

    await prisma.unitStandard.upsert({
      where: { code: unit.code },
      update: {
        title: unit.title,
        credits: unit.credits,
        level: unit.level,
        type: unit.type,
        moduleId
      },
      create: {
        code: unit.code,
        title: unit.title,
        credits: unit.credits,
        level: unit.level,
        type: unit.type,
        moduleId
      }
    });
    createdOrUpdated += 1;
  }

  console.log(`Modules upserted: ${moduleRecords.length}`);
  console.log(`Unit standards upserted: ${createdOrUpdated}`);
}

seedModulesAndUnitStandards()
  .then(() => {
    console.log('Done.');
  })
  .catch(err => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
