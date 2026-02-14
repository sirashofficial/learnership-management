'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ReactNode } from 'react';

const publicPaths = ['/login', '/register'];

export default function MainLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isPublicPage = publicPaths.includes(pathname);

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
            <Sidebar />
            <main className="transition-all duration-150 ml-[var(--sidebar-width)] min-h-screen">
                <Header />
                <div className="px-6 lg:px-8 py-6 page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
