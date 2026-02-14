
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Schedules...');

    // 1. Create Templates
    // Template 1: Mon/Wed Lecture, Tue/Thu Lab
    const scheduleA = {
        "Monday": { "09:00": { "room": "Lecture Room", "activity": "Class" } },
        "Tuesday": { "09:00": { "room": "Computer Lab", "activity": "Lab" } },
        "Wednesday": { "09:00": { "room": "Lecture Room", "activity": "Class" } },
        "Thursday": { "09:00": { "room": "Computer Lab", "activity": "Lab" } }
    };

    // Template 2: Mon/Wed Lab, Tue/Thu Lecture
    const scheduleB = {
        "Monday": { "09:00": { "room": "Computer Lab", "activity": "Lab" } },
        "Tuesday": { "09:00": { "room": "Lecture Room", "activity": "Class" } },
        "Wednesday": { "09:00": { "room": "Computer Lab", "activity": "Lab" } },
        "Thursday": { "09:00": { "room": "Lecture Room", "activity": "Class" } }
    };

    const templateA = await prisma.scheduleTemplate.create({
        data: {
            name: "Standard Schedule A (Lecture MW)",
            schedule: JSON.stringify(scheduleA),
            isActive: true
        }
    });

    const templateB = await prisma.scheduleTemplate.create({
        data: {
            name: "Standard Schedule B (Lab MW)",
            schedule: JSON.stringify(scheduleB),
            isActive: true
        }
    });

    console.log('Created Templates:', templateA.id, templateB.id);

    // 2. Assign to Groups
    const groups = await prisma.group.findMany();

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        // Alternate schedules
        const templateId = i % 2 === 0 ? templateA.id : templateB.id;

        // Check if schedule exists
        const existing = await prisma.groupSchedule.findFirst({
            where: { groupId: group.id }
        });

        if (!existing) {
            await prisma.groupSchedule.create({
                data: {
                    groupId: group.id,
                    templateId: templateId,
                    startDate: new Date('2026-01-01'),
                    endDate: new Date('2026-12-31')
                }
            });
            console.log(`Assigned Schedule ${i % 2 === 0 ? 'A' : 'B'} to active group: ${group.name}`);
        } else {
            console.log(`Group ${group.name} already has a schedule.`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
