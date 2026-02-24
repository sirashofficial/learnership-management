"use client";

import { Building2, Search, Users } from 'lucide-react';
import { useGroups } from '@/contexts/GroupsContext';
import { formatGroupNameDisplay } from '@/lib/groupName';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface GroupFilterSidebarProps {
    selectedGroupId: string;
    onSelectGroup: (groupId: string) => void;
}

export default function GroupFilterSidebar({ selectedGroupId, onSelectGroup }: GroupFilterSidebarProps) {
    const { groups } = useGroups();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGroups = useMemo(() => {
        if (!groups) return [];
        return groups.filter((group: any) =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (group.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [groups, searchQuery]);

    // Group by company
    const groupedGroups = useMemo(() => {
        const map = new Map<string, any[]>();
        filteredGroups.forEach((group: any) => {
            const companyName = group.company?.name || 'Independent';
            if (!map.has(companyName)) map.set(companyName, []);
            map.get(companyName)?.push(group);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredGroups]);

    return (
        <div className="w-64 flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    Groups & Companies
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                <button
                    onClick={() => onSelectGroup('all')}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                        selectedGroupId === 'all'
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                >
                    <Users className="w-4 h-4" />
                    All Students
                </button>

                {groupedGroups.length > 0 ? (
                    groupedGroups.map(([company, companyGroups]) => (
                        <div key={company} className="space-y-1">
                            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                                {company}
                                <span className="text-[9px] opacity-60">({companyGroups.length})</span>
                            </p>
                            {companyGroups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => onSelectGroup(group.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left group",
                                        selectedGroupId === group.id
                                            ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 font-medium"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <span className="truncate">{formatGroupNameDisplay(group.name)}</span>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full transition-colors",
                                        selectedGroupId === group.id
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                    )}>
                                        {group._count?.students || group.students?.length || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-8 text-center">
                        <Users className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">No results found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
