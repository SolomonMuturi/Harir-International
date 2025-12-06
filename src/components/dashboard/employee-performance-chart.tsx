
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface EmployeePerformanceProps {
  data: {
    name: string;
    onTimeDeliveries: number;
    positiveFeedback: number;
    safetyIncidents: number;
  }[];
}

const chartConfig: ChartConfig = {
  onTimeDeliveries: {
    label: 'On-Time Deliveries (%)',
    color: 'hsl(var(--chart-1))',
  },
  positiveFeedback: {
    label: 'Positive Feedback (%)',
    color: 'hsl(var(--chart-2))',
  },
  safetyIncidents: {
    label: 'Safety Incidents',
    color: 'hsl(var(--chart-5))',
  },
};

export function EmployeePerformanceChart({ data }: EmployeePerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Performance Metrics</CardTitle>
        <CardDescription>Key performance indicators by employee.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="onTimeDeliveries" fill="var(--color-onTimeDeliveries)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="positiveFeedback" fill="var(--color-positiveFeedback)" radius={4} />
              <Bar dataKey="safetyIncidents" fill="var(--color-safetyIncidents)" radius={[4, 0, 0, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
