import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const pdf = require('pdf-parse');
import mammoth from 'mammoth';
import Papa from 'papaparse';
import { upsertDocuments } from '../src/lib/ai/pinecone'; // Adjust path for script execution context

const prisma = new PrismaClient();

const DOCS_DIR = path.join(process.cwd(), 'docs');

async function extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (ext === '.docx' || ext === '.doc') {
            const buffer = fs.readFileSync(filePath);
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } else if (ext === '.txt' || ext === '.md') {
            return fs.readFileSync(filePath, 'utf-8');
        } else if (ext === '.csv') {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const result = Papa.parse(fileContent, { header: true });
            return JSON.stringify(result.data, null, 2);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
    return '';
}

function chunkText(text: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    // Simple splitting by sentences approximately
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk.length + sentence.length) > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks;
}

async function processFile(filePath: string) {
    const relativePath = path.relative(DOCS_DIR, filePath);
    const filename = path.basename(filePath);

    console.log(`Processing: ${filename}`);

    const content = await extractText(filePath);
    if (!content.trim()) {
        console.log(`Skipping empty or unreadable: ${filename}`);
        return;
    }

    const chunks = chunkText(content);

    // Determine category based on folder or filename
    let category = 'general';
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes('module')) category = 'module';
    if (lowerPath.includes('assessment')) category = 'assessment';

    console.log(`Saving ${chunks.length} chunks for ${filename}...`);

    const pineconeRecords = [];

    for (let i = 0; i < chunks.length; i++) {
        // 1. Save to Database
        const dbRecord = await prisma.documentChunk.create({
            data: {
                content: chunks[i],
                filename: filename,
                filePath: relativePath,
                category: category,
                tags: category, // simplifying for now
                chunkIndex: i
            }
        });

        // 2. Prepare for Pinecone
        pineconeRecords.push({
            id: dbRecord.id,
            text: chunks[i],
            metadata: {
                filename: filename,
                category: category,
                tags: [category],
                chunkIndex: i,
                totalChunks: chunks.length,
                createdAt: new Date().toISOString(),
                // Add inferred metadata if available
                moduleName: filename.replace(path.extname(filename), ''),
            }
        });
    }

    // 3. Upsert to Pinecone
    if (pineconeRecords.length > 0) {
        console.log(`Upserting ${pineconeRecords.length} chunks to Pinecone...`);
        try {
            await upsertDocuments(pineconeRecords);
            console.log(`Successfully upserted ${filename}`);
        } catch (error) {
            console.error(`Failed to upsert to Pinecone for ${filename}:`, error);
        }
    }
}

async function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            await walkDir(filePath);
        } else {
            // Filter relevant extensions
            if (['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'].includes(path.extname(file).toLowerCase())) {
                await processFile(filePath);
            }
        }
    }
}

async function main() {
    console.log('Starting ingestion from:', DOCS_DIR);
    if (!fs.existsSync(DOCS_DIR)) {
        console.error('Docs directory not found!');
        return;
    }

    // Optional: Clear existing chunks?
    // await prisma.documentChunk.deleteMany({});

    // Note: This script assumes .env is loaded (e.g., via `tsx --env-file=.env` or `dotenv`)

    await walkDir(DOCS_DIR);
    console.log('Ingestion complete!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
