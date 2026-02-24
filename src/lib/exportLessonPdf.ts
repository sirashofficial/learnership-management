/**
 * Client-side PDF export utility for AI-generated lesson plans and schedules.
 * Uses jsPDF (already installed) for browser-based PDF generation.
 */

// Dynamically import jsPDF to avoid SSR issues
type JsPDFInstance = any;

async function getJsPDF(): Promise<{ jsPDF: new (...args: any[]) => JsPDFInstance }> {
  // @ts-ignore — dynamic import of browser-only library
  const mod = await import('jspdf');
  return mod;
}

export interface LessonPlan {
  title: string;
  overview: string;
  duration: number;
  learningOutcomes: string[];
  introduction?: { duration: number; content: string; activities: string[] };
  mainContent?: { duration: number; content: string; activities: string[] };
  activity?: { duration: number; instructions: string; groupWork: boolean };
  assessment?: { duration: number; method: string; questions: string[] };
  wrapUp?: { duration: number; content: string };
  resources?: string[];
  differentiationNotes?: string;
  unitStandardCode?: string;
  unitStandardTitle?: string;
}

export interface LessonScheduleItem {
  day: string;
  date: string;
  module: string;
  unitStandardCode: string;
  unitStandardTitle: string;
  duration: number;
  sessionType: string;
  objectives: string[];
}

function addWrappedText(doc: JsPDFInstance, text: string, x: number, y: number, maxWidth: number, lineHeight = 6): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addSection(doc: JsPDFInstance, title: string, y: number, accentColor: [number, number, number] = [79, 70, 229]): number {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFillColor(...accentColor);
  doc.rect(14, y - 1, pageWidth - 28, 8, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 17, y + 4);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  return y + 12;
}

function checkPageBreak(doc: JsPDFInstance, y: number, needed = 20): number {
  if (y > doc.internal.pageSize.height - needed) {
    doc.addPage();
    return 20;
  }
  return y;
}

/**
 * Export a lesson plan as a PDF file and trigger browser download.
 */
export async function exportLessonPlanPdf(lesson: LessonPlan, filename?: string): Promise<void> {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // ----- Header banner -----
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('LESSON PLAN', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (lesson.unitStandardCode) {
    doc.text(`Unit Standard: ${lesson.unitStandardCode} | Duration: ${lesson.duration} min`, margin, 22);
  }
  y = 36;

  // ----- Title -----
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  y = addWrappedText(doc, lesson.title, margin, y, contentWidth, 7);
  y += 4;

  // ----- Overview -----
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  y = addWrappedText(doc, lesson.overview, margin, y, contentWidth, 5);
  y += 6;

  // ----- Learning Outcomes -----
  y = checkPageBreak(doc, y);
  y = addSection(doc, 'LEARNING OUTCOMES', y);
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  lesson.learningOutcomes.forEach((outcome, i) => {
    y = checkPageBreak(doc, y);
    y = addWrappedText(doc, `${i + 1}. ${outcome}`, margin + 3, y, contentWidth - 3, 5);
    y += 2;
  });
  y += 4;

  // ----- Introduction -----
  if (lesson.introduction) {
    y = checkPageBreak(doc, y);
    y = addSection(doc, `INTRODUCTION / WARM-UP  (${lesson.introduction.duration} min)`, y);
    y = addWrappedText(doc, lesson.introduction.content, margin + 3, y, contentWidth - 3, 5);
    y += 3;
    lesson.introduction.activities.forEach((act) => {
      y = checkPageBreak(doc, y);
      y = addWrappedText(doc, `→ ${act}`, margin + 5, y, contentWidth - 5, 5);
      y += 1;
    });
    y += 4;
  }

  // ----- Main Content -----
  if (lesson.mainContent) {
    y = checkPageBreak(doc, y);
    y = addSection(doc, `MAIN CONTENT  (${lesson.mainContent.duration} min)`, y);
    y = addWrappedText(doc, lesson.mainContent.content, margin + 3, y, contentWidth - 3, 5);
    y += 3;
    lesson.mainContent.activities.forEach((act) => {
      y = checkPageBreak(doc, y);
      y = addWrappedText(doc, `→ ${act}`, margin + 5, y, contentWidth - 5, 5);
      y += 1;
    });
    y += 4;
  }

  // ----- Activity -----
  if (lesson.activity) {
    y = checkPageBreak(doc, y);
    y = addSection(doc, `ACTIVITY / PRACTICE  (${lesson.activity.duration} min)${lesson.activity.groupWork ? '  [Group Work]' : ''}`, y);
    y = addWrappedText(doc, lesson.activity.instructions, margin + 3, y, contentWidth - 3, 5);
    y += 4;
  }

  // ----- Assessment -----
  if (lesson.assessment) {
    y = checkPageBreak(doc, y);
    y = addSection(doc, `ASSESSMENT  (${lesson.assessment.duration} min)`, y);
    y = addWrappedText(doc, lesson.assessment.method, margin + 3, y, contentWidth - 3, 5);
    y += 3;
    lesson.assessment.questions.forEach((q, i) => {
      y = checkPageBreak(doc, y);
      y = addWrappedText(doc, `Q${i + 1}: ${q}`, margin + 5, y, contentWidth - 5, 5);
      y += 1;
    });
    y += 4;
  }

  // ----- Wrap Up -----
  if (lesson.wrapUp) {
    y = checkPageBreak(doc, y);
    y = addSection(doc, `WRAP-UP / CLOSING  (${lesson.wrapUp.duration} min)`, y);
    y = addWrappedText(doc, lesson.wrapUp.content, margin + 3, y, contentWidth - 3, 5);
    y += 4;
  }

  // ----- Resources -----
  if (lesson.resources?.length) {
    y = checkPageBreak(doc, y);
    y = addSection(doc, 'RESOURCES NEEDED', y);
    lesson.resources.forEach((r) => {
      y = checkPageBreak(doc, y);
      y = addWrappedText(doc, `• ${r}`, margin + 3, y, contentWidth - 3, 5);
      y += 1;
    });
    y += 4;
  }

  // ----- Differentiation -----
  if (lesson.differentiationNotes) {
    y = checkPageBreak(doc, y);
    y = addSection(doc, 'DIFFERENTIATION NOTES', y, [16, 185, 129]);
    y = addWrappedText(doc, lesson.differentiationNotes, margin + 3, y, contentWidth - 3, 5);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, doc.internal.pageSize.height - 8);
    doc.text('Learnership Management System — AI Generated', margin, doc.internal.pageSize.height - 8);
  }

  const name = filename || `lesson-plan-${lesson.unitStandardCode || 'export'}.pdf`;
  doc.save(name);
}

/**
 * Export a weekly schedule as a PDF table.
 */
export async function exportSchedulePdf(
  schedule: LessonScheduleItem[],
  groupName: string,
  filename?: string
): Promise<void> {
  const { jsPDF } = await getJsPDF();
  // @ts-ignore
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('LESSON SCHEDULE', margin, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Group: ${groupName}`, margin, 18);

  autoTable(doc, {
    startY: 30,
    head: [['Day', 'Date', 'Module', 'Unit Standard', 'Duration', 'Session', 'Objectives']],
    body: schedule.map((item) => [
      item.day,
      item.date,
      item.module,
      `${item.unitStandardCode}\n${item.unitStandardTitle}`,
      `${item.duration} min`,
      item.sessionType,
      item.objectives.join('\n'),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    columnStyles: { 3: { cellWidth: 50 }, 6: { cellWidth: 65 } },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}  — Learnership Management System`,
      margin,
      doc.internal.pageSize.height - 6
    );
  }

  doc.save(filename || `schedule-${groupName.replace(/\s+/g, '-')}.pdf`);
}
