
import { PrismaClient } from '@prisma/client';
import { addMonths, addDays } from 'date-fns';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const GROUPS_DATA = [
    // 2026 Groups
    {
        companyName: 'City Logistics',
        groupName: 'CITY LOGISTICS (LP) - 2026',
        year: 2026,
        students: [
            "Zamasomi Msomi", "Hloniphile Ngwane", "Nokuthule Nduli", "Nothando Mthembu",
            "Diboseng Tsoanyane", "Khonziwe Khumalo", "Londiwe Sibisi", "Qaqamba Toboshane"
        ]
    },
    {
        companyName: 'Azelis',
        groupName: 'AZELIS SA (LP) - 2026',
        year: 2026,
        students: [
            "Josiah Levi Rampersad", "Zachariah Mohamed", "Neeshan Sewpersadh", "Saahi Ahmed Ally"
        ]
    },
    {
        companyName: 'Monteagle',
        groupName: 'MONTEAGLE (LP) - 2026',
        year: 2026,
        students: [
            "Thandazile Phakamile Gwala", "Samukele Welcome Ngcobo"
        ]
    },
    {
        companyName: 'Beyond Insights',
        groupName: 'BEYOND INSIGHTS (LP) - 2026',
        year: 2026,
        students: [
            "Sisipho Mantshule"
        ]
    },
    // 2025 Groups
    {
        companyName: 'Azelis',
        groupName: 'AZELIS (LP) - 2025',
        year: 2025,
        students: [
            "Josiah Naidoo", "Thandokazi Yengo", "Mathepe Mametja", "Khonziwe Chivi",
            "Siphelele Ngwane", "Sinethemba Mfeka"
        ]
    },
    {
        companyName: 'Packaging World',
        groupName: 'PACKAGING WORLD (LP) - 2025',
        year: 2025,
        students: [
            "Nelisiwe Khuzwayo", "Nontle Hlongwane", "Nokwanda Mkhize"
        ]
    },
    {
        companyName: 'Flint Group',
        groupName: 'FLINT GROUP (LP) - 2025',
        year: 2025,
        students: [
            "Ntando Shabangu", "Mhelngi Jwara", "Thokozile Ngcobo", "Mazwi Masango",
            "Nhlakanipho Xulu", "Akayla Beharee", "Londeka Hlengwa", "Noluthando Jokweni",
            "Duduzile Mkhize", "Thomas Johnson", "Lindokuhle Maduna", "Nqobile Shozi"
        ]
    },
    {
        companyName: 'Wahl Clippers',
        groupName: 'WAHL CLIPPERS (LP) - 2025',
        year: 2025,
        students: [
            "Keanen Sibiya", "Minenhle Mthembu", "Avela Paye", "Nontlahla Pepu",
            "Sinthembile Sikhojana", "Thabani Misimango"
        ]
    },
    {
        companyName: 'Monteagle',
        groupName: 'MONTEAGLE (LP) - 2025',
        year: 2025,
        students: [
            "Philile Ngobese", "Sthembile Nkosi", "Yanilisa Mbotho", "Lulama Majola"
        ]
    }
];

async function main() {
    console.log('Starting seed...');

    // 1. Create Default Facilitator
    const hashedPassword = await bcrypt.hash('password123', 10);
    const facilitator = await prisma.user.upsert({
        where: { email: 'facilitator@yeha.co.za' },
        update: {},
        create: {
            email: 'facilitator@yeha.co.za',
            name: 'Default Facilitator',
            password: hashedPassword,
            role: 'FACILITATOR',
        },
    });
    console.log('Facilitator ensured:', facilitator.email);

    // 2. Process Groups
    for (const groupData of GROUPS_DATA) {
        // Calculate Dates (removed company creation as Company model doesn't exist in schema)
        const validGroupDataYear = groupData.year || 2026;
        const startDate = new Date(`${validGroupDataYear}-02-01`); // Feb 1st
        const endDate = addMonths(startDate, 12);

        // Create Group
        const groupName = groupData.groupName;
        const groupId = groupName
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
        const group = await prisma.group.upsert({
            where: { id: groupId },
            update: {
                startDate,
                endDate
            },
            create: {
                id: groupId,
                name: groupName,
                startDate,
                endDate,
                status: 'ACTIVE',
            },
        });
        console.log(`Group ensured: ${group.name}`);

        // Create Rollout Plan
        // Logic: Mod 1 (1mo), Mod 2 (1.5), Mod 3 (1.5), Mod 4 (1.5), Mod 5 (2), Mod 6 (2)
        const m1Start = startDate;
        const m1End = addMonths(m1Start, 1);
        const m2Start = addDays(m1End, 1);
        const m2End = addDays(addMonths(m2Start, 1), 15); // 1.5 months
        const m3Start = addDays(m2End, 1);
        const m3End = addDays(addMonths(m3Start, 1), 15);
        const m4Start = addDays(m3End, 1);
        const m4End = addDays(addMonths(m4Start, 1), 15);
        const m5Start = addDays(m4End, 1);
        const m5End = addMonths(m5Start, 2);
        const m6Start = addDays(m5End, 1);
        const m6End = addMonths(m6Start, 2);

        await prisma.groupRolloutPlan.upsert({
            where: { groupId: group.id },
            update: {},
            create: {
                groupId: group.id,
                module1StartDate: m1Start, module1EndDate: m1End,
                module2StartDate: m2Start, module2EndDate: m2End,
                module3StartDate: m3Start, module3EndDate: m3End,
                module4StartDate: m4Start, module4EndDate: m4End,
                module5StartDate: m5Start, module5EndDate: m5End,
                module6StartDate: m6Start, module6EndDate: m6End,
            }
        });

        // 3. Create Students
        for (const studentName of groupData.students) {
            const nameParts = studentName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            const studentId = `${groupData.year}${firstName.substring(0, 1)}${lastName.substring(0, 1)}${Math.floor(Math.random() * 1000)}`.toUpperCase();

            await prisma.student.upsert({
                where: { studentId: studentId }, // This might collide on re-runs if random, but acceptable for seed
                update: {
                    groupId: group.id,
                },
                create: {
                    studentId,
                    firstName,
                    lastName,
                    groupId: group.id,
                    facilitatorId: facilitator.id,
                    status: 'ACTIVE',
                },
            });
        }
        console.log(`Seeded ${groupData.students.length} students for ${group.name}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
