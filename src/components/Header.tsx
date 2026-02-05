"use client";

import { Menu, Search, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-background-border px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 text-text hover:bg-background rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-text">{title}</h2>
            <p className="text-sm text-text-light mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Display */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-text-light bg-background px-3 py-1.5 rounded-lg">
            <span>Monday, February 2, 2026</span>
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              placeholder="Search students, modules..."
              className="pl-10 pr-4 py-2 w-64 text-sm bg-background border border-background-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-text-light hover:bg-background rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
