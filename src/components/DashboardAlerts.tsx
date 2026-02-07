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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Alerts & Notifications</h3>
        {visibleAlerts.length > 0 && (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
            {visibleAlerts.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No alerts at the moment</p>
          <p className="text-sm mt-1">Everything looks good!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {visibleAlerts.slice(0, 10).map((alert: any) => {
            const styles = getPriorityStyles(alert.priority);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${styles.bg} ${styles.border} hover:shadow-md transition-all cursor-pointer`}
                onClick={() => handleAlertClick(alert)}
              >
                <div className="flex items-start gap-3">
                  <div className={styles.icon}>
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${styles.text}`}>
                        {alert.message}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(alert.id);
                        }}
                        className={`flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded ${styles.icon}`}
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs ${styles.subtext} font-medium uppercase`}>
                        {alert.priority}
                      </span>
                      <span className={`text-xs ${styles.subtext}`}>
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
