export default function Loading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2 animate-pulse"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
      </div>

      {/* Search and filters skeleton */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
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
