'use client';

import { useState } from 'react';
import Header from '@/components/Header';
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
    Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function ReportsPage() {
    const { groups } = useGroups();

    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [facilitatorName, setFacilitatorName] = useState<string>('');

    const [modulesCovered, setModulesCovered] = useState<string>('');
    const [topicsCovered, setTopicsCovered] = useState<string>('');
    const [activitiesCompleted, setActivitiesCompleted] = useState<string>(''); // multiline string
    const [observations, setObservations] = useState<string>('');
    const [challenges, setChallenges] = useState<string>('');

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReport = async () => {
        if (!selectedGroup || !selectedDate || !facilitatorName) {
            alert('Please fill in all required fields (Date, Group, Facilitator)');
            return;
        }

        setIsGenerating(true);
        try {
            // 1. Fetch Data
            const response = await fetch('/api/reports/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    groupId: selectedGroup,
                    facilitator: facilitatorName,
                    modulesCovered,
                    topicsCovered,
                    activitiesCompleted: activitiesCompleted.split('\n').filter(line => line.trim()),
                    observations,
                    challengesFaced: challenges,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }

            const { data } = await response.json();

            // 2. Generate PDF Client-Side
            generatePDF(data);

        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
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
            yPos += (splitText.length * fontSize * 0.3527) + 2; // Approximate line height (pt to mm conv?) 0.3527
        };

        const addHeading = (text: string) => {
            yPos += 5;
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
            addText(text, 12, true, '#333333');
            yPos += 5;
        };

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Training Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Meta Info
        addText(`Date: ${format(new Date(data.meta.date), 'dd MMMM yyyy')}`, 11);
        addText(`Group: ${data.meta.groupName || 'Unknown Group'}`, 11);
        addText(`Facilitator: ${data.meta.facilitator}`, 11);
        yPos += 10;

        // Attendance
        addHeading('Attendance Summary');
        const presentCount = data.attendance.present.length;
        const absentCount = data.attendance.absent.length;
        const total = presentCount + absentCount; // Approximate
        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

        addText(`Present: ${presentCount} | Absent: ${absentCount} | Attendance Rate: ${rate}%`, 10);

        if (absentCount > 0) {
            yPos += 5;
            addText('Absent Learners:', 10, true);
            data.attendance.absent.forEach((a: any) => {
                addText(`- ${a.name} (${a.reason})`, 9);
            });
        }
        yPos += 5;

        // Training Delivered
        addHeading('Training Delivered');
        addText(`Module: ${data.training.modulesCovered || 'N/A'}`);
        addText(`Topics/US: ${data.training.topicsCovered || 'N/A'}`);

        if (data.training.activitiesCompleted && data.training.activitiesCompleted.length > 0) {
            yPos += 5;
            addText('Activities Completed:', 10, true);
            data.training.activitiesCompleted.forEach((activity: string) => {
                addText(`- ${activity}`, 9);
            });
        }
        yPos += 5;

        // Assessments
        if (data.assessments && data.assessments.length > 0) {
            addHeading('Assessments Completed');
            data.assessments.forEach((assessment: any) => {
                addText(`- ${assessment.studentName}: ${assessment.title} (${assessment.formativeCode})`, 9);
            });
            yPos += 5;
        }

        // Notes
        addHeading('Notes & Observations');
        if (data.notes.observations) {
            addText('Observations:', 10, true);
            addText(data.notes.observations, 9);
            yPos += 5;
        }
        if (data.notes.challengesFaced) {
            addText('Challenges / Incidents:', 10, true);
            addText(data.notes.challengesFaced, 9);
        }

        // Save
        doc.save(`Daily_Report_${data.meta.groupName}_${format(new Date(data.meta.date), 'yyyy-MM-dd')}.pdf`);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Header />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        Daily Reports
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Generate standard daily reports for your groups
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">

                    {/* Form Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Report Details
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Fill in the session details to generate a formatted PDF report
                        </p>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Top Row: Date, Group, Facilitator */}
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
                                        Group
                                    </span>
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select a group...</option>
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
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
                            <h3 className="text-md font-medium text-slate-900 dark:text-white mb-4">
                                Training Delivered
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Module Covered
                                    </label>
                                    <input
                                        type="text"
                                        value={modulesCovered}
                                        onChange={(e) => setModulesCovered(e.target.value)}
                                        placeholder="e.g. Module 3: Market Requirements"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Topics / Unit Standards
                                    </label>
                                    <input
                                        type="text"
                                        value={topicsCovered}
                                        onChange={(e) => setTopicsCovered(e.target.value)}
                                        placeholder="e.g. US 114974 - Target Markets"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Activities Completed (One per line)
                                </label>
                                <textarea
                                    value={activitiesCompleted}
                                    onChange={(e) => setActivitiesCompleted(e.target.value)}
                                    placeholder="- Group discussion on target markets&#10;- Activity 3.1 in Learner Guide"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
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

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGenerating}
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
                                    Generate Report
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
        </div>
    );
}
