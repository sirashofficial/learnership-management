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

// Risk Analysis and Intervention System
export {
    collectStudentRiskData,
    calculateRiskScores,
    generateRiskAssessment,
    saveRiskProfile,
    processGroupRiskAssessments,
    enhanceRiskAssessmentWithAI,
    logRiskProfileAccess,
    RISK_THRESHOLDS,
} from './riskAnalysis';

export type { 
    RiskFactor, 
    StudentRiskData, 
    RiskAssessment 
} from './riskAnalysis';

export {
    createCheckInTask,
    notifyCoordinator,
    suggestResources,
    triggerInterventions,
    trackInterventionEffectiveness,
    generateInterventionReport,
} from './interventions';

export {
    runWeeklyRiskAnalysis,
    runMonthlyModelImprovement,
    startScheduler,
} from './jobScheduler';
