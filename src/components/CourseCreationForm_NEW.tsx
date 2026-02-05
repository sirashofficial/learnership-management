'use client';

import React, { useState } from 'react';
import { Loader2, Brain, CheckCircle } from 'lucide-react';

interface AIAnalysisResult {
  estimatedDuration: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  recommendedAssessments: string[];
  workplaceActivities: string[];
  keyTopics: string[];
  prerequisiteKnowledge: string[];
}

interface CourseModule {
  name: string;
  plannedDuration: number;
  workplaceActivities: string[];
  summativeAssessment: string;
}

export default function CourseCreationForm() {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentModule, setCurrentModule] = useState({
    name: '',
    content: '',
    plannedDuration: 0,
    workplaceActivities: [''],
    summativeAssessment: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const analyzeModuleContent = async () => {
    if (!currentModule.content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis = {
        estimatedDuration: Math.ceil(currentModule.content.split(' ').length / 200),
        difficultyLevel: 'intermediate' as const,
        recommendedAssessments: ['Portfolio Assessment', 'Practical Demonstration'],
        workplaceActivities: [
          'Apply concepts in current role',
          'Document learning process',
          'Present findings to supervisor'
        ],
        keyTopics: ['communication', 'teamwork', 'problem-solving'],
        prerequisiteKnowledge: ['Basic computer skills']
      };
      
      setAnalysisResult(mockAnalysis);
      
      setCurrentModule(prev => ({
        ...prev,
        plannedDuration: mockAnalysis.estimatedDuration,
        workplaceActivities: mockAnalysis.workplaceActivities.slice(0, 3),
        summativeAssessment: mockAnalysis.recommendedAssessments[0] || ''
      }));
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addModule = () => {
    if (currentModule.name && currentModule.plannedDuration > 0) {
      setModules(prev => [...prev, {
        name: currentModule.name,
        plannedDuration: currentModule.plannedDuration,
        workplaceActivities: currentModule.workplaceActivities.filter(a => a.trim()),
        summativeAssessment: currentModule.summativeAssessment
      }]);
      
      setCurrentModule({
        name: '',
        content: '',
        plannedDuration: 0,
        workplaceActivities: [''],
        summativeAssessment: ''
      });
      setAnalysisResult(null);
    }
  };

  const removeModule = (index: number) => {
    setModules(prev => prev.filter((_, i) => i !== index));
  };

  const submitCourse = async () => {
    if (!courseName || modules.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCourseName('');
      setCourseCode('');
      setCourseDescription('');
      setModules([]);
      setCurrentModule({
        name: '',
        content: '',
        plannedDuration: 0,
        workplaceActivities: [''],
        summativeAssessment: ''
      });
      alert('Course created successfully!');
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Course Basic Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Course Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Name *</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., NVC Level 2 Business Administration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Course Code</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., NVC-BA-L2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Course description"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* AI-Assisted Curriculum Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          AI Curriculum Analysis & Course Generation
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Upload curriculum PDFs, learning materials, or assessment documents. Our AI will analyze and create structured courses automatically.
        </p>
        
        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              className="hidden"
              id="curriculum-upload"
              onChange={(e) => {
                if (e.target.files) {
                  // Handle file upload
                  console.log('Files uploaded:', Array.from(e.target.files).map(f => f.name));
                  alert('Files uploaded! AI analysis will begin shortly.');
                }
              }}
            />
            <label htmlFor="curriculum-upload" className="cursor-pointer">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Curriculum Documents</h4>
              <p className="text-gray-600 mb-4">
                Drop PDF files here or click to browse
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">PDF</span>
                <span className="bg-gray-100 px-2 py-1 rounded">DOC</span>
                <span className="bg-gray-100 px-2 py-1 rounded">DOCX</span>
                <span className="bg-gray-100 px-2 py-1 rounded">TXT</span>
              </div>
            </label>
          </div>

          {/* AI Processing Status */}
          {isAnalyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <h4 className="font-medium text-blue-900">AI Analysis in Progress</h4>
                  <p className="text-blue-700 text-sm">
                    Processing curriculum documents and extracting learning objectives, assessments, and module structure...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Curriculum Analysis Results */}
          {analysisResult && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Curriculum Analysis Complete
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <strong>Modules Detected:</strong>
                  <p className="text-gray-600 mt-1">{analysisResult.keyTopics.length} learning modules</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <strong>Total Duration:</strong>
                  <p className="text-gray-600 mt-1">{analysisResult.estimatedDuration} hours</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <strong>Difficulty Level:</strong>
                  <p className="text-gray-600 mt-1 capitalize">{analysisResult.difficultyLevel}</p>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <strong>Key Learning Areas:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysisResult.keyTopics.map((topic, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <strong>Recommended Assessments:</strong>
                <ul className="mt-2 space-y-1">
                  {analysisResult.recommendedAssessments.map((assessment, i) => (
                    <li key={i} className="text-sm text-gray-600">• {assessment}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-3 rounded border">
                <strong>Workplace Activities:</strong>
                <ul className="mt-2 space-y-1">
                  {analysisResult.workplaceActivities.map((activity, i) => (
                    <li key={i} className="text-sm text-gray-600">• {activity}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  // Auto-populate course form with AI results
                  setCourseName(`AI Generated: ${analysisResult.keyTopics[0]} Course`);
                  setCourseDescription(`Comprehensive course covering ${analysisResult.keyTopics.join(', ')}`);
                  setCurrentModule(prev => ({
                    ...prev,
                    name: analysisResult.keyTopics[0],
                    plannedDuration: Math.ceil(analysisResult.estimatedDuration / analysisResult.keyTopics.length),
                    summativeAssessment: analysisResult.recommendedAssessments[0],
                    workplaceActivities: analysisResult.workplaceActivities.slice(0, 3)
                  }));
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Generate Course from AI Analysis
              </button>
            </div>
          )}

          {/* Manual Entry Fallback */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Or create manually:</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Module Name</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentModule.name}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Module name"
              />
            </div>
          </div>

          {/* Existing manual fields for duration, assessment etc. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (hours)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentModule.plannedDuration}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, plannedDuration: Number(e.target.value) }))}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assessment</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentModule.summativeAssessment}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, summativeAssessment: e.target.value }))}
                placeholder="Assessment type"
              />
            </div>
          </div>

          <button 
            onClick={addModule} 
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Module
          </button>
        </div>
      </div>

      {/* Modules List */}
      {modules.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Modules ({modules.length})</h3>
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{module.name}</h4>
                  <p className="text-sm text-gray-600">
                    {module.plannedDuration} hours • {module.summativeAssessment}
                  </p>
                </div>
                <button
                  onClick={() => removeModule(index)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={submitCourse}
          disabled={isSubmitting || !courseName || modules.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Course
        </button>
      </div>
    </div>
  );
}