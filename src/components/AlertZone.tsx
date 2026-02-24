'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';

// Format time relative to now (e.g., "5m ago", "2h ago")
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Alert {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  details: string;
  entityId: string;
  entityType: 'GROUP' | 'STUDENT' | 'ASSESSMENT';
  createdAt: string;
}

interface AlertZoneProps {
  onAlertClick?: (alert: Alert) => void;
}

/**
 * Alert Zone Sidebar Component
 * Shows critical, warning, and info alerts with severity-based styling
 */
export default function AlertZone({ onAlertClick }: AlertZoneProps) {
  const { data, isLoading, error } = useSWR(
    '/api/dashboard/alerts/enhanced',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30000 } // 30s refresh
  );

  const [expandedSeverity, setExpandedSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('CRITICAL');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-900 mb-1">Unable to load alerts</p>
          <p className="text-xs">Please refresh the page</p>
        </div>
      </div>
    );
  }

  const alerts = (data?.alerts || []).filter((a: Alert) => !dismissedAlerts.has(a.id));
  const counts = data?.count || { critical: 0, warning: 0, info: 0 };

  const severityConfig = {
    CRITICAL: {
      color: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-700',
      icon: AlertCircle,
      textColor: 'text-red-700'
    },
    WARNING: {
      color: 'bg-amber-50',
      borderColor: 'border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-700',
      icon: AlertTriangle,
      textColor: 'text-amber-700'
    },
    INFO: {
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-700',
      icon: Info,
      textColor: 'text-blue-700'
    }
  };

  const groupedAlerts = {
    CRITICAL: alerts.filter((a: Alert) => a.severity === 'CRITICAL'),
    WARNING: alerts.filter((a: Alert) => a.severity === 'WARNING'),
    INFO: alerts.filter((a: Alert) => a.severity === 'INFO')
  };

  return (
    <div className="space-y-3">
      {/* Alert Zone Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">🚨 Alerts</h2>
          <span className="text-xs font-medium text-slate-600">
            Total: {alerts.length}
          </span>
        </div>

        {/* Alert Count Summary */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(counts).map(([severity, count]) => {
            const severityKey = severity.toUpperCase() as keyof typeof severityConfig;
            const config = severityConfig[severityKey];
            return (
              <div
                key={severity}
                className={`p-3 rounded-lg border ${config.color} ${config.borderColor}`}
              >
                <div className="text-sm font-semibold text-slate-900">{count as number}</div>
                <div className="text-xs text-slate-600 capitalize">{severity.toLowerCase()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Groups by Severity */}
      {(['CRITICAL', 'WARNING', 'INFO'] as const).map(severity => {
        const config = severityConfig[severity];
        const Icon = config.icon;
        const severityAlerts = groupedAlerts[severity];
        const isExpanded = expandedSeverity === severity;

        return (
          <div
            key={severity}
            className={`rounded-lg border ${config.color} ${config.borderColor} overflow-hidden`}
          >
            {/* Header - Collapsible */}
            <button
              onClick={() => setExpandedSeverity(isExpanded ? (severity === 'CRITICAL' ? 'WARNING' : 'INFO') : severity)}
              className={`w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.textColor}`} />
                <span className={`font-semibold text-sm ${config.textColor}`}>
                  {severity.charAt(0) + severity.slice(1).toLowerCase()}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.badgeColor}`}>
                  {severityAlerts.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className={`w-4 h-4 ${config.textColor}`} />
              ) : (
                <ChevronDown className={`w-4 h-4 ${config.textColor}`} />
              )}
            </button>

            {/* Alert List - Collapsible */}
            {isExpanded && (
              <>
                {severityAlerts.length === 0 ? (
                  <div className="border-t border-current border-opacity-20 p-4 text-center text-xs text-slate-500">
                    No {severity.toLowerCase()} alerts
                  </div>
                ) : (
                  <div className="border-t border-current border-opacity-20 divide-y divide-current divide-opacity-20">
                    {severityAlerts.slice(0, 5).map((alert: Alert, idx: number) => (
                      <div
                        key={alert.id}
                        className="p-4 hover:bg-white/50 cursor-pointer transition-colors group"
                      >
                        {/* Alert Header - Message + Entity Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className={`text-sm font-semibold ${config.textColor} line-clamp-2 flex-1`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${config.badgeColor}`}>
                              {alert.entityType}
                            </span>
                            <button
                              onClick={(e) => handleDismiss(alert.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 p-0"
                              title="Dismiss"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Alert Details */}
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                          {alert.details}
                        </p>

                        {/* Footer - Entity ID + Timestamp + Action */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-mono">
                            {alert.entityId.slice(-8)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">
                              {formatTimeAgo(alert.createdAt)}
                            </span>
                            <button
                              onClick={() => onAlertClick?.(alert)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                              title="View details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {severityAlerts.length > 5 && (
                      <div className="p-3 text-center text-xs text-slate-600 bg-white/30 font-medium cursor-pointer hover:bg-white/50 transition-colors">
                        View all {severityAlerts.length} alerts
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {alerts.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
          <div className="text-sm text-slate-600">
            <p className="text-lg mb-1">✨</p>
            <p className="font-medium text-slate-700">All clear!</p>
            <p className="text-xs mt-1">No alerts at this time</p>
          </div>
        </div>
      )}
    </div>
  );
}
