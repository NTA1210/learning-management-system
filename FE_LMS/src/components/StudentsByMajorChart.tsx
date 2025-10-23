import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { studentsByMajorData } from '../services/mock';
import { useTheme } from '../hooks/useTheme';

export default function StudentsByMajorChart() {
  const { darkMode } = useTheme();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={studentsByMajorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={darkMode ? '#374151' : '#e5e7eb'} 
          />
          <XAxis 
            dataKey="major" 
            tick={{ fill: darkMode ? '#ffffff' : '#374151', fontSize: 12 }}
            axisLine={{ stroke: darkMode ? '#6b7280' : '#d1d5db' }}
            height={50} // giảm chiều cao trục X cho gọn
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
          <Area 
            type="monotone" 
            dataKey="students" 
            stroke={darkMode ? '#10b981' : '#059669'}
            fill={darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.2)'}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
