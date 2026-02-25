/**
 * SSETA Compliance Reporting Templates
 * 
 * Document templates for South African SSETA accreditation reports:
 * - Workplace-Based Learning Agreements
 * - Monthly Progress Reports
 * - Summative Assessment Schedules
 * 
 * Uses docx library for DOCX generation and jspdf for PDF exports
 * All templates include SSETA-compliant formatting, legal clauses, and signature placeholders
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  UnderlineType,
} from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// SSETA Logo placeholder position
const LOGO_POSITION = {
  x: 30,
  y: 20,
  width: 80,
  height: 40,
};

/**
 * Common SSETA legal clauses
 */
const SSETA_LEGAL_CLAUSES = {
  dataProtection: `This document complies with the Protection of Personal Information Act (POPI Act) and data will be used solely for accreditation purposes by the Services Sector Education and Training Authority (Services SETA).`,
  
  confidentiality: `All information contained in this document is confidential and may not be disclosed to third parties without written consent from the learner and training provider.`,
  
  certification: `I certify that the information provided in this document is true and accurate to the best of my knowledge. Any false or misleading information may result in withdrawal of accreditation.`,
  
  learnerRights: `The learner has the right to appeal any assessment decision and to receive feedback on all assessment activities. All assessments are conducted in accordance with SAQA quality assurance requirements.`,
};

/**
 * Student data interface for reports
 */
export interface StudentReportData {
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  groupName: string;
  facilitatorName: string;
  progress: number;
  totalCreditsEarned: number;
  attendancePercentage: number;
  status: string;
  currentModule?: string;
  enrollmentDate: Date;
}

/**
 * Assessment schedule item
 */
export interface AssessmentScheduleItem {
  unitStandardCode: string;
  unitStandardTitle: string;
  assessmentType: string; // SUMMATIVE | FORMATIVE | WORKPLACE
  dueDate: Date;
  assessedDate?: Date;
  result?: string;
  moduleName: string;
}

/**
 * Workplace agreement data
 */
export interface WorkplaceAgreementData {
  student: StudentReportData;
  employerName: string;
  employerContact: string;
  employerAddress: string;
  workplaceMentorName: string;
  workplaceMentorEmail: string;
  trainingPeriodStart: Date;
  trainingPeriodEnd: Date;
  qualificationTitle: string;
  qualificationLevel: string;
  ssetaCode: string;
  providerName: string;
  providerAccreditationNumber: string;
  coordinatorName: string;
  coordinatorContact: string;
}

/**
 * Generate Workplace-Based Learning Agreement (DOCX)
 */
export function generateWorkplaceAgreement(data: WorkplaceAgreementData): Document {
  const { student, employerName, employerAddress, employerContact, 
          workplaceMentorName, workplaceMentorEmail, trainingPeriodStart, 
          trainingPeriodEnd, qualificationTitle, qualificationLevel, 
          ssetaCode, providerName, providerAccreditationNumber,
          coordinatorName, coordinatorContact } = data;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'WORKPLACE-BASED LEARNING AGREEMENT',
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 400 },
          }),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Services Sector Education and Training Authority (Services SETA)',
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Logo placeholder
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '[SSETA LOGO PLACEHOLDER]',
                italics: true,
                color: '999999',
              }),
            ],
            spacing: { after: 400 },
          }),

          // Agreement reference
          new Paragraph({
            children: [
              new TextRun({ text: 'Agreement Reference: ', bold: true }),
              new TextRun({ text: `WBA-${ssetaCode}-${student.studentId}-${format(new Date(), 'yyyyMMdd')}` }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Date of Agreement: ', bold: true }),
              new TextRun({ text: format(new Date(), 'dd MMMM yyyy') }),
            ],
            spacing: { after: 400 },
          }),

          // Section 1: Learner Information
          new Paragraph({
            text: '1. LEARNER INFORMATION',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createInfoTable([
            ['Full Name', `${student.firstName} ${student.lastName}`],
            ['ID Number', student.idNumber || 'N/A'],
            ['Contact Number', student.phone || 'N/A'],
            ['Email Address', student.email || 'N/A'],
            ['Student ID', student.studentId],
          ]),

          // Section 2: Qualification Details
          new Paragraph({
            text: '2. QUALIFICATION DETAILS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createInfoTable([
            ['Qualification Title', qualificationTitle],
            ['NQF Level', qualificationLevel],
            ['SAQA ID', ssetaCode],
            ['Total Credits', '140'],
            ['Training Period', `${format(trainingPeriodStart, 'dd/MM/yyyy')} to ${format(trainingPeriodEnd, 'dd/MM/yyyy')}`],
          ]),

          // Section 3: Training Provider
          new Paragraph({
            text: '3. TRAINING PROVIDER INFORMATION',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createInfoTable([
            ['Provider Name', providerName],
            ['Accreditation Number', providerAccreditationNumber],
            ['Coordinator Name', coordinatorName],
            ['Coordinator Contact', coordinatorContact],
          ]),

          // Section 4: Employer/Workplace Information
          new Paragraph({
            text: '4. EMPLOYER/WORKPLACE INFORMATION',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createInfoTable([
            ['Employer/Company Name', employerName],
            ['Physical Address', employerAddress],
            ['Contact Person', employerContact],
            ['Workplace Mentor', workplaceMentorName],
            ['Mentor Email', workplaceMentorEmail],
          ]),

          // Section 5: Workplace Learning Responsibilities
          new Paragraph({
            text: '5. WORKPLACE LEARNING RESPONSIBILITIES',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            text: '5.1 The Training Provider undertakes to:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),

            ...createBulletList([
            'Provide learner with learning materials and resources',
            'Conduct regular progress assessments and provide feedback',
            'Monitor workplace learning activities and attendance',
            'Ensure compliance with SSETA quality assurance requirements',
            'Facilitate communication between all parties',
            ]),

          new Paragraph({
            text: '5.2 The Employer undertakes to:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),

            ...createBulletList([
            'Provide a safe and conducive workplace learning environment',
            'Assign a qualified workplace mentor to guide the learner',
            'Allow learner to attend scheduled training sessions',
            'Provide practical workplace experience aligned with unit standards',
            'Complete workplace assessment documentation as required',
            ]),

          new Paragraph({
            text: '5.3 The Learner undertakes to:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),

            ...createBulletList([
            'Attend all scheduled training sessions and maintain 80% minimum attendance',
            'Complete all formative and summative assessments',
            'Adhere to workplace policies and professional conduct standards',
            'Complete workplace Portfolio of Evidence (POE) requirements',
            'Notify training provider and employer of any issues affecting training',
            ]),

          // Section 6: Legal Clauses
          new Paragraph({
            text: '6. LEGAL AND COMPLIANCE',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '6.1 Data Protection: ', bold: true }),
              new TextRun({ text: SSETA_LEGAL_CLAUSES.dataProtection }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '6.2 Confidentiality: ', bold: true }),
              new TextRun({ text: SSETA_LEGAL_CLAUSES.confidentiality }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '6.3 Learner Rights: ', bold: true }),
              new TextRun({ text: SSETA_LEGAL_CLAUSES.learnerRights }),
            ],
            spacing: { after: 400 },
          }),

          // Section 7: Signatures
          new Paragraph({
            text: '7. SIGNATORIES',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createSignatureBlock('Learner', `${student.firstName} ${student.lastName}`),
          createSignatureBlock('Training Provider Representative', coordinatorName),
          createSignatureBlock('Employer Representative', employerContact),
          createSignatureBlock('Workplace Mentor', workplaceMentorName),

          // Footer
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Document Generated: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`,
                size: 18,
                italics: true,
                color: '666666',
              }),
            ],
            spacing: { before: 600 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'This document is valid for SSETA accreditation purposes',
                size: 18,
                italics: true,
                color: '666666',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Generate Monthly Progress Report (DOCX)
 */
export function generateMonthlyProgressReport(
  students: StudentReportData[],
  groupName: string,
  reportMonth: Date,
  facilitatorName: string
): Document {
  const monthName = format(reportMonth, 'MMMM yyyy');
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'MONTHLY PROGRESS REPORT',
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Services SETA NVC Level 2 Learnership',
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Report details
          new Paragraph({
            children: [
              new TextRun({ text: 'Report Period: ', bold: true }),
              new TextRun({ text: monthName }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Group: ', bold: true }),
              new TextRun({ text: groupName }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Facilitator: ', bold: true }),
              new TextRun({ text: facilitatorName }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Report Generated: ', bold: true }),
              new TextRun({ text: format(new Date(), 'dd MMMM yyyy HH:mm') }),
            ],
            spacing: { after: 400 },
          }),

          // Summary statistics
          new Paragraph({
            text: 'GROUP SUMMARY',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 },
          }),

          createInfoTable([
            ['Total Learners', students.length.toString()],
            ['Average Progress', `${(students.reduce((sum, s) => sum + s.progress, 0) / students.length).toFixed(1)}%`],
            ['Average Credits Earned', (students.reduce((sum, s) => sum + s.totalCreditsEarned, 0) / students.length).toFixed(1)],
            ['Average Attendance', `${(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length).toFixed(1)}%`],
            ['Active Learners', students.filter(s => s.status === 'ACTIVE').length.toString()],
            ['At Risk Learners', students.filter(s => s.status === 'AT_RISK').length.toString()],
          ]),

          // Student progress table
          new Paragraph({
            text: 'LEARNER PROGRESS DETAILS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createProgressTable(students),

          // Status legend
          new Paragraph({
            text: 'STATUS LEGEND',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

            ...createBulletList([
            'ACTIVE: Learner is on track with required progress',
            'AT_RISK: Learner is behind schedule or attendance below 80%',
            'COMPLETED: Learner has completed all requirements',
            'SUSPENDED: Training temporarily suspended',
            ]),

          // Certification
          new Paragraph({
            text: 'FACILITATOR CERTIFICATION',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: SSETA_LEGAL_CLAUSES.certification }),
            ],
            spacing: { after: 400 },
          }),

          createSignatureBlock('Facilitator', facilitatorName),

          // Footer
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Confidential - For SSETA Accreditation Use Only`,
                size: 18,
                italics: true,
                color: '666666',
              }),
            ],
            spacing: { before: 600 },
          }),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Generate Assessment Schedule (DOCX)
 */
export function generateAssessmentSchedule(
  groupName: string,
  facilitatorName: string,
  scheduleItems: AssessmentScheduleItem[],
  startDate: Date,
  endDate: Date
): Document {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'SUMMATIVE ASSESSMENT SCHEDULE',
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Services SETA NVC Level 2 Learnership',
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Schedule details
          new Paragraph({
            children: [
              new TextRun({ text: 'Group: ', bold: true }),
              new TextRun({ text: groupName }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Facilitator: ', bold: true }),
              new TextRun({ text: facilitatorName }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Schedule Period: ', bold: true }),
              new TextRun({ text: `${format(startDate, 'dd/MM/yyyy')} to ${format(endDate, 'dd/MM/yyyy')}` }),
            ],
            spacing: { after: 400 },
          }),

          // Assessment information
          new Paragraph({
            text: 'ASSESSMENT REQUIREMENTS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 },
          }),

          new Paragraph({
            text: 'All learners must complete three (3) assessment types for each unit standard:',
            spacing: { after: 100 },
          }),

            ...createBulletList([
            'FORMATIVE: Ongoing classroom assessments to monitor learning progress',
            'SUMMATIVE: Final assessment to determine competence in unit standard',
            'WORKPLACE: Practical assessment conducted in workplace environment',
            ]),

          new Paragraph({
            text: 'Assessment Schedule',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createAssessmentScheduleTable(scheduleItems),

          // Notes
          new Paragraph({
            text: 'IMPORTANT NOTES',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

            ...createBulletList([
            'All assessments must be conducted by qualified and registered assessors',
            'Learners must achieve "COMPETENT" result in all three assessment types',
            'Assessment results must be moderated within 5 working days',
            'Learners have the right to appeal any assessment decision within 14 days',
            'Re-assessments must be scheduled within 30 days if required',
            'All assessment evidence must be retained for SSETA quality assurance audits',
            ]),

          // Certification
          new Paragraph({
            text: 'APPROVAL',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          createSignatureBlock('Facilitator/Assessor', facilitatorName),
          createSignatureBlock('Training Coordinator', '[Coordinator Name]'),

          // Footer
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Document Generated: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`,
                size: 18,
                italics: true,
                color: '666666',
              }),
            ],
            spacing: { before: 600 },
          }),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Helper: Create information table
 */
function createInfoTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true })],
                }),
              ],
              shading: { fill: 'F0F0F0' },
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: value })],
            }),
          ],
        })
    ),
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
  });
}

/**
 * Helper: Create bullet list
 */
function createBulletList(items: string[]): Paragraph[] {
  return items.map(
    (item) =>
      new Paragraph({
        text: `• ${item}`,
        spacing: { after: 100 },
        indent: { left: 720 },
      })
  );
}

/**
 * Helper: Create signature block
 */
function createSignatureBlock(role: string, name: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: role, bold: true })],
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: name,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: '',
                spacing: { after: 200 },
                border: {
                  bottom: {
                    color: '000000',
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),
              new Paragraph({
                children: [new TextRun({ text: 'Signature', size: 18 })],
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: '',
                spacing: { after: 200 },
                border: {
                  bottom: {
                    color: '000000',
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),
              new Paragraph({
                children: [new TextRun({ text: 'Date', size: 18 })],
              }),
            ],
            margins: { top: 200, bottom: 200 },
          }),
        ],
      }),
    ],
    margins: { top: 200, bottom: 400 },
  });
}

/**
 * Helper: Create progress table
 */
function createProgressTable(students: StudentReportData[]): Table {
  const headerRow = new TableRow({
    children: [
      createTableCell('Student ID', true),
      createTableCell('Name', true),
      createTableCell('Progress %', true),
      createTableCell('Credits', true),
      createTableCell('Attendance %', true),
      createTableCell('Status', true),
    ],
  });

  const dataRows = students.map(
    (student) =>
      new TableRow({
        children: [
          createTableCell(student.studentId, false),
          createTableCell(`${student.firstName} ${student.lastName}`, false),
          createTableCell(`${student.progress}%`, false),
          createTableCell(`${student.totalCreditsEarned}/140`, false),
          createTableCell(`${student.attendancePercentage.toFixed(1)}%`, false),
          createTableCell(student.status, false),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });
}

/**
 * Helper: Create assessment schedule table
 */
function createAssessmentScheduleTable(scheduleItems: AssessmentScheduleItem[]): Table {
  const headerRow = new TableRow({
    children: [
      createTableCell('Unit Standard', true),
      createTableCell('Module', true),
      createTableCell('Assessment Type', true),
      createTableCell('Due Date', true),
      createTableCell('Status', true),
    ],
  });

  const dataRows = scheduleItems.map(
    (item) =>
      new TableRow({
        children: [
          createTableCell(`${item.unitStandardCode} - ${item.unitStandardTitle}`, false),
          createTableCell(item.moduleName, false),
          createTableCell(item.assessmentType, false),
          createTableCell(format(item.dueDate, 'dd/MM/yyyy'), false),
          createTableCell(
            item.assessedDate 
              ? `${item.result} (${format(item.assessedDate, 'dd/MM/yyyy')})` 
              : 'PENDING',
            false
          ),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });
}

/**
 * Helper: Create table cell
 */
function createTableCell(text: string, isHeader: boolean): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: isHeader })],
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading: isHeader ? { fill: 'D9E1F2' } : undefined,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
  });
}

/**
 * Convert DOCX Document to PDF using jsPDF
 * Note: This is a simplified conversion. For production, consider using pdf-lib or docx-pdf
 */
export function convertDocxToPdf(
  title: string,
  content: Array<{ type: 'heading' | 'text' | 'table'; data: any }>
): jsPDF {
  const doc = new jsPDF();
  let yPosition = 20;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Process content
  content.forEach((item) => {
    if (item.type === 'heading') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(item.data, 20, yPosition);
      yPosition += 10;
    } else if (item.type === 'text') {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(item.data, 170);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * 7;
    } else if (item.type === 'table') {
      autoTable(doc, {
        head: [item.data.headers],
        body: item.data.rows,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [217, 225, 242] },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add new page if needed
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
  });

  return doc;
}

/**
 * Generate PDF from Monthly Progress Report data
 */
export function generateMonthlyProgressPDF(
  students: StudentReportData[],
  groupName: string,
  reportMonth: Date,
  facilitatorName: string
): jsPDF {
  const monthName = format(reportMonth, 'MMMM yyyy');
  
  const content = [
    {
      type: 'heading' as const,
      data: `Monthly Progress Report - ${monthName}`,
    },
    {
      type: 'text' as const,
      data: `Group: ${groupName}\nFacilitator: ${facilitatorName}\nReport Generated: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`,
    },
    {
      type: 'heading' as const,
      data: 'Group Summary',
    },
    {
      type: 'table' as const,
      data: {
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Learners', students.length.toString()],
          ['Average Progress', `${(students.reduce((sum, s) => sum + s.progress, 0) / students.length).toFixed(1)}%`],
          ['Average Credits', (students.reduce((sum, s) => sum + s.totalCreditsEarned, 0) / students.length).toFixed(1)],
          ['Average Attendance', `${(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length).toFixed(1)}%`],
        ],
      },
    },
    {
      type: 'heading' as const,
      data: 'Learner Progress Details',
    },
    {
      type: 'table' as const,
      data: {
        headers: ['Student ID', 'Name', 'Progress %', 'Credits', 'Attendance %', 'Status'],
        rows: students.map(s => [
          s.studentId,
          `${s.firstName} ${s.lastName}`,
          `${s.progress}%`,
          `${s.totalCreditsEarned}/140`,
          `${s.attendancePercentage.toFixed(1)}%`,
          s.status,
        ]),
      },
    },
  ];

  return convertDocxToPdf('MONTHLY PROGRESS REPORT', content);
}

/**
 * Generate PDF from Assessment Schedule data
 */
export function generateAssessmentSchedulePDF(
  groupName: string,
  facilitatorName: string,
  scheduleItems: AssessmentScheduleItem[],
  startDate: Date,
  endDate: Date
): jsPDF {
  const content = [
    {
      type: 'heading' as const,
      data: 'Summative Assessment Schedule',
    },
    {
      type: 'text' as const,
      data: `Group: ${groupName}\nFacilitator: ${facilitatorName}\nPeriod: ${format(startDate, 'dd/MM/yyyy')} to ${format(endDate, 'dd/MM/yyyy')}`,
    },
    {
      type: 'heading' as const,
      data: 'Scheduled Assessments',
    },
    {
      type: 'table' as const,
      data: {
        headers: ['Unit Standard', 'Module', 'Type', 'Due Date', 'Status'],
        rows: scheduleItems.map(item => [
          `${item.unitStandardCode} - ${item.unitStandardTitle}`,
          item.moduleName,
          item.assessmentType,
          format(item.dueDate, 'dd/MM/yyyy'),
          item.assessedDate 
            ? `${item.result} (${format(item.assessedDate, 'dd/MM/yyyy')})` 
            : 'PENDING',
        ]),
      },
    },
  ];

  return convertDocxToPdf('ASSESSMENT SCHEDULE', content);
}
