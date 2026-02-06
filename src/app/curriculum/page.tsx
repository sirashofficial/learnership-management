"use client";

import Header from "@/components/Header";
import { BookOpen, Upload, Brain, FileText, Download, Plus, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { mutate } from "swr";

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  const processWithAI = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload files first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progressive upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append('files', file));

      const response = await fetch('/api/curriculum/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      await mutate('/api/curriculum');
      alert(`✅ Successfully uploaded and processed ${uploadedFiles.length} file(s)!`);
      setUploadedFiles([]);
      setActiveTab('library');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to process files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Header />
      
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
                        <button 
                          onClick={() => alert(`Download ${module.module}\n\nThis will download the curriculum materials for ${module.title}. Feature coming soon!`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        {!module.aiProcessed && (
                          <button 
                            onClick={() => alert(`AI Process ${module.module}\n\nThis will analyze the curriculum using AI to create structured assessments. Feature coming soon!`)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                          >
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
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 mb-2 text-lg">
                    AI-Powered Curriculum Processing
                  </h3>
                  <p className="text-purple-700 text-sm">
                    Upload curriculum documents and our AI will analyze them to extract modules, unit standards, and create structured assessments automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg">
              {/* Upload Area */}
              <div className="p-8">
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    uploadedFiles.length > 0
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadedFiles.length === 0 ? (
                      <>
                        <Upload className="w-16 h-16 mb-4 text-gray-400" />
                        <p className="mb-2 text-lg font-semibold text-gray-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, DOCX, or XLSX files (Max 50MB each)
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-16 h-16 mb-4 text-green-600" />
                        <p className="mb-2 text-lg font-semibold text-green-700">
                          {uploadedFiles.length} file(s) selected
                        </p>
                        <p className="text-sm text-gray-600">
                          Ready to process with AI
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xlsx"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* File List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-gray-900 mb-3">Selected Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Processing with AI...
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing curriculum structure and extracting modules...
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setUploadedFiles([]);
                    setActiveTab('library');
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processWithAI}
                  disabled={uploadedFiles.length === 0 || isUploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Process with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Features Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Module Extraction</h4>
                <p className="text-sm text-gray-600">Automatically identify and structure curriculum modules</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Assessment Creation</h4>
                <p className="text-sm text-gray-600">Generate formative and summative assessments</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Learning Outcomes</h4>
                <p className="text-sm text-gray-600">Extract and organize learning objectives</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
