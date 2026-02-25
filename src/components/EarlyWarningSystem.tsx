/**
 * Early Warning System Dashboard Widget
 * 
 * Displays AI-powered risk indicators for students in a group.
 * Shows red/yellow/green indicators with drill-down to specific risk factors.
 * 
 * Privacy: Only visible to facilitators and coordinators
 * 
 * @component
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface RiskProfile {
  studentId: string;
  studentCode: string;
  studentName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: Array<{
    category: string;
    severity: string;
    description: string;
    recommendation?: string;
  }>;
  scores: {
    attendance: number;
    assessment: number;
    engagement: number;
    overall: number;
  };
  confidenceScore: number;
  calculatedAt: string;
  previousRiskLevel?: string;
  trend?: 'Improving' | 'Worsening' | 'Stable';
}

interface EarlyWarningSystemProps {
  groupId: string;
  groupName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

export default function EarlyWarningSystem({
  groupId,
  groupName,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: EarlyWarningSystemProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<RiskProfile[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access (facilitator or admin only)
  const hasAccess = user && ['FACILITATOR', 'ADMIN'].includes(user.role);

  const fetchRiskProfiles = useCallback(async (refresh = false) => {
    if (!groupId || !hasAccess) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(
        `/api/ai/risk-assessment?groupId=${groupId}&refresh=${refresh}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch risk profiles: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setProfiles(data.data.students || []);
        setSummary(data.data.summary || {});
      } else {
        throw new Error(data.error || 'Failed to load risk assessments');
      }
    } catch (err) {
      console.error('Error fetching risk profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load risk assessments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, hasAccess]);

  useEffect(() => {
    fetchRiskProfiles();
  }, [fetchRiskProfiles]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !hasAccess) return;
    
    const interval = setInterval(() => {
      fetchRiskProfiles();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRiskProfiles, hasAccess]);

  const handleRefresh = () => {
    fetchRiskProfiles(true); // Force refresh
  };

  const toggleExpanded = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (riskLevel) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            High Risk
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Medium Risk
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Low Risk
          </span>
        );
    }
  };

  const getTrendIndicator = (profile: RiskProfile) => {
    if (!profile.previousRiskLevel || profile.previousRiskLevel === profile.riskLevel) {
      return (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <MinusCircle className="w-3 h-3" />
          Stable
        </span>
      );
    }

    const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    const current = riskOrder[profile.riskLevel];
    const previous = riskOrder[profile.previousRiskLevel as keyof typeof riskOrder];

    if (current > previous) {
      return (
        <span className="text-xs text-red-600 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Worsening
        </span>
      );
    } else {
      return (
        <span className="text-xs text-emerald-600 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          Improving
        </span>
      );
    }
  };

  if (!hasAccess) {
    return null; // Don't show to students or guardians
  }

  if (loading) {
    return (
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card p-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
              Failed to Load Risk Assessments
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={() => fetchRiskProfiles()}
              className="mt-3 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Early Warning System
              </h2>
            </div>
            {groupName && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {groupName}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              'p-2 rounded-lg border border-slate-200 dark:border-slate-700',
              'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
              refreshing && 'opacity-50 cursor-not-allowed'
            )}
            title="Refresh assessments"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.totalStudents}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Total Students
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {summary.highRisk}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                High Risk
              </p>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {summary.mediumRisk}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Medium Risk
              </p>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {summary.lowRisk}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Low Risk
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {profiles.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No active students in this group
            </p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.studentId} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {/* Student Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Risk Indicator Circle */}
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full flex-shrink-0',
                      profile.riskLevel === 'HIGH' && 'bg-red-500 animate-pulse',
                      profile.riskLevel === 'MEDIUM' && 'bg-amber-500',
                      profile.riskLevel === 'LOW' && 'bg-emerald-500'
                    )}
                  />

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {profile.studentName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {profile.studentCode}
                    </p>
                  </div>

                  {/* Risk Badge */}
                  <div>
                    {getRiskBadge(profile.riskLevel)}
                  </div>

                  {/* Trend */}
                  <div className="hidden sm:block">
                    {getTrendIndicator(profile)}
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleExpanded(profile.studentId)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    {expandedStudent === profile.studentId ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedStudent === profile.studentId && (
                <div className="mt-4 pl-6 space-y-3">
                  {/* Risk Scores */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Attendance Risk
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {profile.scores.attendance.toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Assessment Risk
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {profile.scores.assessment.toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Engagement Risk
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {profile.scores.engagement.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {profile.riskFactors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Risk Factors
                      </p>
                      {profile.riskFactors.slice(0, 3).map((factor, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'p-3 rounded-lg border-l-4',
                            factor.severity === 'HIGH' && 'bg-red-50 dark:bg-red-900/10 border-red-500',
                            factor.severity === 'MEDIUM' && 'bg-amber-50 dark:bg-amber-900/10 border-amber-500',
                            factor.severity === 'LOW' && 'bg-blue-50 dark:bg-blue-900/10 border-blue-500'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {factor.description}
                              </p>
                              {factor.recommendation && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  💡 {factor.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {profile.riskFactors.length > 3 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          +{profile.riskFactors.length - 3} more factors
                        </p>
                      )}
                    </div>
                  )}

                  {/* Confidence Score */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      AI Confidence: {(profile.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Risk assessments are updated weekly and use AI to analyze attendance, assessment performance, and engagement patterns.
            Click any student to view detailed risk factors and recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
