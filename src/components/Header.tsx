'use client';

import { Bell, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GlobalSearch from './GlobalSearch';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check and apply dark mode preference on mount
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Close notifications on click outside
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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const notifications = [
    { id: 1, title: 'New student enrolled', message: 'John Doe has been added to Group A', time: '5 min ago' },
    { id: 2, title: 'Assessment submitted', message: 'Module 1 assessment completed by 3 students', time: '1 hour ago' },
    { id: 3, title: 'Low attendance alert', message: 'Group B attendance below 80%', time: '2 hours ago' },
  ];

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left - Welcome Message */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <GlobalSearch />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{notif.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-slate-200 dark:border-slate-700">
                  <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {user?.role}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
