
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
import { DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

const chartConfig: ChartConfig = {
  cost: {
    label: 'Cost (KES)',
    color: 'hsl(var(--chart-2))',
  },
};

interface EnergyCostChartProps {
  data: { month: string; cost: number }[];
}

export function EnergyCostChart({ data }: EnergyCostChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <DollarSign className='w-5 h-5 text-primary' />
            Monthly Energy Cost
        </CardTitle>
        <CardDescription>Total energy cost over the last 6 months.</CardDescription>
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
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `KES ${value / 1000}k`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="cost"
                fill="var(--color-cost)"
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

export default EnergyCostChart;
