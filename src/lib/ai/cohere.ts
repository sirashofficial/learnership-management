import { CohereClient } from 'cohere-ai';

// Initialize Cohere client
const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || '',
});

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatContext {
    documents: Array<{
        title: string;
        content: string;
        source: string;
    }>;
    studentInfo?: {
        name: string;
        currentModule: string;
        progress: number;
    };
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const response = await cohere.embed({
        texts: [text],
        model: 'embed-english-v3.0',
        inputType: 'search_query',
    });

    // @ts-ignore
    return response.embeddings[0] as number[];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await cohere.embed({
        texts,
        model: 'embed-english-v3.0',
        inputType: 'search_document',
    });

    // @ts-ignore
    return response.embeddings as number[][];
}

export async function chatWithContext(
    messages: ChatMessage[],
    context: ChatContext,
    systemPrompt?: string
): Promise<string> {
    // Build the context string from documents
    const documentContext = context.documents
        .map((doc, i) => `[Document ${i + 1}: ${doc.title}]\n${doc.content}\n[Source: ${doc.source}]`)
        .join('\n\n---\n\n');

    // Build student context if available
    const studentContext = context.studentInfo
        ? `\n\nStudent Information:\n- Name: ${context.studentInfo.name}\n- Current Module: ${context.studentInfo.currentModule}\n- Overall Progress: ${context.studentInfo.progress}%`
        : '';

    const defaultSystemPrompt = `You are an AI assistant for the YEHA Learnership Management System, helping facilitators and students with the NVC Level 2 qualification training program.

You have access to curriculum documents, training materials, and assessment guidelines. Use this context to provide accurate, helpful responses.

${documentContext}
${studentContext}

Guidelines:
1. Always base your answers on the provided curriculum documents when available
2. Be specific about module numbers, unit standards, and credit values when relevant
3. If you're unsure about something, acknowledge the limitation
4. Suggest relevant resources or next steps when appropriate
5. Use a professional but friendly tone suitable for vocational training
6. When discussing assessments, distinguish between formative and summative types`;

    const response = await cohere.chat({
        model: 'command-r-plus',
        message: messages[messages.length - 1].content,
        chatHistory: messages.slice(0, -1).map((msg) => ({
            role: msg.role === 'user' ? 'USER' as const : 'CHATBOT' as const,
            message: msg.content,
        })),
        preamble: systemPrompt || defaultSystemPrompt,
        temperature: 0.7,
        connectors: [],
    });

    return response.text;
}

export async function generateAssessmentQuestions(
    unitStandardCode: string,
    unitStandardTitle: string,
    context: string,
    assessmentType: 'formative' | 'summative',
    count: number = 5
): Promise<Array<{
    question: string;
    type: 'multiple_choice' | 'short_answer' | 'practical';
    options?: string[];
    correctAnswer?: string;
    rubric?: string;
}>> {
    const prompt = `Generate ${count} ${assessmentType} assessment questions for:

Unit Standard: ${unitStandardCode} - ${unitStandardTitle}

Context from curriculum materials:
${context}

Requirements:
1. Questions should test understanding of specific outcomes for this unit standard
2. For formative assessments, focus on knowledge checks and self-assessment
3. For summative assessments, include more comprehensive, competency-based questions
4. Include a mix of question types: multiple choice, short answer, and practical/observation
5. For multiple choice: provide 4 options with one correct answer
6. For short answer: provide a brief rubric for marking
7. For practical: describe the observable behavior or evidence required

Format your response as a JSON array with objects containing:
- question: the question text
- type: "multiple_choice" | "short_answer" | "practical"
- options: (for multiple choice) array of 4 options
- correctAnswer: (for multiple choice) the correct option
- rubric: (for short answer/practical) marking criteria

Return ONLY the JSON array, no other text.`;

    const response = await cohere.chat({
        model: 'command-r-plus',
        message: prompt,
        temperature: 0.5,
    });

    try {
        // Extract JSON from response
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON array found in response');
    } catch {
        console.error('Failed to parse assessment questions:', response.text);
        throw new Error('Failed to generate assessment questions');
    }
}

export async function summarizeProgress(
    studentName: string,
    moduleProgress: Array<{
        moduleName: string;
        progress: number;
        status: string;
        completedUnitStandards: number;
        totalUnitStandards: number;
    }>,
    recentAssessments: Array<{
        unitStandard: string;
        result: string;
        type: string;
        date: string;
    }>
): Promise<{
    summary: string;
    recommendations: string[];
    strengths: string[];
    areasForImprovement: string[];
}> {
    const prompt = `Analyze the following student progress and provide insights:

Student: ${studentName}

Module Progress:
${moduleProgress.map((m) => `- ${m.moduleName}: ${m.progress}% (${m.status}) - ${m.completedUnitStandards}/${m.totalUnitStandards} unit standards completed`).join('\n')}

Recent Assessments:
${recentAssessments.map((a) => `- ${a.unitStandard}: ${a.result} (${a.type}) on ${a.date}`).join('\n')}

Provide a JSON response with:
1. summary: A brief overview of the student's progress
2. recommendations: 2-3 specific action items to help them progress
3. strengths: Areas where the student is performing well
4. areasForImprovement: Areas that need attention

Return ONLY the JSON object.`;

    const response = await cohere.chat({
        model: 'command-r-plus',
        message: prompt,
        temperature: 0.3,
    });

    try {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON object found in response');
    } catch {
        return {
            summary: `${studentName} is progressing through the NVC Level 2 qualification.`,
            recommendations: ['Continue with current module', 'Complete pending assessments'],
            strengths: ['Regular attendance', 'Engagement with materials'],
            areasForImprovement: ['Complete more unit standards'],
        };
    }
}

export async function getDocumentRecommendations(
    currentModule: string,
    completedTopics: string[],
    strugglingAreas: string[]
): Promise<Array<{
    topic: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}>> {
    const prompt = `Based on the following learning context, recommend curriculum topics to focus on:

Current Module: ${currentModule}
Completed Topics: ${completedTopics.join(', ') || 'None'}
Areas of Difficulty: ${strugglingAreas.join(', ') || 'None identified'}

Provide 3-5 topic recommendations as a JSON array with:
- topic: The topic name
- reason: Why this topic is recommended
- priority: "high", "medium", or "low"

Return ONLY the JSON array.`;

    const response = await cohere.chat({
        model: 'command-r-plus',
        message: prompt,
        temperature: 0.4,
    });

    try {
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON array found in response');
    } catch {
        return [
            { topic: 'Current Unit Standard Content', reason: 'Continue with current learning', priority: 'high' },
            { topic: 'Review Previous Material', reason: 'Reinforce foundational knowledge', priority: 'medium' },
        ];
    }
}

export { cohere };
