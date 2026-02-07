'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Users, Building2, BookOpen, X, Clock } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useDashboard';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'students' | 'groups' | 'courses'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);
  const { results, isLoading } = useGlobalSearch(debouncedQuery, activeFilter);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Handle Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const addToRecentSearches = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleResultClick = (result: any) => {
    addToRecentSearches(query);
    setIsOpen(false);
    setQuery('');

    switch (result.type) {
      case 'student':
        router.push('/students');
        break;
      case 'group':
        router.push('/groups');
        break;
      case 'course':
        router.push('/curriculum');
        break;
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'group':
        return <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'course':
        return <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      default:
        return <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      student: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      group: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
      course: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    };
    return badges[type as keyof typeof badges] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-600 dark:text-slate-300 text-sm"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40" />

          {/* Modal */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 max-h-[70vh] flex flex-col">
            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students, groups, courses..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mt-3">
                {(['all', 'students', 'groups', 'courses'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === filter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : query && results.length > 0 ? (
                <div className="p-2">
                  {results.map((result: any) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {result.name}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query && !isLoading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No results found for "{query}"</p>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Recent Searches</h4>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left text-sm text-slate-600 dark:text-slate-400"
                      >
                        <Clock className="w-4 h-4" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start typing to search...</p>
                </div>
              )}
            </div>

            {/* Footer Hint */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
              Press <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono">ESC</kbd> to close
            </div>
          </div>
        </>
      )}
    </div>
  );
}
