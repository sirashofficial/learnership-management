'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Calendar,
  Users,
  ClipboardCheck,
  Filter,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from 'date-fns';

interface Group {
  id: string;
  name: string;
  location?: string;
  studentCount: number;
}

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  groupId: string;
}

type ReportType = 'workplace-agreement' | 'monthly-progress' | 'assessment-schedule';
type ExportFormat = 'docx' | 'pdf';

export default function SSETAReportsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Report configuration
  const [reportType, setReportType] = useState<ReportType>('monthly-progress');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('docx');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  // Date ranges
  const [reportMonth, setReportMonth] = useState<Date>(new Date());
  const [scheduleStartDate, setScheduleStartDate] = useState<Date>(new Date());
  const [scheduleEndDate, setScheduleEndDate] = useState<Date>(addMonths(new Date(), 3));

  // Workplace agreement specific fields
  const [workplaceData, setWorkplaceData] = useState({
    employerName: '',
    employerContact: '',
    employerAddress: '',
    workplaceMentorName: '',
    workplaceMentorEmail: '',
    trainingPeriodStart: format(new Date(), 'yyyy-MM-dd'),
    trainingPeriodEnd: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    providerName: 'YEHA Training Academy',
    providerAccreditationNumber: 'ACC-2024-001',
    coordinatorName: '',
    coordinatorContact: '',
  });

  useEffect(() => {
    // Check if user has access (ADMIN or COORDINATOR)
    if (user && user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      router.push('/');
      return;
    }
    fetchGroups();
    fetchStudents();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/data/groups', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(
          data.data.map((g: any) => ({
            id: g.id,
            name: g.name,
            location: g.location,
            studentCount: g._count?.students || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(groups.map((g) => g.id));
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);

    try {
      let endpoint = '';
      let body = {};

      switch (reportType) {
        case 'workplace-agreement':
          if (!selectedStudent) {
            alert('Please select a student for the workplace agreement');
            setGenerating(false);
            return;
          }

          endpoint = '/api/reports/sseta/workplace-agreement';
          body = {
            studentId: selectedStudent,
            ...workplaceData,
            format: exportFormat,
          };
          break;

        case 'monthly-progress':
          if (selectedGroups.length === 0) {
            alert('Please select at least one group');
            setGenerating(false);
            return;
          }

          endpoint = '/api/reports/sseta/monthly-progress';
          body = {
            groupIds: selectedGroups,
            reportMonth: reportMonth.toISOString(),
            format: exportFormat,
          };
          break;

        case 'assessment-schedule':
          if (selectedGroups.length === 0) {
            alert('Please select at least one group');
            setGenerating(false);
            return;
          }

          // Generate for first selected group (can be enhanced for multiple)
          endpoint = '/api/reports/sseta/assessment-schedule';
          body = {
            groupId: selectedGroups[0],
            startDate: scheduleStartDate.toISOString(),
            endDate: scheduleEndDate.toISOString(),
            includeCompleted: false,
            format: exportFormat,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
        const filename = filenameMatch
          ? filenameMatch[1]
          : `SSETA_Report_${Date.now()}.${exportFormat}`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Report generated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to generate report'}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SSETA Compliance Reports
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Generate accreditation-ready reports for Services SETA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Report Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Type Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2 text-blue-600" />
                Report Type
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setReportType('workplace-agreement')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    reportType === 'workplace-agreement'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Workplace Agreement</div>
                  <div className="text-xs text-gray-600 mt-1">
                    WBL Agreement Document
                  </div>
                </button>

                <button
                  onClick={() => setReportType('monthly-progress')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    reportType === 'monthly-progress'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-sm font-medium">Monthly Progress</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Student Progress Report
                  </div>
                </button>

                <button
                  onClick={() => setReportType('assessment-schedule')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    reportType === 'assessment-schedule'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                  <div className="text-sm font-medium">Assessment Schedule</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Upcoming Assessments
                  </div>
                </button>
              </div>
            </div>

            {/* Export Format */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Export Format
              </h2>

              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="docx"
                    checked={exportFormat === 'docx'}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    DOCX (Editable) - Recommended
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">PDF (Submission)</span>
                </label>
              </div>
            </div>

            {/* Dynamic Configuration based on Report Type */}
            {reportType === 'workplace-agreement' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Workplace Agreement Details
                </h2>

                <div className="space-y-4">
                  {/* Student Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Student *
                    </label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a student...</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.studentId} - {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employer Name *
                      </label>
                      <input
                        type="text"
                        value={workplaceData.employerName}
                        onChange={(e) =>
                          setWorkplaceData({ ...workplaceData, employerName: e.target.value })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Company or Organization"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employer Contact *
                      </label>
                      <input
                        type="text"
                        value={workplaceData.employerContact}
                        onChange={(e) =>
                          setWorkplaceData({ ...workplaceData, employerContact: e.target.value })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact Person"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer Address *
                    </label>
                    <textarea
                      value={workplaceData.employerAddress}
                      onChange={(e) =>
                        setWorkplaceData({ ...workplaceData, employerAddress: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Full physical address"
                    />
                  </div>

                  {/* Workplace Mentor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workplace Mentor Name *
                      </label>
                      <input
                        type="text"
                        value={workplaceData.workplaceMentorName}
                        onChange={(e) =>
                          setWorkplaceData({
                            ...workplaceData,
                            workplaceMentorName: e.target.value,
                          })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mentor Email *
                      </label>
                      <input
                        type="email"
                        value={workplaceData.workplaceMentorEmail}
                        onChange={(e) =>
                          setWorkplaceData({
                            ...workplaceData,
                            workplaceMentorEmail: e.target.value,
                          })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Training Period */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Training Start Date *
                      </label>
                      <input
                        type="date"
                        value={workplaceData.trainingPeriodStart}
                        onChange={(e) =>
                          setWorkplaceData({
                            ...workplaceData,
                            trainingPeriodStart: e.target.value,
                          })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Training End Date *
                      </label>
                      <input
                        type="date"
                        value={workplaceData.trainingPeriodEnd}
                        onChange={(e) =>
                          setWorkplaceData({
                            ...workplaceData,
                            trainingPeriodEnd: e.target.value,
                          })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Coordinator Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Training Coordinator Name *
                      </label>
                      <input
                        type="text"
                        value={workplaceData.coordinatorName}
                        onChange={(e) =>
                          setWorkplaceData({ ...workplaceData, coordinatorName: e.target.value })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coordinator Contact *
                      </label>
                      <input
                        type="text"
                        value={workplaceData.coordinatorContact}
                        onChange={(e) =>
                          setWorkplaceData({
                            ...workplaceData,
                            coordinatorContact: e.target.value,
                          })
                        }
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'monthly-progress' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Progress Configuration
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Month
                    </label>
                    <input
                      type="month"
                      value={format(reportMonth, 'yyyy-MM')}
                      onChange={(e) => setReportMonth(new Date(e.target.value + '-01'))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Groups *
                      </label>
                      <button
                        onClick={handleSelectAllGroups}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {selectedGroups.length === groups.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>

                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                      {groups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={() => handleGroupToggle(group.id)}
                            className="text-blue-600 focus:ring-blue-500 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{group.name}</div>
                            <div className="text-xs text-gray-600">
                              {group.location} • {group.studentCount} students
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'assessment-schedule' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Assessment Schedule Configuration
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={format(scheduleStartDate, 'yyyy-MM-dd')}
                        onChange={(e) => setScheduleStartDate(new Date(e.target.value))}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={format(scheduleEndDate, 'yyyy-MM-dd')}
                        onChange={(e) => setScheduleEndDate(new Date(e.target.value))}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Group *
                    </label>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                      {groups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="scheduleGroup"
                            checked={selectedGroups[0] === group.id}
                            onChange={() => setSelectedGroups([group.id])}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{group.name}</div>
                            <div className="text-xs text-gray-600">
                              {group.location} • {group.studentCount} students
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Generate & Download Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Information & Guidelines */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                SSETA Compliance Guidelines
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• All reports meet Services SETA accreditation requirements</li>
                <li>• Documents include required legal clauses and signature blocks</li>
                <li>• Reports are automatically logged for audit trail compliance</li>
                <li>• DOCX format allows editing before submission</li>
                <li>• PDF format is submission-ready for SSETA portal</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Report Types</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900">Workplace Agreement</div>
                  <p className="text-gray-600 mt-1">
                    Formal agreement between learner, employer, and training provider.
                    Required for workplace-based learning programs.
                  </p>
                </div>

                <div>
                  <div className="font-medium text-gray-900">Monthly Progress</div>
                  <p className="text-gray-600 mt-1">
                    Comprehensive progress report showing attendance, credits earned, and
                    module completion for all learners in selected groups.
                  </p>
                </div>

                <div>
                  <div className="font-medium text-gray-900">Assessment Schedule</div>
                  <p className="text-gray-600 mt-1">
                    Timeline of upcoming summative assessments including all three
                    required types: Formative, Summative, and Workplace.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Reports use real-time data from the system</li>
                <li>• Ensure all student data is up to date before generating</li>
                <li>• Digital signatures must be added manually</li>
                <li>• Keep copies of all submitted reports for audits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
