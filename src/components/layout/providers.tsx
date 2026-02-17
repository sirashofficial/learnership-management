'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { GroupsProvider } from '@/contexts/GroupsContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <GroupsProvider>
                {children}
            </GroupsProvider>
        </AuthProvider>
    );
}
