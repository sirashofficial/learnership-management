import fs from 'fs';

export interface LessonObjective {
    outcome: string;
    criteria: string[];
}

export interface LessonActivity {
    id: string;
    title: string;
    description: string;
}

export interface ParsedModule {
    unitStandards: {
        id: string;
        title: string;
        objectives: LessonObjective[];
        activities: LessonActivity[];
    }[];
}

export function parseLAGText(text: string): ParsedModule {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const module: ParsedModule = { unitStandards: [] };

    let currentUS: any = null;
    let currentSO: LessonObjective | null = null;
    let capturingAssignments = false;

    const STOP_KEYWORDS = [
        'Unit Standard Accreditation',
        'Learning Assumed',
        'Unit Standard Range',
        'Essential Embedded Knowledge',
        'Specific Outcome',
        '--'
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Ignore lines that look like Table of Contents entries
        if (line.includes('.............')) continue;

        // Detect Unit Standard
        const usMatch = line.match(/^UNIT STANDARD (\d+)$/i);
        if (usMatch) {
            const usId = usMatch[1];
            // Check if we already have this US with objectives
            const existing = module.unitStandards.find(u => u.id === usId && u.objectives.length > 0);

            if (!existing) {
                if (currentUS && currentUS.objectives.length > 0) {
                    module.unitStandards.push(currentUS);
                }

                // Find title - it's usually on the next line or the one after, and not a US match
                let titleLine = lines[i + 1] || '';
                if (titleLine.match(/^UNIT STANDARD/i) || titleLine.includes('---')) {
                    titleLine = lines[i + 2] || '';
                }
                if (titleLine.toLowerCase() === 'unit standard title') {
                    titleLine = lines[i + 2] || '';
                }

                currentUS = {
                    id: usId,
                    title: titleLine.replace(/-- \d+ of \d+ --/, '').trim(),
                    objectives: [],
                    activities: []
                };
            } else {
                currentUS = existing;
            }
            capturingAssignments = false;
            continue;
        }

        // Detect Specific Outcome
        if (line.match(/^Specific Outcome \d+/i)) {
            const outcomeTitle = lines[i + 1] || '';
            // Check if this outcome already exists for this US
            const existingSO = currentUS?.objectives.find((o: any) => o.outcome === outcomeTitle);

            if (!existingSO) {
                currentSO = {
                    outcome: outcomeTitle,
                    criteria: []
                };
                if (currentUS) currentUS.objectives.push(currentSO);
            } else {
                currentSO = existingSO;
            }
            i++; // Skip title line
            continue;
        }

        // Detect Assessment Criteria (bullet points)
        if (line.startsWith('Γ¥û') && currentSO) {
            const cleaned = line.replace('Γ¥û', '').trim();
            if (!currentSO.criteria.includes(cleaned)) {
                currentSO.criteria.push(cleaned);
            }
            continue;
        }

        // Stop criteria capture if we hit meta sections
        if (currentSO && STOP_KEYWORDS.some(k => line.includes(k))) {
            // Don't stop if it's "Specific Outcome" (it will be handled by the SO detector)
            if (!line.match(/^Specific Outcome \d+/i)) {
                currentSO = null;
            }
        }

        // Detect Workplace Assignments
        if (line.match(/^Workplace Assignments/i)) {
            capturingAssignments = true;
            continue;
        }

        // Match "Assignment X: Title"
        const assignmentMatch = line.match(/^Assignment (\d+): (.+)/i);
        if (assignmentMatch && capturingAssignments && currentUS) {
            const activityId = assignmentMatch[1];
            const activityTitle = assignmentMatch[2].replace(/\.+ \d+$/, '').trim();

            const existingAct = currentUS.activities.find((a: any) => a.id === activityId);
            if (!existingAct) {
                currentUS.activities.push({
                    id: activityId,
                    title: activityTitle,
                    description: ''
                });
            }
            continue;
        }

        // Simple descriptions for assignments
        if (capturingAssignments && currentUS && currentUS.activities.length > 0) {
            const lastActivity = currentUS.activities[currentUS.activities.length - 1];
            if (lastActivity.description.length < 1000) {
                if (line.startsWith('Activity')) {
                    lastActivity.description += '\n' + line;
                } else if (!line.includes('Assignment') &&
                    !line.includes('--') &&
                    !line.includes('UNIT STANDARD') &&
                    !line.includes('..........')) {
                    // Only append if it seems like content
                    if (line.length > 20) {
                        lastActivity.description += ' ' + line;
                    }
                }
            }
        }
    }

    // Final push if not already in
    if (currentUS && !module.unitStandards.find(u => u.id === currentUS.id)) {
        module.unitStandards.push(currentUS);
    }

    return module;
}
