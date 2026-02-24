'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-slate-50">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold text-red-600">Critical Error</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-slate-600">
              We encountered an unexpected error. Please try again. If this keeps happening,
              contact support.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button 
                onClick={reset} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try again
              </button>
              <a 
                href="/" 
                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
              >
                Go to dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
