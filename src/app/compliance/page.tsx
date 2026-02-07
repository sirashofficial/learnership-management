"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useStudents } from "@/hooks/useStudents";
import { useAttendance } from "@/hooks/useAttendance";
import { useAssessmentStats } from "@/hooks/useAssessmentStats";
import { useProgress } from "@/hooks/useProgress";
import { FileText, CheckCircle, AlertCircle, Clock, Download, Users, Calendar, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import { generateComplianceReportPDF, type ComplianceReportData, type ReportStudent } from "@/lib/report-generator";

export default function CompliancePage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { students } = useStudents();
  const { attendance } = useAttendance();
  const { stats: assessmentStats } = useAssessmentStats();
  const { moduleProgress } = useProgress();

  // Calculate compliance metrics
  const calculateAttendanceRate = (studentId: string) => {
    const studentAttendance = attendance?.filter((a: any) => a.studentId === studentId) || [];
    if (studentAttendance.length === 0) return 0;
    const present = studentAttendance.filter((a: any) => a.status === "PRESENT").length;
    return Math.round((present / studentAttendance.length) * 100);
  };

  const studentsWithCompliance = students?.map((student: any) => ({
    ...student,
    attendanceRate: calculateAttendanceRate(student.id),
    compliant: calculateAttendanceRate(student.id) >= 80,
  })) || [];

  const compliantStudents = studentsWithCompliance.filter((s) => s.compliant).length;
  const nonCompliantStudents = studentsWithCompliance.filter((s) => !s.compliant).length;
  const overallComplianceRate = students?.length
    ? Math.round((compliantStudents / students.length) * 100)
    : 0;

  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (rate >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getComplianceStatus = (rate: number) => {
    if (rate >= 80) return "Compliant";
    if (rate >= 60) return "At Risk";
    return "Non-Compliant";
  };

  const handleExportReport = () => {
    // Transform data for report generator
    const reportStudents: ReportStudent[] = studentsWithCompliance.map(s => ({
      id: s.id,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      group: typeof s.group === 'string' ? s.group : s.group?.name,
      status: s.status,
      progress: s.progress,
      attendanceRate: s.attendanceRate,
      complianceStatus: s.compliant ? 'COMPLIANT' : s.attendanceRate >= 60 ? 'WARNING' : 'CRITICAL',
    }));

    const reportData: ComplianceReportData = {
      title: 'Compliance Report',
      generatedAt: new Date(),
      students: reportStudents,
      summary: {
        total: students?.length || 0,
        compliant: compliantStudents,
        warning: studentsWithCompliance.filter(s => !s.compliant && s.attendanceRate >= 60).length,
        critical: nonCompliantStudents,
        overallRate: overallComplianceRate,
      }
    };

    generateComplianceReportPDF(reportData);
  };

  return (
    <>
      <Header />

      <div className="p-6 space-y-6">
        {/* Overall Compliance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{overallComplianceRate}%</span>
            </div>
            <p className="text-sm text-text-light">Overall Compliance</p>
          </div>

          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{compliantStudents}</span>
            </div>
            <p className="text-sm text-text-light">Compliant Students</p>
          </div>

          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{nonCompliantStudents}</span>
            </div>
            <p className="text-sm text-text-light">Non-Compliant</p>
          </div>

          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">
                {assessmentStats?.pendingModeration || 0}
              </span>
            </div>
            <p className="text-sm text-text-light">Pending Moderation</p>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Export Compliance Report
          </button>
        </div>

        {/* SSETA Compliance Threshold (80% Attendance) */}
        <div className="bg-white rounded-xl border border-background-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Attendance Compliance (SSETA Threshold: 80%)
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Students must maintain at least 80% attendance for SSETA compliance
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {studentsWithCompliance.length > 0 ? (
              studentsWithCompliance.map((student: any) => (
                <div
                  key={student.id}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-lg transition-colors",
                    student.compliant
                      ? "border-green-200 bg-green-50/50"
                      : "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                      student.compliant ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {student.firstName.charAt(0)}
                    </div>
                    <div>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="font-medium text-slate-900 hover:text-blue-600 hover:underline text-left"
                      >
                        {student.firstName} {student.lastName}
                      </button>
                      <p className="text-sm text-slate-500">
                        {student.studentId} • {typeof student.group === 'string' ? student.group : student.group?.name || "No Group"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-bold",
                        student.compliant ? "text-green-600" : "text-red-600"
                      )}>
                        {student.attendanceRate}%
                      </p>
                      <p className="text-xs text-slate-500">Attendance</p>
                    </div>
                    <span
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full border-2",
                        getComplianceColor(student.attendanceRate)
                      )}
                    >
                      {getComplianceStatus(student.attendanceRate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No student data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Assessment Compliance */}
        <div className="bg-white rounded-xl border border-background-border p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Assessment Compliance
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {assessmentStats?.total || 0}
                </div>
                <p className="text-sm text-slate-600">Total Assessments</p>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {assessmentStats?.completed || 0}
                </div>
                <p className="text-sm text-slate-600">Completed</p>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {assessmentStats?.pending || 0}
                </div>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {assessmentStats?.overdue || 0}
                </div>
                <p className="text-sm text-slate-600">Overdue</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">Formative Assessments</span>
                <span className="text-2xl font-bold text-purple-600">
                  {assessmentStats?.byType?.formative || 0}
                </span>
              </div>
              <p className="text-xs text-purple-700">Ongoing knowledge checks</p>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-900">Summative Assessments</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {assessmentStats?.byType?.summative || 0}
                </span>
              </div>
              <p className="text-xs text-indigo-700">Final competency evaluations</p>
            </div>
          </div>
        </div>

        {/* Module Progress Compliance */}
        <div className="bg-white rounded-xl border border-background-border p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Module Progress Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {moduleProgress?.filter((m: any) => m.status === "COMPLETED").length || 0}
                </div>
                <p className="text-sm text-green-800 font-medium">Modules Completed</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
              <div className="text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {moduleProgress?.filter((m: any) => m.status === "IN_PROGRESS").length || 0}
                </div>
                <p className="text-sm text-blue-800 font-medium">In Progress</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg">
              <div className="text-center">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-slate-700 mb-1">
                  {moduleProgress?.filter((m: any) => m.status === "NOT_STARTED").length || 0}
                </div>
                <p className="text-sm text-slate-800 font-medium">Not Started</p>
              </div>
            </div>
          </div>
        </div>

        {/* Required Documentation Status */}
        <div className="bg-white rounded-xl border border-background-border p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Required SSETA Documentation
          </h3>
          <div className="space-y-3">
            {[
              {
                document: "Monthly Progress Report",
                status: compliantStudents >= students?.length * 0.8 ? "Up to Date" : "Needs Attention",
                description: "Learner progress and attendance summary",
                priority: compliantStudents >= students?.length * 0.8 ? "low" : "high"
              },
              {
                document: "Attendance Register",
                status: "Up to Date",
                description: "Daily attendance records (80% threshold)",
                priority: "low"
              },
              {
                document: "Assessment Records",
                status: (assessmentStats?.pendingModeration || 0) > 0 ? "Pending Moderation" : "Complete",
                description: "Formative and summative assessment results",
                priority: (assessmentStats?.pendingModeration || 0) > 0 ? "medium" : "low"
              },
              {
                document: "POE Verification",
                status: "In Progress",
                description: "Portfolio of Evidence validation",
                priority: "medium"
              },
              {
                document: "Moderation Reports",
                status: (assessmentStats?.pendingModeration || 0) === 0 ? "Complete" : "Action Required",
                description: "Assessment moderation documentation",
                priority: (assessmentStats?.pendingModeration || 0) === 0 ? "low" : "high"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg transition-colors",
                  item.priority === "high" ? "border-red-200 bg-red-50/50" :
                    item.priority === "medium" ? "border-amber-200 bg-amber-50/50" :
                      "border-green-200 bg-green-50/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <FileText className={cn(
                    "w-8 h-8",
                    item.priority === "high" ? "text-red-600" :
                      item.priority === "medium" ? "text-amber-600" :
                        "text-green-600"
                  )} />
                  <div>
                    <p className="font-medium text-slate-900">{item.document}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  item.status === "Complete" || item.status === "Up to Date" ? "bg-green-100 text-green-700 border border-green-200" :
                    item.status.includes("Pending") || item.status === "In Progress" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                      "bg-red-100 text-red-700 border border-red-200"
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailsModal
          isOpen={true}
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSave={(updated) => {
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
}
