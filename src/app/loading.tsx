export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4 animate-pulse"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
