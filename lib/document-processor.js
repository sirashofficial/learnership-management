const fs = require('fs').promises;
const path = require('path');
const pdfParseLib = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text content from a PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
async function extractPdfText(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const pdfParseKey = pdfParseLib.default ? pdfParseLib.default : pdfParseLib;
        const data = await pdfParseKey(dataBuffer);
        return data.text;
    } catch (error) {
        console.error(`Error extracting PDF text from ${filePath}:`, error.message);
        return '';
    }
}

/**
 * Extract text content from a DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} Extracted text
 */
async function extractDocxText(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error(`Error extracting DOCX text from ${filePath}:`, error.message);
        return '';
    }
}

/**
 * Read markdown file content
 * @param {string} filePath - Path to markdown file
 * @returns {Promise<string>} File content
 */
async function extractMarkdown(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading markdown from ${filePath}:`, error.message);
        return '';
    }
}

/**
 * Extract text from any supported document type
 * @param {string} filePath - Path to document
 * @returns {Promise<string>} Extracted text
 */
async function extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.pdf':
            return extractPdfText(filePath);
        case '.docx':
        case '.doc':
            return extractDocxText(filePath);
        case '.md':
        case '.txt':
            return extractMarkdown(filePath);
        default:
            console.warn(`Unsupported file type: ${ext}`);
            return '';
    }
}

/**
 * Split text into chunks of approximately maxTokens
 * @param {string} text - Text to chunk
 * @param {number} maxTokens - Maximum tokens per chunk (roughly 4 chars = 1 token)
 * @returns {string[]} Array of text chunks
 */
function chunkText(text, maxTokens = 500) {
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    const chunks = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed max, save current chunk
        if (currentChunk.length + paragraph.length > maxChars && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }

        // If a single paragraph is too long, split it by sentences
        if (paragraph.length > maxChars) {
            const sentences = paragraph.split(/[.!?]+\s+/);
            for (const sentence of sentences) {
                if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                currentChunk += sentence + '. ';
            }
        } else {
            currentChunk += paragraph + '\n\n';
        }
    }

    // Add remaining chunk
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
}

/**
 * Generate metadata from file path and name
 * @param {string} filePath - Full path to file
 * @param {string} baseDir - Base directory to calculate relative path
 * @returns {object} Metadata object
 */
function generateMetadata(filePath, baseDir) {
    const relativePath = path.relative(baseDir, filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    const dirPath = path.dirname(relativePath);

    // Extract category from directory structure
    let category = 'general';
    let module = null;
    let tags = [];

    const lowerPath = relativePath.toLowerCase();

    // Categorize based on directory structure
    if (lowerPath.includes('daily reports')) {
        category = 'daily-reports';
        tags.push('daily-reports');
    } else if (lowerPath.includes('learner work through')) {
        category = 'learner-materials';
        tags.push('learner-guides');

        // Extract module number
        const moduleMatch = lowerPath.match(/module (\d+)/i);
        if (moduleMatch) {
            module = parseInt(moduleMatch[1]);
            tags.push(`module-${module}`);
        }
    } else if (lowerPath.includes('yeha training material') || lowerPath.includes('yeha class files')) {
        category = 'training-materials';
        tags.push('yeha-training');
    } else if (lowerPath.includes('new groups') || lowerPath.includes('roll out')) {
        category = 'planning';
        tags.push('planning', 'rollout');
    } else if (ext === '.md') {
        category = 'documentation';
        tags.push('documentation');
    }

    // Extract additional metadata from filename
    const dateMatch = fileName.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
    let date = null;
    if (dateMatch) {
        const months = {
            january: '01', february: '02', march: '03', april: '04',
            may: '05', june: '06', july: '07', august: '08',
            september: '09', october: '10', november: '11', december: '12'
        };
        const day = dateMatch[1].padStart(2, '0');
        const month = months[dateMatch[2].toLowerCase()];
        const year = dateMatch[3];
        date = `${year}-${month}-${day}`;
    }

    return {
        filename: fileName,
        filepath: relativePath,
        category,
        module,
        tags,
        date,
        fileType: ext.substring(1), // Remove the dot
    };
}

/**
 * Recursively find all document files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - File extensions to include
 * @returns {Promise<string[]>} Array of file paths
 */
async function findDocuments(dir, extensions = ['.pdf', '.docx', '.doc', '.md', '.txt']) {
    const files = [];

    async function traverse(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                await traverse(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }

    await traverse(dir);
    return files;
}

module.exports = {
    extractText,
    extractPdfText,
    extractDocxText,
    extractMarkdown,
    chunkText,
    generateMetadata,
    findDocuments,
};
