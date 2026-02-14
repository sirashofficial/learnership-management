import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { searchDocuments } from '@/lib/ai/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            unitStandardId,
            duration = 60,
            learningOutcomes,
            notes,
            groupId,
        } = body;

        if (!unitStandardId) {
            return Response.json(
                { success: false, error: 'Unit Standard ID is required' },
                { status: 400 }
            );
        }

        // Step 1: Load the unit standard details
        const unitStandard = await prisma.unitStandard.findUnique({
            where: { id: unitStandardId },
            include: {
                module: true,
            },
        });

        if (!unitStandard) {
            return Response.json(
                { success: false, error: 'Unit Standard not found' },
                { status: 404 }
            );
        }

        // Step 2: Search documents for relevant content
        const searchQuery = `${unitStandard.title} ${unitStandard.code} ${unitStandard.type} learning outcomes activities assessment criteria`;
        
        let relevantDocs: any[] = [];
        try {
            relevantDocs = await searchDocuments(searchQuery, 5);
        } catch (searchError) {
            console.warn('Document search failed, continuing without documents:', searchError);
        }

        // Step 3: Build document context
        const documentContext = relevantDocs.length > 0
            ? relevantDocs.map(doc => 
                `--- From: ${doc.metadata.filename} (Relevance: ${(doc.score * 100).toFixed(0)}%) ---\n${doc.content}\n`
              ).join('\n')
            : 'No curriculum documents available. Use general training knowledge.';

        const sourceDocuments = relevantDocs.map(doc => doc.metadata.filename);

        // Step 4: Build AI prompt
        const prompt = `
You are creating a detailed lesson plan for a South African learnership programme (NQF Level 2).
${relevantDocs.length > 0 ? 'Use the curriculum content below to create an accurate, specific lesson plan. Base everything on the provided documents.' : 'Create a comprehensive lesson plan based on best practices in vocational training.'}

UNIT STANDARD: ${unitStandard.title}
UNIT STANDARD CODE: ${unitStandard.code}
NQF LEVEL: ${unitStandard.level}
CREDITS: ${unitStandard.credits}
TYPE: ${unitStandard.type}
MODULE: ${unitStandard.module?.name || 'N/A'}
DURATION: ${duration} minutes
${learningOutcomes ? 'SPECIFIC LEARNING OUTCOMES: ' + learningOutcomes : ''}
${notes ? 'FACILITATOR NOTES: ' + notes : ''}

CURRICULUM CONTENT FROM DOCUMENTS:
${documentContext}

Generate a detailed, practical lesson plan with these sections:

1. LESSON OVERVIEW (title, duration, key outcomes)
2. INTRODUCTION / WARM-UP (${Math.round(duration * 0.15)} minutes) - Engage learners and activate prior knowledge
3. MAIN CONTENT / INSTRUCTION (${Math.round(duration * 0.45)} minutes) - Core teaching and demonstration
4. ACTIVITY / PRACTICE (${Math.round(duration * 0.25)} minutes) - Hands-on practice or group work
5. ASSESSMENT / CHECK FOR UNDERSTANDING (${Math.round(duration * 0.10)} minutes) - Formative assessment
6. WRAP-UP / CLOSING (${Math.round(duration * 0.05)} minutes) - Summary and homework
7. RESOURCES NEEDED - Materials, equipment, handouts
8. DIFFERENTIATION NOTES - Support for learners who need extra help

FORMAT YOUR RESPONSE AS JSON with this exact structure:
{
  "title": "Lesson title here",
  "overview": "Brief overview paragraph",
  "duration": ${duration},
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
  "introduction": {
    "duration": ${Math.round(duration * 0.15)},
    "content": "What the facilitator does",
    "activities": ["Activity 1", "Activity 2"]
  },
  "mainContent": {
    "duration": ${Math.round(duration * 0.45)},
    "content": "Core teaching content and concepts",
    "activities": ["Teaching activity 1", "Demonstration 2"]
  },
  "activity": {
    "duration": ${Math.round(duration * 0.25)},
    "instructions": "Step-by-step activity instructions",
    "groupWork": true/false
  },
  "assessment": {
    "duration": ${Math.round(duration * 0.10)},
    "method": "Assessment method description",
    "questions": ["Question 1", "Question 2", "Question 3"]
  },
  "wrapUp": {
    "duration": ${Math.round(duration * 0.05)},
    "content": "Closing activities and summary"
  },
  "resources": ["Resource 1", "Resource 2", "Resource 3"],
  "differentiationNotes": "How to support diverse learners"
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no additional text.
`;

        // Step 5: Call AI (using Gemini)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // Parse JSON from response
        let lessonPlan;
        try {
            // Remove markdown code blocks if present
            const jsonText = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            lessonPlan = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', aiResponse);
            throw new Error('AI generated invalid JSON response');
        }

        // Add source documents to the plan
        lessonPlan.sourceDocuments = sourceDocuments;
        lessonPlan.unitStandardCode = unitStandard.code;
        lessonPlan.unitStandardTitle = unitStandard.title;
        lessonPlan.hasDocumentSupport = relevantDocs.length > 0;

        return successResponse({
            lessonPlan,
            message: relevantDocs.length > 0 
                ? `Lesson plan generated using ${relevantDocs.length} curriculum documents`
                : 'Lesson plan generated using general AI knowledge (no documents indexed)',
        });
    } catch (error) {
        console.error('Generate lesson error:', error);
        return handleApiError(error);
    }
}
