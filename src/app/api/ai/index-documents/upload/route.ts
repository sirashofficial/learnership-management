import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { upsertDocuments } from '@/lib/ai/pinecone';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { generateEmbedding } from '@/lib/ai/cohere';

export const dynamic = 'force-dynamic';

// Helper to split text into chunks
function splitIntoChunks(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = '';

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            // Start new chunk with overlap
            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(words.length * 0.1));
            currentChunk = overlapWords.join(' ') + ' ' + sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// Extract text from PDF
async function extractPDFText(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

// Extract text from Word document
async function extractWordText(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error('Word extraction error:', error);
        throw new Error('Failed to extract text from Word document');
    }
}

// Extract text based on file type
async function extractText(buffer: Buffer, filename: string): Promise<string> {
    const ext = filename.toLowerCase().split('.').pop();
    
    switch (ext) {
        case 'pdf':
            return extractPDFText(buffer);
        case 'doc':
        case 'docx':
            return extractWordText(buffer);
        case 'txt':
            return buffer.toString('utf-8');
        default:
            throw new Error(`Unsupported file type: ${ext}`);
    }
}

// POST: Upload and index documents
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const category = formData.get('category') as string || 'other';
        const description = formData.get('description') as string || '';

        if (!files || files.length === 0) {
            return Response.json(
                { success: false, error: 'No files provided' },
                { status: 400 }
            );
        }

        const results = [];

        for (const file of files) {
            try {
                // Get file buffer
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Extract text from file
                const text = await extractText(buffer, file.name);

                if (!text || text.trim().length < 50) {
                    throw new Error('Document has insufficient text content');
                }

                // Split into chunks
                const chunks = splitIntoChunks(text, 1000, 100);

                // Create document record
                const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;

                // Store chunks in database
                const chunkRecords = [];
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = await prisma.documentChunk.create({
                        data: {
                            id: `${documentId}-chunk-${i}`,
                            content: chunks[i],
                            filename: file.name,
                            filePath: `uploads/${file.name}`,
                            category,
                            tags: description ? description.split(',').map(t => t.trim()).join(',') : '',
                            chunkIndex: i,
                        },
                    });
                    chunkRecords.push(chunk);
                }

                // Index in Pinecone
                const pineconeRecords = chunkRecords.map((chunk) => ({
                    id: chunk.id,
                    text: chunk.content,
                    metadata: {
                        filename: chunk.filename,
                        category: chunk.category,
                        tags: chunk.tags.split(',').filter(Boolean),
                        chunkIndex: chunk.chunkIndex,
                        totalChunks: chunks.length,
                        createdAt: chunk.createdAt.toISOString(),
                    },
                }));

                await upsertDocuments(pineconeRecords);

                results.push({
                    filename: file.name,
                    success: true,
                    chunks: chunks.length,
                    documentId,
                });
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                results.push({
                    filename: file.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return successResponse({
            message: 'Files processed',
            results,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return handleApiError(error);
    }
}
