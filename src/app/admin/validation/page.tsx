'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, Info, RefreshCw, PlayCircle, FileText } from 'lucide-react';

interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  issue: string;
  count?: number;
  details?: any[];
}

interface ValidationSummary {
  totalIssues: number;
  critical: number;
  warnings: number;
  info: number;
  studentsChecked: number;
  timestamp: string;
}

interface FixResult {
  studentId: string;
  name: string;
  oldCredits: number;
  newCredits: number;
  difference: number;
}

export default function ValidationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [validationData, setValidationData] = useState<{
    summary: ValidationSummary;
    issues: ValidationIssue[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixingCredits, setFixingCredits] = useState(false);
  const [generatingAssessments, setGeneratingAssessments] = useState(false);
  const [fixingDuplicates, setFixingDuplicates] = useState(false);
  const [cleaningProgress, setCleaningProgress] = useState(false);
  const [fixResults, setFixResults] = useState<FixResult[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [duplicateResults, setDuplicateResults] = useState<any>(null);
  const [cleanupResults, setCleanupResults] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      runValidation();
    }
  }, [user, isLoading, router]);

  const runValidation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/validation/data-integrity', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setValidationData(data);
      } else {
        console.error('Validation failed:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to run validation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixCredits = async (dryRun: boolean = false) => {
    setFixingCredits(true);
    setFixResults([]);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/validation/fix-credits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun }),
      });

      if (response.ok) {
        const data = await response.json();
        setFixResults(data.fixes || []);
        if (!dryRun) {
          // Refresh validation after fixing
          setTimeout(runValidation, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to fix credits:', error);
    } finally {
      setFixingCredits(false);
    }
  };

  const generateMissingAssessments = async (dryRun: boolean = false) => {
    setGeneratingAssessments(true);
    setAssessmentResults(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/validation/generate-missing-assessments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun }),
      });

      if (response.ok) {
        const data = await response.json();
        setAssessmentResults(data);
        if (!dryRun) {
          // Refresh validation after generating
          setTimeout(runValidation, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to generate assessments:', error);
    } finally {
      setGeneratingAssessments(false);
    }
  };

  const fixDuplicates = async (dryRun: boolean = false) => {
    setFixingDuplicates(true);
    setDuplicateResults(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/validation/fix-duplicates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun }),
      });

      if (response.ok) {
        const data = await response.json();
        setDuplicateResults(data);
        if (!dryRun) {
          setTimeout(runValidation, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to fix duplicates:', error);
    } finally {
      setFixingDuplicates(false);
    }
  };

  const cleanupOrphanedProgress = async (dryRun: boolean = false) => {
    setCleaningProgress(true);
    setCleanupResults(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/validation/cleanup-orphaned-progress', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun }),
      });

      if (response.ok) {
        const data = await response.json();
        setCleanupResults(data);
        if (!dryRun) {
          setTimeout(runValidation, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned progress:', error);
    } finally {
      setCleaningProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Validation Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor and fix data integrity issues across the system
          </p>
        </div>
        <button
          onClick={runValidation}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Validation
        </button>
      </div>

      {/* Summary Cards */}
      {validationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Issues</p>
            <p className="text-3xl font-bold text-slate-900">
              {validationData.summary.totalIssues}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
            <p className="text-sm text-slate-500 mb-1">Critical</p>
            <p className="text-3xl font-bold text-red-600">
              {validationData.summary.critical}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-200">
            <p className="text-sm text-slate-500 mb-1">Warnings</p>
            <p className="text-3xl font-bold text-yellow-600">
              {validationData.summary.warnings}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
            <p className="text-sm text-slate-500 mb-1">Info</p>
            <p className="text-3xl font-bold text-blue-600">
              {validationData.summary.info}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Fix Credit Totals</h3>
          <p className="text-sm text-slate-600 mb-4">
            Recalculate student credits based on competent assessments
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fixCredits(true)}
              disabled={fixingCredits}
              className="flex-1 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium border border-blue-300 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={() => fixCredits(false)}
              disabled={fixingCredits}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Apply Fixes
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate Missing Assessments</h3>
          <p className="text-sm text-slate-600 mb-4">
            Create missing formative assessments based on rollout plans
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => generateMissingAssessments(true)}
              disabled={generatingAssessments}
              className="flex-1 px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium border border-purple-300 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={() => generateMissingAssessments(false)}
              disabled={generatingAssessments}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Fix Duplicate Assessments</h3>
          <p className="text-sm text-slate-600 mb-4">
            Remove duplicate assessments (keeps most recent)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fixDuplicates(true)}
              disabled={fixingDuplicates}
              className="flex-1 px-4 py-2 bg-white text-orange-700 rounded-lg hover:bg-orange-50 transition-colors font-medium border border-orange-300 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={() => fixDuplicates(false)}
              disabled={fixingDuplicates}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Cleanup Orphaned Progress</h3>
          <p className="text-sm text-slate-600 mb-4">
            Remove progress records without matching assessments
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => cleanupOrphanedProgress(true)}
              disabled={cleaningProgress}
              className="flex-1 px-4 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium border border-red-300 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={() => cleanupOrphanedProgress(false)}
              disabled={cleaningProgress}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Cleanup
            </button>
          </div>
        </div>
      </div>

      {/* Fix Results */}
      {fixResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Credit Fix Results ({fixResults.length} students)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Student Name</th>
                  <th className="text-right p-3 font-medium text-slate-700">Old Credits</th>
                  <th className="text-right p-3 font-medium text-slate-700">New Credits</th>
                  <th className="text-right p-3 font-medium text-slate-700">Difference</th>
                </tr>
              </thead>
              <tbody>
                {fixResults.map((result, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-3">{result.name}</td>
                    <td className="p-3 text-right text-slate-600">{result.oldCredits}</td>
                    <td className="p-3 text-right font-medium">{result.newCredits}</td>
                    <td className={`p-3 text-right font-medium ${
                      result.difference > 0 ? 'text-green-600' : result.difference < 0 ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      {result.difference > 0 ? '+' : ''}{result.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assessment Results */}
      {assessmentResults && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Assessment Generation Results
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded p-3 border border-blue-200">
              <p className="text-sm text-slate-600">Students Processed</p>
              <p className="text-2xl font-bold text-blue-600">
                {assessmentResults.studentsProcessed}
              </p>
            </div>
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <p className="text-sm text-slate-600">Assessments Created</p>
              <p className="text-2xl font-bold text-green-600">
                {assessmentResults.assessmentsCreated}
              </p>
            </div>
            <div className="bg-purple-50 rounded p-3 border border-purple-200">
              <p className="text-sm text-slate-600">Mode</p>
              <p className="text-lg font-bold text-purple-600">
                {assessmentResults.dryRun ? 'Preview' : 'Applied'}
              </p>
            </div>
          </div>
          {assessmentResults.preview && assessmentResults.preview.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700">Student</th>
                    <th className="text-left p-3 font-medium text-slate-700">Unit Standard</th>
                    <th className="text-left p-3 font-medium text-slate-700">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentResults.preview.slice(0, 50).map((item: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-3">{item.studentName}</td>
                      <td className="p-3">
                        <div className="font-medium">{item.unitStandardCode}</div>
                        <div className="text-xs text-slate-500">{item.unitStandardTitle}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {item.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assessmentResults.preview.length > 50 && (
                <p className="text-sm text-slate-500 p-3 text-center">
                  ... and {assessmentResults.preview.length - 50} more
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Duplicate Fix Results */}
      {duplicateResults && duplicateResults.duplicatesFound > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Duplicate Assessment Results
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-orange-50 rounded p-3 border border-orange-200">
              <p className="text-sm text-slate-600">Duplicates Found</p>
              <p className="text-2xl font-bold text-orange-600">
                {duplicateResults.duplicatesFound}
              </p>
            </div>
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <p className="text-sm text-slate-600">Total Removed</p>
              <p className="text-2xl font-bold text-green-600">
                {duplicateResults.totalRemoved}
              </p>
            </div>
            <div className="bg-blue-50 rounded p-3 border border-blue-200">
              <p className="text-sm text-slate-600">Mode</p>
              <p className="text-lg font-bold text-blue-600">
                {duplicateResults.dryRun ? 'Preview' : 'Applied'}
              </p>
            </div>
          </div>
          {duplicateResults.fixes && duplicateResults.fixes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700">Student</th>
                    <th className="text-left p-3 font-medium text-slate-700">Unit Standard</th>
                    <th className="text-left p-3 font-medium text-slate-700">Type</th>
                    <th className="text-right p-3 font-medium text-slate-700">Removed</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateResults.fixes.map((fix: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-3">{fix.studentName}</td>
                      <td className="p-3">{fix.unitStandardCode}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {fix.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium text-red-600">
                        {fix.duplicatesRemoved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cleanup Results */}
      {cleanupResults && cleanupResults.orphanedFound > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Orphaned Progress Cleanup Results
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-red-50 rounded p-3 border border-red-200">
              <p className="text-sm text-slate-600">Orphaned Found</p>
              <p className="text-2xl font-bold text-red-600">
                {cleanupResults.orphanedFound}
              </p>
            </div>
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <p className="text-sm text-slate-600">Removed</p>
              <p className="text-2xl font-bold text-green-600">
                {cleanupResults.orphanedRemoved}
              </p>
            </div>
            <div className="bg-blue-50 rounded p-3 border border-blue-200">
              <p className="text-sm text-slate-600">Mode</p>
              <p className="text-lg font-bold text-blue-600">
                {cleanupResults.dryRun ? 'Preview' : 'Applied'}
              </p>
            </div>
          </div>
          {cleanupResults.orphanedRecords && cleanupResults.orphanedRecords.length > 0 && (
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-700">Student</th>
                    <th className="text-left p-3 font-medium text-slate-700">Unit Standard</th>
                    <th className="text-right p-3 font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cleanupResults.orphanedRecords.slice(0, 50).map((record: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-3">{record.studentName}</td>
                      <td className="p-3">
                        <div className="font-medium">{record.unitStandardCode}</div>
                        <div className="text-xs text-slate-500">{record.unitStandardTitle}</div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cleanupResults.orphanedRecords.length > 50 && (
                <p className="text-sm text-slate-500 p-3 text-center">
                  ... and {cleanupResults.orphanedRecords.length - 50} more
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Validation Issues */}
      {validationData && validationData.issues.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">All Clear!</h3>
            <p className="text-sm text-green-700">
              No data integrity issues found. System is healthy.
            </p>
          </div>
        </div>
      )}

      {validationData && validationData.issues.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Validation Issues</h2>
          {validationData.issues.map((issue, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-4 ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-slate-900">{issue.category}</h4>
                    {issue.count !== undefined && (
                      <span className="px-2 py-1 bg-white rounded text-sm font-medium">
                        {issue.count} found
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{issue.issue}</p>
                  {issue.details && issue.details.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                        View details ({issue.details.length} items)
                      </summary>
                      <div className="mt-2 bg-white rounded p-3 text-xs max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(issue.details, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      )}
    </div>
  );
}
