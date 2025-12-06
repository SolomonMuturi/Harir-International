
'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
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

interface WaterConsumptionChartProps {
  data: {
    date: string;
    consumption: number;
  }[];
}

const chartConfig: ChartConfig = {
  consumption: {
    label: 'Consumption (m³)',
    color: 'hsl(var(--chart-2))',
  },
};

export function WaterConsumptionChart({ data }: WaterConsumptionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
            <Droplet className='w-5 h-5 text-primary' />
            Daily Water Consumption
        </CardTitle>
        <CardDescription>Total water consumption over the last week.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
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
                tickFormatter={(value) => `${value} m³`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                dataKey="consumption"
                type="monotone"
                stroke="var(--color-consumption)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-consumption)",
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
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

export default WaterConsumptionChart;

