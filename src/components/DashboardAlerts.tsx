'use client';

import { useState } from 'react';
import { useDashboardAlerts } from '@/hooks/useDashboard';
import {
  AlertTriangle,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  X,
  Calendar,
  UserX,
  Bell,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * REDESIGN: Dashboard Alerts Panel
 * Features:
 * - Compact summary badge row (Critical / Warning / Info)
 * - Clean scrollable alert list with student names
 * - No raw UUIDs visible to user
 * - Truncated assessment titles with proper styling
 * - Priority-colored left borders
 * - "View all" link for full alert list
 */
export default function DashboardAlerts() {
  const { alerts, isLoading } = useDashboardAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const router = useRouter();

  const visibleAlerts = alerts.filter((alert: any) => !dismissedAlerts.includes(alert.id));
  
  // Count alerts by priority
  const alertCounts = {
    critical: visibleAlerts.filter((a: any) => a.priority === 'URGENT').length,
    warning: visibleAlerts.filter((a: any) => a.priority === 'WARNING').length,
    info: visibleAlerts.filter((a: any) => a.priority === 'INFO').length,
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const handleAlertClick = (alert: any) => {
    // Route to appropriate page based on alert type
    switch (alert.type) {
      case 'assessment_deadline':
        router.push('/assessments');
        break;
      case 'low_attendance':
        router.push('/attendance');
        break;
      case 'pending_moderation':
        router.push('/moderation');
        break;
      case 'at_risk_student':
        router.push('/students');
        break;
      case 'missing_documents':
        router.push('/compliance');
        break;
      case 'course_ending':
        router.push('/curriculum');
        break;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'assessment_deadline':
        return <Clock className="w-4 h-4" />;
      case 'low_attendance':
        return <UserX className="w-4 h-4" />;
      case 'pending_moderation':
        return <FileText className="w-4 h-4" />;
      case 'at_risk_student':
        return <AlertTriangle className="w-4 h-4" />;
      case 'missing_documents':
        return <FileText className="w-4 h-4" />;
      case 'course_ending':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          borderColor: '#ef4444',
          bgColor: 'bg-red-50 dark:bg-red-900/10',
          iconBg: 'bg-red-100/80 dark:bg-red-900/20',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'alert-badge-critical',
        };
      case 'WARNING':
        return {
          borderColor: '#f59e0b',
          bgColor: 'bg-amber-50 dark:bg-amber-900/10',
          iconBg: 'bg-amber-100/80 dark:bg-amber-900/20',
          icon: 'text-amber-600 dark:text-amber-400',
          badge: 'alert-badge-warning',
        };
      case 'INFO':
        return {
          borderColor: '#10b981',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
          iconBg: 'bg-emerald-100/80 dark:bg-emerald-900/20',
          icon: 'text-emerald-600 dark:text-emerald-400',
          badge: 'alert-badge-info',
        };
      default:
        return {
          borderColor: '#cbd5e1',
          bgColor: 'bg-slate-50 dark:bg-slate-800',
          iconBg: 'bg-slate-100 dark:bg-slate-700',
          icon: 'text-slate-600 dark:text-slate-400',
          badge: '',
        };
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper to check if text looks like a UUID or internal ID
  const isUuidOrId = (text: string) => {
    if (!text) return false;
    // UUID pattern: 8-4-4-4-12 hex chars
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) return true;
    // Short ID pattern: 6-8 hex chars without dashes
    if (/^[0-9a-f]{6,}$/.test(text) && text.length <= 12) return true;
    return false;
  };

  // Truncate text to specific length, removing any UUIDs
  const truncateText = (text: string, maxLength: number = 40) => {
    if (!text) return 'Untitled';
    // Filter out sections that look like UUIDs
    let cleaned = text.replace(/[0-9a-f]{6,}/gi, (match) => isUuidOrId(match) ? '' : match).trim();
    if (!cleaned) return 'Assessment';
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
  };

  // Get clean alert title (student name or group name, filtering out IDs)
  const getAlertTitle = (alert: any) => {
    const studentName = alert.data?.studentName;
    const groupName = alert.data?.groupName;
    const studentId = alert.data?.studentId;
    
    if (studentName && !isUuidOrId(studentName)) {
      return studentName;
    }
    if (groupName && !isUuidOrId(groupName)) {
      return groupName;
    }
    // Fallback: show first letter of type
    return alert.type?.replace(/_/g, ' ').toUpperCase() || 'Alert';
  };

  // Get clean assessment title (filtering out IDs)
  const getAssessmentTitle = (alert: any) => {
    const title = alert.data?.assessmentTitle || alert.message || '';
    if (!title || isUuidOrId(title)) {
      return alert.type?.replace(/_/g, ' ').toUpperCase() || 'Assessment';
    }
    return truncateText(title);
  };

  return (
    <div className="dashboard-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Alerts
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="empty-state py-8">
          <div className="empty-state-icon">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="empty-state-title">All Clear</div>
          <div className="empty-state-description">No pending alerts</div>
        </div>
      ) : (
        <>
          {/* Summary Badge Row */}
          <div className="flex gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            {alertCounts.critical > 0 && (
              <div className="alert-badge-critical">
                <span className="font-bold">{alertCounts.critical}</span>
                <span className="text-xs">Critical</span>
              </div>
            )}
            {alertCounts.warning > 0 && (
              <div className="alert-badge-warning">
                <span className="font-bold">{alertCounts.warning}</span>
                <span className="text-xs">Warning</span>
              </div>
            )}
            {alertCounts.info > 0 && (
              <div className="alert-badge-info">
                <span className="font-bold">{alertCounts.info}</span>
                <span className="text-xs">Info</span>
              </div>
            )}
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {visibleAlerts.filter((alert: any) => 
              alert && typeof alert === 'object' && 'id' in alert
            ).slice(0, 8).map((alert: any) => {
              const styles = getPriorityStyles(alert.priority);
              return (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={cn(
                    'relative p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-150',
                    'hover:shadow-md hover:bg-opacity-100',
                    styles.bgColor
                  )}
                  style={{ borderLeftColor: styles.borderColor }}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn('p-2 rounded-lg flex-shrink-0 mt-0.5', styles.iconBg)}>
                      <div className={styles.icon}>
                        {getAlertIcon(alert.type)}
                      </div>
                    </div>

                    {/* Content - ALERTS REDESIGN: Hide UUIDs, show only meaningful data */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">
                        {getAlertTitle(alert)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                        {getAssessmentTitle(alert)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(alert.id);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Link */}
          {visibleAlerts.length > 8 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => router.push('/alerts')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                  text-xs font-semibold text-emerald-600 dark:text-emerald-400
                  hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                View all {visibleAlerts.length} alerts
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
