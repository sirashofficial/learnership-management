
import { NextRequest, NextResponse } from 'next/server';
import { searchDocuments } from '@/lib/ai/pinecone';
import { chatWithContext } from '@/lib/ai/cohere';
import { handleApiError, successResponse } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            date,
            groupIds,
            facilitator,
            groupTrainingData,
            observations,
            challengesFaced
        } = body;

        if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Group IDs array is required' },
                { status: 400 }
            );
        }

        // 1. Search for the Exemplar in Pinecone
        const searchResults = await searchDocuments("daily report exemplar format", 3);
        const exemplarDoc = searchResults.find(doc =>
            doc.metadata &&
            doc.metadata.filename &&
            String(doc.metadata.filename).toLowerCase().includes('daily report')
        ) || searchResults[0];

        const exemplarContent = exemplarDoc ? exemplarDoc.content : "No exemplar found.";

        // 2. Construct the Prompt for multiple groups with their specific training data
        const systemPrompt = `You are an expert educational administrator for the YEHA Learnership Management System.
Your task is to generate a professional Daily Training Report for multiple groups based on the raw input provided.
CRITICAL: You must strictly follow the format and tone of the provided "Daily Report Exemplar".

Format Requirements:
- Use Markdown for structure.
- Create a main heading using # for the date
- For each group, create a subheading using ##
- Use the exact section headings found in the exemplar (e.g., "STUDENT ENGAGEMENT", "HOMEWORK ASSIGNED", "DISCIPLINARY MATTERS").
- Map the input data to these sections creatively but accurately:
    - 'Observations' -> 'NOTABLE MOMENTS' / 'STUDENT ENGAGEMENT'
    - 'Challenges' -> 'DISCIPLINARY MATTERS' (if negative) or 'CHALLENGES'
    - 'Activities' -> 'WORKPLACE IMPLEMENTATION' or 'ACTIVITIES'
- Each group may have different modules/topics - respect these differences in the report
- If a specific field like "Energy Level" is not provided, infer it from the tone of the observations or default to "High" if positive.
- Do not invent fictional events, but you may expand on the provided points to sound professional.
- Generate separate sections for each group, clearly labeled with the group name.
`;

        // Build per-group training data string
        const groupTrainingDetails = Object.entries(groupTrainingData || {})
            .map(([groupId, data]: [string, any]) => `
Group: ${groupId}
- Modules: ${data.modulesCovered}
- Topics/US: ${data.topicsCovered}
- Activities: ${JSON.stringify(data.activitiesCompleted)}
`)
            .join('\n');

        const userPrompt = `
Please generate Daily Reports for multiple groups on:
Date: ${date}
Facilitator: ${facilitator}

Per-Group Training Data:
${groupTrainingDetails}

Common Input Data (for all groups):
- General Observations: ${observations}
- Challenges/Incidents: ${challengesFaced}

Note: Each group has different training modules and topics. Generate a report with clear sections for each group that reflects their specific training content.

Reference Exemplar Content (Use this format):
---
${exemplarContent}
---

Generate a report with clear sections for each group, reflecting their specific modules and topics.
`;

        // 3. Generate Report
        const generatedReport = await chatWithContext(
            [{ role: 'user', content: userPrompt }],
            {
                documents: exemplarDoc ? [{
                    title: 'Daily Report Exemplar',
                    content: exemplarContent,
                    source: 'Knowledge Base'
                }] : []
            },
            systemPrompt
        );

        return successResponse({
            report: generatedReport,
            exemplarUsed: exemplarDoc ? exemplarDoc.metadata.filename : 'None',
            groupCount: groupIds.length
        });

    } catch (error) {
        console.error('AI Report Generation Error:', error);
        return handleApiError(error);
    }
}
