'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated or not a guardian
    if (!isLoading && (!user || user.role !== 'GUARDIAN')) {
      router.push('/guardian/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'GUARDIAN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
