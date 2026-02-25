import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { searchDocuments } from '@/lib/ai/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

type GenerationType = 'LESSON_PLAN' | 'ACTIVITIES' | 'AI_CONTENT';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'lesson-templates.json');

async function readTemplates(): Promise<any[]> {
  try {
    const text = await fs.readFile(TEMPLATES_FILE, 'utf8');
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function writeTemplates(templates: any[]): Promise<void> {
  await fs.mkdir(path.dirname(TEMPLATES_FILE), { recursive: true });
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
}

// ── GET /api/ai/generate-lesson?templateId=xxx ──────────────────────────────
// Returns a saved lesson template
async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const listAll = searchParams.get('list') === 'true';

    if (listAll) {
      const templates = await readTemplates();
      return successResponse({ templates });
    }

    if (!templateId) return errorResponse('templateId or list=true required', 400);

    const templates = await readTemplates();
    const template = templates.find((t) => t.id === templateId);

    if (!template) return errorResponse('Template not found', 404);
    return successResponse({ template });
  } catch (error) {
    return handleApiError(error);
  }
}

// ── DELETE /api/ai/generate-lesson?templateId=xxx ────────────────────────────
async function handleDelete(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    if (!templateId) return errorResponse('templateId required', 400);

    const templates = await readTemplates();
    const updated = templates.filter((t) => t.id !== templateId);
    await writeTemplates(updated);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

async function handlePost(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            unitStandardId,
            duration = 60,
            learningOutcomes,
            notes,
            groupId,
            generationType = 'LESSON_PLAN' as GenerationType,
            saveAsTemplate = false,
            templateName,
        } = body;

        if (!unitStandardId) {
            return errorResponse('Unit Standard ID is required', 400);
        }

        // ── Save template support ─────────────────────────────────────────────
        // If saveAsTemplate is set, save the current prompt config as a template
        if (saveAsTemplate && templateName) {
          const templates = await readTemplates();
          const newTemplate = {
            id: `tpl-${Date.now()}`,
            name: templateName,
            unitStandardId,
            duration,
            learningOutcomes,
            notes,
            generationType,
            createdAt: new Date().toISOString(),
          };
          templates.push(newTemplate);
          await writeTemplates(templates);
        }

        // Step 1: Load the unit standard details
        const unitStandard = await prisma.unitStandard.findUnique({
            where: { id: unitStandardId },
            include: {
                module: true,
            },
        });

        if (!unitStandard) {
            return errorResponse('Unit Standard not found', 404);
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

        // ── Route by generationType ────────────────────────────────────────────
        if (generationType === 'ACTIVITIES') {
          // Delegate to activities-style prompt embedded here
          const activitiesPrompt = `
You are a South African vocational training expert creating practical learning activities.
UNIT STANDARD: ${unitStandard.title} | CODE: ${unitStandard.code} | NQF LEVEL: ${unitStandard.level}
${documentContext !== 'No curriculum documents available. Use general training knowledge.' ? 'CURRICULUM CONTEXT:\n' + documentContext : ''}
${notes ? 'FACILITATOR NOTES: ' + notes : ''}

Create 5 varied learning activities covering STARTER, CORE, and EXTENSION levels.
Return ONLY a JSON array: [{"id":"act-1","title":"...","type":"GROUP","duration":20,"level":"CORE","description":"...","materials":[],"steps":[],"differentiation":"...","assessmentLink":"..."}]
`;
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(activitiesPrompt);
          const raw = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const activities = JSON.parse(raw);
          return successResponse({ activities, sourceDocuments, generationType });
        }

        if (generationType === 'AI_CONTENT') {
          // Generate enriched AI content / explanation for self-study
          const contentPrompt = `
You are a subject matter expert for South African learnership programmes.
Write comprehensive self-study content for:
UNIT STANDARD: ${unitStandard.title} (${unitStandard.code}) - NQF Level ${unitStandard.level}
${documentContext !== 'No curriculum documents available. Use general training knowledge.' ? 'CURRICULUM CONTENT:\n' + documentContext : ''}
${learningOutcomes ? 'KEY OUTCOMES: ' + learningOutcomes : ''}

Produce content structured as:
{"title":"...","introduction":"...","sections":[{"heading":"...","content":"...","keyPoints":[]}],"glossary":[{"term":"...","definition":"..."}],"selfAssessmentQuestions":["..."],"furtherReading":["..."]}
Return ONLY JSON.
`;
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(contentPrompt);
          const raw = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const content = JSON.parse(raw);
          return successResponse({ content, sourceDocuments, generationType });
        }

        // Default: LESSON_PLAN
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

export const GET = withAuth(withRateLimit(handleGet, 'generous'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(handleDelete, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
