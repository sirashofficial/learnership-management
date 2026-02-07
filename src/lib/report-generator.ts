/**
 * Report Generator Utility
 * 
 * Centralized logic for generating reports in various formats (PDF, CSV).
 * Used by compliance, attendance, assessments, and progress pages.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Add types for jsPDF autoTable plugin
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: AutoTableOptions) => jsPDF;
        lastAutoTable: {
            finalY: number;
        };
    }
}

interface AutoTableOptions {
    head?: string[][];
    body?: (string | number)[][];
    startY?: number;
    theme?: string;
    styles?: Record<string, any>;
    headStyles?: Record<string, any>;
    columnStyles?: Record<string, any>;
    margin?: { left?: number; right?: number };
}

// ============================================================================
// Types
// ============================================================================

export interface ReportStudent {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    email?: string | null;
    group?: string;
    status: string;
    progress?: number;
    attendanceRate?: number;
    complianceStatus?: 'COMPLIANT' | 'WARNING' | 'CRITICAL';
}

export interface AttendanceReportData {
    title: string;
    dateRange: { start: Date; end: Date };
    students: ReportStudent[];
    groupName?: string;
}

export interface ComplianceReportData {
    title: string;
    generatedAt: Date;
    students: ReportStudent[];
    summary: {
        total: number;
        compliant: number;
        warning: number;
        critical: number;
        overallRate: number;
    };
}

export interface ProgressReportData {
    student: ReportStudent;
    modules: Array<{
        name: string;
        progress: number;
        status: string;
        creditsEarned: number;
        totalCredits: number;
    }>;
    generatedAt: Date;
}

// ============================================================================
// CSV Generation
// ============================================================================

/**
 * Generate CSV content from data
 */
export function generateCSV(
    headers: string[],
    rows: (string | number)[][],
): string {
    const escapeCSV = (value: string | number): string => {
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerRow = headers.map(escapeCSV).join(',');
    const dataRows = rows.map(row => row.map(escapeCSV).join(','));

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// PDF Generation
// ============================================================================

/**
 * Create a new PDF document with standard header
 */
function createPDFDocument(title: string, subtitle?: string): jsPDF {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55); // slate-800
    doc.text(title, 14, 22);

    if (subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128); // slate-500
        doc.text(subtitle, 14, 30);
    }

    // Date
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); // slate-400
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

    return doc;
}

/**
 * Generate and download attendance report PDF
 */
export function generateAttendanceReportPDF(data: AttendanceReportData): void {
    const doc = createPDFDocument(
        data.title,
        data.groupName ? `Group: ${data.groupName}` : undefined
    );

    // Date range
    doc.setFontSize(10);
    doc.text(
        `Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`,
        14, 46
    );

    // Table
    const tableHeaders = [['Student ID', 'Name', 'Attendance Rate', 'Status']];
    const tableBody = data.students.map(s => [
        s.studentId,
        `${s.firstName} ${s.lastName}`,
        `${s.attendanceRate ?? 0}%`,
        s.complianceStatus || 'N/A',
    ]);

    doc.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 54,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
    });

    doc.save(`attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate and download compliance report PDF
 */
export function generateComplianceReportPDF(data: ComplianceReportData): void {
    const doc = createPDFDocument('Compliance Report', 'SSETA Attendance Threshold: 80%');

    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('Summary', 14, 50);

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Total Students: ${data.summary.total}`, 14, 58);
    doc.text(`Compliant (≥80%): ${data.summary.compliant}`, 14, 64);
    doc.text(`At Risk (60-79%): ${data.summary.warning}`, 14, 70);
    doc.text(`Non-Compliant (<60%): ${data.summary.critical}`, 14, 76);
    doc.text(`Overall Compliance Rate: ${data.summary.overallRate}%`, 14, 82);

    // Student details table
    const tableHeaders = [['Student ID', 'Name', 'Group', 'Attendance', 'Status']];
    const tableBody = data.students.map(s => [
        s.studentId,
        `${s.firstName} ${s.lastName}`,
        s.group || 'N/A',
        `${s.attendanceRate ?? 0}%`,
        s.complianceStatus === 'COMPLIANT' ? 'Compliant' :
            s.complianceStatus === 'WARNING' ? 'At Risk' : 'Non-Compliant',
    ]);

    doc.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 90,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129] }, // green-500
    });

    doc.save(`compliance-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate and download progress report PDF for a student
 */
export function generateProgressReportPDF(data: ProgressReportData): void {
    const doc = createPDFDocument(
        'Progress Report',
        `${data.student.firstName} ${data.student.lastName} (${data.student.studentId})`
    );

    // Overall progress
    const overallProgress = data.student.progress ?? 0;
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(`Overall Progress: ${overallProgress}%`, 14, 50);

    // Module progress table
    const tableHeaders = [['Module', 'Progress', 'Credits', 'Status']];
    const tableBody = data.modules.map(m => [
        m.name,
        `${m.progress}%`,
        `${m.creditsEarned}/${m.totalCredits}`,
        m.status,
    ]);

    doc.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 58,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] }, // purple-500
    });

    doc.save(`progress-report-${data.student.studentId}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Export students to CSV
 */
export function exportStudentsCSV(students: ReportStudent[]): void {
    const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Group', 'Status', 'Progress', 'Attendance Rate'];
    const rows = students.map(s => [
        s.studentId,
        s.firstName,
        s.lastName,
        s.email || '',
        s.group || '',
        s.status,
        s.progress ?? 0,
        s.attendanceRate ?? 0,
    ]);

    const csv = generateCSV(headers, rows);
    downloadCSV(csv, `students-export-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export attendance data to CSV
 */
export function exportAttendanceCSV(
    data: AttendanceReportData
): void {
    const headers = ['Student ID', 'Name', 'Group', 'Attendance Rate', 'Compliance Status'];
    const rows = data.students.map(s => [
        s.studentId,
        `${s.firstName} ${s.lastName}`,
        s.group || '',
        s.attendanceRate ?? 0,
        s.complianceStatus || 'N/A',
    ]);

    const csv = generateCSV(headers, rows);
    downloadCSV(csv, `attendance-export-${new Date().toISOString().split('T')[0]}.csv`);
}
