export default function TimetableLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
      </div>

      {/* Week navigation skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-20 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="grid grid-cols-7">
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <div key={j} className="p-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[100px]">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
