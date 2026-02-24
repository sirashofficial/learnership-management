import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasMore?: boolean;
  itemsPerPage?: number;
  total?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasMore = true,
  itemsPerPage = 25,
  total = 0,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, total);

  // Calculate page numbers to show
  const pageNumbers: (number | string)[] = [];
  const maxPagesToShow = 5;

  if (totalPages <= maxPagesToShow) {
    // Show all pages if 5 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Always show first page
    pageNumbers.push(1);

    // Calculate start and end of middle section
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis if needed before middle section
    if (startPage > 2) {
      pageNumbers.push('...');
    }

    // Add middle section
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis if needed after middle section
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }

    // Always show last page
    pageNumbers.push(totalPages);
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasMore && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 py-6 px-4 sm:flex-row sm:gap-6">
      {/* Info text */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {total > 0 ? (
          <span>
            Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</span>
            {' '}-{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span> results
          </span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="text-slate-600 dark:text-slate-400 px-2 py-2"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || !hasMore}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
