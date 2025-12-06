
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Clock } from 'lucide-react';

interface VehicleTurnaroundChartProps {
  data: {
    vehicle: string;
    turnaroundTime: number;
  }[];
}

const chartConfig: ChartConfig = {
  turnaroundTime: {
    label: 'Turnaround Time (minutes)',
    color: 'hsl(var(--chart-1))',
  },
};

export function VehicleTurnaroundChart({ data }: VehicleTurnaroundChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Clock />
            Vehicle Turnaround Time
        </CardTitle>
        <CardDescription>Average time spent on-site per vehicle.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} min`}
              />
              <YAxis
                dataKey="vehicle"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="turnaroundTime" fill="var(--color-turnaroundTime)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
