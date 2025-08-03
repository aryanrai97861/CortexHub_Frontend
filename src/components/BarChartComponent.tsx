'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface BarChartData {
  name: string;
  value: number;
}

interface BarChartComponentProps {
  data: BarChartData[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  barColor?: string;
  height?: number;
  width?: number | string;
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  title = 'Bar Chart',
  xAxisLabel = 'Category',
  yAxisLabel = 'Value',
  barColor = '#3b82f6',
  height = 400,
  width = '100%'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No data available for the chart</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-200">{title}</h3>}
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af" 
              label={{ 
                value: xAxisLabel, 
                position: 'insideBottomRight', 
                offset: -5,
                fill: '#9ca3af',
                fontSize: 12
              }} 
            />
            <YAxis 
              stroke="#9ca3af" 
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft',
                fill: '#9ca3af',
                fontSize: 12
              }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.5rem',
                color: '#f3f4f6'
              }}
              itemStyle={{ color: '#f3f4f6' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name={yAxisLabel} 
              fill={barColor} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;
