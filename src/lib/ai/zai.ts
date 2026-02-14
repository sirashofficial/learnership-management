import OpenAI from 'openai';

// Initialize Z.AI client (using OpenAI compatibility)
// Base URL and Key will need to be confirmed for Z.AI specifically, 
// assuming standard OpenAI-compatible endpoint structure.
const zai = new OpenAI({
    apiKey: process.env.ZAI_API_KEY || '',
    baseURL: 'https://api.z.ai/api/paas/v4/',
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

    try {
        const response = await zai.chat.completions.create({
            model: 'glm-4',
            messages: [
                { role: 'system', content: systemPrompt || defaultSystemPrompt },
                ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            ],
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || "I couldn't generate a response.";
    } catch (error) {
        console.error('Z.AI Chat Error:', error);
        throw error;
    }
}

import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || 'plSwcLogGdpMGBstpusri2NdddalxTII13rOxtOa',
});

// Generate Embeddings using Cohere (1024 dimensions for embed-english-v3.0)
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await cohere.embed({
            model: 'embed-english-v3.0',
            texts: [text],
            inputType: 'search_document',
        });

        if (Array.isArray(response.embeddings) && response.embeddings.length > 0) {
            return response.embeddings[0] as number[];
        }
        throw new Error('No embedding returned from Cohere');
    } catch (error) {
        console.error('Cohere Embedding Error:', error);
        throw error;
    }
}
