import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { studentsPerClassData } from '../services/mock';
import { useTheme } from '../hooks/useTheme';

export default function StudentsPerClassChart() {
  const { darkMode } = useTheme();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={studentsPerClassData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="className" 
            tick={{ fill: darkMode ? '#ffffff' : '#374151' }}
            axisLine={{ stroke: darkMode ? '#6b7280' : '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: darkMode ? '#ffffff' : '#374151' }}
            axisLine={{ stroke: darkMode ? '#6b7280' : '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: darkMode ? '#2d3748' : '#ffffff',
              border: darkMode ? '1px solid #4a5568' : '1px solid #e5e7eb',
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#374151'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="students" 
            stroke={darkMode ? '#8b5cf6' : '#7c3aed'}
            strokeWidth={3}
            dot={{ fill: darkMode ? '#8b5cf6' : '#7c3aed', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: darkMode ? '#8b5cf6' : '#7c3aed', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
