import { NextRequest } from 'next/server';
import { chatWithContext, ChatMessage } from '@/lib/ai/cohere';
import { searchDocuments } from '@/lib/ai/pinecone';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

interface ChatRequest {
    messages: ChatMessage[];
    studentId?: string;
    moduleFilter?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { messages, studentId, moduleFilter } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return Response.json(
                { success: false, error: 'Messages array is required' },
                { status: 400 }
            );
        }

        // Get the latest user message for context retrieval
        const latestMessage = messages[messages.length - 1];
        if (latestMessage.role !== 'user') {
            return Response.json(
                { success: false, error: 'Last message must be from user' },
                { status: 400 }
            );
        }

        // Build filter for semantic search
        const filter: Record<string, number> = {};
        if (moduleFilter) {
            filter.moduleNumber = moduleFilter;
        }

        // Retrieve relevant documents using semantic search
        const searchResults = await searchDocuments(
            latestMessage.content,
            5,
            Object.keys(filter).length > 0 ? filter : undefined
        );

        // Format documents for context
        const documents = searchResults.map((result) => ({
            title: result.metadata.filename || 'Curriculum Document',
            content: result.content,
            source: `${result.metadata.category || 'general'} - ${result.metadata.moduleName || 'NVC L2'}`,
        }));

        // Get student info if provided
        let studentInfo = undefined;
        if (studentId) {
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    currentModule: true,
                    moduleProgress: {
                        include: { module: true },
                    },
                },
            });

            if (student) {
                const currentModuleName = student.currentModule?.name || 'Not assigned';
                studentInfo = {
                    name: `${student.firstName} ${student.lastName}`,
                    currentModule: currentModuleName,
                    progress: student.progress,
                };
            }
        }

        // Generate response with context
        const response = await chatWithContext(
            messages,
            { documents, studentInfo }
        );

        // Return the response with source documents
        return successResponse({
            response,
            sources: searchResults.map((result) => ({
                id: result.id,
                filename: result.metadata.filename,
                category: result.metadata.category,
                moduleName: result.metadata.moduleName,
                relevanceScore: result.score,
                preview: result.content.substring(0, 200) + '...',
            })),
            context: {
                documentsUsed: documents.length,
                studentContext: studentInfo ? true : false,
            },
        });
    } catch (error) {
        console.error('AI Chat error:', error);
        return handleApiError(error);
    }
}
