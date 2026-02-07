// AI Module Exports
export * from './pinecone';
export * from './cohere';

// Re-export specific functions for convenience
export { searchDocuments, upsertDocuments, getIndexStats } from './pinecone';
export {
    chatWithContext,
    generateEmbedding,
    generateAssessmentQuestions,
    summarizeProgress,
    getDocumentRecommendations
} from './cohere';
