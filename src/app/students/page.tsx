'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import AddStudentModal from '@/components/AddStudentModal';
import StudentDetailsModal from '@/components/StudentDetailsModal';
import BulkAssessmentModal from '@/components/BulkAssessmentModal';
import { useStudents, type Student } from '@/hooks/useStudents';
import { useGroups } from '@/contexts/GroupsContext';
import { formatGroupNameDisplay } from '@/lib/groupName';
import { getStudentAlert, getAlertColor, type StudentAlert } from '@/lib/progress-alerts';
import { StatusBadge } from '@/components/ui/AccessibilityComponents';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Grid3x3,
  List,
  ArrowUpDown,
  Check,
  Mail,
  Archive,
  X,
  Loader2,
  CheckCircle,
  ClipboardList,

  AlertTriangle,
  Edit2
} from 'lucide-react';
import CreditAdjustmentModal from '@/components/CreditAdjustmentModal';
import { format } from 'date-fns';

// Attendance data type from the API
interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
  complianceStatus: 'COMPLIANT' | 'WARNING' | 'CRITICAL';
}

type SortField = 'name' | 'studentId' | 'progress' | 'attendance' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function StudentsPage() {
  const router = useRouter();
  const { students, isLoading, isError, mutate } = useStudents();
  const { groups } = useGroups();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [progressRange, setProgressRange] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentForCredits, setSelectedStudentForCredits] = useState<Student | null>(null);
  const [showBulkAssessmentModal, setShowBulkAssessmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Fetch attendance rates for all students
  const studentIds = students?.map(s => s.id).join(',') || '';
  const { data: attendanceData, isLoading: attendanceLoading } = useSWR<{ data: Record<string, AttendanceStats> }>(
    studentIds ? `/api/attendance/rates?studentIds=${studentIds}` : null,
    (url: string) => fetch(url).then(res => res.json()),
    { revalidateOnFocus: false }
  );

  const { data: modulesData } = useSWR<{ modules: any[] }>(
    '/api/modules',
    (url: string) => fetch(url).then(res => res.json())
  );
  const modules = modulesData?.modules || [];

  // Get student alerts
  const getStudentAlertData = (student: Student): StudentAlert => {
    // For now, we don't have lastAssessmentDate easily available
    // In production, you'd fetch this from the API
    return getStudentAlert(student);
  };

  // Get attendance percentage from real data
  const getAttendancePercentage = (student: Student): number => {
    if (!attendanceData?.data?.[student.id]) {
      return 0; // No attendance data yet
    }
    return attendanceData.data[student.id].rate;
  };

  // Get compliance status for a student
  const getComplianceStatus = (student: Student): 'COMPLIANT' | 'WARNING' | 'CRITICAL' | null => {
    if (!attendanceData?.data?.[student.id]) {
      return null;
    }
    return attendanceData.data[student.id].complianceStatus;
  };

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    let filtered = students.filter((student) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        (student.email?.toLowerCase() || '').includes(searchLower) ||
        student.studentId.toLowerCase().includes(searchLower) ||
        (student.idNumber?.toLowerCase() || '').includes(searchLower);

      if (!matchesSearch) return false;

      // Group filter
      if (selectedGroup !== 'all' && student.group?.id !== selectedGroup) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && student.status !== selectedStatus) {
        return false;
      }

      // Module filter
      if (selectedModule !== 'all' && student.currentModuleId !== selectedModule) {
        return false;
      }

      // Progress range filter
      if (progressRange !== 'all') {
        const progress = student.progress;
        switch (progressRange) {
          case '0-25':
            if (progress > 25) return false;
            break;
          case '26-50':
            if (progress < 26 || progress > 50) return false;
            break;
          case '51-75':
            if (progress < 51 || progress > 75) return false;
            break;
          case '76-100':
            if (progress < 76) return false;
            break;
        }
      }

      // Alert filter
      if (showOnlyAlerts) {
        const alert = getStudentAlertData(student);
        if (alert.type === 'NONE') {
          return false;
        }
      }

      return true;
    });

    // Sort students
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'studentId':
          aValue = a.studentId.toLowerCase();
          bValue = b.studentId.toLowerCase();
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'attendance':
          aValue = getAttendancePercentage(a);
          bValue = getAttendancePercentage(b);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchQuery, selectedGroup, selectedStatus, selectedModule, progressRange, showOnlyAlerts, sortField, sortOrder, attendanceData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!students) return { total: 0, active: 0, averageProgress: 0, stalledCount: 0, atRiskCount: 0, needsAttention: 0 };

    const totalStudents = students?.length || 0;
    const activeStudents = students?.filter(s => s.status === 'ACTIVE').length || 0;
    const averageProgress = students && students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length)
      : 0;

    // Calculate alert statistics
    let stalledCount = 0;
    let atRiskCount = 0;

    students?.forEach(student => {
      const alert = getStudentAlertData(student);
      if (alert.type === 'STALLED') stalledCount++;
      if (alert.type === 'AT_RISK') atRiskCount++;
    });

    return {
      total: totalStudents,
      active: activeStudents,
      averageProgress,
      stalledCount,
      atRiskCount,
      needsAttention: stalledCount + atRiskCount
    };
  }, [students]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedStudents.length === 0) return;

    if (!confirm(`Are you sure you want to archive ${selectedStudents.length} student(s)?`)) {
      return;
    }

    setIsArchiving(true);
    try {
      // Archive each selected student
      const archivePromises = selectedStudents.map(studentId =>
        fetch(`/api/students/${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ARCHIVED' }),
        })
      );

      await Promise.all(archivePromises);

      // Refresh the student list
      mutate();
      setSelectedStudents([]);
    } catch (error) {
      console.error('Failed to archive students:', error);
      alert('Failed to archive some students. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleBulkEmail = async () => {
    if (selectedStudents.length === 0) return;

    // Get emails of selected students
    const selectedStudentData = students?.filter(s => selectedStudents.includes(s.id)) || [];
    const emails = selectedStudentData
      .map(s => s.email)
      .filter((email): email is string => !!email);

    if (emails.length === 0) {
      alert('No email addresses found for selected students.');
      return;
    }

    // Open default email client with all emails
    const mailtoLink = `mailto:${emails.join(',')}?subject=Learnership Update`;
    window.open(mailtoLink, '_blank');
  };

  const handleExportCSV = async () => {
    try {
      // Create CSV from filtered students
      const csvHeaders = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Group', 'Status', 'Progress%'];
      const csvRows = filteredStudents.map(student => [
        student.studentId || '',
        student.firstName || '',
        student.lastName || '',
        student.email || '',
        student.phone || '',
        student.group?.name || '',
        student.status || '',
        (student.progress || 0).toString()
      ]);

      // Combine headers and rows
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-cyan-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600 dark:text-red-400 py-12">
          Error loading students
        </div>
      </div>
    );
  }

    return (
      <div className="space-y-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">
              Total Students
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">
              Active Students
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {stats.active}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">
              Avg Progress
            </p>
          </div>
          <p className="text-2xl font-bold text-cyan-600">
            {stats.averageProgress}%
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">
              Needs Attention
            </p>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {stats.needsAttention}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.stalledCount} stalled, {stats.atRiskCount} at risk
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-slate-200 mb-6">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, email, or ID number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${viewMode === 'table'
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600'
                  }`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid'
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600'
                  }`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showFilters
                ? 'bg-teal-500 text-white'
                : 'bg-slate-100 text-slate-600'
                }`}
            >
              <Filter className="h-5 w-5" />
              Filters
              {(selectedGroup !== 'all' || selectedStatus !== 'all' || selectedModule !== 'all' || progressRange !== 'all') && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {[selectedGroup !== 'all', selectedStatus !== 'all', selectedModule !== 'all', progressRange !== 'all'].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Alert Filter Toggle */}
            <button
              onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showOnlyAlerts
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-600'
                }`}
            >
              <AlertTriangle className="h-5 w-5" />
              {showOnlyAlerts ? 'Show All' : 'At Risk Only'}
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Export
            </button>

            {/* Add Student */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 flex items-center gap-2 shadow-soft"
            >
              <UserPlus className="h-5 w-5" />
              Add Student
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Group Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Group / Company
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Groups</option>
                  {groups?.map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {formatGroupNameDisplay(group.name)} - {group.company?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              {/* Progress Range Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Progress Range
                </label>
                <select
                  value={progressRange}
                  onChange={(e) => setProgressRange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Progress</option>
                  <option value="0-25">0-25%</option>
                  <option value="26-50">26-50%</option>
                  <option value="51-75">51-75%</option>
                  <option value="76-100">76-100%</option>
                </select>
              </div>

              {/* Module Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Module
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Modules</option>
                  {modules.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      Module {m.moduleNumber}: {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Banner */}
        {selectedStudents.length > 0 && (
          <div className="p-4 bg-teal-50 border-b border-teal-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-teal-900">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleBulkArchive}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 text-sm"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
                <button
                  onClick={() => setShowBulkAssessmentModal(true)}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 text-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  Award Credits
                </button>
                <button
                  onClick={handleBulkEmail}
                  className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center gap-2 text-sm"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
              </div>
              <button
                onClick={() => setSelectedStudents([])}
                  className="p-1.5 hover:bg-teal-200 rounded-lg"
              >
                <X className="h-5 w-5 text-teal-900 dark:text-teal-100" />
                                <X className="h-5 w-5 text-teal-900" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No students found
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery || selectedGroup !== 'all' || selectedStatus !== 'all' || progressRange !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Get started by adding your first student'}
            </p>
            {!searchQuery && selectedGroup === 'all' && selectedStatus === 'all' && progressRange === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600"
              >
                Add First Student
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        // Table View
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-teal-500 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      Student
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('studentId')}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      Student ID
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Group / Company
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('progress')}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      Progress
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('attendance')}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      Attendance
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      Enrolled
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Current Module
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.map((student) => {
                  const attendance = getAttendancePercentage(student);
                  const alert = getStudentAlertData(student);
                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleViewDetails(student)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="rounded border-slate-300 text-teal-500 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(student.firstName, student.lastName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {student.firstName} {student.lastName}
                              </span>
                              {alert.type !== 'NONE' && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getAlertColor(alert.severity)}`}>
                                  {alert.type === 'STALLED' ? '⏸️ Stalled' : '⚠️ At Risk'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">
                            {student.group?.name || 'No Group'}
                          </div>
                          <div className="text-slate-500">
                            {student.group?.name || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(student.progress)}`}
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 min-w-[3rem] text-right">
                            {student.totalCreditsEarned || 0}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentForCredits(student);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500"
                            title="Adjust Credits"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>

                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-slate-700">
                            {attendance}%
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.status || 'ACTIVE'} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {format(new Date(student.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-900">
                          {student.currentModuleId ? (
                            `M${modules.find(m => m.id === student.currentModuleId)?.moduleNumber || '?'}`
                          ) : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => {
            const attendance = getAttendancePercentage(student);
            return (
              <div
                key={student.id}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-soft transition-shadow cursor-pointer relative"
                onClick={() => handleViewDetails(student)}
              >
                {/* Checkbox */}
                <div
                  className="absolute top-4 right-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleSelectStudent(student.id)}
                    className="rounded border-slate-300 text-teal-500 focus:ring-teal-500"
                  />
                </div>

                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(student.firstName, student.lastName)}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-semibold text-slate-900 text-center mb-1">
                  {student.firstName} {student.lastName}
                </h3>

                {/* Student ID */}
                <p className="text-sm text-slate-500 text-center mb-4">
                  {student.studentId}
                </p>

                {/* Group */}
                <div className="mb-4 text-center">
                  <p className="text-sm font-medium text-slate-900">
                    {student.group?.name || 'No Group'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {student.group?.name || 'N/A'}
                  </p>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      Progress
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {student.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(student.progress)}`}
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>

                {/* Attendance */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-600">
                    Attendance
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {attendance}%
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Status
                  </span>
                  <StatusBadge status={student.status || 'ACTIVE'} />
                </div>

                {/* Enrollment Date */}
                <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-500">
                    Enrolled {format(new Date(student.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={async (student) => {
            try {
              const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId: student.studentId,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  email: student.email || undefined,
                  phone: student.phone || undefined,
                  groupId: student.groupId || student.group,
                  status: student.status || 'ACTIVE',
                  progress: student.progress || 0,
                }),
              });

              console.log('📡 Response status:', response.status);

              if (response.ok) {
                const result = await response.json();
                console.log('✅ Success:', result);
                alert('Student added successfully!');
                setShowAddModal(false);
                mutate(); // Revalidate SWR cache
                router.refresh(); // Refresh server components
              } else {
                const error = await response.json();
                console.error('❌ API Error:', error);
                alert(`Failed to add student: ${error.error || error.message || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('❌ Error adding student:', error);
              alert('Failed to add student. Please try again.');
            }
          }}
        />
      )}

      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onSave={async (updated) => {
            try {
              const response = await fetch(`/api/students/${selectedStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
              });

              if (response.ok) {
                alert('Student updated successfully!');
                setShowDetailsModal(false);
                mutate(); // Revalidate SWR cache
                router.refresh(); // Refresh server components
              } else {
                const error = await response.json();
                alert(`Failed to update student: ${error.error}`);
              }
            } catch (error) {
              console.error('Error updating student:', error);
              alert('Failed to update student. Please try again.');
            }
          }}
        />
      )}
      {/* Bulk Assessment Modal */}
      <BulkAssessmentModal
        isOpen={showBulkAssessmentModal}
        onClose={() => setShowBulkAssessmentModal(false)}
        studentIds={selectedStudents}
        onSuccess={() => {
          setSelectedStudents([]);
          mutate();
        }}
      />
      <CreditAdjustmentModal
        isOpen={!!selectedStudentForCredits}
        onClose={() => setSelectedStudentForCredits(null)}
        student={selectedStudentForCredits}
        onSuccess={() => {
          mutate();
        }}
      />
    </div>
  );
}


