
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FILE_PATH = 'all_learnership_groups.md';

async function main() {
    console.log('Reading groups from markdown...');

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        return;
    }

    // 1. Get or Create a Default Facilitator
    let facilitator = await prisma.user.findFirst({
        where: { role: 'FACILITATOR' }
    });

    if (!facilitator) {
        console.log('No facilitator found. Creating default System Admin facilitator...');
        facilitator = await prisma.user.create({
            data: {
                name: 'System Admin',
                email: 'admin@system.local',
                password: 'hashed_password_placeholder', // In a real app, hash this
                role: 'FACILITATOR'
            }
        });
    }
    console.log(`Using Facilitator: ${facilitator.name} (${facilitator.id})`);

    const content = fs.readFileSync(FILE_PATH, 'utf-8');
    const lines = content.split('\n');

    let currentGroup: string | null = null;
    let currentCompany: string | null = null;
    let currentGroupId: string | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Group Header: "## CITY LOGISTICS (LP) - 2026"
        if (trimmed.startsWith('##')) {
            const groupNameRaw = trimmed.replace(/^##\s*/, '').trim();
            currentGroup = groupNameRaw;

            // Extract Company Name
            const companyMatch = groupNameRaw.match(/^(.*?)\(/);
            currentCompany = companyMatch ? companyMatch[1].trim() : groupNameRaw;
            if (!currentCompany) currentCompany = groupNameRaw;
            console.log(`\nProcessing Group: ${currentGroup}`);

            try {
                // Ensure Group Exists
                let group = await prisma.group.findFirst({
                    where: { name: currentGroup }
                });

                if (!group) {
                    group = await prisma.group.create({
                        data: {
                            name: currentGroup,
                            startDate: new Date('2026-01-01'),
                            endDate: new Date('2026-12-31'),
                            status: 'ACTIVE'
                        }
                    });
                    console.log(`  Created Group: ${currentGroup}`);
                    currentGroupId = group.id;
                } else {
                    console.log(`  Group exists: ${currentGroup}`);
                    currentGroupId = group.id;
                }

            } catch (e) {
                console.error(`  Error processing group ${currentGroup}:`, e);
                currentGroupId = null;
            }
            continue;
        }

        // Student Line: "1. Zamasomi Msomi"
        const studentMatch = trimmed.match(/^\d+\.\s*(.+)/);
        if (studentMatch && currentGroupId) {
            const fullName = studentMatch[1].trim();
            const names = fullName.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ') || '.';

            try {
                const existingStudent = await prisma.student.findFirst({
                    where: {
                        firstName: firstName,
                        lastName: lastName,
                        groupId: currentGroupId
                    }
                });

                if (!existingStudent) {
                    await prisma.student.create({
                        data: {
                            firstName,
                            lastName,
                            groupId: currentGroupId,
                            studentId: `ST${Math.floor(Math.random() * 100000)}`,
                            status: 'ACTIVE',
                            facilitatorId: facilitator.id
                        }
                    });
                    console.log(`    Added Student: ${fullName}`);
                }
            } catch (e) {
                console.error(`    Error adding student ${fullName}:`, e);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
