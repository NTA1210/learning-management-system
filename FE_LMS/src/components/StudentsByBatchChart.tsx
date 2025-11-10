import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { studentsByBatchData } from '../services/mock';
import { useTheme } from '../hooks/useTheme';

export default function StudentsByBatchChart() {
  const { darkMode } = useTheme();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
      <BarChart data={studentsByBatchData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="batch" 
            tick={{ fill: darkMode ? '#ffffff' : '#374151' }}
            axisLine={{ stroke: darkMode ? '#6b7280' : '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: darkMode ? '#ffffff' : '#374151' }}
            axisLine={{ stroke: darkMode ? '#6b7280' : '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#374151'
            }}
          />
          <Bar 
            dataKey="students" 
            fill={darkMode ? '#6366f1' : '#3b82f6'}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
