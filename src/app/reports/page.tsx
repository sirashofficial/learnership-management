'use client';

import { formatGroupNameDisplay } from '@/lib/groupName';

import { useState, useEffect } from 'react';
// ...existing code...
import { useGroups } from '@/contexts/GroupsContext';
import { format } from 'date-fns';
import {
    FileText,
    Calendar,
    Users,
    Download,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Clock,
    Sparkles,
    X,
    Copy,
    FileDown,
    TrendingUp,
    Award,
    BarChart3
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { downloadExport } from '@/lib/utils';
// We might not have 'marked' installed, so let's stick to raw or simple display first. 
// Actually, I'll just display it in a textarea or pre tag.

type ReportType = 'daily-attendance' | 'group-progress' | 'assessment-results' | 'unit-standards';

export default function ReportsPage() {
    const { groups } = useGroups();
    
    // Main report type selector
    const [reportType, setReportType] = useState<ReportType>('daily-attendance');

    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [facilitatorName, setFacilitatorName] = useState<string>('');
    const [activeGroupTab, setActiveGroupTab] = useState<string>('');

    // Per-group training data
    const [groupTrainingData, setGroupTrainingData] = useState<Record<string, {
        selectedModules: string[];
        topicsCovered: string;
        activitiesCompleted: string;
    }>>({});

    const [observations, setObservations] = useState<string>('');
    const [challenges, setChallenges] = useState<string>('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // New state for different report types
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [reportData, setReportData] = useState<any>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    // New state for dropdowns
    const [modules, setModules] = useState<any[]>([]);
    const [availableUnitStandards, setAvailableUnitStandards] = useState<any[]>([]);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await fetch('/api/modules?includeUnitStandards=true');
                const data = await response.json();
                if (data.modules) {
                    setModules(data.modules);
                }
            } catch (error) {
                console.error('Error fetching modules:', error);
            }
        };
        fetchModules();
    }, []);

    // Handle group selection - initialize per-group data
    const handleGroupSelectionChange = (selected: string[]) => {
        if (selected.length <= 10) {
            setSelectedGroups(selected);
            
            // Initialize or clear group training data
            const newGroupData: Record<string, any> = {};
            selected.forEach(groupId => {
                if (!groupTrainingData[groupId]) {
                    newGroupData[groupId] = {
                        selectedModules: [],
                        topicsCovered: '',
                        activitiesCompleted: ''
                    };
                } else {
                    newGroupData[groupId] = groupTrainingData[groupId];
                }
            });
            setGroupTrainingData(newGroupData);
            
            // Set active tab to first group
            if (selected.length > 0 && !activeGroupTab) {
                setActiveGroupTab(selected[0]);
            }
        } else {
            alert('You can select a maximum of 10 groups');
        }
    };

    // Update per-group training data
    const updateGroupTrainingData = (groupId: string, field: string, value: any) => {
        setGroupTrainingData(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                [field]: value
            }
        }));
    };

    // Get available unit standards for currently active group
    const getAvailableUnitStandardsForGroup = (groupId: string) => {
        const selectedModuleNames = groupTrainingData[groupId]?.selectedModules || [];
        if (selectedModuleNames.length === 0) {
            return [];
        }
        const unitStandards: any[] = [];
        selectedModuleNames.forEach(moduleName => {
            const selectedModule = modules.find(m => m.name === moduleName);
            if (selectedModule && selectedModule.unitStandards) {
                unitStandards.push(...selectedModule.unitStandards);
            }
        });
        return unitStandards;
    };

    const handleGenerateReport = async () => {
        if (!selectedGroups.length || !selectedDate || !facilitatorName) {
            setErrorMessage('Please fill in Date, Groups, and Facilitator Name before generating.');
            return;
        }

        // Verify each group has training data
        for (const groupId of selectedGroups) {
            if (!groupTrainingData[groupId] || groupTrainingData[groupId].selectedModules.length === 0) {
                alert(`Please select modules for ${groups.find(g => g.id === groupId)?.name}`);
                return;
            }
        }

        setIsGenerating(true);
        setErrorMessage('');
        try {
            // 1. Fetch Data for all selected groups with their specific training data
            const response = await fetch('/api/reports/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    date: selectedDate,
                    groupIds: selectedGroups,
                    facilitator: facilitatorName,
                    groupTrainingData: selectedGroups.reduce((acc, groupId) => {
                        const data = groupTrainingData[groupId];
                        acc[groupId] = {
                            modulesCovered: data.selectedModules.join(', '),
                            topicsCovered: data.topicsCovered,
                            activitiesCompleted: data.activitiesCompleted.split('\n').filter(line => line.trim()),
                        };
                        return acc;
                    }, {} as Record<string, any>),
                    observations,
                    challengesFaced: challenges,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to generate report — check that the group exists and has students');
            }

            const { data } = await response.json();

            // 2. Generate PDF Client-Side
            generatePDF(data);

        } catch (error: any) {
            console.error('Error generating report:', error);
            setErrorMessage(error.message || 'Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAiReport = async () => {
        if (!selectedGroups.length || !selectedDate || !facilitatorName) {
            alert('Please fill in all required fields (Date, Groups, Facilitator)');
            return;
        }

        // Verify each group has training data
        for (const groupId of selectedGroups) {
            if (!groupTrainingData[groupId] || groupTrainingData[groupId].selectedModules.length === 0) {
                alert(`Please select modules for ${groups.find(g => g.id === groupId)?.name}`);
                return;
            }
        }

        setIsAiGenerating(true);
        try {
            const response = await fetch('/api/reports/daily/generate-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    groupIds: selectedGroups,
                    facilitator: facilitatorName,
                    groupTrainingData: selectedGroups.reduce((acc, groupId) => {
                        const data = groupTrainingData[groupId];
                        acc[groupId] = {
                            modulesCovered: data.selectedModules.join(', '),
                            topicsCovered: data.topicsCovered,
                            activitiesCompleted: data.activitiesCompleted.split('\n').filter(line => line.trim()),
                        };
                        return acc;
                    }, {} as Record<string, any>),
                    observations,
                    challengesFaced: challenges,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate AI report');
            }

            const data = await response.json();
            if (data.success) {
                setAiReport(data.report);
                setShowAiModal(true);
            } else {
                throw new Error(data.error || 'Unknown error');
            }

        } catch (error) {
            console.error('Error generating AI report:', error);
            alert('Failed to generate AI report. Please try again.');
        } finally {
            setIsAiGenerating(false);
        }
    };

    // Handler for Group Progress Report
    const handleGenerateGroupProgress = async () => {
        if (!selectedGroup) {
            alert('Please select a group');
            return;
        }
        
        setIsLoadingReport(true);
        try {
            const response = await fetch(
                `/api/reports/group-progress?groupId=${selectedGroup}&startDate=${startDate}&endDate=${endDate}`
            );
            if (!response.ok) throw new Error('Failed to fetch group progress');
            
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate group progress report');
        } finally {
            setIsLoadingReport(false);
        }
    };

    // Handler for Assessment Results Report
    const handleGenerateAssessmentResults = async () => {
        if (!selectedGroup) {
            alert('Please select a group');
            return;
        }
        
        setIsLoadingReport(true);
        try {
            const response = await fetch(
                `/api/reports/assessment-results?groupId=${selectedGroup}&startDate=${startDate}&endDate=${endDate}`
            );
            if (!response.ok) throw new Error('Failed to fetch assessment results');
            
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate assessment results report');
        } finally {
            setIsLoadingReport(false);
        }
    };

    // Handler for Unit Standards Completion Report
    const handleGenerateUnitStandards = async () => {
        if (!selectedGroup) {
            alert('Please select a group');
            return;
        }
        
        setIsLoadingReport(true);
        try {
            const response = await fetch(
                `/api/reports/unit-standards?groupId=${selectedGroup}`
            );
            if (!response.ok) throw new Error('Failed to fetch unit standards');
            
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate unit standards report');
        } finally {
            setIsLoadingReport(false);
        }
    };

    // Handler for Daily Attendance Report with AI
    const handleGenerateDailyAttendance = async () => {
        if (!selectedGroup || !selectedDate) {
            alert('Please select a group and date');
            return;
        }
        
        setIsLoadingReport(true);
        try {
            const response = await fetch(
                `/api/reports/daily?groupId=${selectedGroup}&date=${selectedDate}`
            );
            if (!response.ok) throw new Error('Failed to fetch daily report');
            
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate daily attendance report');
        } finally {
            setIsLoadingReport(false);
        }
    };

    // Generate AI Summary for current report
    const handleGenerateAISummary = async () => {
        if (!reportData) {
            alert('Please generate a report first');
            return;
        }
        
        setIsAiGenerating(true);
        try {
            const response = await fetch('/api/reports/generate-ai-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType,
                    reportData
                }),
            });
            
            if (!response.ok) throw new Error('Failed to generate AI summary');
            
            const data = await response.json();
            if (data.success) {
                setAiReport(data.summary);
                setShowAiModal(true);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate AI summary');
        } finally {
            setIsAiGenerating(false);
        }
    };

    const downloadAiReport = () => {
        if (!aiReport) return;
        const blob = new Blob([aiReport], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const groupNames = selectedGroups
            .map(id => formatGroupNameDisplay(groups.find(g => g.id === id)?.name || 'Group'))
            .join('-');
        a.download = `Daily_Report_AI_${groupNames}_${selectedDate}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        if (aiReport) {
            navigator.clipboard.writeText(aiReport);
            alert('Copied to clipboard!');
        }
    };

    const generatePDF = (data: any) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPos = 20;

        // Helper for adding text
        const addText = (text: string, fontSize = 10, isBold = false, color = '#000000') => {
            doc.setFontSize(fontSize);
            doc.setTextColor(color);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');

            // Handle multi-line
            const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
            doc.text(splitText, margin, yPos);
            yPos += (splitText.length * fontSize * 0.3527) + 2;
        };

        const addHeading = (text: string) => {
            yPos += 5;
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
            addText(text, 12, true, '#333333');
            yPos += 5;
        };

        const checkPageBreak = (spaceNeeded: number = 30) => {
            if (yPos + spaceNeeded > doc.internal.pageSize.height - margin) {
                doc.addPage();
                yPos = margin;
            }
        };

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Training Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Meta Info (displayed once at top)
        addText(`Date: ${format(new Date(data.meta.date), 'dd MMMM yyyy')}`, 11);
        addText(`Facilitator: ${data.meta.facilitator}`, 11);
        yPos += 10;

        // Process each group separately
        data.groups.forEach((groupData: any, index: number) => {
            // Page break before new group (except first)
            if (index > 0) {
                doc.addPage();
                yPos = margin;
            }

            checkPageBreak();

            // Group heading
            addHeading(`Group: ${formatGroupNameDisplay(groupData.groupName || '')}`);
            yPos += 5;

            // Attendance
            addHeading('Attendance Summary');
            const presentCount = groupData.attendance.present.length;
            const absentCount = groupData.attendance.absent.length;
            const lateCount = groupData.attendance.late.length;
            const total = presentCount + absentCount + lateCount;
            const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

            addText(`Present: ${presentCount} | Absent: ${absentCount} | Late: ${lateCount} | Attendance Rate: ${rate}%`, 10);

            if (absentCount > 0) {
                yPos += 5;
                checkPageBreak();
                addText('Absent Learners:', 10, true);
                groupData.attendance.absent.forEach((a: any) => {
                    const isNoReason = !a.reason ||
                        a.reason === 'No Reason Provided' ||
                        a.reason === 'Unspecified' ||
                        a.reason === 'No Record';

                    const textColor = isNoReason ? '#FF0000' : '#000000';
                    const reasonText = isNoReason ? 'NO REASON PROVIDED' : a.reason;

                    addText(`- ${a.name} (${reasonText})`, 9, isNoReason, textColor);
                    checkPageBreak();
                });
            }

            if (lateCount > 0) {
                yPos += 5;
                checkPageBreak();
                addText('Late Arrivals:', 10, true);
                groupData.attendance.late.forEach((l: any) => {
                    addText(`- ${l.name}: ${l.arrivalTime}`, 9);
                    checkPageBreak();
                });
            }

            yPos += 5;
            checkPageBreak();

            // Training Delivered
            addHeading('Training Delivered');
            addText(`Module: ${groupData.training.modulesCovered || 'N/A'}`);
            addText(`Topics/US: ${groupData.training.topicsCovered || 'N/A'}`);

            if (groupData.training.activitiesCompleted && groupData.training.activitiesCompleted.length > 0) {
                yPos += 5;
                checkPageBreak();
                addText('Activities Completed:', 10, true);
                groupData.training.activitiesCompleted.forEach((activity: string) => {
                    addText(`- ${activity}`, 9);
                    checkPageBreak();
                });
            }
            yPos += 5;

            // Assessments
            if (groupData.assessments && groupData.assessments.length > 0) {
                checkPageBreak();
                addHeading('Assessments Completed');
                groupData.assessments.forEach((assessment: any) => {
                    addText(`- ${assessment.studentName}: ${assessment.title} (${assessment.formativeCode})`, 9);
                    checkPageBreak();
                });
                yPos += 5;
            }

            // Notes
            if (groupData.notes.observations || groupData.notes.challengesFaced) {
                checkPageBreak();
                addHeading('Notes & Observations');
                if (groupData.notes.observations) {
                    addText('Observations:', 10, true);
                    addText(groupData.notes.observations, 9);
                    yPos += 5;
                    checkPageBreak();
                }
                if (groupData.notes.challengesFaced) {
                    addText('Challenges / Incidents:', 10, true);
                    addText(groupData.notes.challengesFaced, 9);
                }
            }
        });

        // Save
        const groupNames = selectedGroups
            .map(id => formatGroupNameDisplay(groups.find(g => g.id === id)?.name || 'Group'))
            .join('-');
        doc.save(`Daily_Report_${groupNames}_${format(new Date(data.meta.date), 'yyyy-MM-dd')}.pdf`);
    };

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-600" />
                        Reports
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Generate comprehensive reports for attendance, progress, assessments, and compliance
                    </p>
                </div>

                {/* Report Type Tabs */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                            onClick={() => {
                                setReportType('daily-attendance');
                                setReportData(null);
                            }}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                reportType === 'daily-attendance'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <Calendar className="w-5 h-5" />
                            <span className="text-sm">Daily Attendance</span>
                        </button>
                        <button
                            onClick={() => {
                                setReportType('group-progress');
                                setReportData(null);
                            }}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                reportType === 'group-progress'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-sm">Group Progress</span>
                        </button>
                        <button
                            onClick={() => {
                                setReportType('assessment-results');
                                setReportData(null);
                            }}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                reportType === 'assessment-results'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <Award className="w-5 h-5" />
                            <span className="text-sm">Assessment Results</span>
                        </button>
                        <button
                            onClick={() => {
                                setReportType('unit-standards');
                                setReportData(null);
                            }}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                reportType === 'unit-standards'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <BarChart3 className="w-5 h-5" />
                            <span className="text-sm">Unit Standards</span>
                        </button>
                    </div>
                </div>

                {/* Daily Attendance Report */}
                {reportType === 'daily-attendance' && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Daily Attendance Report
                            </h2>
                            <p className="text-sm text-slate-500">
                                Generate attendance report for a specific date and group
                            </p>
                        </div>

                        {/* Error Display */}
                        {errorMessage && (
                            <div className="p-4 mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                                {errorMessage}
                            </div>
                        )}
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Date
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setErrorMessage('');
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Group
                                        </span>
                                    </label>
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select a group</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {formatGroupNameDisplay(group.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerateDailyAttendance}
                                    disabled={isLoadingReport}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoadingReport ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                                {reportData && (
                                    <button
                                        onClick={handleGenerateAISummary}
                                        disabled={isAiGenerating}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isAiGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                AI Thinking...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate AI Summary
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            
                            {/* Display Report Data */}
                            {reportData && (
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Report Results</h3>
                                    <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="bg-white rounded-lg p-4">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {reportData.data?.attendance?.present?.length || 0}
                                                </div>
                                                <div className="text-sm text-slate-600">Present</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4">
                                                <div className="text-2xl font-bold text-red-600">
                                                    {reportData.data?.attendance?.absent?.length || 0}
                                                </div>
                                                <div className="text-sm text-slate-600">Absent</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4">
                                                <div className="text-2xl font-bold text-yellow-600">
                                                    {reportData.data?.attendance?.late?.length || 0}
                                                </div>
                                                <div className="text-sm text-slate-600">Late</div>
                                            </div>
                                        </div>
                                        
                                        {reportData.data?.attendance?.absent && reportData.data.attendance.absent.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold text-slate-900 mb-2">Absent Students:</h4>
                                                <ul className="space-y-1">
                                                    {reportData.data.attendance.absent.map((student: any, idx: number) => (
                                                        <li key={idx} className="text-sm text-slate-700">
                                                            • {student.name} {student.reason && `- ${student.reason}`}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Group Progress Report */}
                {reportType === 'group-progress' && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Group Progress Report
                            </h2>
                            <p className="text-sm text-slate-500">
                                View per-student progress metrics for a group over a date range
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Group
                                    </label>
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select a group</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {formatGroupNameDisplay(group.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerateGroupProgress}
                                    disabled={isLoadingReport}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoadingReport ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                                {reportData && (
                                    <button
                                        onClick={handleGenerateAISummary}
                                        disabled={isAiGenerating}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isAiGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                AI Thinking...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate AI Summary
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            
                            {/* Display Report Data */}
                            {reportData && reportData.students && (
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Student Progress</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold">Student</th>
                                                    <th className="text-center p-3 font-semibold">Attendance %</th>
                                                    <th className="text-center p-3 font-semibold">Assessments</th>
                                                    <th className="text-center p-3 font-semibold">Overall Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.students.map((student: any, idx: number) => (
                                                    <tr key={idx} className={`border-b border-slate-100 ${student.progress < 50 ? 'bg-red-50' : ''}`}>
                                                        <td className="p-3">{student.name}</td>
                                                        <td className="text-center p-3">
                                                            <span className={`font-semibold ${student.attendanceRate < 80 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {student.attendanceRate}%
                                                            </span>
                                                        </td>
                                                        <td className="text-center p-3">{student.assessmentsCompleted || 0}/{student.totalAssessments || 0}</td>
                                                        <td className="text-center p-3">
                                                            <span className={`font-semibold ${student.progress < 50 ? 'text-red-600' : student.progress < 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {student.progress}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Assessment Results Report */}
                {reportType === 'assessment-results' && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Assessment Results Report
                            </h2>
                            <p className="text-sm text-slate-500">
                                View assessment submissions and results for a group
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Group
                                    </label>
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select a group</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {formatGroupNameDisplay(group.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerateAssessmentResults}
                                    disabled={isLoadingReport}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoadingReport ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                                {reportData && (
                                    <button
                                        onClick={handleGenerateAISummary}
                                        disabled={isAiGenerating}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isAiGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                AI Thinking...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate AI Summary
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            
                            {/* Display Report Data */}
                            {reportData && reportData.assessments && (
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Assessment Results</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold">Student</th>
                                                    <th className="text-left p-3 font-semibold">Assessment</th>
                                                    <th className="text-center p-3 font-semibold">Result</th>
                                                    <th className="text-center p-3 font-semibold">Score</th>
                                                    <th className="text-center p-3 font-semibold">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.assessments.map((assessment: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-slate-100">
                                                        <td className="p-3">{assessment.studentName}</td>
                                                        <td className="p-3">{assessment.assessmentTitle}</td>
                                                        <td className="text-center p-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                assessment.result === 'Competent' 
                                                                    ? 'bg-green-100 text-green-700' 
                                                                    : assessment.result === 'Not Yet Competent'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {assessment.result}
                                                            </span>
                                                        </td>
                                                        <td className="text-center p-3">{assessment.score !== undefined ? `${assessment.score}%` : 'N/A'}</td>
                                                        <td className="text-center p-3">{assessment.date ? format(new Date(assessment.date), 'MMM d, yyyy') : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Unit Standards Completion Report */}
                {reportType === 'unit-standards' && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Unit Standards Completion Report
                            </h2>
                            <p className="text-sm text-slate-500">
                                Matrix showing student completion of unit standards
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Group
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select a group</option>
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerateUnitStandards}
                                    disabled={isLoadingReport}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoadingReport ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                                {reportData && (
                                    <button
                                        onClick={handleGenerateAISummary}
                                        disabled={isAiGenerating}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isAiGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                AI Thinking...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate AI Summary
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            
                            {/* Display Report Data */}
                            {reportData && reportData.matrix && (
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Completion Matrix</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="text-left p-2 font-semibold sticky left-0 bg-slate-50">Student</th>
                                                    {reportData.unitStandards && reportData.unitStandards.map((us: any, idx: number) => (
                                                        <th key={idx} className="text-center p-2 font-semibold" title={us.title}>
                                                            {us.code}
                                                        </th>
                                                    ))}
                                                    <th className="text-center p-2 font-semibold">Total %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.matrix.map((row: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-slate-100">
                                                        <td className="p-2 sticky left-0 bg-white">{row.studentName}</td>
                                                        {row.completions && row.completions.map((status: string, usIdx: number) => (
                                                            <td key={usIdx} className="text-center p-2">
                                                                <div className={`w-8 h-8 mx-auto rounded ${
                                                                    status === 'completed' 
                                                                        ? 'bg-green-500' 
                                                                        : status === 'in-progress'
                                                                        ? 'bg-yellow-500'
                                                                        : 'bg-gray-200'
                                                                }`}></div>
                                                            </td>
                                                        ))}
                                                        <td className="text-center p-2 font-semibold">
                                                            {row.completionPercentage}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 flex gap-4 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-green-500"></div>
                                            <span>Completed</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-yellow-500"></div>
                                            <span>In Progress</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-gray-200"></div>
                                            <span>Not Started</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Keep the original daily training report for facilitators - accessed separately if needed */}
                {/* This is the old daily training report with PDF generation - commented out for now but preserved */}
                
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden" style={{display: 'none'}}>

                    {/* Form Header */}
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Report Details (Legacy)
                        </h2>
                        <p className="text-sm text-slate-500">
                            Fill in the session details to generate a formatted PDF report
                        </p>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Top Row: Date, Groups, Facilitator */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Date
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Groups (Select up to 10)
                                    </span>
                                </label>
                                <select
                                    multiple
                                    value={selectedGroups}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                        handleGroupSelectionChange(selected);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple groups</p>
                                {selectedGroups.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedGroups.map((groupId) => {
                                            const group = groups.find(g => g.id === groupId);
                                            return (
                                                <span key={groupId} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                                                    {group?.name}
                                                    <button
                                                        onClick={() => handleGroupSelectionChange(selectedGroups.filter(id => id !== groupId))}
                                                        className="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Facilitator Name
                                </label>
                                <input
                                    type="text"
                                    value={facilitatorName}
                                    onChange={(e) => setFacilitatorName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            {selectedGroups.length > 0 ? (
                                <>
                                    <h3 className="text-md font-medium text-slate-900 dark:text-white mb-4">
                                        Training Delivered (per Group)
                                    </h3>

                                    {/* Group Tabs */}
                                    <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                                        {selectedGroups.map((groupId) => {
                                            const group = groups.find(g => g.id === groupId);
                                            const isActive = activeGroupTab === groupId;
                                            return (
                                                <button
                                                    key={groupId}
                                                    onClick={() => setActiveGroupTab(groupId)}
                                                    className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                                        isActive
                                                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                                                    }`}
                                                >
                                                    {group?.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Tab Content */}
                                    {activeGroupTab && (
                                        <div className="space-y-6 mb-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        Modules Covered (select multiple)
                                                    </label>
                                                    <select
                                                        multiple
                                                        value={groupTrainingData[activeGroupTab]?.selectedModules || []}
                                                        onChange={(e) => {
                                                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                            updateGroupTrainingData(activeGroupTab, 'selectedModules', selected);
                                                            updateGroupTrainingData(activeGroupTab, 'topicsCovered', '');
                                                        }}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        {modules.map((m: any) => (
                                                            <option key={m.id} value={m.name}>
                                                                {m.moduleNumber}. {m.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple modules</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        Topics / Unit Standards
                                                    </label>
                                                    <select
                                                        value={groupTrainingData[activeGroupTab]?.topicsCovered || ''}
                                                        onChange={(e) => updateGroupTrainingData(activeGroupTab, 'topicsCovered', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                                        disabled={(groupTrainingData[activeGroupTab]?.selectedModules.length || 0) === 0}
                                                    >
                                                        <option value="">Select Unit Standard...</option>
                                                        {getAvailableUnitStandardsForGroup(activeGroupTab).map((us: any) => (
                                                            <option key={us.id} value={`${us.code} - ${us.title}`}>
                                                                {us.code} - {us.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Activities Completed (One per line)
                                                </label>
                                                <textarea
                                                    value={groupTrainingData[activeGroupTab]?.activitiesCompleted || ''}
                                                    onChange={(e) => updateGroupTrainingData(activeGroupTab, 'activitiesCompleted', e.target.value)}
                                                    placeholder="- Group discussion on target markets&#10;- Activity 3.1 in Learner Guide"
                                                    rows={4}
                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 italic">
                                    Select groups above to configure training content for each group
                                </p>
                            )}
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h3 className="text-md font-medium text-slate-900 dark:text-white mb-4">
                                Notes & Observations
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        General Observations
                                    </label>
                                    <textarea
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Learner engagement, participation levels, etc."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Challenges / Incidents
                                    </label>
                                    <textarea
                                        value={challenges}
                                        onChange={(e) => setChallenges(e.target.value)}
                                        placeholder="Late arrivals, technical issues, etc."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                        {/* Export Data Buttons */}
                        <button
                            onClick={async () => {
                                try {
                                    await downloadExport(
                                        '/api/attendance/export',
                                        `attendance-${selectedDate}.csv`,
                                        { 
                                            format: 'csv',
                                            startDate: selectedDate,
                                            endDate: selectedDate,
                                            groupId: selectedGroups[0] || ''
                                        }
                                    );
                                    alert('✅ Attendance exported successfully!');
                                } catch (error) {
                                    alert('Failed to export attendance');
                                }
                            }}
                            disabled={!selectedGroups.length}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <FileDown className="w-5 h-5" />
                            Export Attendance
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    await downloadExport(
                                        '/api/assessments/export',
                                        `assessments-${selectedDate}.csv`,
                                        { 
                                            format: 'csv',
                                            groupId: selectedGroups[0] || ''
                                        }
                                    );
                                    alert('✅ Assessments exported successfully!');
                                } catch (error) {
                                    alert('Failed to export assessments');
                                }
                            }}
                            disabled={!selectedGroups.length}
                            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <FileDown className="w-5 h-5" />
                            Export Assessments
                        </button>
                        
                        {/* Report Generation Buttons */}
                        <button
                            onClick={handleGenerateAiReport}
                            disabled={isGenerating || isAiGenerating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isAiGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    AI Thinking...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate with AI
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGenerating || isAiGenerating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Standard PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800 flex gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg h-fit">
                        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Automated Data Inclusion</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            The generated report will automatically include:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                            <li>Attendance records for the selected date</li>
                            <li>Assessments completed on this date</li>
                            <li>Student names and ID numbers</li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* AI Report Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-500" />
                                    AI Generated Report
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Based on the official YEHA format
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
                            <div className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <pre className="whitespace-pre-wrap font-sans text-sm">{aiReport}</pre>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-b-2xl">
                            <p className="text-xs text-slate-400">
                                Review the content before saving. AI content may require minor adjustments.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Text
                                </button>
                                <button
                                    onClick={downloadAiReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors shadow-sm"
                                >
                                    <FileDown className="w-4 h-4" />
                                    Download Markdown
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

