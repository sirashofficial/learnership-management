'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Wrench, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DataIntegrityIssue {
  checkType: string;
  severity: 'warning' | 'critical';
  description: string;
  entityId?: string;
  repairAction?: string;
}

interface DataIntegritySummary {
  totalIssues: number;
  critical: number;
  warnings: number;
  timestamp: string;
}

export default function DataHealthWidget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState<string | null>(null);
  const [summary, setSummary] = useState<DataIntegritySummary | null>(null);
  const [issues, setIssues] = useState<DataIntegrityIssue[]>([]);

  const isAdmin = user?.role === 'ADMIN';

  const status = useMemo(() => {
    if (!summary) return 'UNKNOWN';
    if (summary.critical > 0) return 'RED';
    if (summary.warnings > 0) return 'YELLOW';
    return 'GREEN';
  }, [summary]);

  const statusLabel = status === 'GREEN'
    ? 'Healthy'
    : status === 'YELLOW'
      ? 'Warnings'
      : status === 'RED'
        ? 'Critical'
        : 'Unknown';

  const statusColor = status === 'GREEN'
    ? 'bg-emerald-500'
    : status === 'YELLOW'
      ? 'bg-amber-500'
      : status === 'RED'
        ? 'bg-red-500'
        : 'bg-slate-300';

  const runChecks = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/validation/run-checks', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data?.summary || null);
        setIssues(data.data?.inconsistencies || []);
      }
    } catch (error) {
      console.error('Failed to run data integrity checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async (action: string) => {
    if (!action) return;

    setRepairing(action);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/validation/repair', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      await runChecks();
    } catch (error) {
      console.error('Repair failed:', error);
    } finally {
      setRepairing(null);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      runChecks();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            Data Health
          </h3>
        </div>
        <p className="text-sm text-slate-500">Admin access required to view data integrity status.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Data Health
        </h3>
        <button
          onClick={runChecks}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className={`w-3 h-3 rounded-full ${statusColor}`} />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{statusLabel}</p>
          {summary && (
            <p className="text-xs text-slate-500">
              {summary.critical} critical, {summary.warnings} warnings
            </p>
          )}
        </div>
      </div>

      {!summary && !loading ? (
        <p className="text-sm text-slate-500">No data integrity runs yet.</p>
      ) : (
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              No issues detected.
            </div>
          ) : (
            issues.slice(0, 5).map((issue, index) => (
              <div key={`${issue.entityId || index}`} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {issue.severity === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    )}
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {issue.description}
                    </p>
                  </div>
                  {issue.repairAction && (
                    <button
                      onClick={() => handleRepair(issue.repairAction || '')}
                      disabled={repairing === issue.repairAction}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60"
                    >
                      <Wrench className="w-3 h-3" />
                      Repair
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
