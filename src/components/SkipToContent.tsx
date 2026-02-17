'use client';

/**
 * Skip to Content Link
 * Provides keyboard users a way to skip navigation and go directly to main content
 * WCAG 2.1 Level A compliance
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:outline-none"
      tabIndex={0}
    >
      Skip to main content
    </a>
  );
}
