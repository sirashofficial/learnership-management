'use client';

import { Bell, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GlobalSearch from './GlobalSearch';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

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
    <header className="sticky top-4 z-40 bg-white/70 backdrop-blur-xl border border-white/20 px-8 py-6 rounded-[2rem] shadow-premium mb-8 mx-4">
      <div className="flex items-center justify-between">
        {/* Left - Contextual Info */}
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter font-display italic">
              Dashboard
            </h2>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Right - Global Actions */}
        <div className="flex items-center gap-5">
          {/* Global Search Interface */}
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2"></div>

          {/* Theme & Utility Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleDarkMode}
              className="w-11 h-11 flex items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300"
              title={darkMode ? 'Switch to Light' : 'Switch to Dark'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 active:rotate-90 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 active:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Notification Ecosystem */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 relative",
                  showNotifications ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
                title="Activity Feed"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-white shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                )}
              </button>

              {/* Refined Dropdown Interface */}
              {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-premium border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-300 ease-out origin-top-right">
                  <div className="p-6 bg-slate-950 text-white flex items-center justify-between noise-texture">
                    <div>
                      <h3 className="text-lg font-bold font-display">Activity Stream</h3>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">3 Unread Internal Alerts</p>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-[32rem] overflow-y-auto py-2 custom-scrollbar">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{notif.title}</p>
                          <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0 ml-4">{notif.time}</span>
                        </div>
                        <p className="text-[13px] text-slate-500 leading-relaxed">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                    <button className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-[12px] font-black text-slate-900 uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all duration-300 shadow-sm">
                      Enter Notification Center
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Signature */}
          <div className="flex items-center gap-4 pl-5 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-[14px] font-black text-slate-950 tracking-tight font-main">
                {user?.name || 'Authorized Personnel'}
              </p>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] opacity-80">
                {user?.role || 'Guest'}
              </p>
            </div>
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-lg transition-all duration-500 hover:rotate-6 hover:scale-110 shadow-xl overflow-hidden noise-texture">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-white shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
