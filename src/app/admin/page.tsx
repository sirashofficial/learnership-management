'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, Settings, Database, FileText, BookOpen, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [indexStats, setIndexStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadIndexStats();
    }
  }, [user, isLoading, router]);

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
    } finally {
      setLoadingStats(false);
    }
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

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage system users, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      title: 'Document Management',
      description: 'Upload and manage curriculum documents for AI lessons',
      icon: FileText,
      href: '/admin/documents',
      color: 'bg-emerald-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      href: '/settings',
      color: 'bg-purple-500',
    },
    {
      title: 'Security & Access',
      description: 'Manage security settings and access controls',
      icon: Shield,
      href: '#',
      color: 'bg-red-500',
    },
    {
      title: 'Database Management',
      description: 'View and manage database information',
      icon: Database,
      href: '#',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={() => card.href !== '#' && router.push(card.href)}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-sm transition-shadow text-left"
              >
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Knowledge Base Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                Knowledge Base / Document Index
              </h2>
            </div>
            <button
              onClick={loadIndexStats}
              disabled={loadingStats}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loadingStats ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : indexStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-slate-500 mb-1">Total Documents Indexed</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {indexStats.local?.documentChunks || 0}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-slate-500 mb-1">Pinecone Records</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {indexStats.pinecone?.totalRecords || 0}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <p className={`text-lg font-bold ${
                    (indexStats.pinecone?.totalRecords || 0) > 0 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {indexStats.status === 'indexed' ? '✅ Indexed' : '⏳ Empty'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/admin/documents')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Manage Documents
                </button>
                <button
                  onClick={() => router.push('/curriculum/search')}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Search Documents
                </button>
              </div>

              {(indexStats.pinecone?.totalRecords || 0) === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ No documents indexed yet.</strong> Upload curriculum documents to enhance AI lesson generation and assessment creation.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
