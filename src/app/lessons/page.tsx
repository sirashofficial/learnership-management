import { formatGroupNameDisplay } from '@/lib/groupName';
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Plus, Calendar, Clock, Users, BookOpen, Target, CheckCircle, X, Save, MapPin, Sparkles, RefreshCw, CalendarPlus, Edit2, Loader2, AlertCircle, FileText } from "lucide-react";
import { mutate } from "swr";
import { useGroups } from "@/contexts/GroupsContext";
import { useAuth } from "@/contexts/AuthContext";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";

type GeneratingStep = {
  title: string;
  duration: number;
};

const GENERATING_STEPS: GeneratingStep[] = [
  { title: "Analysing unit standard...", duration: 800 },
  { title: "Designing learning sequence...", duration: 600 },
  { title: "Creating activities...", duration: 700 },
  { title: "Generating assessment methods...", duration: 500 },
  { title: "Finalizing lesson plan...", duration: 400 },
];

export default function LessonsPage() {
  const router = useRouter();
  const { groups } = useGroups();
  const { user } = useAuth();
  const { data: modulesData } = useSWR('/api/modules', fetcher);
  const modules = modulesData?.data?.modules || modulesData?.modules || [];
  const { data: unitStandards } = useSWR('/api/unit-standards', fetcher);
  const { data: lessonsData, mutate: mutateLessons } = useSWR('/api/lessons', fetcher);
  const realLessons = lessonsData?.data || [];
  const { data: indexStats } = useSWR('/api/ai/index-documents', fetcher);
  
  const [activeTab, setActiveTab] = useState<'list' | 'manual' | 'ai'>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    moduleId: "",
    date: "",
    startTime: "",
    endTime: "",
    groupId: "",
    venue: "",
    objectives: "",
    activities: "",
    materials: "",
    assessment: "",
    notes: ""
  });

  const [aiFormData, setAiFormData] = useState({
    groupId: "",
    unitStandardId: "",
    duration: "60",
    learningOutcomes: "",
    notes: "",
  });

  const handleAIGenerate = async () => {
    if (!aiFormData.groupId || !aiFormData.unitStandardId) {
      console.warn('Missing group or unit standard selection');
      return;
    }

    setGenerating(true);
    setCurrentStep(0);

    try {
      // Simulate loading steps
      for (let i = 0; i < GENERATING_STEPS.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, GENERATING_STEPS[i].duration));
      }

      // Call new AI generation endpoint with document support
      const response = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitStandardId: aiFormData.unitStandardId,
          duration: parseInt(aiFormData.duration),
          learningOutcomes: aiFormData.learningOutcomes,
          notes: aiFormData.notes,
          groupId: aiFormData.groupId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate lesson plan');
      }

      const result = await response.json();
      const lessonData = result.lessonPlan;
      
      // Transform result into displayable format
      const unitStandard = unitStandards?.find((us: any) => us.id === aiFormData.unitStandardId);
      const group = groups?.find(g => g.id === aiFormData.groupId);
      
      setGeneratedPlan({
        title: lessonData.title || `Lesson: ${unitStandard?.title || 'Generated Lesson'}`,
        unitStandard: unitStandard?.title || '',
        group: group?.name || '',
        duration: lessonData.duration || aiFormData.duration,
        learningOutcomes: lessonData.learningOutcomes || [],
        introduction: lessonData.introduction || { duration: 0, content: '', activities: [] },
        mainContent: lessonData.mainContent || { duration: 0, content: '', activities: [] },
        activity: lessonData.activity || { duration: 0, instructions: '', groupWork: false },
        assessment: lessonData.assessment || { duration: 0, method: '', questions: [] },
        wrapUp: lessonData.wrapUp || { duration: 0, content: '' },
        resources: lessonData.resources || [],
        differentiationNotes: lessonData.differentiationNotes || '',
        sourceDocuments: lessonData.sourceDocuments || [],
        hasDocumentSupport: lessonData.hasDocumentSupport || false,
        isEditing: false,
      });
      
    } catch (error: any) {
      console.error('Error generating lesson:', error);
      alert(error.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setGenerating(false);
      setCurrentStep(-1);
    }
  };

  const handleSaveGenerated = async (status: 'draft' | 'published') => {
    if (!generatedPlan || !user?.id) return;

    setSaving(true);
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedPlan.title,
          description: `${generatedPlan.unitStandard} - AI Generated`,
          date: new Date(),
          startTime: '09:00',
          endTime: `${9 + parseInt(aiFormData.duration) / 60}:00`,
          facilitatorId: user.id,
          groupId: aiFormData.groupId,
          moduleId: modules?.[0]?.id || null,
          objectives: generatedPlan.learningOutcomes,
          activities: `Introduction: ${generatedPlan.introduction}\n\nMain Activity: ${generatedPlan.mainActivity}\n\nWrap-up: ${generatedPlan.wrapUp}`,
          assessment: generatedPlan.assessment,
          materials: generatedPlan.resources.join(', '),
          notes: aiFormData.notes,
          aiGenerated: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lesson plan');
      }

      await mutateLessons();
      alert(`✅ Lesson plan saved as ${status}!`);
      setGeneratedPlan(null);
      setActiveTab('list');
      setAiFormData({
        groupId: "",
        unitStandardId: "",
        duration: "60",
        learningOutcomes: "",
        notes: "",
      });
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.moduleId) {
      alert('Please select a module');
      return;
    }
    
    if (!user?.id) {
      alert('User session expired. Please login again.');
      return;
    }
    
    setSaving(true);

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          facilitatorId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create lesson');
      }

      await mutateLessons();
      alert('Lesson plan created successfully!');
      setShowCreateForm(false);
      setFormData({
        title: "",
        moduleId: "",
        date: "",
        startTime: "",
        endTime: "",
        groupId: "",
        venue: "",
        objectives: "",
        activities: "",
        materials: "",
        assessment: "",
        notes: ""
      });
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      alert(error.message || 'Failed to create lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  };



  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header with Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Lesson Plans</h2>
                  <p className="text-slate-600">Create and manage your lesson plans</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Lesson Plans
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                AI Generator
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Manual Create
              </button>
            </div>
          </div>

          {/* List View */}
          {activeTab === 'list' && (
            <div className="divide-y divide-slate-200">
              {realLessons.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-medium text-slate-900 mb-1">No lesson plans yet</p>
                  <p className="text-sm text-slate-600 mb-4">Create your first lesson plan using the form above</p>
                </div>
              ) : (
                realLessons.map((lesson: any) => (
                  <div key={lesson.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-2">{lesson.title}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {lesson.group?.name || 'No group'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {lesson.date ? new Date(lesson.date).toLocaleDateString() : 'No date'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {lesson.startTime} - {lesson.endTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {lesson.venue || 'No venue'}
                          </div>
                        </div>
                      </div>
                      <button className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI Generator View */}
          {activeTab === 'ai' && (
            <div className="p-6">{!generatedPlan ? (
                !generating ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-600 rounded-lg">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">AI Lesson Plan Generator</h3>
                          <p className="text-slate-600">
                            Let AI design a comprehensive lesson plan based on your unit standard and requirements.
                            The generator will create learning outcomes, activities, and assessment methods.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Document Index Status */}
                    {indexStats && (
                      <div className={`rounded-lg p-4 border ${
                        (indexStats.pinecone?.totalRecords || 0) > 0
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          {(indexStats.pinecone?.totalRecords || 0) > 0 ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-green-900">
                                  {indexStats.pinecone.totalRecords} documents indexed
                                </p>
                                <p className="text-sm text-green-700">
                                  Lesson plans will use your curriculum content
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-yellow-900">
                                  No documents indexed
                                </p>
                                <p className="text-sm text-yellow-700">
                                  Lesson plans will use general AI knowledge only.{' '}
                                  <a href="/admin/documents" className="underline">
                                    Upload documents
                                  </a>
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Group *
                        </label>
                        <select
                          required
                          value={aiFormData.groupId}
                          onChange={(e) => setAiFormData({...aiFormData, groupId: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select a group</option>
                          {groups?.map(group => (
                             <option key={group.id} value={group.id}>{formatGroupNameDisplay(group.name)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Unit Standard *
                        </label>
                        <select
                          required
                          value={aiFormData.unitStandardId}
                          onChange={(e) => {
                            const us = unitStandards?.find((u: any) => u.id === e.target.value);
                            setAiFormData({
                              ...aiFormData,
                              unitStandardId: e.target.value,
                              learningOutcomes: us?.purpose || ''
                            });
                          }}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select a unit standard</option>
                          {unitStandards?.map((us: any) => (
                            <option key={us.id} value={us.id}>
                              {us.code} - {us.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Duration *
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {['30', '60', '90', '120'].map(duration => (
                            <button
                              key={duration}
                              type="button"
                              onClick={() => setAiFormData({...aiFormData, duration})}
                              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                                aiFormData.duration === duration
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {duration} min
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Learning Outcomes
                        </label>
                        <textarea
                          value={aiFormData.learningOutcomes}
                          onChange={(e) => setAiFormData({...aiFormData, learningOutcomes: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="What should learners achieve? (Auto-populated from unit standard or customize...)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Special Notes / Accommodations
                        </label>
                        <textarea
                          value={aiFormData.notes}
                          onChange={(e) => setAiFormData({...aiFormData, notes: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Any special requirements, accommodations, or focus areas..."
                        />
                      </div>

                      <button
                        onClick={handleAIGenerate}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                      >
                        <Sparkles className="w-5 h-5" />
                        Generate Lesson Plan with AI
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="max-w-md mx-auto text-center">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Generating Your Lesson Plan</h3>
                      {currentStep >= 0 && currentStep < GENERATING_STEPS.length && (
                        <p className="text-purple-600 font-medium animate-pulse">
                          {GENERATING_STEPS[currentStep].title}
                        </p>
                      )}
                      <div className="mt-6 flex justify-center gap-2">
                        {GENERATING_STEPS.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-2 w-12 rounded-full transition-colors ${
                              idx <= currentStep ? 'bg-purple-600' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  {/* Generated Plan Display */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{generatedPlan.title}</h3>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>📚 {generatedPlan.unitStandard}</span>
                          <span>👥 {formatGroupNameDisplay(generatedPlan.group)}</span>
                          <span>⏱️ {generatedPlan.duration} minutes</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAIGenerate}
                          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Learning Outcomes */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-slate-900">Learning Outcomes</h4>
                      <button className="ml-auto text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-slate-700 whitespace-pre-wrap">{generatedPlan.learningOutcomes}</div>
                  </div>

                  {/* Introduction */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-slate-900">Introduction / Warm-up</h4>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">5-10 min</span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-slate-700">{generatedPlan.introduction}</div>
                  </div>

                  {/* Main Activity */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        <h4 className="font-semibold text-slate-900">Main Activity / Content</h4>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">{parseInt(generatedPlan.duration) - 20} min</span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-slate-700">{generatedPlan.mainActivity}</div>
                  </div>

                  {/* Assessment */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-slate-900">Assessment / Check for Understanding</h4>
                      <button className="ml-auto text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-slate-700">{generatedPlan.assessment}</div>
                  </div>

                  {/* Wrap-up */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-semibold text-slate-900">Wrap-up / Closing</h4>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">5-10 min</span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-slate-700">{generatedPlan.wrapUp}</div>
                  </div>

                  {/* Resources */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-teal-600" />
                      <h4 className="font-semibold text-slate-900">Resources Needed</h4>
                      <button className="ml-auto text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <ul className="list-disc list-inside text-slate-700 space-y-1">
                      {generatedPlan.resources.map((resource: string, idx: number) => (
                        <li key={idx}>{resource}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Source Documents */}
                  {generatedPlan.sourceDocuments && generatedPlan.sourceDocuments.length > 0 && (
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Generated Using Curriculum Documents</h4>
                      </div>
                      <p className="text-sm text-blue-700 mb-2">
                        This lesson plan was created using content from your uploaded curriculum documents:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                        {generatedPlan.sourceDocuments.map((doc: string, idx: number) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleSaveGenerated('draft')}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors disabled:bg-slate-400 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                      onClick={() => handleSaveGenerated('published')}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-slate-400 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {saving ? 'Publishing...' : 'Save & Publish'}
                    </button>
                    <button
                      onClick={() => alert('Add to Timetable functionality coming soon')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CalendarPlus className="w-5 h-5" />
                      Add to Timetable
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Manual Create View */}
          {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Introduction to Market Requirements"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Module *
                  </label>
                  <select
                    required
                    value={formData.moduleId}
                    onChange={(e) => setFormData({...formData, moduleId: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a module</option>
                    {modules?.map((module: any) => (
                      <option key={module.id} value={module.id}>
                        {module.code} - {module.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Group *
                  </label>
                  <select
                    required
                    value={formData.groupId}
                    onChange={(e) => setFormData({...formData, groupId: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a group</option>
                    {groups?.map(group => (
                      <option key={group.id} value={group.id}>{formatGroupNameDisplay(group.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Training Room A"
                  />
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Learning Objectives
              </h4>
              <textarea
                value={formData.objectives}
                onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="What will learners achieve by the end of this session?"
              />
            </div>

            {/* Activities */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Activities & Exercises
              </h4>
              <textarea
                value={formData.activities}
                onChange={(e) => setFormData({...formData, activities: e.target.value})}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe the activities, exercises, and teaching methods..."
              />
            </div>

            {/* Materials */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                Materials & Resources
              </h4>
              <textarea
                value={formData.materials}
                onChange={(e) => setFormData({...formData, materials: e.target.value})}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="List materials, handouts, equipment needed..."
              />
            </div>

            {/* Assessment */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Assessment Methods
              </h4>
              <textarea
                value={formData.assessment}
                onChange={(e) => setFormData({...formData, assessment: e.target.value})}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="How will you assess learner understanding?"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Creating...' : 'Create Lesson Plan'}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </>
  );
}