'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CourseProgressChartProps {
  data: Array<{
    id: string;
    name: string;
    code: string;
    completionRate: number;
    studentsCompleted: number;
    totalStudents: number;
    avgProgress: number;
  }>;
}

export default function CourseProgressChart({ data }: CourseProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No course progress data available
      </div>
    );
  }

  // Format data for display
  const formattedData = data.map(item => ({
    ...item,
    displayName: item.code || item.name.substring(0, 15),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis 
          dataKey="displayName" 
          className="text-xs text-slate-600 dark:text-slate-400"
          tick={{ fill: 'currentColor' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          className="text-sm text-slate-600 dark:text-slate-400"
          tick={{ fill: 'currentColor' }}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
          formatter={(value: number | undefined, name: string | undefined, props: any) => {
            if (!value || !name) return ['0', 'Unknown'];
            if (name === 'completionRate') {
              return [
                `${value}% (${props.payload.studentsCompleted}/${props.payload.totalStudents} students)`,
                'Completion Rate'
              ];
            }
            if (name === 'avgProgress') {
              return [`${value}%`, 'Average Progress'];
            }
            return [value, name];
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0) {
              return payload[0].payload.name;
            }
            return label;
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => {
            if (value === 'completionRate') return 'Completion Rate';
            if (value === 'avgProgress') return 'Average Progress';
            return value;
          }}
        />
        <Bar 
          dataKey="completionRate" 
          fill="#10b981" 
          radius={[8, 8, 0, 0]}
          maxBarSize={60}
        />
        <Bar 
          dataKey="avgProgress" 
          fill="#3b82f6" 
          radius={[8, 8, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
