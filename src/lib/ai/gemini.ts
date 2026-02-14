
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, ChatContext } from './zai'; // Reuse interfaces

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function chatWithGemini(
    messages: ChatMessage[],
    context: ChatContext,
    systemPrompt?: string
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Construct the full prompt including context and system instructions
        let fullPrompt = systemPrompt ? `${systemPrompt}\n\n` : '';

        // Add context documents
        if (context.documents.length > 0) {
            fullPrompt += "Reference Documents:\n";
            context.documents.forEach((doc, i) => {
                fullPrompt += `[Document ${i + 1}: ${doc.title}]\n${doc.content}\n[Source: ${doc.source}]\n\n`;
            });
            fullPrompt += "---\n\n";
        }

        if (context.studentInfo) {
            fullPrompt += `Student Information:\n- Name: ${context.studentInfo.name}\n- Current Module: ${context.studentInfo.currentModule}\n- Overall Progress: ${context.studentInfo.progress}%\n\n`;
        }

        // Add conversation history
        fullPrompt += "Conversation:\n";
        messages.forEach(msg => {
            fullPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
        });

        fullPrompt += "\nASSISTANT:";

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini Chat Error:', error);
        throw error;
    }
}
