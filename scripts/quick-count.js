const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.student.count()
  .then(count => {
    console.log('Total Students:', count);
    return prisma.group.count();
  })
  .then(count => {
    console.log('Total Groups:', count);
    return prisma.assessment.count();
  })
  .then(count => {
    console.log('Total Assessments:', count);
  })
  .finally(() => prisma.$disconnect());
