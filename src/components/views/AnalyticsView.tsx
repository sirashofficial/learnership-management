'use client';

import React from 'react';
import { Construction } from 'lucide-react';

/**
 * Analytics View Placeholder
 * Will be replaced with full Analytics dashboard in Phase 5
 */
export default function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <Construction className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analytics View</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-6">
          Advanced analytics and reporting coming in Phase 5. Deep insights into programme performance.
        </p>
        <div className="space-y-2 text-sm text-slate-600">
          <p>📊 Performance Trends: Track key metrics over time</p>
          <p>🎯 Cohort Comparisons: Compare groups side-by-side</p>
          <p>📈 Predictive Analytics: Completion projections</p>
          <p>📥 Export Reports: Download data for further analysis</p>
        </div>
      </div>
    </div>
  );
}
