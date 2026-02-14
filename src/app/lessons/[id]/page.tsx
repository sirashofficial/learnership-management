"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Edit2, Save, Trash2, Printer, Calendar, Clock, Users, 
  MapPin, Target, BookOpen, CheckCircle, X 
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((data) => data.data || data);

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.id as string;
  
  const { data: lesson, mutate } = useSWR(lessonId ? `/api/lessons/${lessonId}` : null, fetcher);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedLesson, setEditedLesson] = useState<any>(null);

  useEffect(() => {
    if (lesson && !editedLesson) {
      setEditedLesson({ ...lesson });
    }
  }, [lesson]);

  const handleSave = async () => {
    if (!editedLesson) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedLesson),
      });

      if (!response.ok) {
        throw new Error('Failed to update lesson');
      }

      await mutate();
      setIsEditing(false);
      alert('✅ Lesson plan updated successfully!');
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Failed to update lesson plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lesson plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      alert('✅ Lesson plan deleted successfully!');
      router.push('/lessons');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson plan');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!lesson) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading lesson plan...</div>
        </div>
      </div>
    );
  }

  const displayLesson = isEditing ? editedLesson : lesson;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lessons
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditedLesson({ ...lesson });
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:bg-slate-400"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          {isEditing ? (
            <input
              type="text"
              value={editedLesson?.title || ''}
              onChange={(e) => setEditedLesson({ ...editedLesson, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          ) : (
            displayLesson.title
          )}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {displayLesson.group?.name || 'No Group'}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(displayLesson.date).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {displayLesson.startTime} - {displayLesson.endTime}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {displayLesson.venue || 'TBD'}
          </div>
        </div>
      </div>

      {/* Module Info */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Module</h3>
        <p className="text-slate-700">
          {displayLesson.module?.code} - {displayLesson.module?.name}
        </p>
      </div>

      {/* Learning Objectives */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Learning Objectives</h3>
        </div>
        {isEditing ? (
          <textarea
            value={editedLesson?.objectives || ''}
            onChange={(e) => setEditedLesson({ ...editedLesson, objectives: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        ) : (
          <div className="text-slate-700 whitespace-pre-wrap">
            {displayLesson.objectives || 'No objectives specified'}
          </div>
        )}
      </div>

      {/* Activities */}
      {displayLesson.activities && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Activities & Exercises</h3>
          </div>
          {isEditing ? (
            <textarea
              value={editedLesson?.activities || ''}
              onChange={(e) => setEditedLesson({ ...editedLesson, activities: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          ) : (
            <div className="text-slate-700 whitespace-pre-wrap">
              {displayLesson.activities}
            </div>
          )}
        </div>
      )}

      {/* Materials */}
      {displayLesson.materials && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-slate-900">Materials & Resources</h3>
          </div>
          {isEditing ? (
            <textarea
              value={editedLesson?.materials || ''}
              onChange={(e) => setEditedLesson({ ...editedLesson, materials: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          ) : (
            <div className="text-slate-700 whitespace-pre-wrap">
              {displayLesson.materials}
            </div>
          )}
        </div>
      )}

      {/* Assessment */}
      {displayLesson.assessment && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Assessment Methods</h3>
          </div>
          {isEditing ? (
            <textarea
              value={editedLesson?.assessment || ''}
              onChange={(e) => setEditedLesson({ ...editedLesson, assessment: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          ) : (
            <div className="text-slate-700 whitespace-pre-wrap">
              {displayLesson.assessment}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {displayLesson.notes && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Additional Notes</h3>
          {isEditing ? (
            <textarea
              value={editedLesson?.notes || ''}
              onChange={(e) => setEditedLesson({ ...editedLesson, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          ) : (
            <div className="text-slate-700 whitespace-pre-wrap">
              {displayLesson.notes}
            </div>
          )}
        </div>
      )}

      {/* AI Generated Badge */}
      {displayLesson.aiGenerated && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-purple-900">AI-Generated Lesson Plan</p>
            <p className="text-sm text-purple-700">This lesson was created using AI assistance</p>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .p-6.space-y-6, .p-6.space-y-6 * {
            visibility: visible;
          }
          button {
            display: none !important;
          }
          .p-6.space-y-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
