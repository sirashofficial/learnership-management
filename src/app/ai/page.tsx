'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageCircle,
  Search,
  FileText,
  BookOpen,
  Lightbulb,
  Send,
  Loader2,
  ChevronRight,
  Brain,
  Target,
  GraduationCap,
  ClipboardCheck,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Array<{
    filename: string;
    category: string;
    moduleName: string;
    relevanceScore: number;
  }>;
}

interface SearchResult {
  id: string;
  score: number;
  filename: string;
  category: string;
  moduleName?: string;
  preview: string;
  tags: string[];
}

interface GeneratedQuestion {
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'practical';
  options?: string[];
  correctAnswer?: string;
  rubric?: string;
}

interface IndexStats {
  pinecone: {
    totalRecords: number;
    dimension: number;
  };
  local: {
    documentChunks: number;
  };
  status: 'indexed' | 'empty';
}

type ActiveTab = 'chat' | 'search' | 'generate' | 'settings';

export default function AIAssistantPage() {
  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateType, setGenerateType] = useState('lesson-plan');
  const [generatedContent, setGeneratedContent] = useState('');
  const [unitStandards, setUnitStandards] = useState<{ id: string; title: string; code?: string; module?: { number: number } }[]>([]);
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [selectedUnitStandard, setSelectedUnitStandard] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [assessmentType, setAssessmentType] = useState('formative');
  const [questionCount, setQuestionCount] = useState(5);
  const [indexing, setIndexing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI teaching assistant. I can help you with curriculum questions, generate lesson plans, and search through course materials. How can I help you today?'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadIndexStats();
    loadUnitStandards();
  }, []);

  const loadUnitStandards = async () => {
    try {
      const response = await fetch('/api/modules');
      const data = await response.json();
      if (data.modules) {
        const allUS: typeof unitStandards = [];
        for (const module of data.modules) {
          for (const us of module.unitStandards) {
            allUS.push({
              id: us.id,
              title: us.title,
              code: us.code,
              module: { number: module.moduleNumber },
            });
          }
        }
        setUnitStandards(allUS);
      }
    } catch (error) {
      console.error('Failed to load unit standards:', error);
    }
  };

  const loadIndexStats = async () => {
    try {
      const response = await fetch('/api/ai/index-documents');
      const data = await response.json();
      if (data.success) {
        setIndexStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load index stats:', error);
    }
  };

  // Chat handler
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.data.response,
          sources: data.data.sources
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I apologize, but I encountered an issue processing your request. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m having trouble connecting to my knowledge base. Please check your connection and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        topK: '10'
      });
      if (searchFilter) {
        params.append('module', searchFilter.toString());
      }

      const response = await fetch(`/api/ai/semantic-search?${params}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Assessment generation handler
  const handleGenerateAssessment = async () => {
    if (!selectedUnitStandard) return;
    setLoading(true);
    setGeneratedQuestions([]);

    try {
      const response = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitStandardId: selectedUnitStandard,
          type: assessmentType,
          count: questionCount
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedQuestions(data.data.questions);
      }
    } catch (error) {
      console.error('Assessment generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Index documents handler
  const handleIndexDocuments = async (action: 'index-sample' | 'index-from-db') => {
    setIndexing(true);
    try {
      const response = await fetch('/api/ai/index-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (data.success) {
        await loadIndexStats();
        alert(`Successfully indexed ${data.data.indexed} documents!`);
      }
    } catch (error) {
      console.error('Indexing error:', error);
      alert('Failed to index documents. Check the console for details.');
    } finally {
      setIndexing(false);
    }
  };

  const tabs = [
    { id: 'chat' as const, label: 'AI Chat', icon: MessageCircle },
    { id: 'search' as const, label: 'Semantic Search', icon: Search },
    { id: 'generate' as const, label: 'Generate Assessment', icon: ClipboardCheck },
    { id: 'settings' as const, label: 'Knowledge Base', icon: Database },
  ];

  return (
    <>

      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Sparkles className="w-12 h-12" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-2">AI Training Assistant</h1>
              <p className="text-white/80 max-w-xl">
                Powered by advanced AI to help you search curriculum materials, answer questions,
                generate assessments, and provide personalized learning recommendations.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Brain className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs opacity-80">RAG-Powered</span>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Target className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs opacity-80">Semantic Search</span>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <GraduationCap className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs opacity-80">NVC L2 Curriculum</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-800 rounded-bl-md'
                        }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content.split('\n').map((line, i) => {
                          // Handle bold text
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                              {parts.map((part, j) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return <strong key={j}>{part.slice(2, -2)}</strong>;
                                }
                                return part;
                              })}
                            </p>
                          );
                        })}
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.slice(0, 3).map((source, i) => (
                              <span
                                key={i}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                              >
                                {source.moduleName || source.filename}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about curriculum, assessments, or get help..."
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500 text-center">
                  AI responses are based on NVC Level 2 curriculum documents and may not be 100% accurate.
                </p>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="p-6">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Semantic Curriculum Search</h2>
                  <p className="text-slate-600">
                    Search through all curriculum materials using natural language
                  </p>
                </div>

                {/* Search Input */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g., 'How to calculate percentages' or 'workplace safety requirements'"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                  </button>
                </div>

                {/* Module Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSearchFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${searchFilter === null
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    All Modules
                  </button>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSearchFilter(num)}
                      className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${searchFilter === num
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      Module {num}
                    </button>
                  ))}
                </div>

                {/* Results */}
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      Found {searchResults.length} relevant document{searchResults.length !== 1 ? 's' : ''}
                    </p>
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-slate-900">{result.filename}</span>
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {Math.round(result.score * 100)}% match
                              </span>
                            </div>
                            <div className="flex gap-2 mb-2">
                              <span className="text-xs text-slate-500">{result.category}</span>
                              {result.moduleName && (
                                <span className="text-xs text-purple-600">• {result.moduleName}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{result.preview}</p>
                            {result.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {result.tags.slice(0, 4).map((tag: string, i: number) => (
                                  <span key={i} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !loading ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No documents found matching your search.</p>
                    <p className="text-sm text-slate-400 mt-1">Try different keywords or remove filters.</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Enter a search query to find relevant curriculum materials</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {['workplace safety', 'communication skills', 'numeracy basics', 'assessment criteria'].map((example) => (
                        <button
                          key={example}
                          onClick={() => {
                            setSearchQuery(example);
                            setTimeout(handleSearch, 100);
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessment Generation Tab */}
          {activeTab === 'generate' && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Assessment Generator</h2>
                  <p className="text-slate-600">
                    Generate formative or summative assessment questions based on unit standards
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Configuration */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Unit Standard
                      </label>
                      <select
                        value={selectedUnitStandard}
                        onChange={(e) => setSelectedUnitStandard(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select a unit standard...</option>
                        {unitStandards.map((us) => (
                          <option key={us.id} value={us.id}>
                            {us.code} - {us.title} {us.module ? `(Module ${us.module.number})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Assessment Type
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setAssessmentType('formative')}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors ${assessmentType === 'formative'
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          <span className="font-medium">Formative</span>
                          <p className="text-xs text-slate-500 mt-1">Knowledge checks & practice</p>
                        </button>
                        <button
                          onClick={() => setAssessmentType('summative')}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors ${assessmentType === 'summative'
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          <span className="font-medium">Summative</span>
                          <p className="text-xs text-slate-500 mt-1">Competency evaluation</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Number of Questions: {questionCount}
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <button
                      onClick={handleGenerateAssessment}
                      disabled={loading || !selectedUnitStandard}
                      className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Assessment
                        </>
                      )}
                    </button>
                  </div>

                  {/* Generated Questions */}
                  <div className="bg-slate-50 rounded-xl p-4 min-h-[400px]">
                    {generatedQuestions.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">
                            Generated Questions ({generatedQuestions.length})
                          </h3>
                          <button
                            onClick={() => setGeneratedQuestions([])}
                            className="text-sm text-slate-500 hover:text-slate-700"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {generatedQuestions.map((q, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                  {index + 1}
                                </span>
                                <div className="flex-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${q.type === 'multiple_choice'
                                      ? 'bg-blue-100 text-blue-700'
                                      : q.type === 'practical'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {q.type.replace('_', ' ')}
                                  </span>
                                  <p className="mt-2 text-slate-800">{q.question}</p>
                                  {q.options && (
                                    <div className="mt-2 space-y-1">
                                      {q.options.map((opt: string, i: number) => (
                                        <div
                                          key={i}
                                          className={`text-sm px-3 py-1.5 rounded ${opt === q.correctAnswer
                                              ? 'bg-green-50 text-green-700 border border-green-200'
                                              : 'bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                          {String.fromCharCode(65 + i)}. {opt}
                                          {opt === q.correctAnswer && (
                                            <CheckCircle className="inline w-4 h-4 ml-2" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {q.rubric && (
                                    <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded">
                                      <span className="font-medium">Rubric:</span> {q.rubric}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <ClipboardCheck className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500">Generated questions will appear here</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Select a unit standard and click generate
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings / Knowledge Base Tab */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Knowledge Base Status</h2>
                  <p className="text-slate-600">
                    Manage the AI's knowledge base of curriculum documents
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-slate-700">Pinecone Index</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                      {indexStats?.pinecone.totalRecords || 0}
                    </p>
                    <p className="text-sm text-slate-500">indexed documents</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3 mb-2">
                      {indexStats?.status === 'indexed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="font-medium text-slate-700">Status</span>
                    </div>
                    <p className={`text-xl font-bold ${indexStats?.status === 'indexed' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                      {indexStats?.status === 'indexed' ? 'Active' : 'Needs Indexing'}
                    </p>
                    <p className="text-sm text-slate-500">knowledge base status</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-slate-900 mb-2">Index Curriculum Content</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Index all modules and unit standards from your database into the AI knowledge base.
                    </p>
                    <button
                      onClick={() => handleIndexDocuments('index-sample')}
                      disabled={indexing}
                      className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {indexing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Indexing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          Index Curriculum Data
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-slate-900 mb-2">Index Document Chunks</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Index previously uploaded document chunks from the local database.
                    </p>
                    <button
                      onClick={() => handleIndexDocuments('index-from-db')}
                      disabled={indexing}
                      className="w-full py-3 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {indexing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Indexing...
                        </>
                      ) : (
                        <>
                          <Database className="w-5 h-5" />
                          Index from Database
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Important</p>
                      <p className="text-sm text-amber-700 mt-1">
                        The AI knowledge base uses your Pinecone index. Make sure you have set up your
                        PINECONE_API_KEY and COHERE_API_KEY in your .env.local file for full functionality.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
