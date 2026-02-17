'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Search, BookOpen, AlertCircle, BarChart3, Eye, ArrowRight } from 'lucide-react';
import useSWR from 'swr';

interface SearchResult {
  id: string;
  filename: string;
  category: string;
  moduleNumber?: number;
  moduleName?: string;
  preview: string;
  score: number;
}

export default function CurriculumSearchPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: indexData, error: indexError } = useSWR(
    '/api/ai/index-documents/list',
    (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json())
  );

  const indexedCount =
    indexData?.count ??
    indexData?.data?.count ??
    indexData?.documents?.length ??
    indexData?.data?.documents?.length ??
    0;
  const showIndexWarning = Boolean(indexError) || indexedCount === 0;

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'unit-standards', label: 'Unit Standards' },
    { value: 'learning-guide', label: 'Learning Guides' },
    { value: 'assessment-tools', label: 'Assessment Tools' },
    { value: 'learner-workbook', label: 'Learner Workbooks' },
    { value: 'policy-documents', label: 'Policy Documents' },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const response = await fetch(
        `/api/ai/semantic-search?q=${encodeURIComponent(searchTerm)}&limit=10${categoryParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const formatRelevance = (score: number) => {
    const percentage = Math.round(score * 100);
    return percentage;
  };

  const getRelevanceColor = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'bg-green-200';
    if (percentage >= 60) return 'bg-yellow-200';
    return 'bg-orange-200';
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
          <h1 className="text-3xl font-bold text-slate-900">Curriculum Search</h1>
          <p className="text-slate-600 mt-1">Search through your indexed curriculum documents to find relevant content</p>
        </div>
      </div>

      {showIndexWarning ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 text-yellow-600" />
          <p className="text-sm">
            No curriculum documents are indexed yet. Search results may be empty. Ask your administrator to index documents first.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 text-green-900 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>{indexedCount} curriculum documents indexed</span>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Query
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for unit standards, learning outcomes, assessment criteria, activities..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              💡 Tip: Include specific terms like "assessment", "health & safety", "learning outcomes" for better results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searching || !searchTerm.trim()}
                className="w-full px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length === 0 && searchTerm ? (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No results found for "{searchTerm}"</p>
            <p className="text-slate-500 text-sm mt-2">Try different search terms or adjust category filters</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-medium text-slate-700">
                Found {results.length} relevant sections
              </p>
            </div>
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {result.filename}
                        </h3>
                        {result.moduleName && (
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {result.moduleName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Category: {result.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getRelevanceColor(result.score)}`}
                            style={{ width: `${formatRelevance(result.score)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 w-10 text-right">
                          {formatRelevance(result.score)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Relevance</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded p-3 mb-4 border border-slate-200">
                    <p className="text-sm text-slate-700 line-clamp-3">
                      {result.preview}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/lessons?search=${encodeURIComponent(result.filename)}&docId=${result.id}`)
                      }
                      className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Use in Lesson
                    </button>
                    <button
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
            <Search className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <p className="text-blue-900 text-lg font-medium">Start Searching</p>
            <p className="text-blue-700 text-sm mt-2">
              Enter a search term above to find relevant curriculum content from your indexed documents
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
