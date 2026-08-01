'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface WeeklyTrendItem {
  day: string;
  pallets: number;
  weight: number;
}

export function WeeklyIntakeLineChart({ data }: { data: WeeklyTrendItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f8f5f5ff" />
        <XAxis dataKey="day" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pallets"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Pallets"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="weight"
          stroke="#10b981"
          strokeWidth={2}
          name="Weight (kg)"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
