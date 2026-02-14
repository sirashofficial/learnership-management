'use client';

import { Bell, Search, X, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/students': 'Students',
  '/groups': 'Groups',
  '/timetable': 'Timetable',
  '/attendance': 'Attendance',
  '/assessments': 'Assessments',
  '/reports': 'Reports',
  '/progress': 'Progress',
  '/settings': 'Settings',
  '/poe': 'POE Management',
  '/compliance': 'Compliance',
  '/moderation': 'Moderation',
  '/lessons': 'Lesson Planner',
  '/curriculum': 'Curriculum',
  '/ai': 'AI Assistant',
  '/admin': 'Admin',
  '/admin/users': 'User Management',
  '/assessment-checklist': 'Assessment Checklist',
};

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [notificationCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const pageTitle = pageTitles[pathname] || 'Dashboard';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const notifications = [
    { id: 1, title: 'New student enrolled', message: 'John Doe has been added to Group A', time: '5 min ago', unread: true },
    { id: 2, title: 'Assessment submitted', message: 'Module 1 assessment completed by 3 students', time: '1 hour ago', unread: true },
    { id: 3, title: 'Low attendance alert', message: 'Group B attendance below 80%', time: '2 hours ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-6 lg:px-8 h-14">
        {/* Left — Page Title */}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{pageTitle}</h1>

        {/* Right — Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          {showSearch ? (
            <div className="relative mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, students, groups..."
                className="w-64 pl-9 pr-8 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg
                  bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                  placeholder:text-slate-500 dark:placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                  dark:focus:ring-emerald-500/30 dark:focus:border-emerald-400"
                aria-label="Search"
              />
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Close search"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
              aria-label="Search (Ctrl+K)"
              title="Search (Ctrl+K)"
            >
              <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
          )}

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-150 relative",
                "tap-target focus-ring",
                showNotifications
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
              aria-label={`Notifications (${notificationCount} new)`}
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-label={`${notificationCount} unread notifications`} />
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-dropdown border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in"
                role="region"
                aria-label="Notifications"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{notificationCount} new</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "px-4 py-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 cursor-pointer",
                        notif.unread && "bg-blue-50/30 dark:bg-blue-900/20"
                      )}
                      role="article"
                      aria-label={`${notif.title}: ${notif.message}`}
                    >
                      <div className="flex items-start gap-2">
                        {notif.unread && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                        <div className={cn(!notif.unread && "ml-3.5")}>
                          <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <button className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150"
            title="Help"
          >
            <HelpCircle className="w-[18px] h-[18px]" />
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-slate-200">
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {user?.name || 'User'}
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
