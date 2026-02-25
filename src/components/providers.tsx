'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { GroupsProvider } from '@/contexts/GroupsContext';
import { StudentProvider } from '@/contexts/StudentContextSimple';
import { ReactNode, useEffect } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    // Initialize event-driven cache invalidation on app startup
    useEffect(() => {
        // Make a request to initialize the server-side event system
        // This triggers the lazy initialization of cache invalidation listeners
        fetch('/api/events/stream', { method: 'HEAD' }).catch(() => {
            // Connection failures are expected, we're just triggering initialization
        });
    }, []);

    return (
        <AuthProvider>
            <GroupsProvider>
                <StudentProvider>
                    {children}
                </StudentProvider>
            </GroupsProvider>
        </AuthProvider>
    );
}
