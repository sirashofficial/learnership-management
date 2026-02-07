'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Users, Shield, Settings, Database } from 'lucide-react';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Optional: Check if user is admin
    // if (!isLoading && user && user.role !== 'admin') {
    //   router.push('/');
    // }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Administration
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage system settings, users, and configuration
              </p>
            </div>

            {/* Admin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.title}
                    onClick={() => card.href !== '#' && router.push(card.href)}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
                  >
                    <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {card.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* System Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                System Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Platform</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    YEHA LMS
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Version</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    2.0.0
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Environment</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Development
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
