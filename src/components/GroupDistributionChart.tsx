'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GroupDistributionChartProps {
  data: Array<{
    id: string;
    name: string;
    companyName: string;
    studentCount: number;
    percentage: number;
  }>;
}

/**
 * GROUP DISTRIBUTION CHART - REDESIGNED
 * Horizontal bar chart showing student count per group
 * Uses 2-3 brand green shades for clean, professional appearance
 * Fully readable labels, no overlapping text
 */
const COLORS = [
  '#059669', // emerald-600
  '#10b981', // emerald-500
  '#34d399', // emerald-400
  '#6ee7b7', // emerald-300
  '#a7f3d0', // emerald-200
];

export default function GroupDistributionChart({ data }: GroupDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No group data available
      </div>
    );
  }

  // Filter and sort by student count (descending)
  const filteredData = data
    .filter(item => item.studentCount > 0)
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 10); // Show top 10 groups

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No groups with students
      </div>
    );
  }

  const maxStudents = Math.max(...filteredData.map(d => d.studentCount));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filteredData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#64748b"
            width={190}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value: any) => [`${value} students`, 'Count']}
            cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
          />
          <Bar
            dataKey="studentCount"
            fill="#059669"
            radius={[0, 8, 8, 0]}
            isAnimationActive={true}
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend below chart - shows all groups with counts */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {filteredData.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
              title={`${item.name}: ${item.studentCount} students`}
            />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              {item.name}: <span className="font-semibold">{item.studentCount}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
