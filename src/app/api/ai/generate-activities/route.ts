import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export interface ActivityIdea {
  id: string;
  title: string;
  type: 'INDIVIDUAL' | 'PAIR' | 'GROUP' | 'WHOLE_CLASS' | 'PRACTICAL';
  duration: number;
  level: 'STARTER' | 'CORE' | 'EXTENSION';
  description: string;
  materials: string[];
  steps: string[];
  differentiation?: string;
  assessmentLink?: string;
}

/**
 * POST /api/ai/generate-activities
 * Body: { unitStandardId, count?, difficulty?, sessionType? }
 * Returns a list of creative activity ideas for the given unit standard.
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      unitStandardId,
      count = 5,
      sessionType = 'mixed', // mixed | classroom | workplace | practical
      difficulty = 'mixed',  // mixed | starter | core | extension
    } = body;

    if (!unitStandardId) {
      return errorResponse('unitStandardId is required', 400);
    }

    const unitStandard = await prisma.unitStandard.findUnique({
      where: { id: unitStandardId },
      include: { module: true },
    });

    if (!unitStandard) {
      return errorResponse('Unit Standard not found', 404);
    }

    const prompt = `
You are a South African vocational training expert creating practical learning activities.

UNIT STANDARD: ${unitStandard.title}
CODE: ${unitStandard.code}
NQF LEVEL: ${unitStandard.level}
CREDITS: ${unitStandard.credits}
TYPE: ${unitStandard.type}
MODULE: ${unitStandard.module?.name || 'N/A'}
REQUESTED COUNT: ${count}
SESSION TYPE FOCUS: ${sessionType}
DIFFICULTY MIX: ${difficulty}

Create ${count} varied, practical learning activities for this unit standard. Include a mix of:
- Individual, pair, group, whole-class, and practical activities
- Starter activities (introduction/warm-up), core activities (main learning), and extension activities
- Activities suited to South African workplace learnership contexts

IMPORTANT: Return ONLY a JSON array with this exact structure:
[
  {
    "id": "act-1",
    "title": "Activity title",
    "type": "INDIVIDUAL|PAIR|GROUP|WHOLE_CLASS|PRACTICAL",
    "duration": 20,
    "level": "STARTER|CORE|EXTENSION",
    "description": "Clear description of what learners do",
    "materials": ["Item 1", "Item 2"],
    "steps": ["Step 1", "Step 2", "Step 3"],
    "differentiation": "How to adapt for learners needing extra support",
    "assessmentLink": "How this activity links to assessment criteria"
  }
]

Return ONLY the JSON array, no markdown, no additional text.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    let activities: ActivityIdea[];
    try {
      const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      activities = JSON.parse(jsonText);
      if (!Array.isArray(activities)) throw new Error('Expected array');
    } catch {
      throw new Error('AI returned invalid JSON for activities');
    }

    return successResponse({
      activities,
      unitStandardCode: unitStandard.code,
      unitStandardTitle: unitStandard.title,
    });
  } catch (error) {
    console.error('Generate activities error:', error);
    return handleApiError(error);
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
