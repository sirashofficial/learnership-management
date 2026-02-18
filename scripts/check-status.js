const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  const students = await prisma.student.findMany({
    select: { firstName: true, lastName: true, status: true }
  });
  
  console.log('Student Status Values:');
  students.forEach(s => {
    console.log(`  ${s.firstName} ${s.lastName}: "${s.status}"`);
  });
  
  await prisma.$disconnect();
}

checkStatus();
