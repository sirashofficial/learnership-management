'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceTrendChartProps {
  data: Array<{
    date: string;
    rate: number;
    present: number;
    total: number;
  }>;
}

export default function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No attendance data available
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="displayDate" 
          className="text-sm text-gray-600 dark:text-gray-400"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-sm text-gray-600 dark:text-gray-400"
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
          formatter={(value: number | undefined, name: string | undefined) => {
            if (!value || !name) return ['0', 'Unknown'];
            if (name === 'rate') return [`${value}%`, 'Attendance Rate'];
            if (name === 'present') return [value, 'Present'];
            if (name === 'total') return [value, 'Total Students'];
            return [value, name];
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => {
            if (value === 'rate') return 'Attendance Rate';
            return value;
          }}
        />
        <Line 
          type="monotone" 
          dataKey="rate" 
          stroke="#3b82f6" 
          strokeWidth={3}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
