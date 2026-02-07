"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import { useStudents } from "@/hooks/useStudents";
import {
  Calendar, Users, TrendingUp, ChevronDown, ChevronRight, Check, X,
  ChevronLeft, ChevronRight as ChevronRightIcon, Clock, AlertCircle,
  Download, Filter, BarChart3, Copy, CheckSquare, FileText, Bell, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GroupCollection {
  id: string;
  name: string;
  subGroupNames: string[];
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  details?: string;
  resolved: boolean;
  studentId: string;
}

export default function AttendancePage() {
  const { students: apiStudents, isLoading } = useStudents();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCollection, setExpandedCollection] = useState<string | null>("montazility");
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // New states for enhanced features
  const [activeView, setActiveView] = useState<'mark' | 'history' | 'analytics'>('mark');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [groupStats, setGroupStats] = useState<{ [key: string]: AttendanceStats }>({});
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [absentReasons, setAbsentReasons] = useState<{ [key: string]: string }>({});

  // Group collections
  const groupCollections: GroupCollection[] = [
    {
      id: "montazility",
      name: "Montazility 26'",
      subGroupNames: ["Azelis 26'", "Beyond Insights 26'", "City Logistics 26'", "Monteagle 26'"]
    }
  ];

  // Group students by their group
  const groupedStudents = useMemo(() => {
    const groups: { [key: string]: any } = {};
    apiStudents.forEach((student) => {
      const groupId = student.group?.id || 'no-group';
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          name: student.group?.name || 'No Group',
          students: [],
          group: student.group,
        };
      }
      groups[groupId].students.push(student);
    });
    return groups;
  }, [apiStudents]);

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  // Fetch attendance history when date changes
  useEffect(() => {
    if (activeView === 'history' || activeView === 'analytics') {
      fetchHistoryData();
    }
  }, [selectedDate, activeView]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/attendance/alerts?unresolvedOnly=true');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
      const response = await fetch(`/api/attendance/history?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (data.success) {
        setHistoryData(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const getAttendanceKey = (studentId: string, date: Date = selectedDate) => {
    return `${studentId}-${format(date, "yyyy-MM-dd")}`;
  };

  const getAttendanceStatus = (studentId: string, date: Date = selectedDate) => {
    return attendanceData[getAttendanceKey(studentId, date)] || "NOT_MARKED";
  };

  const markAttendance = (studentId: string, status: string) => {
    const key = getAttendanceKey(studentId);
    setAttendanceData(prev => ({
      ...prev,
      [key]: status
    }));
    setLastSaved(null);
  };

  const markAllPresent = (groupId: string) => {
    const group = groupedStudents[groupId];
    if (!group) return;

    const updates: { [key: string]: string } = {};
    group.students.forEach((student: any) => {
      updates[getAttendanceKey(student.id)] = "PRESENT";
    });

    setAttendanceData(prev => ({ ...prev, ...updates }));
    setLastSaved(null);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedForBulk.size === 0) return;

    const studentIds = Array.from(selectedForBulk);

    try {
      setSavingAttendance(true);
      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          status: action,
          date: selectedDate,
          sessionId: 'MANUAL',
          markedBy: 'System',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        const updates: { [key: string]: string } = {};
        studentIds.forEach(studentId => {
          updates[getAttendanceKey(studentId)] = action;
        });
        setAttendanceData(prev => ({ ...prev, ...updates }));
        setSelectedForBulk(new Set());
        setBulkAction(null);
      }
    } catch (error) {
      console.error('Error bulk marking attendance:', error);
    } finally {
      setSavingAttendance(false);
    }
  };

  const saveAttendance = async () => {
    try {
      setSavingAttendance(true);



      const attendanceRecords = Object.entries(attendanceData)
        .filter(([key, status]) => status !== "NOT_MARKED" && key.includes(format(selectedDate, "yyyy-MM-dd")))
        .map(([key, status]) => {
          const studentId = key.split('-')[0];
          const student = apiStudents.find(s => s.id === studentId);

          return {
            studentId,
            groupId: student?.group?.id || null, // FIX: Use null instead of undefined
            sessionId: null, // Manual attendance doesn't have a session
            status,
            date: selectedDate.toISOString(),
            markedBy: "System",
          };
        });



      // Use bulk API endpoint
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: attendanceRecords }),
      });



      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response (raw):', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        console.error('❌ API Error (parsed):', error);
        throw new Error(error.error || 'Failed to save attendance');
      }

      const result = await response.json();

      const responseData = result.data;

      // Handle both array response (old format) and object response (new format)
      let successCount = 0;
      let failedCount = 0;

      if (Array.isArray(responseData)) {
        // Old format: just an array of results
        successCount = responseData.length;
        failedCount = 0;
      } else if (responseData && typeof responseData === 'object') {
        // New format: {success: [], failed: [], summary: {}}
        successCount = responseData.success?.length || 0;
        failedCount = responseData.failed?.length || 0;

        // Log detailed failures
        if (failedCount > 0) {
          console.error('❌ Failed records:', responseData.failed);
        }
      } else {
        console.error('❌ Unexpected response format:', responseData);
        throw new Error('Invalid API response format');
      }

      setLastSaved(new Date());

      // Show appropriate message based on results
      if (failedCount === 0 && successCount > 0) {
        alert(`✅ Successfully saved attendance for ${successCount} students!`);
      } else if (successCount > 0) {
        alert(`⚠️ Partially saved:\n✅ ${successCount} successful\n❌ ${failedCount} failed\n\nCheck console for details.`);
      } else {
        throw new Error('All records failed to save');
      }

      fetchAlerts(); // Refresh alerts after saving
    } catch (error: unknown) {
      console.error('❌ Error saving attendance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save attendance: ${errorMessage}`);
    } finally {
      setSavingAttendance(false);
    }
  };

  const exportAttendance = async (formatType: 'csv' | 'json') => {
    try {
      const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(selectedDate), 'yyyy-MM-dd');

      // Get first group for demo (in production, allow user to select)
      const firstGroupId = Object.keys(groupedStudents)[0];

      const response = await fetch(
        `/api/attendance/export?format=${formatType}&groupId=${firstGroupId}&startDate=${startDate}&endDate=${endDate}`
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${format(selectedDate, 'yyyy-MM-dd')}.${formatType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const calculateGroupStats = (groupId: string): { present: number; absent: number; late: number; notMarked: number } => {
    const group = groupedStudents[groupId];
    if (!group) return { present: 0, absent: 0, late: 0, notMarked: 0 };

    const stats = { present: 0, absent: 0, late: 0, notMarked: 0 };
    group.students.forEach((student: any) => {
      const status = getAttendanceStatus(student.id);
      if (status === "PRESENT") stats.present++;
      else if (status === "ABSENT") stats.absent++;
      else if (status === "LATE") stats.late++;
      else stats.notMarked++;
    });

    return stats;
  };

  const renderAttendanceRow = (student: any) => {
    const status = getAttendanceStatus(student.id);
    const isSelected = selectedForBulk.has(student.id);
    const isFiltered = filterStatus && status !== filterStatus && status !== 'NOT_MARKED';

    if (isFiltered) return null;

    return (
      <div key={student.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              const newSelected = new Set(selectedForBulk);
              if (e.target.checked) {
                newSelected.add(student.id);
              } else {
                newSelected.delete(student.id);
              }
              setSelectedForBulk(newSelected);
            }}
            className="w-4 h-4 rounded border-slate-300"
          />
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{student.studentId}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => markAttendance(student.id, "PRESENT")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              status === "PRESENT"
                ? "bg-green-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-green-900/30"
            )}
          >
            Present
          </button>
          <button
            onClick={() => markAttendance(student.id, "LATE")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              status === "LATE"
                ? "bg-yellow-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            )}
          >
            Late
          </button>
          <button
            onClick={() => markAttendance(student.id, "ABSENT")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              status === "ABSENT"
                ? "bg-red-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30"
            )}
          >
            Absent
          </button>
          {status === "ABSENT" && (
            <select
              value={absentReasons[student.id] || ""}
              onChange={(e) => setAbsentReasons(prev => ({ ...prev, [student.id]: e.target.value }))}
              className="px-2 py-1 text-xs border border-red-300 rounded-lg bg-red-50 text-red-700 focus:ring-1 focus:ring-red-400"
            >
              <option value="">Select reason...</option>
              <option value="SICK">Sick</option>
              <option value="BUSINESS">Business</option>
              <option value="NO_SHOW">No Show</option>
              <option value="PERSONAL">Personal</option>
              <option value="OTHER">Other</option>
            </select>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    const groupedByDate = historyData.reduce((acc: any, record) => {
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(record);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attendance History</h2>
        {Object.entries(groupedByDate).map(([date, records]: [string, any]) => {
          const stats = {
            present: records.filter((r: any) => r.status === 'PRESENT').length,
            late: records.filter((r: any) => r.status === 'LATE').length,
            absent: records.filter((r: any) => r.status === 'ABSENT').length,
          };

          return (
            <div key={date} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 dark:text-green-400">Present: {stats.present}</span>
                  <span className="text-yellow-600 dark:text-yellow-400">Late: {stats.late}</span>
                  <span className="text-red-600 dark:text-red-400">Absent: {stats.absent}</span>
                </div>
              </div>
              <div className="space-y-2">
                {records.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {record.student?.firstName} {record.student?.lastName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {record.student?.group?.name}
                      </p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      record.status === 'PRESENT' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      record.status === 'LATE' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      record.status === 'ABSENT' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAnalyticsView = () => {
    // Prepare chart data from history
    const dailyStats = historyData.reduce((acc: any, record) => {
      const dateKey = format(new Date(record.date), 'MMM dd');
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, present: 0, late: 0, absent: 0 };
      }
      if (record.status === 'PRESENT') acc[dateKey].present++;
      else if (record.status === 'LATE') acc[dateKey].late++;
      else if (record.status === 'ABSENT') acc[dateKey].absent++;
      return acc;
    }, {});

    const chartData = Object.values(dailyStats);

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Analytics</h2>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Records</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{historyData.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Present</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {historyData.filter(r => r.status === 'PRESENT').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Late</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {historyData.filter(r => r.status === 'LATE').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Absent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {historyData.filter(r => r.status === 'ABSENT').length}
                </p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Attendance Trend Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#10b981" name="Present" />
              <Bar dataKey="late" fill="#f59e0b" name="Late" />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Active Alerts
            </h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={cn(
                  "p-4 rounded-lg border-l-4",
                  alert.severity === 'CRITICAL' && "bg-red-50 dark:bg-red-900/20 border-red-500",
                  alert.severity === 'WARNING' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500",
                  alert.severity === 'INFO' && "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{alert.message}</p>
                      {alert.details && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.details}</p>
                      )}
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500 dark:text-slate-400">Loading students...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                Attendance Management
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Track and manage student attendance
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-10 py-2">
                    <button
                      onClick={() => exportAttendance('csv')}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => exportAttendance('json')}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveView('mark')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeView === 'mark'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeView === 'history'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              History
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeView === 'analytics'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Filter by Status</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus(null)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    !filterStatus
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('PRESENT')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    filterStatus === 'PRESENT'
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  Present
                </button>
                <button
                  onClick={() => setFilterStatus('LATE')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    filterStatus === 'LATE'
                      ? "bg-yellow-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  Late
                </button>
                <button
                  onClick={() => setFilterStatus('ABSENT')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    filterStatus === 'ABSENT'
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  Absent
                </button>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedForBulk.size > 0 && activeView === 'mark' && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6 flex items-center justify-between">
              <p className="text-indigo-900 dark:text-indigo-300 font-medium">
                {selectedForBulk.size} student{selectedForBulk.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('PRESENT')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleBulkAction('LATE')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Mark All Late
                </button>
                <button
                  onClick={() => handleBulkAction('ABSENT')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Mark All Absent
                </button>
                <button
                  onClick={() => setSelectedForBulk(new Set())}
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Date Navigation */}
          {activeView === 'mark' && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <button
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>

              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
                {isToday(selectedDate) && (
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                    Today
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {!isToday(selectedDate) && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Today
                  </button>
                )}
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {activeView === 'mark' && (
          <div className="space-y-6">
            {/* Save Button */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {lastSaved ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Last saved {format(lastSaved, "h:mm a")}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Unsaved changes
                  </>
                )}
              </div>
              <button
                onClick={saveAttendance}
                disabled={savingAttendance}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {savingAttendance ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Attendance
                  </>
                )}
              </button>
            </div>

            {/* Montazility Collection */}
            {groupCollections.map((collection) => {
              const subGroups = collection.subGroupNames
                .map(name => Object.values(groupedStudents).find(g => g.name === name))
                .filter(Boolean);

              const totalStudents = subGroups.reduce((sum, g) => sum + g.students.length, 0);
              const isExpanded = expandedCollection === collection.id;

              return (
                <div key={collection.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedCollection(isExpanded ? null : collection.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {collection.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {totalStudents} students across {subGroups.length} groups
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-6 space-y-4">
                      {subGroups.map((group) => {
                        const stats = calculateGroupStats(group.id);
                        const groupExpanded = expandedGroups.has(group.id);

                        return (
                          <div key={group.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedGroups);
                                if (groupExpanded) {
                                  newExpanded.delete(group.id);
                                } else {
                                  newExpanded.add(group.id);
                                }
                                setExpandedGroups(newExpanded);
                              }}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {groupExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                                <h4 className="font-medium text-slate-900 dark:text-white">{group.name}</h4>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  ({group.students.length} students)
                                </span>
                              </div>

                              <div className="flex gap-4 text-sm">
                                <span className="text-green-600 dark:text-green-400">✓ {stats.present}</span>
                                <span className="text-yellow-600 dark:text-yellow-400">⏰ {stats.late}</span>
                                <span className="text-red-600 dark:text-red-400">✗ {stats.absent}</span>
                                <span className="text-slate-500 dark:text-slate-400">— {stats.notMarked}</span>
                              </div>
                            </button>

                            {groupExpanded && (
                              <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-700/50">
                                <div className="flex justify-end mb-3">
                                  <button
                                    onClick={() => markAllPresent(group.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                    Mark All Present
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {group.students.map((student: any) => renderAttendanceRow(student))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Individual Groups */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Other Groups</h2>
              {Object.values(groupedStudents)
                .filter(group => !groupCollections.some(c => c.subGroupNames.includes(group.name)))
                .map((group: any) => {
                  const stats = calculateGroupStats(group.id);
                  const isExpanded = expandedGroups.has(group.id);

                  return (
                    <div key={group.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedGroups);
                          if (isExpanded) {
                            newExpanded.delete(group.id);
                          } else {
                            newExpanded.add(group.id);
                          }
                          setExpandedGroups(newExpanded);
                        }}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {group.name}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {group.students.length} students
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600 dark:text-green-400">✓ {stats.present}</span>
                          <span className="text-yellow-600 dark:text-yellow-400">⏰ {stats.late}</span>
                          <span className="text-red-600 dark:text-red-400">✗ {stats.absent}</span>
                          <span className="text-slate-500 dark:text-slate-400">— {stats.notMarked}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-700/50">
                          <div className="flex justify-end mb-3">
                            <button
                              onClick={() => markAllPresent(group.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <CheckSquare className="w-4 h-4" />
                              Mark All Present
                            </button>
                          </div>
                          <div className="space-y-2">
                            {group.students.map((student: any) => renderAttendanceRow(student))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeView === 'history' && renderHistoryView()}
        {activeView === 'analytics' && renderAnalyticsView()}
      </main>
    </div>
  );
}

