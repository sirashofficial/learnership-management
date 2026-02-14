"use client";

import {
    LayoutDashboard,
    Building2,
    Users,
    CalendarDays,
    ClipboardCheck,
    TrendingUp,
    Settings,
    ChevronLeft,
    ChevronDown,
    GraduationCap,
    LogOut,
    CalendarCheck,
    FolderOpen,
    FileText,
    FileBarChart,
    Search,
    Lightbulb,
    BookOpen,
    CheckSquare,
    Shield,
    Sparkles,
    Sun,
    Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const quickAccessItems = [
    { icon: LayoutDashboard, label: "Home", href: "/" },
    { icon: Building2, label: "Groups", href: "/groups" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: CalendarDays, label: "Timetable", href: "/timetable" },
    { icon: CalendarCheck, label: "Attendance", href: "/attendance" },
    { icon: FileText, label: "Reports", href: "/reports" },
];

const managementItems = [
    { icon: ClipboardCheck, label: "Assessments", href: "/assessments" },
    { icon: TrendingUp, label: "Progress", href: "/progress" },
    { icon: FolderOpen, label: "POE Management", href: "/poe" },
    { icon: FileBarChart, label: "Compliance", href: "/compliance" },
    { icon: CheckSquare, label: "Moderation", href: "/moderation" },
];

const toolItems = [
    { icon: Lightbulb, label: "Lesson Planner", href: "/lessons" },
    { icon: BookOpen, label: "Curriculum", href: "/curriculum" },
    { icon: Sparkles, label: "AI Assistant", href: "/ai" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

const adminItems = [
    { icon: Shield, label: "User Management", href: "/admin/users" },
];

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sidebarTheme, setSidebarTheme] = useState<'dark' | 'light'>('dark');
    const pathname = usePathname();
    const { user, logout } = useAuth();

    useEffect(() => {
        const saved = localStorage.getItem('sidebarTheme') as 'dark' | 'light' | null;
        if (saved) setSidebarTheme(saved);
    }, []);

    const toggleTheme = () => {
        const next = sidebarTheme === 'dark' ? 'light' : 'dark';
        setSidebarTheme(next);
        localStorage.setItem('sidebarTheme', next);
    };

    const isDark = sidebarTheme === 'dark';

    const renderNavItem = (item: typeof quickAccessItems[0]) => {
        const isActive = pathname === item.href;
        return (
            <Link
                key={item.label}
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                    isActive
                        ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-emerald-50 text-emerald-700"
                        : isDark
                            ? "text-slate-400 hover:text-white hover:bg-white/5"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                    isCollapsed && "justify-center px-2"
                )}
            >
                <item.icon className={cn(
                    "w-[18px] h-[18px] flex-shrink-0",
                    isActive
                        ? isDark ? "text-emerald-400" : "text-emerald-600"
                        : isDark ? "text-slate-500" : "text-slate-400"
                )} />
                {!isCollapsed && <span>{item.label}</span>}
            </Link>
        );
    };

    const renderSection = (label: string, items: typeof quickAccessItems) => (
        <div className="space-y-0.5">
            {!isCollapsed && (
                <p className={cn(
                    "px-3 mb-2 text-xs font-medium uppercase tracking-wider",
                    isDark ? "text-slate-500" : "text-slate-400"
                )}>
                    {label}
                </p>
            )}
            {items.map(renderNavItem)}
        </div>
    );

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full z-50 transition-all duration-200",
                isCollapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]"
            )}
        >
            <div className={cn(
                "h-full flex flex-col",
                isDark
                    ? "bg-slate-950 border-r border-white/5"
                    : "bg-white border-r border-slate-200"
            )}>
                {/* Brand */}
                <div className="px-4 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isDark ? "bg-emerald-600" : "bg-emerald-600"
                        )}>
                            <GraduationCap className="w-4.5 h-4.5 text-white" />
                        </div>
                        {!isCollapsed && (
                            <span className={cn(
                                "text-lg font-bold tracking-tight font-display",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                YEHA
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "p-1.5 rounded-md transition-colors duration-150",
                            isDark
                                ? "text-slate-500 hover:text-white hover:bg-white/10"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        )}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronLeft className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isCollapsed && "rotate-180"
                        )} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
                    {renderSection("Quick access", quickAccessItems)}
                    {renderSection("Management", managementItems)}
                    {renderSection("Tools", toolItems)}
                    {user?.role === 'ADMIN' && renderSection("Admin", adminItems)}
                </nav>

                {/* Footer */}
                <div className={cn(
                    "mt-auto border-t p-3 space-y-2",
                    isDark ? "border-white/5" : "border-slate-200"
                )}>
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                            isDark
                                ? "text-slate-500 hover:text-white hover:bg-white/5"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {!isCollapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
                    </button>

                    {/* User */}
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                                isDark ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                            )}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm font-medium truncate",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>
                                    {user?.name || 'User'}
                                </p>
                                <p className={cn(
                                    "text-xs truncate",
                                    isDark ? "text-slate-500" : "text-slate-400"
                                )}>
                                    {user?.role || 'Guest'}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className={cn(
                                    "p-1.5 rounded-md transition-colors duration-150",
                                    isDark
                                        ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                        : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                                )}
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                                isDark ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                            )}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <button
                                onClick={logout}
                                className={cn(
                                    "p-1.5 rounded-md transition-colors duration-150",
                                    isDark
                                        ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                        : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                                )}
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
