export default function AssessmentsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2 animate-pulse"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4 animate-pulse"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
