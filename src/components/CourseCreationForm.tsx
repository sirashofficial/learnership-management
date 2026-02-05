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
      // Simulate AI analysis for now
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
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Course Information</h3>
          <p className="text-gray-600 text-sm">
            Create a new course with AI-assisted module analysis. Course names can be freely entered (duplicates allowed for different contexts).
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Name *</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., NVC Level 2 Business Administration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Course Code (Optional)</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., NVC-BA-L2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Description (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Brief description of the course objectives and outcomes"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* AI-Assisted Module Creation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI-Assisted Module Creation
          </h3>
          <p className="text-gray-600 text-sm">
            Paste your module content and let AI analyze it to suggest duration, activities, and assessments.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Module Name</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={currentModule.name}
              onChange={(e) => setCurrentModule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Introduction to Business Communication"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Module Content (for AI Analysis)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={currentModule.content}
              onChange={(e) => setCurrentModule(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Paste your module content, learning objectives, or curriculum here..."
              rows={6}
            />
            <button
              onClick={analyzeModuleContent}
              disabled={isAnalyzing || !currentModule.content.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
              <Brain className="h-4 w-4" />
              Analyze with AI
            </button>
          </div>

          {analysisResult && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI Analysis Results
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Estimated Duration:</strong> {analysisResult.estimatedDuration} hours
                </div>
                <div>
                  <strong>Difficulty Level:</strong> 
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                    {analysisResult.difficultyLevel}
                  </span>
                </div>
              </div>
              
              <div>
                <strong>Key Topics:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.keyTopics.slice(0, 5).map((topic, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Planned Duration (hours)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={currentModule.plannedDuration}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, plannedDuration: Number(e.target.value) }))}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Summative Assessment</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={currentModule.summativeAssessment}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, summativeAssessment: e.target.value }))}
                placeholder="e.g., Portfolio Assessment"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Workplace Activities</label>
            {currentModule.workplaceActivities.map((activity, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={activity}
                  onChange={(e) => {
                    const newActivities = [...currentModule.workplaceActivities];
                    newActivities[index] = e.target.value;
                    setCurrentModule(prev => ({ ...prev, workplaceActivities: newActivities }));
                  }}
                  placeholder={`Workplace activity ${index + 1}`}
                />
                {currentModule.workplaceActivities.length > 1 && (
                  <button
                    onClick={() => {
                      const newActivities = currentModule.workplaceActivities.filter((_, i) => i !== index);
                      setCurrentModule(prev => ({ ...prev, workplaceActivities: newActivities }));
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setCurrentModule(prev => ({
                ...prev,
                workplaceActivities: [...prev.workplaceActivities, '']
              }))}
              className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Add Activity
            </button>
          </div>

          <button 
            onClick={addModule} 
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Add Module to Course
          </button>
        </div>
      </div>

      {/* Course Modules List */}
      {modules.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Course Modules ({modules.length})</h3>
            <p className="text-gray-600 text-sm">
              Total Duration: {modules.reduce((sum, m) => sum + m.plannedDuration, 0)} hours
            </p>
          </div>
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{module.name}</h4>
                  <p className="text-sm text-gray-600">
                    {module.plannedDuration} hours • {module.summativeAssessment}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    Activities: {module.workplaceActivities.join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => removeModule(index)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Course */}
      <div className="flex justify-end">
        <button
          onClick={submitCourse}
          disabled={isSubmitting || !courseName || modules.length === 0}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-400 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Course
        </button>

              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Course Code (Optional)</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., NVC-BA-L2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Description (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Brief description of the course objectives and outcomes"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* AI-Assisted Module Creation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI-Assisted Module Creation
          </h3>
          <p className="text-gray-600 text-sm">
            Paste your module content and let AI analyze it to suggest duration, activities, and assessments.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Module Name</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={currentModule.name}
              onChange={(e) => setCurrentModule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Introduction to Business Communication"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Module Content (for AI Analysis)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={currentModule.content}
              onChange={(e) => setCurrentModule(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Paste your module content, learning objectives, or curriculum here..."
              rows={6}
            />
            <button
              onClick={analyzeModuleContent}
              disabled={isAnalyzing || !currentModule.content.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
              <Brain className="h-4 w-4" />
              Analyze with AI
            </button>
          </div>

          {analysisResult && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI Analysis Results
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Estimated Duration:</strong> {analysisResult.estimatedDuration} hours
                </div>
                <div>
                  <strong>Difficulty Level:</strong> 
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                    {analysisResult.difficultyLevel}
                  </span>
                </div>
              </div>
              
              <div>
                <strong>Key Topics:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.keyTopics.slice(0, 5).map((topic, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Planned Duration (hours)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={currentModule.plannedDuration}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, plannedDuration: Number(e.target.value) }))}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Summative Assessment</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={currentModule.summativeAssessment}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, summativeAssessment: e.target.value }))}
                placeholder="e.g., Portfolio Assessment"
              />
            </div>
          </div>

          <button 
            onClick={addModule} 
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Add Module to Course
          </button>
        </div>
      </div>

      {/* Course Modules List */}
      {modules.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Course Modules ({modules.length})</h3>
            <p className="text-gray-600 text-sm">
              Total Duration: {modules.reduce((sum, m) => sum + m.plannedDuration, 0)} hours
            </p>
          </div>
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{module.name}</h4>
                  <p className="text-sm text-gray-600">
                    {module.plannedDuration} hours • {module.summativeAssessment}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    Activities: {module.workplaceActivities.join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => removeModule(index)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Course */}
      <div className="flex justify-end">
        <button
          onClick={submitCourse}
          disabled={isSubmitting || !courseName || modules.length === 0}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-400 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Course
        </button>
      </div>
    </div>
  );
}

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
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: courseName,
          code: courseCode || undefined,
          description: courseDescription || undefined,
          modules,
          totalDuration: modules.reduce((sum, m) => sum + m.plannedDuration, 0)
        })
      });

      if (response.ok) {
        // Reset form
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
      }
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
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>
            Create a new course with AI-assisted module analysis. Course names can be freely entered (duplicates allowed for different contexts).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courseName">Course Name *</Label>
              <Input
                id="courseName"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., NVC Level 2 Business Administration"
              />
            </div>
            <div>
              <Label htmlFor="courseCode">Course Code (Optional)</Label>
              <Input
                id="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., NVC-BA-L2"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="courseDescription">Course Description (Optional)</Label>
            <Textarea
              id="courseDescription"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Brief description of the course objectives and outcomes"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI-Assisted Module Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI-Assisted Module Creation
          </CardTitle>
          <CardDescription>
            Paste your module content and let AI analyze it to suggest duration, activities, and assessments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="moduleName">Module Name</Label>
            <Input
              id="moduleName"
              value={currentModule.name}
              onChange={(e) => setCurrentModule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Introduction to Business Communication"
            />
          </div>
          
          <div>
            <Label htmlFor="moduleContent">Module Content (for AI Analysis)</Label>
            <Textarea
              id="moduleContent"
              value={currentModule.content}
              onChange={(e) => setCurrentModule(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Paste your module content, learning objectives, or curriculum here..."
              rows={6}
            />
            <Button
              onClick={analyzeModuleContent}
              disabled={isAnalyzing || !currentModule.content.trim()}
              className="mt-2"
              variant="outline"
            >
              {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Brain className="mr-2 h-4 w-4" />
              Analyze with AI
            </Button>
          </div>

          {analysisResult && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI Analysis Results
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Estimated Duration:</strong> {analysisResult.estimatedDuration} hours
                </div>
                <div>
                  <strong>Difficulty Level:</strong> 
                  <Badge variant="outline" className="ml-2">
                    {analysisResult.difficultyLevel}
                  </Badge>
                </div>
              </div>
              
              <div>
                <strong>Key Topics:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.keyTopics.slice(0, 5).map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plannedDuration">Planned Duration (hours)</Label>
              <Input
                id="plannedDuration"
                type="number"
                value={currentModule.plannedDuration}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, plannedDuration: Number(e.target.value) }))}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <Label htmlFor="summativeAssessment">Summative Assessment</Label>
              <Input
                id="summativeAssessment"
                value={currentModule.summativeAssessment}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, summativeAssessment: e.target.value }))}
                placeholder="e.g., Portfolio Assessment"
              />
            </div>
          </div>

          <div>
            <Label>Workplace Activities</Label>
            {currentModule.workplaceActivities.map((activity, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={activity}
                  onChange={(e) => {
                    const newActivities = [...currentModule.workplaceActivities];
                    newActivities[index] = e.target.value;
                    setCurrentModule(prev => ({ ...prev, workplaceActivities: newActivities }));
                  }}
                  placeholder={`Workplace activity ${index + 1}`}
                />
                {currentModule.workplaceActivities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newActivities = currentModule.workplaceActivities.filter((_, i) => i !== index);
                      setCurrentModule(prev => ({ ...prev, workplaceActivities: newActivities }));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setCurrentModule(prev => ({
                ...prev,
                workplaceActivities: [...prev.workplaceActivities, '']
              }))}
            >
              Add Activity
            </Button>
          </div>

          <Button onClick={addModule} className="w-full">
            Add Module to Course
          </Button>
        </CardContent>
      </Card>

      {/* Course Modules List */}
      {modules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Modules ({modules.length})</CardTitle>
            <CardDescription>
              Total Duration: {modules.reduce((sum, m) => sum + m.plannedDuration, 0)} hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modules.map((module, index) => (
                <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{module.name}</h4>
                    <p className="text-sm text-gray-600">
                      {module.plannedDuration} hours • {module.summativeAssessment}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      Activities: {module.workplaceActivities.join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeModule(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Course */}
      <div className="flex justify-end">
        <Button
          onClick={submitCourse}
          disabled={isSubmitting || !courseName || modules.length === 0}
          size="lg"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Course
        </Button>
      </div>
    </div>
  );
}