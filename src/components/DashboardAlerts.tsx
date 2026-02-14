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
  UserX
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardAlerts() {
  const { alerts, isLoading } = useDashboardAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const router = useRouter();

  const visibleAlerts = alerts.filter((alert: any) => !dismissedAlerts.includes(alert.id));

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
        return <Clock className="w-5 h-5" />;
      case 'low_attendance':
        return <UserX className="w-5 h-5" />;
      case 'pending_moderation':
        return <FileText className="w-5 h-5" />;
      case 'at_risk_student':
        return <AlertTriangle className="w-5 h-5" />;
      case 'missing_documents':
        return <FileText className="w-5 h-5" />;
      case 'course_ending':
        return <Calendar className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-l-red-500',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-900 dark:text-red-100',
          subtext: 'text-red-700 dark:text-red-300',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-l-amber-500',
          icon: 'text-amber-600 dark:text-amber-400',
          text: 'text-amber-900 dark:text-amber-100',
          subtext: 'text-amber-700 dark:text-amber-300',
        };
      case 'INFO':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-l-emerald-500',
          icon: 'text-emerald-600 dark:text-emerald-400',
          text: 'text-emerald-900 dark:text-emerald-100',
          subtext: 'text-emerald-700 dark:text-emerald-300',
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          border: 'border-l-slate-500',
          icon: 'text-slate-600 dark:text-slate-400',
          text: 'text-slate-900 dark:text-slate-100',
          subtext: 'text-slate-700 dark:text-slate-300',
        };
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
        {visibleAlerts.length > 0 && (
          <span className="text-xs text-red-500 font-medium">
            {visibleAlerts.length} active
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">All clear</p>
          <p className="text-xs text-slate-400 mt-0.5">No pending alerts</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {visibleAlerts.slice(0, 10).map((alert: any) => {
            const styles = getPriorityStyles(alert.priority);
            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-150 border-l-2 border-transparent"
                style={{ borderLeftColor: alert.priority === 'URGENT' ? '#ef4444' : alert.priority === 'WARNING' ? '#f59e0b' : '#10b981' }}
                onClick={() => handleAlertClick(alert)}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", styles.bg, styles.icon)}>
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 leading-snug">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs font-medium", styles.icon)}>{alert.priority}</span>
                    <span className="text-xs text-slate-400">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(alert.id);
                  }}
                  className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-300 hover:text-slate-500 flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
