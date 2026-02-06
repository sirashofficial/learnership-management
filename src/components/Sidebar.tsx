"use client";

import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CalendarCheck, 
  ClipboardCheck, 
  FolderOpen, 
  BookOpen, 
  Lightbulb, 
  FileText, 
  Sparkles, 
  Settings, 
  ChevronLeft,
  GraduationCap,
  TrendingUp,
  CheckSquare,
  FileBarChart,
  Calendar,
  LogOut,
  Shield
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building2, label: "Groups & Companies", href: "/groups" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: Calendar, label: "Timetable", href: "/timetable" },
  { icon: CalendarCheck, label: "Attendance", href: "/attendance" },
  { icon: ClipboardCheck, label: "Assessments", href: "/assessments" },
  { icon: FolderOpen, label: "POE Management", href: "/poe" },
  { icon: BookOpen, label: "Curriculum Library", href: "/curriculum" },
  { icon: Lightbulb, label: "Lesson Planner", href: "/lessons" },
  { icon: Shield, label: "User Management", href: "/admin/users", adminOnly: true },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full z-50 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-full bg-gradient-to-b from-primary to-primary-dark flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-white text-lg leading-tight">YEHA</h1>
                <p className="text-xs text-white/60">Facilitator Portal</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          >
            <ChevronLeft 
              className={cn(
                "w-4 h-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigationItems
            .filter(item => !item.adminOnly || user?.role === 'ADMIN')
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-secondary text-white" 
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="flex-1 text-left">{item.label}</span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-white/60">{user?.role || 'User'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
