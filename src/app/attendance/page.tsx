"use client";

import { useState, useMemo, useEffect } from "react";
import { useStudents } from "@/hooks/useStudents";
import {
  Calendar, Users, TrendingUp, ChevronDown, ChevronRight, Check, X,
  ChevronLeft, ChevronRight as ChevronRightIcon, Clock, AlertCircle,
  Download, Filter, BarChart3, Copy, CheckSquare, FileText, Bell, Settings
} from "lucide-react";
import { cn, downloadExport } from "@/lib/utils";
import { formatGroupNameDisplay } from "@/lib/groupName";
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
  const [expandedCollection, setExpandedCollection] = useState<string | null>("montzelity");
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>({});
  const [attendanceReasons, setAttendanceReasons] = useState<{ [key: string]: string }>({});
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
  const [todayStats, setTodayStats] = useState<any>(null);
  const [weekStats, setWeekStats] = useState<any>(null);
  const [lowAttendanceCount, setLowAttendanceCount] = useState<number>(0);
  const [selectedHistoryGroup, setSelectedHistoryGroup] = useState<string | null>(null);

  // Group collections
  const groupCollections: GroupCollection[] = [
    {
      id: "montzelity",
      name: "MONTZELITY (LP) - 2026",
      subGroupNames: [
        "AZELIS SA (LP) - 2026",
        "BEYOND INSIGHTS (LP) - 2026",
        "CITY LOGISTICS (LP) - 2026",
        "MONTEAGLE (LP) - 2026"
      ]
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
    fetchTodayStats();
    fetchWeekStats();
    fetchLowAttendanceCount();
  }, []);

  // Fetch attendance history when date changes
  useEffect(() => {
    if (activeView === 'history' || activeView === 'analytics') {
      fetchHistoryData();
    }
  }, [selectedDate, activeView, selectedHistoryGroup]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/attendance/alerts?unresolvedOnly=true', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await fetch(`/api/attendance/stats?startDate=${today}&endDate=${today}`);
      const data = await response.json();
      if (data.success) {
        setTodayStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchWeekStats = async () => {
    try {
      const start = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const end = format(endOfWeek(new Date()), 'yyyy-MM-dd');
      const response = await fetch(`/api/attendance/stats?startDate=${start}&endDate=${end}`);
      const data = await response.json();
      if (data.success) {
        setWeekStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching week stats:', error);
    }
  };

  const fetchLowAttendanceCount = async () => {
    try {
      // Get all student IDs
      const studentIds = apiStudents.map(s => s.id).join(',');
      if (!studentIds) return;
      
      const response = await fetch(`/api/attendance/rates?studentIds=${studentIds}`);
      const data = await response.json();
      if (data.success) {
        // Count students with attendance rate below 80%
        const lowCount = Object.values(data.data as any).filter((stats: any) => 
          stats.attendanceRate < 80
        ).length;
        setLowAttendanceCount(lowCount);
      }
    } catch (error) {
      console.error('Error fetching attendance rates:', error);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
      let url = `/api/attendance/history?startDate=${startDate}&endDate=${endDate}`;
      if (selectedHistoryGroup) {
        url += `&groupId=${selectedHistoryGroup}`;
      }
      const response = await fetch(url, {
        credentials: 'include',
      });
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



      // 1. Filter relevant records
      const recordsToProcess = Object.entries(attendanceData)
        .filter(([key, status]) => status !== "NOT_MARKED" && key.includes(format(selectedDate, "yyyy-MM-dd")));

      // 2. Helper to extract studentId from key (format: ${studentId}-${yyyy-MM-dd})
      const extractStudentId = (key: string) => {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        // Date is always at the end, so extract from the right: remove date and the dash
        return key.substring(0, key.length - dateStr.length - 1);
      };

      // 3. Validate reasons for absence
      for (const [key, status] of recordsToProcess) {
        if (status === 'ABSENT' && !attendanceReasons[key]) {
          const studentId = extractStudentId(key);
          const student = apiStudents.find(s => s.id === studentId);
          throw new Error(`Please provide a reason for ${student?.firstName || 'Student'} ${student?.lastName || ''}'s absence.`);
        }
      }

      // 4. Create records payload
      const attendanceRecords = recordsToProcess.map(([key, status]) => {
        const studentId = extractStudentId(key);
        const student = apiStudents.find(s => s.id === studentId);

        return {
          studentId,
          groupId: student?.group?.id || null, // FIX: Use null instead of undefined
          sessionId: null, // Manual attendance doesn't have a session
          status,
          date: selectedDate.toISOString(),
          markedBy: "System",

          notes: attendanceReasons[key] || null,
        };
      });

      console.log(`📝 Extracted and prepared ${attendanceRecords.length} attendance records:`, 
        attendanceRecords.map(r => ({ studentId: r.studentId, status: r.status }))
      );

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

      await downloadExport(
        '/api/attendance/export',
        `attendance-${format(selectedDate, 'yyyy-MM-dd')}.${formatType}`,
        {
          format: formatType,
          groupId: firstGroupId,
          startDate,
          endDate
        }
      );

      setShowExportMenu(false);
      alert('✅ Attendance exported successfully!');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export attendance. Please try again.');
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
      <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
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
            className="w-4 h-4 rounded border-gray-300"
          />
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.studentId}</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {status === 'ABSENT' && (
            <input
              type="text"
              placeholder="Reason for absence..."
              value={attendanceReasons[getAttendanceKey(student.id)] || ''}
              onChange={(e) => {
                const key = getAttendanceKey(student.id);
                setAttendanceReasons(prev => ({ ...prev, [key]: e.target.value }));
              }}
              className="px-3 py-2 border border-red-200 rounded-lg text-sm w-48 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          )}
          <button
            onClick={() => markAttendance(student.id, "PRESENT")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              status === "PRESENT"
                ? "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30"
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
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
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
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30"
            )}
          >
            Absent
          </button>
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance History</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Group:</label>
            <select
              value={selectedHistoryGroup || ''}
              onChange={(e) => setSelectedHistoryGroup(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Groups</option>
              {Object.values(groupedStudents).map((group: any) => (
                <option key={group.id} value={group.id}>{formatGroupNameDisplay(group.name)}</option>
              ))}
            </select>
          </div>
        </div>
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-slate-200">
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No attendance records for this week</p>
            <p className="text-sm text-slate-400 mt-2">
              Navigate to a different week or mark attendance on the Mark tab first
            </p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, records]: [string, any]) => {
          const stats = {
            present: records.filter((r: any) => r.status === 'PRESENT').length,
            late: records.filter((r: any) => r.status === 'LATE').length,
            absent: records.filter((r: any) => r.status === 'ABSENT').length,
          };

          return (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 dark:text-green-400">Present: {stats.present}</span>
                  <span className="text-yellow-600 dark:text-yellow-400">Late: {stats.late}</span>
                  <span className="text-red-600 dark:text-red-400">Absent: {stats.absent}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Student</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Group</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record: any) => (
                      <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 px-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {record.student?.firstName} {record.student?.lastName}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {record.student?.group?.name || 'N/A'}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium",
                            record.status === 'PRESENT' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            record.status === 'LATE' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                            record.status === 'ABSENT' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {record.markedBy || 'System'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
        )}
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

    if (historyData.length === 0) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Analytics</h2>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-slate-200">
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No data for this period</p>
            <p className="text-sm text-slate-400 mt-2">
              Mark attendance for this week to see analytics
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Analytics</h2>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Today's Attendance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayStats?.attendanceRate?.toFixed(1) || '0'}%
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {weekStats?.attendanceRate?.toFixed(1) || '0'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Students Below 80%</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {lowAttendanceCount}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {alerts.length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Attendance Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Trend</h3>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Active Alerts ({alerts.length})
            </h3>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const student = apiStudents.find(s => s.id === alert.studentId);
                return (
                  <div key={alert.id} className={cn(
                    "p-4 rounded-lg border-l-4",
                    alert.severity === 'CRITICAL' && "bg-red-50 dark:bg-red-900/20 border-red-500",
                    alert.severity === 'WARNING' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500",
                    alert.severity === 'INFO' && "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                          {alert.type === 'LOW_ATTENDANCE' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                              Low Rate
                            </span>
                          )}
                        </div>
                        {alert.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.details}</p>
                        )}
                        {student && (
                          <div className="mt-2 flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                              {student.firstName} {student.lastName}
                            </span>
                            <button
                              onClick={() => window.alert('Reminder functionality will be implemented in a future update')}
                              className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            >
                              Send Reminder
                            </button>
                          </div>
                        )}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex gap-2 mb-6 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('mark')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeView === 'mark'
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
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
                : "bg-white text-gray-700 hover:bg-gray-50"
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
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button
                onClick={() => exportAttendance('csv')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => exportAttendance('json')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg p-4 shadow-soft mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Filter by Status</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus(null)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                !filterStatus
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700"
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
                  : "bg-gray-100 text-gray-700"
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
                  : "bg-gray-100 text-gray-700"
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
                  : "bg-gray-100 text-gray-700"
              )}
            >
              Absent
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedForBulk.size > 0 && activeView === 'mark' && (
        <div className="bg-indigo-50 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="text-indigo-900 font-medium">
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
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      {activeView === 'mark' && (
        <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-soft">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="text-lg font-semibold text-gray-900">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </span>
            {isToday(selectedDate) && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeView === 'mark' && (
        <div className="space-y-6">
          {/* Save Button */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-soft">
            <div className="flex items-center gap-2 text-sm text-gray-500">
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

          {/* Montzelity Collection */}
          {groupCollections.map((collection) => {
            const subGroups = collection.subGroupNames
              .map(name => Object.values(groupedStudents).find(g => g.name === name))
              .filter(Boolean);

            const totalStudents = subGroups.reduce((sum, g) => sum + g.students.length, 0);
            const isExpanded = expandedCollection === collection.id;

            return (
              <div key={collection.id} className="bg-white rounded-lg shadow-soft overflow-hidden">
                <button
                  onClick={() => setExpandedCollection(isExpanded ? null : collection.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatGroupNameDisplay(collection.name)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {totalStudents} students across {subGroups.length} groups
                        </p>
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 space-y-4">
                    {subGroups.map((group) => {
                      const stats = calculateGroupStats(group.id);
                      const groupExpanded = expandedGroups.has(group.id);

                      return (
                        <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
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
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {groupExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <h4 className="font-medium text-gray-900">{formatGroupNameDisplay(group.name)}</h4>
                              <span className="text-sm text-gray-500">
                                ({group.students.length} students)
                              </span>
                            </div>

                            <div className="flex gap-4 text-sm">
                              <span className="text-green-600">✓ {stats.present}</span>
                              <span className="text-yellow-600">⏰ {stats.late}</span>
                              <span className="text-red-600">✗ {stats.absent}</span>
                              <span className="text-gray-500">— {stats.notMarked}</span>
                            </div>
                          </button>

                          {groupExpanded && (
                            <div className="border-t border-gray-200 p-4 bg-white">
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
            <h2 className="text-xl font-bold text-gray-900">Other Groups</h2>
            {Object.values(groupedStudents)
              .filter(group => !groupCollections.some(c => c.subGroupNames.includes(group.name)))
              .map((group: any) => {
                const stats = calculateGroupStats(group.id);
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <div key={group.id} className="bg-white rounded-lg shadow-soft overflow-hidden">
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
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatGroupNameDisplay(group.name)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {group.students.length} students
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">✓ {stats.present}</span>
                        <span className="text-yellow-600">⏰ {stats.late}</span>
                        <span className="text-red-600">✗ {stats.absent}</span>
                        <span className="text-gray-500">— {stats.notMarked}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-6 bg-white">
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
    </div>
  );
}

