
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mammoth from 'mammoth';

// @ts-ignore
const pdf = require('pdf-parse');

/**
 * Extract individual unit standards from parsed text
 * Looks for patterns like: Unit Standard 7480: [...] \n Start Date: ... End Date: ... etc
 */
function parseUnitStandards(text: string): any[] {
    const unitStandards: any[] = [];
    
    // Pattern to find unit standard blocks: "Unit Standard XXXX: ..."
    const unitPattern = /Unit\s+Standard\s+(\d+):([^\n]*)/gi;
    let match;
    
    while ((match = unitPattern.exec(text)) !== null) {
        const code = match[1];
        const title = match[2].trim();
        
        // Find the next unit standard or end of text to get this unit's section
        const startPos = match.index;
        let endPos = text.length;
        
        const nextUnitMatch = unitPattern.exec(text);
        if (nextUnitMatch) {
            endPos = nextUnitMatch.index;
            // Reset lastIndex since exec() moves it forward
            unitPattern.lastIndex = startPos;
        }
        
        const sectionText = text.substring(startPos, endPos);
        
        // Extract dates from this unit standard section
        // Pattern: "Date Label: DD/MM/YYYY"
        const startDateMatch = /Start\s+Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(sectionText);
        const endDateMatch = /End\s+Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(sectionText);
        const summativeDateMatch = /Summative\s+Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(sectionText);
        const assessingDateMatch = /Assessing\s+Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(sectionText);
        const creditsMatch = /Credits?:\s*(\d+)/i.exec(sectionText);
        
        // Format dates as DD/MM/YYYY strings
        const formatDateString = (match: RegExpExecArray | null): string | null => {
            if (!match) return null;
            const [, day, month, year] = match;
            return `${day}/${month}/${year}`;
        };
        
        if (startDateMatch && endDateMatch && assessingDateMatch) {
            unitStandards.push({
                code,
                startDate: formatDateString(startDateMatch),
                endDate: formatDateString(endDateMatch),
                summativeDate: formatDateString(summativeDateMatch),
                assessingDate: formatDateString(assessingDateMatch),
                credits: creditsMatch ? parseInt(creditsMatch[1], 10) : 0,
            });
        }
    }
    
    return unitStandards;
}

/**
 * Extract workplace activity end dates for each module
 * Pattern: "Workplace Activity: DD/MM/YYYY – DD/MM/YYYY"
 */
function parseWorkplaceActivityEndDates(text: string): Map<number, string> {
    const dates = new Map<number, string>();
    
    // Find each module section
    for (let moduleNum = 1; moduleNum <= 6; moduleNum++) {
        const moduleRegex = new RegExp(`MODULE\\s*${moduleNum}`, 'i');
        const nextModuleRegex = new RegExp(`MODULE\\s*${moduleNum + 1}`, 'i');
        
        const startIdx = text.search(moduleRegex);
        if (startIdx === -1) continue;
        
        let endIdx = text.search(nextModuleRegex);
        if (endIdx === -1) endIdx = text.length;
        
        const moduleText = text.substring(startIdx, endIdx);
        
        // Look for workplace activity dates in this module
        // Pattern: "Workplace Activity: DD/MM/YYYY – DD/MM/YYYY"
        const workplaceMatch = /Workplace\s+Activity:\s*(\d{2})\/(\d{2})\/(\d{4})\s*[–\-]\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(moduleText);
        
        if (workplaceMatch) {
            // Capture the end date (second date)
            const [, , , , endDay, endMonth, endYear] = workplaceMatch;
            const endDateStr = `${endDay}/${endMonth}/${endYear}`;
            dates.set(moduleNum, endDateStr);
        }
    }
    
    return dates;
}

/**
 * Organize unit standards by module number
 */
function organizeUnitsByModule(unitStandards: any[]): Map<number, any[]> {
    const moduleMap = new Map<number, any[]>();
    
    // Initialize modules 1-6
    for (let i = 1; i <= 6; i++) {
        moduleMap.set(i, []);
    }
    
    // Group units by module (infer from position or order, defaulting to sequential assignment)
    const unitsPerModule = Math.ceil(unitStandards.length / 6);
    unitStandards.forEach((unit, index) => {
        const moduleNum = Math.floor(index / unitsPerModule) + 1;
        if (moduleNum <= 6) {
            moduleMap.get(moduleNum)?.push(unit);
        }
    });
    
    return moduleMap;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const groupId = formData.get('groupId') as string; // New: group ID
        const groupName = formData.get('groupName') as string;
        const facilitatorId = formData.get('facilitatorId') as string; // Optional

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'File is required' },
                { status: 400 }
            );
        }

        if (!groupId && !groupName) {
            return NextResponse.json(
                { success: false, error: 'Group ID or Group Name is required' },
                { status: 400 }
            );
        }

        console.log(`Processing upload for group: ${groupName} (${groupId}), file: ${file.name}`);

        // 1. Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 2. Extract Text
        let text = '';
        if (file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (file.name.endsWith('.pdf')) {
            const data = await pdf(buffer);
            text = data.text;
        } else {
            return NextResponse.json(
                { success: false, error: 'Only .docx and .pdf files are supported' },
                { status: 400 }
            );
        }

        // 3. Parse unit standards and workplace dates
        const unitStandards = parseUnitStandards(text);
        const workplaceActivityDates = parseWorkplaceActivityEndDates(text);
        const moduleMap = organizeUnitsByModule(unitStandards);

        // 4. Build the rollout plan JSON (for group.notes)
        const modules: any[] = [];
        
        for (let moduleNum = 1; moduleNum <= 6; moduleNum++) {
            const moduleUnits = moduleMap.get(moduleNum) || [];
            if (moduleUnits.length === 0) continue; // Skip empty modules
            
            const workplaceEndDate = workplaceActivityDates.get(moduleNum) || null;
            
            const moduleObj: any = {
                moduleNumber: moduleNum,
                unitStandards: moduleUnits,
            };
            
            if (workplaceEndDate) {
                moduleObj.workplaceActivityEndDate = workplaceEndDate;
            }
            
            modules.push(moduleObj);
        }

        // Build the full rollout plan object
        const rolloutPlan = {
            modules: modules.length > 0 ? modules : [],
        };

        // 5. Create or update Group with notes
        let existingGroup = null;

        // Try to find by groupId first, then by groupName
        if (groupId) {
            existingGroup = await prisma.group.findUnique({
                where: { id: groupId }
            });
        }

        if (!existingGroup && groupName) {
            existingGroup = await prisma.group.findFirst({
                where: { name: groupName }
            });
        }

        let resolvedGroupName = groupName || existingGroup?.name || 'Unnamed Group';
        let actualGroupId = groupId || existingGroup?.id;
        const notesJson = JSON.stringify({ rolloutPlan });

        if (!existingGroup) {
            // Create new group with notes
            const newGroup = await prisma.group.create({
                data: {
                    name: resolvedGroupName,
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    status: 'ACTIVE',
                    notes: notesJson,
                }
            });
            actualGroupId = newGroup.id;
            console.log(`Created new group: ${actualGroupId} with rollout plan`);
        } else {
            // Update existing group with notes
            await prisma.group.update({
                where: { id: existingGroup.id },
                data: { notes: notesJson }
            });
            actualGroupId = existingGroup.id;
            console.log(`Updated existing group: ${actualGroupId} with rollout plan`);
        }

        // 6. Also update GroupRolloutPlan table (for backward compatibility)
        const planUpdates: any = {};
        let datesFound = false;

        for (let i = 1; i <= 6; i++) {
            const currentModuleRegex = new RegExp(`MODULE\\s*${i}`, 'i');
            const nextModuleRegex = new RegExp(`MODULE\\s*${i + 1}`, 'i');

            const startIdx = text.search(currentModuleRegex);
            if (startIdx === -1) continue;

            let endIdx = text.search(nextModuleRegex);
            if (endIdx === -1) endIdx = text.length;

            const sectionText = text.substring(startIdx, endIdx);

            // DD/MM/YYYY
            const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/g;
            const dates: Date[] = [];
            let match;

            while ((match = dateRegex.exec(sectionText)) !== null) {
                const [_, day, month, year] = match;
                dates.push(new Date(`${year}-${month}-${day}`));
            }

            if (dates.length > 0) {
                dates.sort((a, b) => a.getTime() - b.getTime());
                planUpdates[`module${i}StartDate`] = dates[0];
                planUpdates[`module${i}EndDate`] = dates[dates.length - 1];
                datesFound = true;
            }
        }

        if (actualGroupId) {
            if (planUpdates.module1StartDate) {
                await prisma.group.update({
                    where: { id: actualGroupId },
                    data: { startDate: planUpdates.module1StartDate }
                });
            }

            await prisma.groupRolloutPlan.upsert({
                where: { groupId: actualGroupId },
                create: {
                    groupId: actualGroupId,
                    rolloutDocPath: file.name,
                    ...planUpdates
                },
                update: {
                    rolloutDocPath: file.name,
                    ...planUpdates
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: existingGroup ? 'Group updated with rollout plan' : 'Group created with rollout plan',
            groupId: actualGroupId,
            unitStandardsFound: unitStandards.length,
            modulesProcessed: modules.length,
        });

    } catch (error) {
        console.error('Error uploading group rollout:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process upload' },
            { status: 500 }
        );
    }
}
