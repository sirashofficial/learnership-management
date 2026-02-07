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
                "transition-all duration-300 ease-out",
                isCollapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Main container with premium gradient */}
            <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-white/5">

                {/* Header - Brand */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="transition-opacity duration-200">
                                <h1 className="font-bold text-white text-lg tracking-tight">YEHA</h1>
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Facilitator</p>
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
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    {/* Primary Items */}
                    <div className="space-y-1">
                        {primaryItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                                        "transition-all duration-200 ease-out",
                                        isActive
                                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 shadow-sm"
                                            : "text-slate-300 hover:text-white hover:bg-white/5",
                                        isCollapsed && "justify-center px-2"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                                        isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200",
                                        !isCollapsed && "group-hover:scale-110"
                                    )} />
                                    {!isCollapsed && (
                                        <span className="flex-1">{item.label}</span>
                                    )}
                                    {isActive && !isCollapsed && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="my-4 mx-2 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

                    {/* Secondary Groups (Collapsible) */}
                    {!isCollapsed && (
                        <div className="space-y-2">
                            {secondaryGroups.map((group) => {
                                const isExpanded = expandedGroups.includes(group.id);
                                const hasActiveItem = isGroupActive(group.items);

                                return (
                                    <div key={group.id} className="space-y-1">
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                                                "transition-all duration-200",
                                                hasActiveItem
                                                    ? "text-slate-200"
                                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                            )}
                                        >
                                            <group.icon className="w-4 h-4" />
                                            <span className="flex-1 text-left text-[13px]">{group.label}</span>
                                            <ChevronDown className={cn(
                                                "w-4 h-4 transition-transform duration-200",
                                                isExpanded && "rotate-180"
                                            )} />
                                        </button>

                                        {/* Expandable items with smooth animation */}
                                        <div className={cn(
                                            "overflow-hidden transition-all duration-300 ease-out",
                                            isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                        )}>
                                            <div className="pl-4 space-y-0.5 py-1">
                                                {group.items.map((item) => {
                                                    const isActive = pathname === item.href;
                                                    return (
                                                        <Link
                                                            key={item.label}
                                                            href={item.href}
                                                            className={cn(
                                                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]",
                                                                "transition-all duration-200",
                                                                isActive
                                                                    ? "text-emerald-400 bg-emerald-500/10"
                                                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                                            )}
                                                        >
                                                            <item.icon className="w-4 h-4" />
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

                    {/* Collapsed state: Show group icons only */}
                    {isCollapsed && (
                        <div className="space-y-1">
                            {secondaryGroups.map((group) => (
                                <button
                                    key={group.id}
                                    onClick={() => {
                                        setIsCollapsed(false);
                                        setExpandedGroups(prev =>
                                            prev.includes(group.id) ? prev : [...prev, group.id]
                                        );
                                    }}
                                    className="w-full flex justify-center p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                                    title={group.label}
                                >
                                    <group.icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Admin Section */}
                    {user?.role === 'ADMIN' && (
                        <>
                            <div className="my-4 mx-2 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                            <div className="space-y-1">
                                {adminItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                                                "transition-all duration-200",
                                                isActive
                                                    ? "bg-amber-500/10 text-amber-400"
                                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                                                isCollapsed && "justify-center px-2"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            {!isCollapsed && <span>{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </nav>

                {/* User Profile Footer */}
                <div className="p-3 border-t border-white/10">
                    {!isCollapsed ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center ring-2 ring-white/10">
                                    <span className="text-white font-semibold text-sm">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white truncate">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                                        {user?.role || 'User'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={logout}
                            className="w-full flex justify-center p-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
