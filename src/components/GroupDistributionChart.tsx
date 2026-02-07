'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GroupDistributionChartProps {
  data: Array<{
    id: string;
    name: string;
    companyName: string;
    studentCount: number;
    percentage: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function GroupDistributionChart({ data }: GroupDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No group data available
      </div>
    );
  }

  // Only show groups with students
  const filteredData = data.filter(item => item.studentCount > 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Don't show label for small slices
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="studentCount"
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          formatter={(value: number | undefined, name: string | undefined, props: any) => {
            if (!value || !props?.payload) return ['0', 'Unknown'];
            return [
              `${value} students (${props.payload.percentage}%)`,
              props.payload.name
            ];
          }}
        />
        <Legend 
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ paddingLeft: '20px', fontSize: '12px' }}
          formatter={(value, entry: any) => {
            return `${entry.payload.name} (${entry.payload.studentCount})`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
