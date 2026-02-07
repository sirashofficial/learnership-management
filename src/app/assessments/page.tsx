"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import { useCurriculum } from "@/hooks/useCurriculum";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import AssessmentModal from "@/components/AssessmentModal";
import {
  ChevronDown, ChevronRight, Users, CheckCircle, Clock, XCircle, Calendar,
  BookOpen, FileText, TrendingUp, Grid3x3, Plus, Download, Filter,
  BarChart3, AlertTriangle, Award, Target, CheckSquare, FileCheck, Shield,
  LineChart, FileBarChart, Eye, ThumbsUp, ThumbsDown, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GroupCollection {
  id: string;
  name: string;
  subGroupNames: string[];
}

interface Assessment {
  id: string;
  type: string;
  method: string;
  result?: string;
  score?: number;
  dueDate: string;
  assessedDate?: string;
  attemptNumber: number;
  moderationStatus: string;
  student: any;
  unitStandard?: {
    code: string;
    title: string;
    module?: {
      name: string;
    };
  };
}

interface Template {
  id: string;
  name: string;
  type: string;
  method: string;
  description: string;
}

export default function AssessmentsPage() {
  const { modules, isLoading: isLoadingCurriculum } = useCurriculum();
  const { students, isLoading: isLoadingStudents } = useStudents();
  const { user } = useAuth();

  const [activeView, setActiveView] = useState<'manage' | 'analytics' | 'templates' | 'moderation' | 'progress' | 'compliance' | 'formatives'>('manage');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedUnitStandards, setExpandedUnitStandards] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCollection, setExpandedCollection] = useState<string | null>("montazility");
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedStudentForFormative, setSelectedStudentForFormative] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [formatives, setFormatives] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Group collections
  const groupCollections: GroupCollection[] = [
    {
      id: "montazility",
      name: "Montazility 26'",
      subGroupNames: ["Azelis 26'", "Beyond Insights 26'", "City Logistics 26'", "Monteagle 26'"]
    }
  ];

  // Group students
  const groupedStudents = useMemo(() => {
    return students.reduce((acc: any, student) => {
      const groupId = student.group?.id || 'no-group';
      const groupName = student.group?.name || 'No Group';
      if (!acc[groupId]) {
        acc[groupId] = { groupId, groupName, students: [] };
      }
      acc[groupId].students.push(student);
      return acc;
    }, {});
  }, [students]);

  // Separate groups
  const montazilityGroupIds = Object.keys(groupedStudents).filter(
    (groupId) => groupCollections[0].subGroupNames.includes(groupedStudents[groupId].groupName)
  );
  const individualGroupIds = Object.keys(groupedStudents).filter(
    (groupId) => !groupCollections[0].subGroupNames.includes(groupedStudents[groupId].groupName)
  );

  // Fetch assessments on mount
  useEffect(() => {
    fetchAssessments();
    fetchTemplates();
    fetchFormatives();
  }, []);

  // Fetch analytics when view changes
  useEffect(() => {
    if (activeView === 'analytics') {
      fetchAnalytics();
    }
  }, [activeView]);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      const data = await response.json();
      if (data.success) {
        setAssessments(data.data);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/assessments/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchFormatives = async () => {
    try {
      const response = await fetch('/api/formatives');
      const data = await response.json();
      if (data.success) {
        setFormatives(data.data);
      }
    } catch (error) {
      console.error('Error fetching formatives:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/assessments/analytics?period=all');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleBulkCreate = async (templateId: string, unitStandard: string, module: string, dueDate: string) => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student');
      return;
    }

    try {
      const response = await fetch('/api/assessments/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          studentIds: Array.from(selectedStudents),
          unitStandard,
          module,
          dueDate,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAssessments();
        setSelectedStudents(new Set());
        alert(`✅ Created ${data.data.length} assessments successfully!`);
      } else {
        throw new Error(data.error || 'Failed to create assessments');
      }
    } catch (error: any) {
      console.error('❌ Error creating bulk assessments:', error);
      alert(`Failed to create assessments: ${error.message}`);
    }
  };

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/assessments/export?format=${exportFormat}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessments-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const updateAssessmentResult = async (assessmentId: string, result: string, score?: number) => {
    try {
      const response = await fetch('/api/assessments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assessmentId,
          result,
          score,
          assessedDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        await fetchAssessments();
      }
    } catch (error) {
      console.error('Error updating assessment:', error);
    }
  };

  const updateFormativeCompletion = async (formativeId: string, passed: boolean) => {
    if (!selectedStudentForFormative) return;

    try {
      const response = await fetch('/api/formatives/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentForFormative,
          formativeId,
          passed,
          completedDate: passed ? new Date().toISOString() : null,
          moderationStatus: passed ? 'PENDING' : undefined,
        }),
      });

      if (response.ok) {
        await fetchFormatives();
      }
    } catch (error) {
      console.error('Error updating formative completion:', error);
    }
  };

  const getStatusBadge = (result?: string) => {
    if (!result || result === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (result === 'COMPETENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
          <CheckCircle className="w-3 h-3" />
          Competent
        </span>
      );
    }
    if (result === 'NOT_YET_COMPETENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
          <XCircle className="w-3 h-3" />
          NYC
        </span>
      );
    }
    return null;
  };

  const renderAnalyticsView = () => {
    if (!analytics) return <div>Loading analytics...</div>;

    const chartData = [
      { name: 'Formative', value: analytics.byType.formative },
      { name: 'Summative', value: analytics.byType.summative },
      { name: 'Integrated', value: analytics.byType.integrated },
    ];

    const methodData = Object.entries(analytics.byMethod).map(([key, value]) => ({
      name: key,
      value: value as number,
    }));

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment Analytics</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Assessments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.summary.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Competent</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.summary.competent}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pass Rate</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{analytics.summary.passRate}%</p>
              </div>
              <Target className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.summary.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Assessment Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Assessment Methods</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={methodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        {analytics.topPerformers && analytics.topPerformers.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Performers</h3>
            <div className="space-y-3">
              {analytics.topPerformers.slice(0, 10).map((performer: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {performer.student.firstName} {performer.student.lastName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {performer.competent}/{performer.total} assessments
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {performer.passRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTemplatesView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment Templates</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select students and use templates for bulk assessment creation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <FileCheck className="w-6 h-6 text-indigo-500" />
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  template.type === 'FORMATIVE' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  template.type === 'SUMMATIVE' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                  template.type === 'INTEGRATED' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                )}>
                  {template.type}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{template.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{template.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Method: {template.method}</span>
                <button
                  onClick={() => {
                    // Logic to use template would go here
                    alert(`Using template: ${template.name}\nSelect students from the Manage tab first.`);
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFormativesView = () => {
    // Group formatives by module
    const groupedFormatives = formatives.reduce((acc: any, formative) => {
      const moduleName = formative.module?.name || 'Unknown Module';
      if (!acc[moduleName]) {
        acc[moduleName] = [];
      }
      acc[moduleName].push(formative);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Formative Assessments</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Official formative assessments from the curriculum
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Student:</span>
            <select
              value={selectedStudentForFormative || ''}
              onChange={(e) => setSelectedStudentForFormative(e.target.value || null)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white min-w-[200px]"
            >
              <option value="">Select a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedStudentForFormative && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Tracking for: {students.find(s => s.id === selectedStudentForFormative)?.firstName} {students.find(s => s.id === selectedStudentForFormative)?.lastName}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Click 'Mark Complete' to update progress for this student
                </p>
              </div>
            </div>
          </div>
        )}

        {Object.entries(groupedFormatives).map(([moduleName, moduleFormatives]: [string, any]) => (
          <div key={moduleName} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">{moduleName}</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {moduleFormatives.map((formative: any) => {
                const completion = formative.completions?.find(
                  (c: any) => c.studentId === selectedStudentForFormative
                );
                const isCompleted = completion?.passed;

                return (
                  <div key={formative.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            {formative.code}
                          </span>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {formative.title}
                          </h4>
                          {selectedStudentForFormative && isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          {formative.description} • Unit Standard: {formative.unitStandard?.code}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {formative.questions || 0} Questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Pass: {formative.passingScore}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedStudentForFormative ? (
                          <button
                            onClick={() => updateFormativeCompletion(formative.id, !isCompleted)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                              isCompleted
                                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                            )}
                          >
                            {isCompleted ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                Mark Incomplete
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Mark Complete
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => alert(`Opening document: docs/Curriculumn and data process/${formative.documentPath}`)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            View PDF
                          </button>
                        )}

                        {selectedStudentForFormative && (
                          <button
                            onClick={() => alert(`Opening document: docs/Curriculumn and data process/${formative.documentPath}`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors"
                            title="View PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderModerationView = () => {
    // Get assessments that need moderation
    const pendingModeration = assessments.filter(a =>
      a.result === 'COMPETENT' && a.moderationStatus === 'PENDING'
    );
    const inReview = assessments.filter(a => a.moderationStatus === 'IN_REVIEW');
    const moderated = assessments.filter(a => ['APPROVED', 'REJECTED'].includes(a.moderationStatus));

    const handleModerate = async (assessmentId: string, status: 'APPROVED' | 'REJECTED', feedback?: string) => {
      try {
        const response = await fetch(`/api/assessments/moderate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            moderationStatus: status,
            moderatorId: user?.id,
            moderationNotes: feedback
          }),
        });
        if (response.ok) {
          await fetchAssessments();
        } else {
          console.error('Failed to moderate assessment:', await response.text());
        }
      } catch (error) {
        console.error('Error moderating assessment:', error);
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment Moderation</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending Moderation</p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{pendingModeration.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">In Review</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{inReview.length}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Moderated</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{moderated.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Assessments */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Assessments Requiring Moderation</h3>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {pendingModeration.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p>No assessments pending moderation</p>
              </div>
            ) : (
              pendingModeration.map((assessment) => (
                <div key={assessment.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                          {assessment.student?.firstName?.[0]}{assessment.student?.lastName?.[0]}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {assessment.student?.firstName} {assessment.student?.lastName}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{assessment.student?.studentId}</p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">Unit Standard:</span> {assessment.unitStandard?.code} - {assessment.unitStandard?.title}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">Type:</span> {assessment.type} | <span className="font-medium">Method:</span> {assessment.method}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">Score:</span> {assessment.score || 'N/A'} | <span className="font-medium">Assessed:</span> {assessment.assessedDate ? format(new Date(assessment.assessedDate), 'dd MMM yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerate(assessment.id, 'APPROVED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const feedback = prompt('Please provide feedback for rejection:');
                          if (feedback) handleModerate(assessment.id, 'REJECTED', feedback);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Moderated */}
        {moderated.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recently Moderated</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {moderated.slice(0, 10).map((assessment) => (
                <div key={assessment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-semibold">
                          {assessment.student?.firstName?.[0]}{assessment.student?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {assessment.student?.firstName} {assessment.student?.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{assessment.unitStandard?.code}</p>
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      assessment.moderationStatus === 'APPROVED' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      assessment.moderationStatus === 'REJECTED' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {assessment.moderationStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProgressView = () => {
    // Calculate student progress
    const studentProgress = students.map(student => {
      const studentAssessments = assessments.filter(a => a.student?.id === student.id);
      const competent = studentAssessments.filter(a => a.result === 'COMPETENT').length;
      const total = studentAssessments.length;
      const progressPercentage = total > 0 ? (competent / total) * 100 : 0;

      // Calculate module progress
      const moduleProgress = modules.map(module => {
        const moduleAssessments = studentAssessments.filter(a => a.unitStandard?.module?.name === module.name);
        const moduleCompetent = moduleAssessments.filter(a => a.result === 'COMPETENT').length;
        const moduleTotal = module.unitStandards?.length || 0;
        return {
          moduleName: module.name,
          completed: moduleCompetent,
          total: moduleTotal,
          percentage: moduleTotal > 0 ? (moduleCompetent / moduleTotal) * 100 : 0
        };
      });

      return {
        student,
        competent,
        total,
        progressPercentage,
        moduleProgress
      };
    }).sort((a, b) => b.progressPercentage - a.progressPercentage);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Progress Tracking</h2>
          <button
            onClick={() => alert('Export progress reports functionality')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Progress</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {studentProgress.length > 0
                    ? Math.round(studentProgress.reduce((sum, s) => sum + s.progressPercentage, 0) / studentProgress.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">On Track</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {studentProgress.filter(s => s.progressPercentage >= 70).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">At Risk</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {studentProgress.filter(s => s.progressPercentage < 50).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Student Progress List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Individual Student Progress</h3>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {studentProgress.map(({ student, competent, total, progressPercentage, moduleProgress }) => (
              <div key={student.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {student.studentId} • {student.group?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round(progressPercentage)}%
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {competent}/{total} completed
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className={cn(
                        "h-3 rounded-full transition-all",
                        progressPercentage >= 70 && "bg-green-500",
                        progressPercentage >= 50 && progressPercentage < 70 && "bg-yellow-500",
                        progressPercentage < 50 && "bg-red-500"
                      )}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Module Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {moduleProgress.map((mp) => (
                    <div key={mp.moduleName} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{mp.moduleName}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-indigo-600"
                            style={{ width: `${mp.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{Math.round(mp.percentage)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderComplianceView = () => {
    const currentYear = new Date().getFullYear();
    const reportTypes = [
      {
        id: 'quarterly',
        name: 'Quarterly Assessment Report',
        description: 'Summary of all assessments completed in the quarter',
        icon: FileBarChart,
        frequency: 'Quarterly'
      },
      {
        id: 'seta',
        name: 'SETA Submission Report',
        description: 'Compliance report for SETA submissions',
        icon: Send,
        frequency: 'As Required'
      },
      {
        id: 'moderation',
        name: 'Moderation Summary',
        description: 'Overview of assessment moderation activities',
        icon: Shield,
        frequency: 'Monthly'
      },
      {
        id: 'achievement',
        name: 'Student Achievement Report',
        description: 'Individual student progress and achievement rates',
        icon: Award,
        frequency: 'Monthly'
      },
      {
        id: 'completion',
        name: 'Programme Completion Report',
        description: 'Learnership completion status and statistics',
        icon: Target,
        frequency: 'Annually'
      }
    ];

    const handleGenerateReport = (reportType: string, format: 'pdf' | 'excel') => {
      alert(`Generating ${reportType} report in ${format.toUpperCase()} format...`);
      // API call would go here
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Reports</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate reports for SETA and compliance requirements</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Reports Generated</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">24</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">This year</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Completion Rate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">87%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Above target</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Active Learners</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Currently enrolled</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Compliance Status</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              <CheckCircle className="w-8 h-8 inline" />
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Up to date</p>
          </div>
        </div>

        {/* Report Generation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Generate Reports</h3>
          </div>
          <div className="p-6 space-y-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <div key={report.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{report.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{report.description}</p>
                        <span className="inline-flex items-center px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                          {report.frequency}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateReport(report.id, 'pdf')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Generate PDF
                      </button>
                      <button
                        onClick={() => handleGenerateReport(report.id, 'excel')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Generate Excel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Reports</h3>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {[
              { name: 'Q4 2025 Assessment Report', date: '2026-01-15', type: 'Quarterly', format: 'PDF' },
              { name: 'SETA Submission - December', date: '2025-12-31', type: 'SETA', format: 'Excel' },
              { name: 'November Moderation Summary', date: '2025-12-01', type: 'Moderation', format: 'PDF' },
            ].map((report, index) => (
              <div key={index} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{report.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Generated on {format(new Date(report.date), 'dd MMM yyyy')} • {report.type} • {report.format}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingCurriculum || isLoadingStudents) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500 dark:text-slate-400">Loading...</div>
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
                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                Assessment Management
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Track and manage learner assessments across all modules
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
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsAssessmentModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Assessment
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveView('manage')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                activeView === 'manage'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              Manage Assessments
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
                activeView === 'analytics'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveView('templates')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
                activeView === 'templates'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <FileCheck className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setActiveView('moderation')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
                activeView === 'moderation'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <Shield className="w-4 h-4" />
              Moderation
            </button>
            <button
              onClick={() => setActiveView('progress')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
                activeView === 'progress'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <LineChart className="w-4 h-4" />
              Progress Tracking
            </button>
            <button
              onClick={() => setActiveView('compliance')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
                activeView === 'compliance'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <FileBarChart className="w-4 h-4" />
              Compliance Reports
            </button>
            <button
              onClick={() => setActiveView('formatives')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
                activeView === 'formatives'
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <FileText className="w-4 h-4" />
              Formatives
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && activeView === 'manage' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterType(null)}
                      className={cn(
                        "px-3 py-1 rounded text-sm font-medium transition-colors",
                        !filterType ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterType('FORMATIVE')}
                      className={cn(
                        "px-3 py-1 rounded text-sm font-medium transition-colors",
                        filterType === 'FORMATIVE' ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      Formative
                    </button>
                    <button
                      onClick={() => setFilterType('SUMMATIVE')}
                      className={cn(
                        "px-3 py-1 rounded text-sm font-medium transition-colors",
                        filterType === 'SUMMATIVE' ? "bg-purple-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      Summative
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Method</label>
                  <select
                    value={filterMethod || ''}
                    onChange={(e) => setFilterMethod(e.target.value || null)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">All Methods</option>
                    <option value="KNOWLEDGE">Knowledge</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="OBSERVATION">Observation</option>
                    <option value="PORTFOLIO">Portfolio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Result</label>
                  <select
                    value={filterResult || ''}
                    onChange={(e) => setFilterResult(e.target.value || null)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">All Results</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPETENT">Competent</option>
                    <option value="NOT_YET_COMPETENT">Not Yet Competent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Selection Actions */}
          {selectedStudents.size > 0 && activeView === 'manage' && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6 flex items-center justify-between">
              <p className="text-indigo-900 dark:text-indigo-300 font-medium">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Bulk Create Assessments
                </button>
                <button
                  onClick={() => setSelectedStudents(new Set())}
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {activeView === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Modules</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{modules.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Unit Standards</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {modules.reduce((sum, m) => sum + (m.unitStandards?.length || 0), 0)}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Learners</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Assessments</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{assessments.length}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {activeView === 'manage' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Expand modules and unit standards to view and manage student assessments
              </p>
            </div>
            <div className="space-y-1">
              {modules.map((module) => {
                const moduleUnitStandards = module.unitStandards || [];
                const isModuleExpanded = expandedModules.has(module.id);

                return (
                  <div key={module.id} className="border-b dark:border-slate-700 last:border-b-0">
                    {/* Module Header */}
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedModules);
                        if (newExpanded.has(module.id)) {
                          newExpanded.delete(module.id);
                        } else {
                          newExpanded.add(module.id);
                        }
                        setExpandedModules(newExpanded);
                      }}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isModuleExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{module.code}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{module.name}</p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {module.credits} Credits • {moduleUnitStandards.length} Unit Standards
                      </span>
                    </button>

                    {/* Unit Standards */}
                    {isModuleExpanded && (
                      <div className="bg-slate-50 dark:bg-slate-900">
                        {moduleUnitStandards.map((unitStandard: any) => {
                          const isUSExpanded = expandedUnitStandards.has(unitStandard.id);

                          return (
                            <div key={unitStandard.id} className="border-t border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedUnitStandards);
                                  if (newExpanded.has(unitStandard.id)) {
                                    newExpanded.delete(unitStandard.id);
                                  } else {
                                    newExpanded.add(unitStandard.id);
                                  }
                                  setExpandedUnitStandards(newExpanded);
                                }}
                                className="w-full px-6 py-3 pl-16 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {isUSExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                  <FileText className="w-4 h-4 text-purple-500" />
                                  <div className="text-left">
                                    <h4 className="font-medium text-slate-900 dark:text-white">{unitStandard.code}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{unitStandard.title}</p>
                                  </div>
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  {unitStandard.credits} Credits • NQF Level {unitStandard.level}
                                </span>
                              </button>

                              {/* Student Lists */}
                              {isUSExpanded && (
                                <div className="bg-white dark:bg-slate-800 p-4">
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    Select students and manage their assessments for this unit standard
                                  </p>
                                  {/* Students would be listed here with checkboxes and assessment status */}
                                  <div className="space-y-2">
                                    {students.slice(0, 5).map((student) => {
                                      const isSelected = selectedStudents.has(student.id);
                                      return (
                                        <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                          <div className="flex items-center gap-3">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={(e) => {
                                                const newSelected = new Set(selectedStudents);
                                                if (e.target.checked) {
                                                  newSelected.add(student.id);
                                                } else {
                                                  newSelected.delete(student.id);
                                                }
                                                setSelectedStudents(newSelected);
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
                                          <div className="flex items-center gap-2">
                                            {getStatusBadge()}
                                          </div>
                                        </div>
                                      );
                                    })}
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
            </div>
          </div>
        )}

        {activeView === 'analytics' && renderAnalyticsView()}
        {activeView === 'templates' && renderTemplatesView()}
        {activeView === 'moderation' && renderModerationView()}
        {activeView === 'progress' && renderProgressView()}
        {activeView === 'compliance' && renderComplianceView()}
        {activeView === 'formatives' && renderFormativesView()}
      </main>

      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onSubmit={async (data) => {
          try {
            await fetch('/api/assessments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            await fetchAssessments();
            setIsAssessmentModalOpen(false);
          } catch (error) {
            console.error('Error creating assessment:', error);
          }
        }}
        students={students}
        modules={modules}
      />
    </div>
  );
}
