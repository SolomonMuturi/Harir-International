
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Droplet } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

const chartConfig: ChartConfig = {
  consumption: {
    label: 'Consumption (L)',
    color: 'hsl(var(--chart-5))',
  },
};

interface DieselConsumptionChartProps {
  data: { day: string; consumption: number }[];
}

export function DieselConsumptionChart({ data }: DieselConsumptionChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Droplet className='w-5 h-5 text-primary' />
            Daily Diesel Consumption
        </CardTitle>
        <CardDescription>Total diesel usage over the last week.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart
              accessibilityLayer
              data={data}
              margin={{
                left: -10,
                right: 12,
              }}
            >
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value} L`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="consumption"
                fill="var(--color-consumption)"
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default DieselConsumptionChart;
