'use client';

import { useState, useCallback } from 'react';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    sources?: Array<{
        filename: string;
        category: string;
        moduleName: string;
        relevanceScore: number;
    }>;
}

interface SearchResult {
    id: string;
    score: number;
    filename: string;
    category: string;
    moduleName?: string;
    preview: string;
    tags: string[];
}

interface GeneratedQuestion {
    question: string;
    type: 'multiple_choice' | 'short_answer' | 'practical';
    options?: string[];
    correctAnswer?: string;
    rubric?: string;
}

interface ProgressSummary {
    summary: string;
    recommendations: string[];
    strengths: string[];
    areasForImprovement: string[];
}

interface RecommendedDocument {
    topic: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    documents: Array<{
        id: string;
        filename: string;
        category: string;
        moduleName: string;
        preview: string;
        relevanceScore: number;
    }>;
}

export function useAI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchDocuments = useCallback(async (
        query: string,
        options?: {
            topK?: number;
            moduleNumber?: number;
            category?: string;
        }
    ): Promise<SearchResult[]> => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ q: query });
            if (options?.topK) params.append('topK', options.topK.toString());
            if (options?.moduleNumber) params.append('module', options.moduleNumber.toString());
            if (options?.category) params.append('category', options.category);

            const response = await fetch(`/api/ai/semantic-search?${params}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Search failed');
            }

            return data.data.results;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Search failed';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const chat = useCallback(async (
        messages: ChatMessage[],
        options?: {
            studentId?: string;
            moduleFilter?: number;
        }
    ): Promise<{ response: string; sources: ChatMessage['sources'] } | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    studentId: options?.studentId,
                    moduleFilter: options?.moduleFilter,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Chat failed');
            }

            return {
                response: data.data.response,
                sources: data.data.sources,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Chat failed';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const generateAssessment = useCallback(async (
        unitStandardId: string,
        type: 'formative' | 'summative',
        count: number = 5
    ): Promise<GeneratedQuestion[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/generate-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unitStandardId,
                    type,
                    count,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Assessment generation failed');
            }

            return data.data.questions;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Assessment generation failed';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getRecommendations = useCallback(async (
        studentId: string
    ): Promise<{
        recommendations: RecommendedDocument[];
        progressSummary: ProgressSummary;
    } | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai/recommendations?studentId=${studentId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get recommendations');
            }

            return {
                recommendations: data.data.recommendations,
                progressSummary: data.data.progressSummary,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get recommendations';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const askQuestion = useCallback(async (
        question: string,
        context?: {
            studentId?: string;
            moduleNumber?: number;
        }
    ): Promise<string | null> => {
        const result = await chat(
            [{ role: 'user', content: question }],
            context
        );
        return result?.response || null;
    }, [chat]);

    return {
        loading,
        error,
        searchDocuments,
        chat,
        generateAssessment,
        getRecommendations,
        askQuestion,
    };
}

export type {
    ChatMessage,
    SearchResult,
    GeneratedQuestion,
    ProgressSummary,
    RecommendedDocument
};
