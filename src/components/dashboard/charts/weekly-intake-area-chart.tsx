'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface WeeklyTrendItem {
  day: string;
  pallets: number;
  weight: number;
}

export function WeeklyIntakeAreaChart({ data }: { data: WeeklyTrendItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="pallets"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.2}
          name="Pallets"
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.2}
          name="Weight (kg)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
