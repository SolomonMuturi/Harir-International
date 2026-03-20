
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
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

const chartConfig: ChartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--chart-1))',
  },
  other: {
    label: 'Incidents',
    color: 'hsl(var(--primary))',
  }
};

interface EmployeePerformanceOverviewChartProps {
  data: { name: string; score: number; other: number }[];
}

export function EmployeePerformanceOverviewChart({ data }: EmployeePerformanceOverviewChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Performance Overview</CardTitle>
        <CardDescription>
          Comparison of key performance indicators by employee.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart accessibilityLayer data={data}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 40]}
                />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="score"
                fill="var(--color-score)"
                radius={4}
                barSize={20}
              />
               <Bar
                dataKey="other"
                fill="var(--color-other)"
                radius={4}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
