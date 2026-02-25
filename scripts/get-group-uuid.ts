/**
 * Get a real group UUID for testing
 */

import prisma from '@/lib/prisma';

async function main() {
  const group = await prisma.group.findFirst({
    select: {
      id: true,
      name: true,
    },
  });

  if (group) {
    console.log(`Found group: ${group.name}`);
    console.log(`UUID: ${group.id}`);
    console.log(`Type: ${typeof group.id}`);
    console.log(`Length: ${group.id.length}`);
  } else {
    console.log('No groups found');
  }

  process.exit(0);
}

main().catch(console.error);
