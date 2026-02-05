"use client";

import Header from "@/components/Header";
import { BookOpen, Upload, Brain, FileText, Download, Plus, Loader2 } from "lucide-react";
import { useState } from "react";

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  const processWithAI = async () => {
    setIsUploading(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsUploading(false);
      alert('Files processed successfully with AI!');
      setUploadedFiles([]);
    }, 3000);
  };

  return (
    <>
      <Header title="Curriculum Library" subtitle="Access training materials and AI-powered curriculum management" />
      
      <div className="p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('library')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'library'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Curriculum Library
            </button>
            <button
              onClick={() => setActiveTab('ai-upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'ai-upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Brain className="h-4 w-4" />
              AI Curriculum Upload
            </button>
          </nav>
        </div>

        {/* Curriculum Library Tab Content */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Available Curricula</h2>
              <button 
                onClick={() => setActiveTab('ai-upload')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload New Curriculum
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { module: "Module 1", title: "Introduction to NVC Level 2", units: 4, status: "Available", aiProcessed: true },
                { module: "Module 2", title: "Communication Skills", units: 5, status: "Available", aiProcessed: true },
                { module: "Module 3", title: "Market Requirements", units: 6, status: "Available", aiProcessed: false },
                { module: "Module 4", title: "Business Operations", units: 5, status: "Available", aiProcessed: true },
                { module: "Module 5", title: "Financial Requirements", units: 4, status: "Available", aiProcessed: false },
                { module: "Module 6", title: "Final Project", units: 3, status: "Coming Soon", aiProcessed: false },
              ].map((module, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        module.status === "Available" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {module.status}
                      </span>
                      {module.aiProcessed && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          AI Ready
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{module.module}</h3>
                  <p className="text-sm text-gray-600 mb-4">{module.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{module.units} units</span>
                    {module.status === "Available" && (
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        {!module.aiProcessed && (
                          <button className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            Process with AI
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Upload Tab Content */}
        {activeTab === 'ai-upload' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Curriculum Upload & Analysis
              </h3>
              <p className="text-blue-700 text-sm">
                Upload curriculum documents (PDFs, Word docs) and let AI analyze them to create structured courses with modules, assessments, and timelines.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Document Upload</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Upload your curriculum documents for AI analysis. Supported formats: PDF, DOC, DOCX, TXT
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop files here, or 
                      </p>
                      <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        Browse Files
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      Maximum file size: 50MB per file
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h5 className="font-medium text-sm">Uploaded Files:</h5>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">({Math.round(file.size / 1024)} KB)</span>
                        </div>
                        <button
                          onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={processWithAI}
                      disabled={isUploading}
                      className="w-full mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing with AI...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Process with AI
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
