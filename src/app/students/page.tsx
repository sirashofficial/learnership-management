'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AddStudentModal from '@/components/AddStudentModal';
import StudentDetailsModal from '@/components/StudentDetailsModal';
import { useStudents, type Student } from '@/hooks/useStudents';
import { useGroups } from '@/contexts/GroupsContext';
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
  X
} from 'lucide-react';
import { format } from 'date-fns';

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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Calculate attendance percentage (mocked for now)
  const getAttendancePercentage = (student: Student) => {
    // This would come from actual attendance data
    return Math.floor(Math.random() * 30) + 70; // 70-100%
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
  }, [students, searchQuery, selectedGroup, selectedStatus, progressRange, sortField, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!students) return { total: 0, active: 0, avgProgress: 0, avgAttendance: 0 };

    const activeStudents = students.filter((s) => s.status === 'ACTIVE');
    const totalProgress = students.reduce((sum: number, s) => sum + s.progress, 0);
    const totalAttendance = students.reduce((sum: number, s) => sum + getAttendancePercentage(s), 0);

    return {
      total: students.length,
      active: activeStudents.length,
      avgProgress: students.length > 0 ? Math.round(totalProgress / students.length) : 0,
      avgAttendance: students.length > 0 ? Math.round(totalAttendance / students.length) : 0,
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
    // Implementation for bulk archive
    console.log('Archiving students:', selectedStudents);
    setSelectedStudents([]);
  };

  const handleBulkEmail = async () => {
    // Implementation for bulk email
    console.log('Sending email to students:', selectedStudents);
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/students?export=csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'COMPLETED':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
      case 'SUSPENDED':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'WITHDRAWN':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
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
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center text-red-600 dark:text-red-400">
              Error loading students
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Students
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage and track student progress
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Students
                </p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.total}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Active Students
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.active}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Avg Progress
                </p>
              </div>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {stats.avgProgress}%
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Avg Attendance
                </p>
              </div>
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {stats.avgAttendance}%
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
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
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg ${
                      viewMode === 'table'
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${
                      viewMode === 'grid'
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    showFilters
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Filter className="h-5 w-5" />
                  Filters
                  {(selectedGroup !== 'all' || selectedStatus !== 'all' || progressRange !== 'all') && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {[selectedGroup !== 'all', selectedStatus !== 'all', progressRange !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Export
                </button>

                {/* Add Student */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 flex items-center gap-2 shadow-lg"
                >
                  <UserPlus className="h-5 w-5" />
                  Add Student
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Group Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Group / Company
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="all">All Groups</option>
                      {groups?.map((group: any) => (
                        <option key={group.id} value={group.id}>
                          {group.name} - {group.company?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Progress Range
                    </label>
                    <select
                      value={progressRange}
                      onChange={(e) => setProgressRange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="all">All Progress</option>
                      <option value="0-25">0-25%</option>
                      <option value="26-50">26-50%</option>
                      <option value="51-75">51-75%</option>
                      <option value="76-100">76-100%</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Actions Banner */}
            {selectedStudents.length > 0 && (
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-200 dark:border-teal-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
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
                      onClick={handleBulkEmail}
                      className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center gap-2 text-sm"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedStudents([])}
                    className="p-1.5 hover:bg-teal-200 dark:hover:bg-teal-800 rounded-lg"
                  >
                    <X className="h-5 w-5 text-teal-900 dark:text-teal-100" />
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
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No students found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
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
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredStudents.map((student) => {
                      const attendance = getAttendancePercentage(student);
                      return (
                        <tr
                          key={student.id}
                          onClick={() => handleViewDetails(student)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
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
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
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
                              <div className="font-medium text-slate-900 dark:text-white">
                                {student.group?.name || 'No Group'}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {student.group?.name || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${getProgressColor(student.progress)}`}
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[3rem] text-right">
                                {student.progress}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {attendance}%
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {format(new Date(student.createdAt), 'MMM d, yyyy')}
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
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
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
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-1">
                      {student.firstName} {student.lastName}
                    </h3>

                    {/* Student ID */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                      {student.studentId}
                    </p>

                    {/* Group */}
                    <div className="mb-4 text-center">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {student.group?.name || 'No Group'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {student.group?.name || 'N/A'}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Progress
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {student.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(student.progress)}`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Attendance */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Attendance
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {attendance}%
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Status
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </div>

                    {/* Enrollment Date */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enrolled {format(new Date(student.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={async (student) => {
            try {
              console.log('📝 Student page: Received student data:', student);
              
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
    </div>
  );
}
