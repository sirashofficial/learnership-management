"use client";

import Header from "@/components/Header";
import { BookOpen, Upload, Brain, FileText, Download, Plus, Loader2, CheckCircle, AlertCircle, X, Eye } from "lucide-react";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import jsPDF from 'jspdf';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Module {
  id: string;
  name: string;
  title: string;
  order: number;
  status: string;
  unitStandards?: any[];
  documents?: any[];
}

export default function CurriculumPage() {
  // Fetch real curriculum data from API
  const { data: curriculumData, isLoading: isLoadingCurriculum } = useSWR<{ data: Module[] }>('/api/curriculum', fetcher);
  const modules = curriculumData?.data || [];

  const [activeTab, setActiveTab] = useState('library');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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

  const handleDownloadPDF = (module: Module) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFillColor(37, 99, 235); // Blue background
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`NVC Level 2 - Module ${module.order}`, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(module.name, pageWidth / 2, 23, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Module Details
    let y = 45;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Module Details', 20, y);

    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Module Code: ${module.title || 'N/A'}`, 20, y);

    y += 7;
    doc.text(`Status: ${module.status === 'ACTIVE' ? 'Active' : module.status === 'COMPLETED' ? 'Completed' : 'Not Started'}`, 20, y);

    y += 7;
    doc.text(`Order: Module ${module.order}`, 20, y);

    // Unit Standards Section
    if (module.unitStandards && module.unitStandards.length > 0) {
      y += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Unit Standards', 20, y);

      y += 2;
      doc.setLineWidth(0.5);
      doc.line(20, y, pageWidth - 20, y);
      y += 8;

      module.unitStandards.forEach((us: any, idx: number) => {
        // Check if we need a new page
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${us.code || `US${idx + 1}`}`, 20, y);

        doc.setFont('helvetica', 'normal');
        const titleLines = doc.splitTextToSize(us.title || 'Untitled Unit Standard', pageWidth - 50);
        doc.text(titleLines, 20, y + 5);

        const titleHeight = titleLines.length * 5;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Credits: ${us.credits || 'N/A'}`, 20, y + 5 + titleHeight + 2);
        doc.setTextColor(0, 0, 0);

        // Draw separator
        y += titleHeight + 10;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(20, y, pageWidth - 20, y);
        y += 5;
      });
    } else {
      y += 10;
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.text('No unit standards available for this module.', 20, y);
      doc.setTextColor(0, 0, 0);
    }

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }

    // Download
    const filename = `${module.name.toLowerCase().replace(/\s+/g, '-')}-curriculum.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <Header />

      <div className="p-6">
        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('library')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'library'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <BookOpen className="h-4 w-4" />
              Curriculum Library
            </button>
            <button
              onClick={() => setActiveTab('ai-upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'ai-upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
              {isLoadingCurriculum ? (
                <div className="col-span-3 flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-600">Loading curriculum...</span>
                </div>
              ) : modules.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">No curriculum modules found.</p>
                  <p className="text-sm text-slate-500 mt-1">Upload curriculum documents to get started.</p>
                </div>
              ) : (
                modules.map((module) => (
                  <div key={module.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${module.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          module.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                          {module.status === "COMPLETED" ? "Completed" :
                            module.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                        </span>
                        {module.documents && module.documents.length > 0 && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {module.documents.length} docs
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{module.name}</h3>
                    <p className="text-sm text-slate-600 mb-2">{module.title || `Module ${module.order}`}</p>
                    <p className="text-sm text-slate-500 mb-4">
                      {module.unitStandards?.length || 0} unit standards
                    </p>

                    {/* Unit Standards List (expandable) */}
                    {module.unitStandards && module.unitStandards.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {expandedModule === module.id ? 'Hide' : 'View'} Unit Standards
                        </button>
                        {expandedModule === module.id && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {module.unitStandards.map((us: any, idx: number) => (
                              <div key={us.id || idx} className="text-xs bg-slate-50 rounded p-2">
                                <span className="font-medium text-slate-700">{us.code || `US${idx + 1}`}</span>
                                <span className="text-slate-500 ml-2">{us.title}</span>
                                {us.credits && <span className="text-blue-600 ml-2">({us.credits} credits)</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPDF(module)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
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

            <div className="bg-white rounded-xl border-2 border-slate-300 shadow-lg">
              {/* Upload Area */}
              <div className="p-8">
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploadedFiles.length > 0
                    ? 'border-green-400 bg-green-50'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadedFiles.length === 0 ? (
                      <>
                        <Upload className="w-16 h-16 mb-4 text-slate-400" />
                        <p className="mb-2 text-lg font-semibold text-slate-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-slate-500">
                          PDF, DOCX, or XLSX files (Max 50MB each)
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-16 h-16 mb-4 text-green-600" />
                        <p className="mb-2 text-lg font-semibold text-green-700">
                          {uploadedFiles.length} file(s) selected
                        </p>
                        <p className="text-sm text-slate-600">
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
                    <h4 className="font-semibold text-slate-900 mb-3">Selected Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-slate-900">{file.name}</p>
                            <p className="text-sm text-slate-500">
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
                      <span className="text-sm font-medium text-slate-700">
                        Processing with AI...
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing curriculum structure and extracting modules...
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => {
                    setUploadedFiles([]);
                    setActiveTab('library');
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processWithAI}
                  disabled={uploadedFiles.length === 0 || isUploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
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
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Module Extraction</h4>
                <p className="text-sm text-slate-600">Automatically identify and structure curriculum modules</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Assessment Creation</h4>
                <p className="text-sm text-slate-600">Generate formative and summative assessments</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Learning Outcomes</h4>
                <p className="text-sm text-slate-600">Extract and organize learning objectives</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
