'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, Upload, Trash2, RefreshCw, AlertCircle, 
  CheckCircle, Clock, XCircle, Search, Filter 
} from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  category: string;
  size?: number;
  status: 'indexed' | 'processing' | 'failed' | 'pending';
  chunks: number;
  createdAt: string;
  error?: string;
}

interface StagedFile {
  file: File;
  id: string;
  category: string;
}

export default function DocumentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [indexStats, setIndexStats] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('unit-standards');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = [
    { value: 'unit-standards', label: 'Unit Standards' },
    { value: 'learning-guide', label: 'Learning Guide / Facilitator Guide' },
    { value: 'assessment-tools', label: 'Assessment Tools' },
    { value: 'learner-workbook', label: 'Learner Workbook' },
    { value: 'policy-documents', label: 'Policy Documents' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadDocuments();
      loadIndexStats();
    }
  }, [user, isLoading, router]);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/index-documents/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIndexStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/index-documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIndexStats(data);
      }
    } catch (error) {
      console.error('Failed to load index stats:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newStaged = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      category: selectedCategory,
    }));
    setStagedFiles([...stagedFiles, ...newStaged]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newStaged = files
      .filter((file) => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['pdf', 'doc', 'docx', 'txt'].includes(ext || '');
      })
      .map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        category: selectedCategory,
      }));
    setStagedFiles([...stagedFiles, ...newStaged]);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(stagedFiles.filter((f) => f.id !== id));
  };

  const uploadAllFiles = async () => {
    if (stagedFiles.length === 0) return;

    setUploading(true);
    const token = localStorage.getItem('token');

    for (const staged of stagedFiles) {
      try {
        setUploadProgress((prev) => ({ ...prev, [staged.id]: 0 }));

        const formData = new FormData();
        formData.append('files', staged.file);
        formData.append('category', staged.category);

        const response = await fetch('/api/ai/index-documents/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          setUploadProgress((prev) => ({ ...prev, [staged.id]: 100 }));
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error(`Failed to upload ${staged.file.name}:`, error);
        setUploadProgress((prev) => ({ ...prev, [staged.id]: -1 }));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setStagedFiles([]);
    setUploadProgress({});
    setUploading(false);
    loadDocuments();
    loadIndexStats();
  };

  const deleteDocument = async (docId: string, filename: string) => {
    if (!confirm(`Remove "${filename}" from the knowledge base? Lessons generated after this point won't use its content.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/index-documents/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: docId }),
      });

      if (response.ok) {
        setDocuments(documents.filter((d) => d.id !== docId));
        loadIndexStats();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const retryIndexing = async (docId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/ai/index-documents/retry', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: docId }),
      });

      loadDocuments();
    } catch (error) {
      console.error('Failed to retry indexing:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading || loading) {
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
          <h1 className="text-3xl font-bold text-slate-900">Document Management</h1>
          <p className="text-slate-600 mt-1">Upload and manage curriculum documents for AI-powered lesson generation</p>
        </div>
      </div>

      {/* Index Stats */}
      {indexStats && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Knowledge Base Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-slate-500">Total Documents</p>
              <p className="text-2xl font-semibold text-slate-900">
                {indexStats.local?.documentChunks || 0}
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-slate-500">Indexed Records</p>
              <p className="text-2xl font-semibold text-slate-900">
                {indexStats.pinecone?.totalRecords || 0}
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-sm text-slate-500">Status</p>
              <p className="text-2xl font-semibold text-slate-900 capitalize">
                {indexStats.status || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Documents</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Document Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors"
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-lg text-slate-700 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Supported formats: PDF, Word (.doc, .docx), Text (.txt) • Max 50MB per file
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </label>
        </div>

        {/* Staged Files */}
        {stagedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Files Ready to Upload ({stagedFiles.length})
            </h3>
            <div className="space-y-2">
              {stagedFiles.map((staged) => (
                <div
                  key={staged.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {staged.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(staged.file.size)} • {staged.category}
                      </p>
                    </div>
                  </div>
                  {uploadProgress[staged.id] !== undefined ? (
                    <div className="w-32">
                      {uploadProgress[staged.id] === 100 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : uploadProgress[staged.id] === -1 ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress[staged.id]}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => removeStagedFile(staged.id)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={uploadAllFiles}
              disabled={uploading}
              className="mt-4 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading & Indexing...
                </span>
              ) : (
                `Upload & Index All (${stagedFiles.length})`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Document Library */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Document Library</h2>
          <button
            onClick={loadDocuments}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents Table */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">
              {documents.length === 0
                ? 'No documents uploaded yet. Upload some to get started!'
                : 'No documents match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Document Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Size
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Indexed Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {categories.find((c) => c.value === doc.category)?.label || doc.category}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(doc.status)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        {doc.status === 'failed' && (
                          <button
                            onClick={() => retryIndexing(doc.id)}
                            className="p-1 hover:bg-slate-200 rounded"
                            title="Retry indexing"
                          >
                            <RefreshCw className="w-4 h-4 text-yellow-600" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDocument(doc.id, doc.filename)}
                          className="p-1 hover:bg-slate-200 rounded"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
