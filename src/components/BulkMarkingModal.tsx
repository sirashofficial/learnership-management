'use client';

import { useState, useEffect } from 'react';
import { X, Check, Loader2, Users, AlertCircle, CheckSquare, Square } from 'lucide-react';

export type AssessmentResult = 'COMPETENT' | 'NOT_YET_COMPETENT';
export type AssessmentType = 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  currentStatus?: string; // existing assessment result if any
}

interface BulkMarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (studentIds: string[], result: AssessmentResult, assessmentType: AssessmentType) => Promise<void>;
  unitStandard: { id: string; code: string; title: string };
  students: Student[];
  assessmentType: AssessmentType;
  defaultResult?: AssessmentResult;
  title?: string;
}

export default function BulkMarkingModal({
  isOpen,
  onClose,
  onConfirm,
  unitStandard,
  students,
  assessmentType,
  defaultResult = 'COMPETENT',
  title,
}: BulkMarkingModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<AssessmentResult>(defaultResult);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-select all students that haven't been marked yet
  useEffect(() => {
    if (isOpen) {
      const preSelected = new Set(
        students
          .filter((s) => !s.currentStatus || s.currentStatus === 'PENDING')
          .map((s) => s.id)
      );
      setSelectedIds(preSelected);
      setSearchQuery('');
      setResult(defaultResult);
    }
  }, [isOpen, students, defaultResult]);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q)
    );
  });

  const allFilteredSelected = filteredStudents.every((s) => selectedIds.has(s.id));
  const someFilteredSelected = filteredStudents.some((s) => selectedIds.has(s.id));

  const toggleStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleAllFiltered = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredStudents.forEach((s) => next.delete(s.id));
    } else {
      filteredStudents.forEach((s) => next.add(s.id));
    }
    setSelectedIds(next);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      await onConfirm(Array.from(selectedIds), result, assessmentType);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'PENDING') return null;
    if (status === 'COMPETENT')
      return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Competent</span>;
    return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Not Yet</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {title ?? 'Bulk Mark Assessment'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {unitStandard.code} — {unitStandard.title}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Assessment type + result selector */}
        <div className="px-5 pt-4 pb-3 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 w-28">Assessment:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {assessmentType}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 w-28">Mark as:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setResult('COMPETENT')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg border-2 transition ${
                  result === 'COMPETENT'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-green-300 text-green-700 hover:bg-green-50'
                }`}
              >
                ✓ Competent
              </button>
              <button
                onClick={() => setResult('NOT_YET_COMPETENT')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg border-2 transition ${
                  result === 'NOT_YET_COMPETENT'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-red-300 text-red-700 hover:bg-red-50'
                }`}
              >
                ✗ Not Yet Competent
              </button>
            </div>
          </div>
        </div>

        {/* Search + select all */}
        <div className="px-5 pt-3 pb-2">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Select all toggle */}
        <div className="px-5 pb-2 flex items-center gap-2">
          <button
            onClick={toggleAllFiltered}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {allFilteredSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filteredStudents.length})
          </button>
          <span className="ml-auto text-sm text-gray-500">
            {selectedIds.size} of {students.length} selected
          </span>
        </div>

        {/* Student list */}
        <div className="overflow-y-auto flex-1 px-5 pb-2">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No students found</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredStudents.map((student) => {
                const isSelected = selectedIds.has(student.id);
                const alreadyMarked =
                  student.currentStatus === 'COMPETENT' || student.currentStatus === 'NOT_YET_COMPETENT';
                return (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStudent(student.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500">ID: {student.studentId}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alreadyMarked && getStatusBadge(student.currentStatus)}
                      {alreadyMarked && (
                        <span className="text-xs text-orange-600 font-medium" title="Will be overwritten">
                          ↻ overwrite
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning if overwriting */}
        {students.some(
          (s) => selectedIds.has(s.id) && (s.currentStatus === 'COMPETENT' || s.currentStatus === 'NOT_YET_COMPETENT')
        ) && (
          <div className="mx-5 mb-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Some selected students already have a result. Their existing assessment will be updated.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || selectedIds.size === 0}
            className={`px-5 py-2 text-sm font-bold rounded-lg text-white flex items-center gap-2 disabled:opacity-50 ${
              result === 'COMPETENT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {loading
              ? 'Marking...'
              : `Mark ${selectedIds.size} Student${selectedIds.size !== 1 ? 's' : ''} as ${
                  result === 'COMPETENT' ? 'Competent' : 'Not Yet Competent'
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}
