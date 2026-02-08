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
    <div className="card-premium p-8 noise-texture mb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 font-display tracking-tight">System Directives</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Critical infrastructure alerts</p>
        </div>
        {visibleAlerts.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-100 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
              {visibleAlerts.length} Active Directives
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-spin rounded-xl h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parsing notification grid...</p>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-sm font-black text-slate-900 font-display tracking-tight">Status: Nominal</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No pending interventions required</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[32rem] overflow-y-auto custom-scrollbar p-1">
          {visibleAlerts.slice(0, 10).map((alert: any) => {
            const styles = getPriorityStyles(alert.priority);
            return (
              <div
                key={alert.id}
                className={cn(
                  "group relative p-6 rounded-[1.5rem] border-l-[6px] bg-white hover:shadow-premium transition-all duration-300 cursor-pointer overflow-hidden",
                  styles.border
                )}
                onClick={() => handleAlertClick(alert)}
              >
                {/* Visual Accent Layer */}
                <div className={cn("absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.07]", styles.bg)} />

                <div className="relative flex items-center gap-6">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500", styles.bg, styles.icon)}>
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className={cn("text-base font-black font-display tracking-tight leading-tight", styles.text)}>
                        {alert.message}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(alert.id);
                        }}
                        className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-300 hover:text-red-500"
                        title="Dismiss Directive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", styles.bg.replace('bg-', 'border-').replace('/20', '/50'))}>
                        {alert.priority}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(alert.timestamp)}
                      </div>
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
