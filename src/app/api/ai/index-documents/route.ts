import { NextRequest } from 'next/server';
import { getIndexStats, upsertDocuments } from '@/lib/ai/pinecone';
import { successResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// Categorize document based on path
function categorizeDocument(filePath: string): { category: string; moduleNumber?: number; tags: string[] } {
    const normalizedPath = filePath.toLowerCase();
    const tags: string[] = [];
    let category = 'general';
    let moduleNumber: number | undefined;

    if (normalizedPath.includes('module') || normalizedPath.includes('mod')) {
        const moduleMatch = normalizedPath.match(/mod(?:ule)?[_\-\s]?(\d)/i);
        if (moduleMatch) {
            moduleNumber = parseInt(moduleMatch[1]);
            category = `module-${moduleNumber}`;
            tags.push(`module-${moduleNumber}`);
        }
    }

    if (normalizedPath.includes('assessment') || normalizedPath.includes('formative') || normalizedPath.includes('summative')) {
        tags.push('assessment');
        if (normalizedPath.includes('formative')) tags.push('formative');
        if (normalizedPath.includes('summative')) tags.push('summative');
    }

    if (normalizedPath.includes('lesson') || normalizedPath.includes('training')) {
        tags.push('lesson-plan');
        category = category === 'general' ? 'lesson-plans' : category;
    }

    if (normalizedPath.includes('daily') && normalizedPath.includes('report')) {
        tags.push('daily-report');
        category = 'daily-reports';
    }

    if (normalizedPath.includes('poe') || normalizedPath.includes('portfolio')) {
        tags.push('poe');
        category = 'poe';
    }

    if (normalizedPath.includes('numeracy') || normalizedPath.includes('math')) {
        tags.push('numeracy');
        if (!moduleNumber) moduleNumber = 1;
    }

    if (normalizedPath.includes('communication') || normalizedPath.includes('language')) {
        tags.push('communication');
        if (!moduleNumber) moduleNumber = 2;
    }

    if (normalizedPath.includes('computer') || normalizedPath.includes('ict')) {
        tags.push('computer-skills');
        if (!moduleNumber) moduleNumber = 3;
    }

    if (normalizedPath.includes('business') || normalizedPath.includes('entrepreneurship')) {
        tags.push('business');
        if (!moduleNumber) moduleNumber = 4;
    }

    if (normalizedPath.includes('workplace') || normalizedPath.includes('safety')) {
        tags.push('workplace-skills');
        if (!moduleNumber) moduleNumber = 5;
    }

    if (normalizedPath.includes('life skills') || normalizedPath.includes('personal')) {
        tags.push('life-skills');
        if (!moduleNumber) moduleNumber = 6;
    }

    return { category, moduleNumber, tags };
}

// GET: Get index statistics
export async function GET() {
    try {
        const stats = await getIndexStats();

        // Get local document chunks from database
        const localChunks = await prisma.documentChunk.count();

        return successResponse({
            pinecone: {
                dimension: stats.dimension,
                totalRecords: stats.totalRecordCount,
                namespaces: stats.namespaces,
            },
            local: {
                documentChunks: localChunks,
            },
            status: (stats.totalRecordCount || 0) > 0 ? 'indexed' : 'empty',
        });
    } catch (error) {
        console.error('Index stats error:', error);
        return handleApiError(error);
    }
}

// POST: Index documents to Pinecone
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'index-from-db') {
            // Index from local DocumentChunk table
            const chunks = await prisma.documentChunk.findMany({
                take: 1000,
            });

            const modules = await prisma.module.findMany();
            const moduleMap = new Map(modules.map(m => [m.moduleNumber, m.name]));

            const records = chunks.map((chunk) => {
                const { category, moduleNumber, tags } = categorizeDocument(chunk.filePath);
                return {
                    id: chunk.id,
                    text: chunk.content,
                    metadata: {
                        filename: chunk.filename,
                        category: chunk.category || category,
                        moduleNumber,
                        moduleName: moduleNumber ? moduleMap.get(moduleNumber) || '' : '',
                        tags: [...tags, ...chunk.tags.split(',').filter(Boolean)],
                        chunkIndex: chunk.chunkIndex,
                        totalChunks: 1, // Would need to calculate this
                        createdAt: chunk.createdAt.toISOString(),
                    },
                };
            });

            if (records.length > 0) {
                await upsertDocuments(records);
            }

            return successResponse({
                message: 'Documents indexed successfully',
                indexed: records.length,
            });
        }

        if (action === 'index-sample') {
            // Index sample curriculum content from modules table
            const modules = await prisma.module.findMany({
                include: {
                    unitStandards: true,
                },
                orderBy: { moduleNumber: 'asc' },
            });

            const records = [];

            for (const module of modules) {
                // Create a chunk for module overview
                records.push({
                    id: `module-${module.id}-overview`,
                    text: `${module.name} (${module.code})\n\n${module.fullName}\n\nPurpose: ${module.purpose}\n\n${module.description || ''}\n\nCredits: ${module.credits}\nNotional Hours: ${module.notionalHours}\nClassroom: ${module.classroomHours}hrs\nWorkplace: ${module.workplaceHours}hrs`,
                    metadata: {
                        filename: `${module.code}-overview`,
                        category: `module-${module.moduleNumber}`,
                        moduleNumber: module.moduleNumber,
                        moduleName: module.name,
                        tags: ['module-overview', 'curriculum'],
                        chunkIndex: 0,
                        totalChunks: module.unitStandards.length + 1,
                        createdAt: new Date().toISOString(),
                    },
                });

                // Create chunks for each unit standard
                for (let i = 0; i < module.unitStandards.length; i++) {
                    const us = module.unitStandards[i];
                    records.push({
                        id: `us-${us.id}`,
                        text: `Unit Standard ${us.code}: ${us.title}\n\nModule: ${module.name}\nLevel: NQF ${us.level}\nCredits: ${us.credits}\nType: ${us.type}\n\n${us.content || ''}`,
                        metadata: {
                            filename: `US-${us.code}`,
                            category: `module-${module.moduleNumber}`,
                            moduleNumber: module.moduleNumber,
                            moduleName: module.name,
                            unitStandardCode: us.code,
                            tags: ['unit-standard', us.type.toLowerCase(), `level-${us.level}`],
                            chunkIndex: i + 1,
                            totalChunks: module.unitStandards.length + 1,
                            createdAt: new Date().toISOString(),
                        },
                    });
                }
            }

            if (records.length > 0) {
                await upsertDocuments(records);
            }

            return successResponse({
                message: 'Sample curriculum indexed successfully',
                indexed: records.length,
                modules: modules.length,
                unitStandards: records.length - modules.length,
            });
        }

        return Response.json(
            { success: false, error: 'Invalid action. Use "index-from-db" or "index-sample"' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Index documents error:', error);
        return handleApiError(error);
    }
}
