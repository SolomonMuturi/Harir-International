
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
import { Truck } from 'lucide-react';

interface FleetActivityChartProps {
  data: {
    hour: string;
    checkIns: number;
    checkOuts: number;
  }[];
}

const chartConfig: ChartConfig = {
  checkIns: {
    label: 'Check-ins',
    color: 'hsl(var(--chart-1))',
  },
  checkOuts: {
    label: 'Check-outs',
    color: 'hsl(var(--chart-2))',
  },
};

export function FleetActivityChart({ data }: FleetActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Truck />
            Fleet Activity by Hour
        </CardTitle>
        <CardDescription>Hourly check-ins vs. check-outs at the gate.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="checkIns" fill="var(--color-checkIns)" radius={4} />
              <Bar dataKey="checkOuts" fill="var(--color-checkOuts)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
