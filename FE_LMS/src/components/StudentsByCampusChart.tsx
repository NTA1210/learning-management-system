import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { studentsByCampusData } from '../services/mock';
import { useTheme } from '../hooks/useTheme';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981'];

export default function StudentsByCampusChart() {
  const { darkMode } = useTheme();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={studentsByCampusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ campus, percent }) => `${campus} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="students"
          >
            {studentsByCampusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#374151'
            }}
          />
          <Legend 
            wrapperStyle={{
              color: darkMode ? '#ffffff' : '#374151',
              fontSize: '14px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
