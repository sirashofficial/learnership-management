'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, BookOpen, CheckCircle, Copy, Download, Save } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((data) => data);

interface Question {
  text: string;
  options?: string[];
  correctAnswer?: string;
  correctAnswerIndex?: number;
  marks?: number;
  type?: 'multiple-choice' | 'short-answer' | 'essay' | 'practical';
}

interface GeneratedAssessment {
  unitStandard: {
    code: string;
    title: string;
    credits: number;
    level: number;
  };
  assessmentType: 'formative' | 'summative';
  questions: Question[];
  metadata: {
    generatedAt: string;
    sourceDocuments: number;
    questionCount: number;
  };
}

export default function AssessmentGeneratorPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { data: modules } = useSWR('/api/ai/generate-assessment', fetcher);
  
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedUnitStandardId, setSelectedUnitStandardId] = useState('');
  const [assessmentType, setAssessmentType] = useState<'formative' | 'summative'>('formative');
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [format, setFormat] = useState('mixed');
  
  const [generating, setGenerating] = useState(false);
  const [generatedAssessment, setGeneratedAssessment] = useState<GeneratedAssessment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const currentModule = modules?.modules?.find((m: any) => m.moduleId === selectedModuleId);
  const currentUnitStandard = currentModule?.unitStandards.find(
    (us: any) => us.id === selectedUnitStandardId
  );

  const handleGenerateAssessment = async () => {
    if (!selectedUnitStandardId) {
      alert('Please select a unit standard');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          unitStandardId: selectedUnitStandardId,
          type: assessmentType,
          count: parseInt(questionCount),
          difficulty,
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate assessment');
      }

      const result = await response.json();
      setGeneratedAssessment(result);
    } catch (error: any) {
      alert(error.message || 'Failed to generate assessment. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!generatedAssessment) return;

    setSaving(true);
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: `${assessmentType === 'formative' ? 'Formative' : 'Summative'} Assessment: ${generatedAssessment.unitStandard.code}`,
          description: `AI-generated ${assessmentType} assessment for ${generatedAssessment.unitStandard.title}`,
          unitStandardId: selectedUnitStandardId,
          type: assessmentType,
          questions: generatedAssessment.questions,
          aiGenerated: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save assessment');
      }

      alert('✅ Assessment saved successfully!');
      setGeneratedAssessment(null);
      setSelectedUnitStandardId('');
    } catch (error: any) {
      alert(error.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const downloadAssessment = () => {
    if (!generatedAssessment) return;

    const content = formatAssessmentForDownload(generatedAssessment);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute(
      'download',
      `${generatedAssessment.unitStandard.code}_${assessmentType}_assessment.txt`
    );
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatAssessmentForDownload = (assessment: GeneratedAssessment) => {
    let content = `${assessment.assessmentType.toUpperCase()} ASSESSMENT\n`;
    content += `${'='.repeat(80)}\n\n`;
    content += `Unit Standard: ${assessment.unitStandard.code}\n`;
    content += `Title: ${assessment.unitStandard.title}\n`;
    content += `NQF Level: ${assessment.unitStandard.level}\n`;
    content += `Credits: ${assessment.unitStandard.credits}\n`;
    content += `Generated: ${new Date(assessment.metadata.generatedAt).toLocaleString()}\n\n`;

    assessment.questions.forEach((q, idx) => {
      content += `Question ${idx + 1} (${q.marks || 1} marks):\n`;
      content += `${q.text}\n`;
      if (q.options) {
        q.options.forEach((opt, i) => {
          content += `  ${String.fromCharCode(65 + i)}. ${opt}\n`;
        });
        if (q.correctAnswerIndex !== undefined) {
          content += `\n[ANSWER KEY: ${String.fromCharCode(65 + q.correctAnswerIndex)}]\n`;
        }
      }
      if (q.type === 'short-answer' && q.correctAnswer) {
        content += `\n[MODEL ANSWER]: ${q.correctAnswer}\n`;
      }
      content += '\n---\n\n';
    });

    return content;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Assessment Generator</h1>
          <p className="text-slate-600 mt-1">Generate assessments powered by your curriculum documents</p>
        </div>
      </div>

      {/* Generator Form */}
      {!generatedAssessment ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 space-y-6">
          {/* Module Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Module *
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                setSelectedUnitStandardId('');
              }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select a module</option>
              {modules?.modules?.map((m: any) => (
                <option key={m.moduleId} value={m.moduleId}>
                  {m.moduleName}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Standard Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unit Standard *
            </label>
            <select
              value={selectedUnitStandardId}
              onChange={(e) => setSelectedUnitStandardId(e.target.value)}
              disabled={!selectedModuleId}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-100"
            >
              <option value="">Select a unit standard</option>
              {currentModule?.unitStandards.map((us: any) => (
                <option key={us.id} value={us.id}>
                  {us.code} - {us.title} (Level {us.level}, {us.credits} credits)
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Assessment Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all" 
                style={{borderColor: assessmentType === 'formative' ? '#10b981' : '#e2e8f0'}}>
                <input
                  type="radio"
                  name="type"
                  value="formative"
                  checked={assessmentType === 'formative'}
                  onChange={() => setAssessmentType('formative')}
                  className="w-4 h-4"
                />
                <span className="ml-2">
                  <p className="font-medium text-slate-900">Formative</p>
                  <p className="text-sm text-slate-500">Ongoing assessment, check understanding</p>
                </span>
              </label>
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                style={{borderColor: assessmentType === 'summative' ? '#10b981' : '#e2e8f0'}}>
                <input
                  type="radio"
                  name="type"
                  value="summative"
                  checked={assessmentType === 'summative'}
                  onChange={() => setAssessmentType('summative')}
                  className="w-4 h-4"
                />
                <span className="ml-2">
                  <p className="font-medium text-slate-900">Summative</p>
                  <p className="text-sm text-slate-500">Final assessment, measure achievement</p>
                </span>
              </label>
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Questions
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
              <option value="20">20 Questions</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['foundation', 'intermediate', 'advanced'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    difficulty === level
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Question Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="multiple-choice">Multiple Choice Only</option>
              <option value="short-answer">Short Answer Only</option>
              <option value="essay">Essay Questions Only</option>
              <option value="mixed">Mixed (MCQ + Short Answer + Essay)</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateAssessment}
            disabled={generating || !selectedUnitStandardId}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating Assessment...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Generate Assessment
              </>
            )}
          </button>
        </div>
      ) : (
        // Assessment Display
        <div className="space-y-6">
          {/* Assessment Header */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {generatedAssessment.assessmentType === 'formative' ? 'Formative' : 'Summative'} Assessment
                </h2>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><strong>Unit Standard:</strong> {generatedAssessment.unitStandard.code} - {generatedAssessment.unitStandard.title}</p>
                  <p><strong>Level:</strong> NQF {generatedAssessment.unitStandard.level} | <strong>Credits:</strong> {generatedAssessment.unitStandard.credits}</p>
                  <p><strong>Source Documents:</strong> {generatedAssessment.metadata.sourceDocuments} curriculum documents used</p>
                </div>
              </div>
              <button
                onClick={() => setGeneratedAssessment(null)}
                className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg transition-colors"
              >
                ✕ Back
              </button>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {generatedAssessment.questions.map((question, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-700 font-semibold">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 mb-3">{question.text}</p>
                    {question.options && question.options.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {question.options.map((option, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-lg border ${
                              optIdx === question.correctAnswerIndex
                                ? 'bg-green-50 border-green-300'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="text-slate-700">{option}</span>
                              {optIdx === question.correctAnswerIndex && (
                                <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : question.correctAnswer ? (
                      <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-3">
                        <p className="text-sm text-slate-600 mb-1"><strong>Model Answer:</strong></p>
                        <p className="text-slate-700">{question.correctAnswer}</p>
                      </div>
                    ) : null}
                    {question.marks && (
                      <p className="text-xs text-slate-500">Marks: {question.marks}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={downloadAssessment}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download as Text
            </button>
            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Assessment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
