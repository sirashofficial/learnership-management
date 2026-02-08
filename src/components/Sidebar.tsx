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
    // Secondary: Records & Compliance
    CalendarCheck,
    FolderOpen,
    FileText,
    FileBarChart,
    // Secondary: Tools
    Search,
    Lightbulb,
    BookOpen,
    CheckSquare,
    // Admin
    Shield
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Primary navigation - always visible, prominent
const primaryItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Building2, label: "Groups", href: "/groups" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: CalendarDays, label: "Timetable", href: "/timetable" },
    { icon: ClipboardCheck, label: "Assessments", href: "/assessments" },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: TrendingUp, label: "Progress", href: "/progress" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

// Secondary navigation - grouped, collapsible
const secondaryGroups = [
    {
        id: "records",
        label: "Records & Compliance",
        icon: FolderOpen,
        items: [
            { icon: CalendarCheck, label: "Attendance", href: "/attendance" },
            { icon: FolderOpen, label: "POE Management", href: "/poe" },
            { icon: FileText, label: "Compliance", href: "/compliance" },
            { icon: FileBarChart, label: "Moderation", href: "/moderation" },
        ]
    },
    {
        id: "tools",
        label: "Tools",
        icon: Search,
        items: [
            { icon: Search, label: "Search", href: "/search" },
            { icon: Lightbulb, label: "Lesson Planner", href: "/lessons" },
            { icon: BookOpen, label: "Curriculum", href: "/curriculum" },
            { icon: CheckSquare, label: "Checklist", href: "/assessment-checklist" },
        ]
    },
];

const adminItems = [
    { icon: Shield, label: "User Management", href: "/admin/users" },
];

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const isGroupActive = (items: typeof primaryItems) =>
        items.some(item => pathname === item.href);

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full z-50",
                "transition-all duration-500 ease-out",
                isCollapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]"
            )}
        >
            {/* Main container with high-contrast slate and subtle noise */}
            <div className="h-full flex flex-col bg-slate-950 border-r border-white/5 noise-texture">
                {/* Header - Brand with refined typography */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="transition-all duration-300">
                                <h1 className="font-bold text-white text-xl tracking-tighter font-display">YEHA</h1>
                                <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-[0.2em]">Academic Portal</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronLeft className={cn(
                            "w-4 h-4 transition-transform duration-300",
                            isCollapsed && "rotate-180"
                        )} />
                    </button>
                </div>

                {/* Primary Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
                    {/* Primary Items with staggered animation potential */}
                    <div className="space-y-1.5">
                        {primaryItems.map((item, index) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    style={{ animationDelay: `${index * 40}ms` }}
                                    className={cn(
                                        "group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13.5px] font-medium",
                                        "transition-all duration-300 ease-out animate-in slide-in-from-left-4 fade-in filling-mode-both",
                                        isActive
                                            ? "bg-white/10 text-white shadow-xl shadow-black/20"
                                            : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
                                        isCollapsed && "justify-center px-1"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-[18px] h-[18px] flex-shrink-0 transition-all duration-300",
                                        isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300",
                                        !isCollapsed && "group-hover:scale-110 group-hover:rotate-3"
                                    )} />
                                    {!isCollapsed && (
                                        <span className="flex-1 tracking-tight">{item.label}</span>
                                    )}
                                    {isActive && !isCollapsed && (
                                        <div className="w-1 h-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Refined Divider */}
                    <div className="my-8 mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Secondary Groups */}
                    {!isCollapsed && (
                        <div className="space-y-4">
                            {secondaryGroups.map((group) => {
                                const isExpanded = expandedGroups.includes(group.id);
                                const hasActiveItem = isGroupActive(group.items);

                                return (
                                    <div key={group.id} className="space-y-2">
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em]",
                                                "transition-all duration-300",
                                                hasActiveItem
                                                    ? "text-emerald-400"
                                                    : "text-slate-500 hover:text-slate-300"
                                            )}
                                        >
                                            <span className="flex-1 text-left">{group.label}</span>
                                            <ChevronDown className={cn(
                                                "w-3.5 h-3.5 transition-transform duration-300",
                                                isExpanded && "rotate-180"
                                            )} />
                                        </button>

                                        <div className={cn(
                                            "overflow-hidden transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)",
                                            isExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                                        )}>
                                            <div className="pl-2 space-y-1">
                                                {group.items.map((item) => {
                                                    const isActive = pathname === item.href;
                                                    return (
                                                        <Link
                                                            key={item.label}
                                                            href={item.href}
                                                            className={cn(
                                                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium",
                                                                "transition-all duration-200",
                                                                isActive
                                                                    ? "text-white bg-white/5"
                                                                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                                            )}
                                                        >
                                                            <item.icon className={cn(
                                                                "w-4 h-4",
                                                                isActive ? "text-emerald-400" : "text-slate-600"
                                                            )} />
                                                            <span>{item.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </nav>

                {/* Refined User Profile Footer */}
                <div className="p-4 bg-black/20 mt-auto border-t border-white/5">
                    {!isCollapsed ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3.5 px-2">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-emerald-500/50 transition-all duration-300">
                                        <span className="text-white font-bold text-sm font-display">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate font-main tracking-tight">
                                        {user?.name || 'User Account'}
                                    </p>
                                    <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">
                                        {user?.role || 'Guest'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsCollapsed(true)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center ring-1 ring-white/10">
                                <span className="text-white font-bold text-sm">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
