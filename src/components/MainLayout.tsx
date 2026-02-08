'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ReactNode } from 'react';

const publicPaths = ['/login', '/register'];

export default function MainLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isPublicPage = publicPaths.includes(pathname);

    if (isPublicPage) {
        return (
            <div className="min-h-screen bg-background">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="transition-all duration-300 ease-out ml-[260px] min-h-screen">
                <div className="p-6 page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
