'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useWindowSize';

const publicPaths = ['/login', '/register'];

export default function MainLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isPublicPage = publicPaths.includes(pathname);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { isMobile } = useBreakpoint();

    useEffect(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved === 'true') setIsSidebarCollapsed(true);
    }, []);

    // Close mobile drawer on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

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
                <main className="min-h-screen">{children}</main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Mobile backdrop overlay */}
            {isMobile && isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <Sidebar
                isCollapsed={isMobile ? false : isSidebarCollapsed}
                onToggle={handleToggleSidebar}
                isMobileOpen={isMobileOpen}
                isMobile={isMobile}
            />

            <main
                className={cn(
                    "min-h-screen transition-all duration-300 ease-in-out",
                    isMobile
                        ? "pl-0"
                        : isSidebarCollapsed
                            ? "pl-[var(--sidebar-collapsed)]"
                            : "pl-[var(--sidebar-width)]"
                )}
            >
                <Header onMenuOpen={() => setIsMobileOpen(true)} />
                <div className="page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
