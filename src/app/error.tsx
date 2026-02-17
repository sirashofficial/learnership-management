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
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-red-600">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Unexpected error</h1>
        <p className="mt-3 text-slate-600">
          We hit an unexpected error. Please try again. If this keeps happening,
          contact support.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <a href="/" className="btn-secondary">
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
