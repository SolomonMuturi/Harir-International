
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
import { Zap } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

const chartConfig: ChartConfig = {
  usage: {
    label: 'Usage (kWh)',
    color: 'hsl(var(--chart-1))',
  },
};

interface EnergyConsumptionChartProps {
  data: { hour: string; usage: number }[];
}

export function EnergyConsumptionChart({ data }: EnergyConsumptionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Zap className='w-5 h-5 text-primary' />
            Hourly Energy Consumption
        </CardTitle>
        <CardDescription>Total grid power usage over the last 24 hours.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value} kWh`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="usage"
                fill="var(--color-usage)"
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
       <CardFooter>
        <Button asChild variant="outline" className="w-full">
            <Link href="/analytics">View Breakdown</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default EnergyConsumptionChart;
