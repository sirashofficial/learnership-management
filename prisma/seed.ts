import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.courseProgress.deleteMany();
  await prisma.groupCourse.deleteMany();
  await prisma.pOEChecklist.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.lessonPlan.deleteMany();
  await prisma.curriculumDocument.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.unitStandard.deleteMany();
  await prisma.module.deleteMany();
  await prisma.session.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create facilitator user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const facilitator = await prisma.user.create({
    data: {
      email: 'ash@yeha.training',
      name: 'Ash',
      password: hashedPassword,
      role: 'FACILITATOR',
    },
  });

  console.log('✅ Created facilitator user');

  // Create companies
  const azelisCompany = await prisma.company.create({
    data: {
      name: 'Azelis',
      contactPerson: 'John Smith',
      email: 'john.smith@azelis.com',
      phone: '+27 11 234 5678',
      address: 'Johannesburg, South Africa',
      industry: 'Chemical Distribution',
    },
  });

  const kelpackCompany = await prisma.company.create({
    data: {
      name: 'Kelpack Manufacturing',
      contactPerson: 'Sarah Johnson',
      email: 'sarah.j@kelpack.co.za',
      phone: '+27 11 345 6789',
      address: 'Johannesburg, South Africa',
      industry: 'Manufacturing',
    },
  });

  const cityLogisticsCompany = await prisma.company.create({
    data: {
      name: 'City Logistics',
      contactPerson: 'Mike Williams',
      email: 'mike.w@citylogistics.co.za',
      phone: '+27 12 456 7890',
      address: 'Pretoria, South Africa',
      industry: 'Logistics',
    },
  });

  // Create more companies for all the groups
  const beyondInsightsCompany = await prisma.company.create({
    data: {
      name: 'Beyond Insights',
      contactPerson: 'Linda Brown',
      email: 'linda@beyondinsights.co.za',
      phone: '+27 11 567 8901',
      address: 'Sandton, South Africa',
      industry: 'Consulting',
    },
  });

  const monteagleCompany = await prisma.company.create({
    data: {
      name: 'Monteagle',
      contactPerson: 'David Lee',
      email: 'david@monteagle.co.za',
      phone: '+27 11 678 9012',
      address: 'Johannesburg, South Africa',
      industry: 'Business Services',
    },
  });

  const packagingWorldCompany = await prisma.company.create({
    data: {
      name: 'Packaging World',
      contactPerson: 'Emma Wilson',
      email: 'emma@packagingworld.co.za',
      phone: '+27 11 789 0123',
      address: 'Johannesburg, South Africa',
      industry: 'Packaging',
    },
  });

  const flintGroupCompany = await prisma.company.create({
    data: {
      name: 'Flint Group',
      contactPerson: 'Robert Taylor',
      email: 'robert@flintgroup.co.za',
      phone: '+27 11 890 1234',
      address: 'Johannesburg, South Africa',
      industry: 'Printing Solutions',
    },
  });

  const wahlCompany = await prisma.company.create({
    data: {
      name: 'Wahl',
      contactPerson: 'Jessica Martinez',
      email: 'jessica@wahl.co.za',
      phone: '+27 11 901 2345',
      address: 'Johannesburg, South Africa',
      industry: 'Consumer Products',
    },
  });

  console.log('✅ Created 8 companies');

  // Create training groups - 2026 Cohort (Montzelity 26' Collection)
  const azelis26 = await prisma.group.create({
    data: {
      name: "Azelis 26'",
      location: 'Azelis Head Office, Johannesburg',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-12-15'),
      status: 'Active',
      notes: 'Part of Montzelity 26\' collection - 2026 cohort',
      companyId: azelisCompany.id,
    },
  });

  const beyondInsights26 = await prisma.group.create({
    data: {
      name: "Beyond Insights 26'",
      location: 'Beyond Insights Office, Sandton',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-12-15'),
      status: 'Active',
      notes: 'Part of Montzelity 26\' collection - 2026 cohort',
      companyId: beyondInsightsCompany.id,
    },
  });

  const cityLogistics26 = await prisma.group.create({
    data: {
      name: "City Logistics 26'",
      location: 'City Logistics Warehouse, Pretoria',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-12-15'),
      status: 'Active',
      notes: 'Part of Montzelity 26\' collection - 2026 cohort',
      companyId: cityLogisticsCompany.id,
    },
  });

  const monteagle26 = await prisma.group.create({
    data: {
      name: "Monteagle 26'",
      location: 'Monteagle Office, Johannesburg',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-12-15'),
      status: 'Active',
      notes: 'Part of Montzelity 26\' collection - 2026 cohort',
      companyId: monteagleCompany.id,
    },
  });

  // Create training groups - 2025 Cohort
  const azelis25 = await prisma.group.create({
    data: {
      name: "Azelis 25'",
      location: 'Azelis Head Office, Johannesburg',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-12-15'),
      status: 'Active',
      notes: '2025 cohort - Computer Lab sessions',
      companyId: azelisCompany.id,
    },
  });

  const packagingWorld25 = await prisma.group.create({
    data: {
      name: "Packaging World 25'",
      location: 'Packaging World Factory, Johannesburg',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-12-15'),
      status: 'Active',
      notes: '2025 cohort - Computer Lab sessions',
      companyId: packagingWorldCompany.id,
    },
  });

  const flintGroup25 = await prisma.group.create({
    data: {
      name: "Flint Group 25'",
      location: 'Flint Group Office, Johannesburg',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-12-31'),
      status: 'Active',
      notes: '2025 cohort - Lecture Room sessions',
      companyId: flintGroupCompany.id,
    },
  });

  const wahl25 = await prisma.group.create({
    data: {
      name: "Wahl 25'",
      location: 'Wahl Office, Johannesburg',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-12-31'),
      status: 'Active',
      notes: '2025 cohort - Computer Lab sessions',
      companyId: wahlCompany.id,
    },
  });

  const monteagle25 = await prisma.group.create({
    data: {
      name: "Monteagle 25'",
      location: 'Monteagle Office, Johannesburg',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-12-31'),
      status: 'Active',
      notes: '2025 cohort - Computer Lab sessions',
      companyId: monteagleCompany.id,
    },
  });

  const kelpack = await prisma.group.create({
    data: {
      name: 'Kelpack',
      location: 'Kelpack Training Center',
      coordinator: 'Ash Mahomed',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2026-02-28'),
      status: 'Active',
      notes: 'Friday sessions - Lecture Room',
      companyId: kelpackCompany.id,
    },
  });

  const groups = [
    azelis26, beyondInsights26, cityLogistics26, monteagle26,  // 2026 cohort
    azelis25, packagingWorld25, flintGroup25, wahl25, monteagle25,  // 2025 cohort
    kelpack  // No year specified
  ];

  console.log('✅ Created 10 training groups (4 from 2026 cohort, 5 from 2025 cohort, 1 other)');

  // Create students - distributed across multiple groups
  const students = await Promise.all([
    // Azelis 26' students
    prisma.student.create({
      data: {
        studentId: 'AZE26-001',
        firstName: 'Thabo',
        lastName: 'Mkhize',
        email: 'thabo.mkhize@azelis.com',
        phone: '+27 82 123 4567',
        idNumber: '9801015800081',
        progress: 15,
        status: 'ACTIVE',
        groupId: azelis26.id,
        facilitatorId: facilitator.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: 'AZE26-002',
        firstName: 'Zanele',
        lastName: 'Dlamini',
        email: 'zanele.dlamini@azelis.com',
        phone: '+27 83 234 5678',
        idNumber: '9905125800082',
        progress: 18,
        status: 'ACTIVE',
        groupId: azelis26.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Beyond Insights 26' students
    prisma.student.create({
      data: {
        studentId: 'BEY26-001',
        firstName: 'Sipho',
        lastName: 'Ndlovu',
        email: 'sipho@beyondinsights.co.za',
        phone: '+27 84 345 6789',
        idNumber: '9702085800083',
        progress: 20,
        status: 'ACTIVE',
        groupId: beyondInsights26.id,
        facilitatorId: facilitator.id,
      },
    }),
    // City Logistics 26' students
    prisma.student.create({
      data: {
        studentId: 'CL26-001',
        firstName: 'Nomsa',
        lastName: 'Khumalo',
        email: 'nomsa@citylogistics.co.za',
        phone: '+27 85 456 7890',
        idNumber: '9808145800084',
        progress: 12,
        status: 'ACTIVE',
        groupId: cityLogistics26.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Monteagle 26' students
    prisma.student.create({
      data: {
        studentId: 'MON26-001',
        firstName: 'Bongani',
        lastName: 'Shabalala',
        email: 'bongani@monteagle.co.za',
        phone: '+27 86 567 8901',
        idNumber: '9612205800085',
        progress: 25,
        status: 'ACTIVE',
        groupId: monteagle26.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Azelis 25' students
    prisma.student.create({
      data: {
        studentId: 'AZE25-001',
        firstName: 'Precious',
        lastName: 'Mokoena',
        email: 'precious.m@azelis.com',
        phone: '+27 87 678 9012',
        idNumber: '9903165800086',
        progress: 55,
        status: 'ACTIVE',
        groupId: azelis25.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Packaging World 25' students
    prisma.student.create({
      data: {
        studentId: 'PKG25-001',
        firstName: 'Lindiwe',
        lastName: 'Nkosi',
        email: 'lindiwe@packagingworld.co.za',
        phone: '+27 88 789 0123',
        idNumber: '9707195800087',
        progress: 48,
        status: 'ACTIVE',
        groupId: packagingWorld25.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Flint Group 25' students
    prisma.student.create({
      data: {
        studentId: 'FLN25-001',
        firstName: 'Mandla',
        lastName: 'Zulu',
        email: 'mandla@flintgroup.co.za',
        phone: '+27 89 890 1234',
        idNumber: '9511225800088',
        progress: 62,
        status: 'ACTIVE',
        groupId: flintGroup25.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Wahl 25' students
    prisma.student.create({
      data: {
        studentId: 'WHL25-001',
        firstName: 'Thandi',
        lastName: 'Mthembu',
        email: 'thandi@wahl.co.za',
        phone: '+27 90 901 2345',
        idNumber: '9604235800089',
        progress: 58,
        status: 'ACTIVE',
        groupId: wahl25.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Monteagle 25' students
    prisma.student.create({
      data: {
        studentId: 'MON25-001',
        firstName: 'Sello',
        lastName: 'Maseko',
        email: 'sello@monteagle.co.za',
        phone: '+27 91 012 3456',
        idNumber: '9809265800090',
        progress: 51,
        status: 'ACTIVE',
        groupId: monteagle25.id,
        facilitatorId: facilitator.id,
      },
    }),
    // Kelpack students
    prisma.student.create({
      data: {
        studentId: 'KEL-001',
        firstName: 'Khaya',
        lastName: 'Ncube',
        email: 'khaya@kelpack.co.za',
        phone: '+27 85 456 7890',
        idNumber: '0001125800084',
        progress: 38,
        status: 'ACTIVE',
        groupId: kelpack.id,
        facilitatorId: facilitator.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: 'KEL-002',
        firstName: 'Ayanda',
        lastName: 'Dube',
        email: 'ayanda@kelpack.co.za',
        phone: '+27 86 567 8901',
        idNumber: '9910285800091',
        progress: 41,
        status: 'ACTIVE',
        groupId: kelpack.id,
        facilitatorId: facilitator.id,
      },
    }),
  ]);

  console.log(`✅ Created ${students.length} students across all groups`);

  // Create sessions
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        title: 'Market Requirements Training',
        module: 'Module 3: Market Requirements',
        date: today,
        startTime: '09:00',
        endTime: '14:00',
        groupId: groups[0].id,
        facilitatorId: facilitator.id,
      },
    }),
    prisma.session.create({
      data: {
        title: 'Communication Skills Workshop',
        module: 'Module 2: Communication Skills',
        date: tomorrow,
        startTime: '09:00',
        endTime: '14:00',
        groupId: groups[1].id,
        facilitatorId: facilitator.id,
      },
    }),
    prisma.session.create({
      data: {
        title: 'Financial Requirements',
        module: 'Module 5: Financial Requirements',
        date: dayAfter,
        startTime: '09:00',
        endTime: '14:00',
        groupId: groups[2].id,
        facilitatorId: facilitator.id,
      },
    }),
  ]);

  console.log('✅ Created 3 training sessions');

  // Create assessments
  const futureDates = [1, 2, 5].map(days => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  });

  await Promise.all([
    prisma.assessment.create({
      data: {
        unitStandard: 'US 119672',
        module: 'Module 3',
        type: 'FORMATIVE',
        method: 'PRACTICAL',
        dueDate: futureDates[0],
        studentId: students[0].id,
      },
    }),
    prisma.assessment.create({
      data: {
        unitStandard: 'US 8963',
        module: 'Module 2',
        type: 'FORMATIVE',
        method: 'KNOWLEDGE',
        dueDate: futureDates[1],
        studentId: students[1].id,
      },
    }),
    prisma.assessment.create({
      data: {
        unitStandard: 'US 119670',
        module: 'Module 4',
        type: 'SUMMATIVE',
        method: 'PRACTICAL',
        dueDate: futureDates[2],
        result: 'COMPETENT',
        assessedDate: new Date(),
        studentId: students[2].id,
      },
    }),
  ]);

  console.log('✅ Created assessments');

  // Create curriculum modules for SSETA NVC Level 2 (49648)
  const modules = await Promise.all([
    prisma.module.create({
      data: {
        code: 'NVC-M1',
        name: 'Use basic Mathematics in order to fulfil new venture functions effectively',
        description: 'This module equips learners with the necessary mathematical skills and knowledge to successfully run their own businesses.',
        credits: 16,
        order: 1,
        status: 'NOT_STARTED',
      },
    }),
    prisma.module.create({
      data: {
        code: 'NVC-M2',
        name: 'Apply basic Communication skills in new venture creation context',
        description: 'This module equips learners with the necessary communication skills and knowledge to successfully interact with employees, clients and suppliers, including HIV/AIDS awareness.',
        credits: 24,
        order: 2,
        status: 'NOT_STARTED',
      },
    }),
    prisma.module.create({
      data: {
        code: 'NVC-M3',
        name: 'Determine market requirements and manage the relevant marketing and selling processes',
        description: 'This module equips learners with knowledge of market requirements and how to benefit from this knowledge in the form of increased sales.',
        credits: 22,
        order: 3,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.module.create({
      data: {
        code: 'NVC-M4',
        name: 'Demonstrate an understanding of the sector/industry in which the business operates',
        description: 'This module provides learners with knowledge and skills to procure raw material, tender for business, administer contracts, and comply with legal and health & safety requirements.',
        credits: 26,
        order: 4,
        status: 'NOT_STARTED',
      },
    }),
    prisma.module.create({
      data: {
        code: 'NVC-M5',
        name: 'Determine financial requirements and manage financial resources of a new venture',
        description: 'This module provides learners with knowledge and skills to manage financial requirements, cash flow, pricing, costing, and financial record keeping.',
        credits: 23,
        order: 5,
        status: 'NOT_STARTED',
      },
    }),
    prisma.module.create({
      data: {
        code: 'NVC-M6',
        name: 'Manage business operations',
        description: 'This module provides learners with knowledge and skills to manage overall business operations, coordinate business activities, and maintain professional business conduct.',
        credits: 26,
        order: 6,
        status: 'NOT_STARTED',
      },
    }),
  ]);

  console.log('✅ Created 6 curriculum modules (SSETA NVC Level 2)');

  // Create unit standards for each module
  const unitStandards = await Promise.all([
    // Module 1: Numeracy (16 credits, 160 hours)
    prisma.unitStandard.create({
      data: {
        code: '7480',
        title: 'Demonstrate understanding of rational and irrational numbers and number systems',
        credits: 3,
        level: 2,
        content: 'Number systems, rational and irrational numbers, mathematical operations',
        moduleId: modules[0].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '9008',
        title: 'Identify, describe, compare, classify, explore shape and motion in 2-and 3-dimensional shapes in different contexts',
        credits: 3,
        level: 2,
        content: 'Geometry, 2D and 3D shapes, spatial reasoning',
        moduleId: modules[0].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '9007',
        title: 'Work with a range of patterns and functions and solve problems',
        credits: 5,
        level: 2,
        content: 'Patterns, functions, algebraic thinking, problem-solving',
        moduleId: modules[0].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '7469',
        title: 'Use mathematics to investigate and monitor the financial aspects of personal and community life',
        credits: 2,
        level: 2,
        content: 'Financial mathematics, budgeting, personal finance',
        moduleId: modules[0].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '9009',
        title: 'Apply basic knowledge of statistics and probability to influence the use of data and procedures in order to investigate life related problems',
        credits: 3,
        level: 2,
        content: 'Statistics, probability, data analysis, interpretation',
        moduleId: modules[0].id,
      },
    }),

    // Module 2: Communication & HIV/AIDS (24 credits, 240 hours)
    prisma.unitStandard.create({
      data: {
        code: '8963',
        title: 'Access and use information from texts',
        credits: 5,
        level: 2,
        content: 'Reading comprehension, information extraction, text analysis',
        moduleId: modules[1].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '8964',
        title: 'Write for a defined context',
        credits: 5,
        level: 2,
        content: 'Business writing, report writing, professional correspondence',
        moduleId: modules[1].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '8962',
        title: 'Maintain and adapt oral communication',
        credits: 5,
        level: 2,
        content: 'Verbal communication, presentations, interpersonal skills',
        moduleId: modules[1].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '8967',
        title: 'Use language in occupational learning',
        credits: 5,
        level: 2,
        content: 'Workplace literacy, technical vocabulary, learning strategies',
        moduleId: modules[1].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '13915',
        title: 'Demonstrate knowledge and understanding of HIV/AIDS in a workplace and a given community',
        credits: 4,
        level: 3,
        content: 'HIV/AIDS awareness, workplace policies, impact on business',
        moduleId: modules[1].id,
      },
    }),

    // Module 3: Market Requirements (22 credits, 220 hours)
    prisma.unitStandard.create({
      data: {
        code: '119673',
        title: 'Identify and demonstrate entrepreneurial ideas and opportunities',
        credits: 7,
        level: 2,
        content: 'Entrepreneurship, opportunity recognition, business ideas',
        moduleId: modules[2].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '119669',
        title: 'Match new venture opportunity to market needs',
        credits: 6,
        level: 2,
        content: 'Market research, customer needs, opportunity alignment',
        moduleId: modules[2].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '119672',
        title: 'Manage marketing and selling processes of a new venture',
        credits: 7,
        level: 2,
        content: 'Marketing strategies, sales processes, customer engagement',
        moduleId: modules[2].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '114974',
        title: 'Apply the basic skills of customer service',
        credits: 2,
        level: 2,
        content: 'Customer service excellence, complaint handling, satisfaction',
        moduleId: modules[2].id,
      },
    }),

    // Module 4: Sector/Industry Understanding (26 credits, 260 hours)
    prisma.unitStandard.create({
      data: {
        code: '119667',
        title: 'Identify the composition of a selected new venture\'s industry/sector and its procurement systems',
        credits: 8,
        level: 2,
        content: 'Industry analysis, value chains, procurement processes',
        moduleId: modules[3].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '119712',
        title: 'Tender for business or work in a selected new venture',
        credits: 8,
        level: 3,
        content: 'Tendering processes, bid preparation, proposal writing',
        moduleId: modules[3].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '119671',
        title: 'Administer contracts for a selected new venture',
        credits: 10,
        level: 3,
        content: 'Contract management, legal requirements, administration',
        moduleId: modules[3].id,
      },
    }),

    // Module 5: Financial Requirements (23 credits, 230 hours)
    prisma.unitStandard.create({
      data: {
        code: '119666',
        title: 'Determine financial requirements of a new venture',
        credits: 8,
        level: 2,
        content: 'Financial planning, cash flow, start-up capital, funding',
        moduleId: modules[4].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '119670',
        title: 'Produce a business plan for a new venture',
        credits: 5,
        level: 3,
        content: 'Business planning, financial projections, strategic planning',
        moduleId: modules[4].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '119674',
        title: 'Manage finances for a new venture',
        credits: 10,
        level: 2,
        content: 'Financial management, accounting, record keeping, controls',
        moduleId: modules[4].id,
      },
    }),

    // Module 6: Business Operations (26 credits, 260 hours)
    prisma.unitStandard.create({
      data: {
        code: '119668',
        title: 'Manage business operations',
        credits: 8,
        level: 2,
        content: 'Operations management, business plans, progress monitoring',
        moduleId: modules[5].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '13929',
        title: 'Co-ordinate meetings, minor events and travel arrangements',
        credits: 3,
        level: 3,
        content: 'Event coordination, meeting management, travel logistics',
        moduleId: modules[5].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '13932',
        title: 'Prepare and process documents for financial and banking processes',
        credits: 5,
        level: 3,
        content: 'Financial documentation, banking procedures, processing',
        moduleId: modules[5].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '13930',
        title: 'Monitor and control the receiving and satisfaction of visitors',
        credits: 4,
        level: 3,
        content: 'Reception management, visitor protocols, customer experience',
        moduleId: modules[5].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '114959',
        title: 'Behave in a professional manner in a business environment',
        credits: 4,
        level: 2,
        content: 'Professional conduct, workplace behavior, business etiquette',
        moduleId: modules[5].id,
      },
    }),
    prisma.unitStandard.create({
      data: {
        code: '113924',
        title: 'Apply basic business ethics in a work environment',
        credits: 2,
        level: 2,
        content: 'Business ethics, integrity, ethical decision-making',
        moduleId: modules[5].id,
      },
    }),
  ]);

  console.log('✅ Created 26 unit standards across all 6 modules');

  // Create sample activities for some unit standards
  await Promise.all([
    prisma.activity.create({
      data: {
        description: 'Calculate monthly household budget',
        duration: 60,
        resources: 'Calculator, budget worksheet, sample bills',
        assessmentType: 'Formative',
        unitStandardId: unitStandards[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        description: 'Role-play: Professional telephone conversations',
        duration: 45,
        resources: 'Phone scripts, scenario cards',
        assessmentType: 'Practical',
        unitStandardId: unitStandards[3].id,
      },
    }),
    prisma.activity.create({
      data: {
        description: 'Customer service case study analysis',
        duration: 90,
        resources: 'Case study handouts, discussion questions',
        assessmentType: 'Formative',
        unitStandardId: unitStandards[7].id,
      },
    }),
    prisma.activity.create({
      data: {
        description: 'Quality control workplace inspection',
        duration: 120,
        resources: 'Inspection checklist, camera, notepad',
        assessmentType: 'Practical',
        unitStandardId: unitStandards[9].id,
      },
    }),
  ]);

  console.log('✅ Created sample activities');

  // Create sample lesson plans
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  await Promise.all([
    prisma.lessonPlan.create({
      data: {
        title: 'Introduction to Market Requirements',
        description: 'Understanding customer needs and market dynamics',
        date: nextWeek,
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Training Room A',
        objectives: JSON.stringify([
          'Identify different types of customers',
          'Understand basic market research concepts',
          'Recognize the importance of customer feedback',
        ]),
        materials: JSON.stringify([
          'Projector and laptop',
          'Handouts on market research',
          'Case study materials',
          'Flip chart and markers',
        ]),
        activities: JSON.stringify([
          { time: '09:00-09:30', activity: 'Icebreaker and recap of previous session' },
          { time: '09:30-10:30', activity: 'Lecture: Understanding the market' },
          { time: '10:30-10:45', activity: 'Break' },
          { time: '10:45-11:45', activity: 'Group activity: Market research simulation' },
          { time: '11:45-12:00', activity: 'Q&A and closing' },
        ]),
        notes: 'Ensure all learners participate in group activities',
        moduleId: modules[2].id,
        facilitatorId: facilitator.id,
        groupId: groups[0].id,
      },
    }),
    prisma.lessonPlan.create({
      data: {
        title: 'Workplace Communication Skills',
        description: 'Effective communication in professional settings',
        date: new Date(nextWeek.getTime() + 86400000),
        startTime: '09:00',
        endTime: '13:00',
        venue: 'Training Room B',
        objectives: JSON.stringify([
          'Practice professional telephone etiquette',
          'Write effective workplace emails',
          'Demonstrate active listening skills',
        ]),
        materials: JSON.stringify([
          'Telephones for practice',
          'Email templates',
          'Role-play scenario cards',
        ]),
        activities: JSON.stringify([
          { time: '09:00-09:15', activity: 'Welcome and objectives overview' },
          { time: '09:15-10:30', activity: 'Workshop: Telephone communication' },
          { time: '10:30-10:45', activity: 'Break' },
          { time: '10:45-12:00', activity: 'Email writing practice' },
          { time: '12:00-12:45', activity: 'Role-play assessments' },
          { time: '12:45-13:00', activity: 'Feedback and wrap-up' },
        ]),
        moduleId: modules[1].id,
        facilitatorId: facilitator.id,
        groupId: groups[1].id,
      },
    }),
  ]);

  console.log('✅ Created sample lesson plans');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📧 Login credentials:');
  console.log('   Email: ash@yeha.training');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
