'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Users, Building2, BookOpen, X, Clock } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useDashboard';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

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
        className="group relative flex items-center gap-3 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-300 text-slate-500 hover:text-slate-950 text-[13px] font-bold"
      >
        <Search className="w-4 h-4 text-emerald-600 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline tracking-tight">Direct Access...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black font-mono shadow-sm group-hover:border-emerald-200 transition-colors">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal - Immersive Interface */}
      {isOpen && (
        <>
          {/* Immersive Backdrop */}
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[60] animate-in fade-in duration-500" />

          {/* Luxury Modal Container */}
          <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-premium z-[70] max-h-[75vh] flex flex-col border border-white/50 overflow-hidden animate-in slide-in-from-top-8 zoom-in-95 duration-500 ease-out origin-top">
            {/* Contextual Header Interface */}
            <div className="p-8 border-b border-slate-100/50 relative noise-texture">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Query student records, cohorts, or curriculum architecture..."
                  className="w-full pl-10 pr-4 py-4 bg-transparent text-xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none font-main tracking-tighter"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400 hover:text-slate-900" />
                  </button>
                )}
              </div>

              {/* Refined Filter Ecosystem */}
              <div className="flex gap-3 mt-6">
                {(['all', 'students', 'groups', 'courses'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border",
                      activeFilter === filter
                        ? 'bg-slate-950 text-white border-slate-950 shadow-lg'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200 hover:text-emerald-600'
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensional Results Section */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <div className="animate-spin rounded-xl h-6 w-6 border-b-2 border-emerald-500"></div>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Parsing Intelligence Grid...</p>
                </div>
              ) : query && results.length > 0 ? (
                <div className="p-4 space-y-1">
                  <div className="px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Synthesized matches</div>
                  {results.map((result: any) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-6 p-5 rounded-[1.5rem] hover:bg-slate-50 transition-all duration-300 text-left group border border-transparent hover:border-white hover:shadow-sm"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:border-emerald-100 group-hover:shadow-emerald-500/10">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-lg font-black text-slate-950 group-hover:text-emerald-700 transition-colors truncate font-display tracking-tight">
                            {result.name}
                          </p>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            getTypeBadge(result.type).split(' ').pop() // Simple extraction of color classes
                          )}>
                            {result.type}
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-[13px] text-slate-400 font-medium truncate tracking-tight">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query && !isLoading ? (
                <div className="text-center py-24 text-slate-500">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-xl font-black font-display tracking-tight">No indexed records for <span className="text-emerald-500 italic">"{query}"</span></p>
                  <p className="text-sm font-medium text-slate-400 mt-2">Adjust your query or change the filter context.</p>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent Contexts</h4>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      Purge History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-100 transition-all duration-300 text-sm font-bold text-slate-600 group"
                      >
                        <Clock className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-24">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                      <Search className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-xl">
                      ⌘K
                    </div>
                  </div>
                  <h4 className="text-2xl font-black font-display tracking-tighter">Unified Knowledge Search</h4>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 font-medium">Initiate query to parse the academic record system.</p>
                </div>
              )}
            </div>

            {/* Strategic Footer Hint */}
            <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-900 shadow-sm">⏎</kbd>
                  Select result
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-900 shadow-sm">↑↓</kbd>
                  Navigate
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-900 shadow-sm">ESC</kbd>
                Collapse
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
