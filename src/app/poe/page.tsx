"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { FolderOpen, Check, X, Save } from "lucide-react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((data) => data.data || data);

export default function POEPage() {
  const { data: students } = useSWR('/api/students', fetcher);
  const { data: poeChecklists } = useSWR('/api/poe', fetcher);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("");
  const [saving, setSaving] = useState<string | null>(null);

  const studentList = students || [];
  const checklists = poeChecklists || [];

  // Get or create checklist for a student
  const getChecklist = (studentId: string) => {
    return checklists.find((c: any) => c.studentId === studentId) || {
      studentId,
      module1POE: false,
      module2POE: false,
      module3POE: false,
      module4POE: false,
      module5POE: false,
      module6POE: false,
      assessmentSigned: false,
      logbookComplete: false,
      idCopy: false,
      contractSigned: false,
      inductionComplete: false,
      workplaceAgreement: false,
      notes: "",
    };
  };

  const updateChecklist = async (studentId: string, field: string, value: boolean) => {
    setSaving(studentId);
    try {
      const response = await fetch('/api/poe', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          [field]: value,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      mutate('/api/poe');
    } catch (error) {
      console.error('Error updating POE checklist:', error);
      alert('Failed to update checklist');
    } finally {
      setSaving(null);
    }
  };

  const filteredStudents = selectedGroupFilter
    ? studentList.filter((s: any) => s.group?.id === selectedGroupFilter)
    : studentList;

  const uniqueGroups = Array.from(new Set(studentList.map((s: any) => s.group?.id).filter(Boolean)));

  const checklistFields = [
    { key: 'module1POE', label: 'Module 1 POE' },
    { key: 'module2POE', label: 'Module 2 POE' },
    { key: 'module3POE', label: 'Module 3 POE' },
    { key: 'module4POE', label: 'Module 4 POE' },
    { key: 'module5POE', label: 'Module 5 POE' },
    { key: 'module6POE', label: 'Module 6 POE' },
    { key: 'assessmentSigned', label: 'Assessments Signed' },
    { key: 'logbookComplete', label: 'Logbook Complete' },
    { key: 'idCopy', label: 'ID Copy' },
    { key: 'contractSigned', label: 'Contract Signed' },
    { key: 'inductionComplete', label: 'Induction Complete' },
    { key: 'workplaceAgreement', label: 'Workplace Agreement' },
  ];

  const calculateCompleteness = (checklist: any) => {
    const total = checklistFields.length;
    const completed = checklistFields.filter((f) => checklist[f.key]).length;
    return Math.round((completed / total) * 100);
  };

  return (
    <>
      <Header title="POE Management" subtitle="Portfolio of Evidence physical file tracking and verification" />
      
      <div className="p-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Physical POE File Tracking
          </h3>
          <p className="text-blue-700 text-sm">
            Use this page to track physical portfolio of evidence files. Check off items as you verify they are present in each student's physical file.
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Group</label>
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Groups</option>
            {uniqueGroups.map((groupId: any) => {
              const student = studentList.find((s: any) => s.group?.id === groupId);
              return (
                <option key={groupId} value={groupId}>
                  {student?.group?.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* POE Checklist Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Group</th>
                  {checklistFields.map((field) => (
                    <th key={field.key} className="px-2 py-3 text-center text-xs font-medium text-gray-700 min-w-[100px]">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Complete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={checklistFields.length + 3} className="px-4 py-8 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student: any) => {
                    const checklist = getChecklist(student.id);
                    const completeness = calculateCompleteness(checklist);
                    const isSaving = saving === student.id;

                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 ${isSaving ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 sticky left-0 bg-white z-10">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{student.studentId}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.group?.name || '-'}
                        </td>
                        {checklistFields.map((field) => (
                          <td key={field.key} className="px-2 py-3 text-center">
                            <button
                              onClick={() => updateChecklist(student.id, field.key, !checklist[field.key])}
                              disabled={isSaving}
                              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                                checklist[field.key]
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {checklist[field.key] ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            </button>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${completeness}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{completeness}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <p className="text-sm text-green-600">100% Complete</p>
            <p className="text-2xl font-bold text-green-700">
              {filteredStudents.filter((s: any) => calculateCompleteness(getChecklist(s.id)) === 100).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600">In Progress</p>
            <p className="text-2xl font-bold text-yellow-700">
              {filteredStudents.filter((s: any) => {
                const c = calculateCompleteness(getChecklist(s.id));
                return c > 0 && c < 100;
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <p className="text-sm text-red-600">Not Started</p>
            <p className="text-2xl font-bold text-red-700">
              {filteredStudents.filter((s: any) => calculateCompleteness(getChecklist(s.id)) === 0).length}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

