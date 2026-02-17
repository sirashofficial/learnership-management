'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ReactNode, useEffect, useState } from 'react';

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
        <div className="min-h-screen bg-white">
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:shadow-lg"
            >
                Skip to main content
            </a>
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
            <main
                id="main-content"
                className={`min-h-screen transition-all duration-300 ease-in-out ${
                    isSidebarCollapsed ? 'ml-[var(--sidebar-collapsed)]' : 'ml-[var(--sidebar-width)]'
                }`}
            >
                <Header />
                <div className="px-6 lg:px-8 py-6 page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
