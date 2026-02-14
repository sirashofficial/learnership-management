'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { GroupsProvider } from '@/contexts/GroupsContext';
import { StudentProvider } from '@/contexts/StudentContextSimple';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
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
