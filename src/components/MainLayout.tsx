'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const publicPaths = ['/login', '/register'];

export default function MainLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isPublicPage = publicPaths.includes(pathname);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved === 'true') {
            setIsSidebarCollapsed(true);
        }
    }, []);

    const handleToggleSidebar = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebarCollapsed', String(next));
            return next;
        });
    };

    if (isPublicPage) {
        return (
            <div className="min-h-screen bg-white">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
            <main
                className={cn(
                    "min-h-screen transition-all duration-300 ease-in-out",
                    isSidebarCollapsed ? "pl-[var(--sidebar-collapsed)]" : "pl-[var(--sidebar-width)]"
                )}
            >
                {/* Header is now managed per-page or globally here */}
                {/* For the dashboard, we will use the DashboardLayout's header but ensure it doesn't double-wrap */}
                <Header />
                <div className="page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
